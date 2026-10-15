import json
import os
import uuid
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.api import deps
from app.models.evidence import Evidence, EvidenceCriteria, Document, DocumentVersion
from app.models.quality import Criterion, Standard
from app.models.user import User
from app.schemas.evidence import EvidenceCreate, EvidenceResponse, WorkflowUpdate
from app.services import file_service

router = APIRouter()

def generate_evidence_code(db: Session, criteria_id: Optional[uuid.UUID] = None) -> str:
    if criteria_id:
        crit = db.query(Criterion).filter(Criterion.id == criteria_id).first()
        if crit:
            std = db.query(Standard).filter(Standard.id == crit.standard_id).first()
            std_code = std.code if std else "TC"
            crit_code = crit.code
            count = db.query(EvidenceCriteria).filter(EvidenceCriteria.criteria_id == criteria_id).count()
            return f"MC.{std_code}.{crit_code}.{(count + 1):02d}"
            
    total_ev = db.query(Evidence).count()
    return f"MC.GEN.{(total_ev + 1):03d}"

def serialize_evidence(ev: Evidence, db: Session) -> dict:
    data = {
        "id": ev.id,
        "code": ev.code,
        "name": ev.name,
        "description": ev.description,
        "type": ev.type,
        "issue_date": ev.issue_date,
        "provider": ev.provider,
        "status": ev.status,
        "author_id": ev.author_id,
        "created_at": ev.created_at,
        "criteria": [],
        "documents": [],
        "file_name": None,
        "file_size": None,
        "file_url": None,
        "uploader_name": "Quản trị viên"
    }

    # Lấy thông tin uploader
    if ev.author_id:
        u = db.query(User).filter(User.id == ev.author_id).first()
        if u:
            data["uploader_name"] = u.username

    # Lấy tài liệu đính kèm
    if ev.documents:
        first_doc = ev.documents[0]
        data["file_name"] = first_doc.title
        data["file_size"] = first_doc.file_size
        if first_doc.versions:
            latest_v = first_doc.versions[-1]
            data["file_url"] = f"/api/evidences/documents/{latest_v.id}/download"

    # Lấy danh sách tiêu chí liên kết
    for ec in ev.criteria:
        crit_info = None
        if ec.criterion:
            crit_info = {
                "id": ec.criterion.id,
                "code": ec.criterion.code,
                "name": ec.criterion.name,
                "standard_id": ec.criterion.standard_id
            }
        data["criteria"].append({
            "criteria_id": ec.criteria_id,
            "requirement_id": ec.requirement_id,
            "criterion": crit_info
        })

    return data

@router.get("", response_model=dict)
@router.get("/", response_model=dict)
def search_evidences(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    search: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50)
):
    query = db.query(Evidence).options(
        joinedload(Evidence.criteria).joinedload(EvidenceCriteria.criterion),
        joinedload(Evidence.documents).joinedload(Document.versions)
    )

    if search:
        query = query.filter(or_(
            Evidence.code.ilike(f"%{search}%"),
            Evidence.name.ilike(f"%{search}%")
        ))
    if status and status.upper() != 'ALL':
        query = query.filter(Evidence.status == status.upper())
        
    total = query.count()
    items = query.order_by(Evidence.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [serialize_evidence(i, db) for i in items]
    }

@router.post("/upload")
def upload_and_create_evidence(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    criteria_ids: Optional[str] = Form(None), # Chuỗi JSON danh sách ID tiêu chí hoặc phân tách bằng dấu phẩy
    primary_criteria_id: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.create"]))
):
    # 1. Parse criteria_ids
    parsed_criteria_ids = []
    if criteria_ids:
        try:
            # Thử decode JSON
            loaded = json.loads(criteria_ids)
            if isinstance(loaded, list):
                parsed_criteria_ids = [uuid.UUID(str(c)) for c in loaded if c]
        except Exception:
            # Parse chuỗi phân tách bằng phẩy
            parts = [p.strip() for p in criteria_ids.split(",") if p.strip()]
            for p in parts:
                try:
                    parsed_criteria_ids.append(uuid.UUID(p))
                except Exception:
                    pass

    prim_id = None
    if primary_criteria_id:
        try:
            prim_id = uuid.UUID(primary_criteria_id)
        except Exception:
            pass
    if not prim_id and parsed_criteria_ids:
        prim_id = parsed_criteria_ids[0]

    # 2. Tạo mã minh chứng
    generated_code = generate_evidence_code(db, prim_id)

    # 3. Tạo bản ghi Evidence
    ev = Evidence(
        code=generated_code,
        name=title.strip(),
        description=description.strip() if description else None,
        type="FILE",
        issue_date=date.today(),
        author_id=current_user.id,
        status="DRAFT"
    )
    db.add(ev)
    db.flush()

    # 4. Gắn các Criteria liên kết
    if prim_id and prim_id not in parsed_criteria_ids:
        parsed_criteria_ids.append(prim_id)

    for cid in set(parsed_criteria_ids):
        # Xác nhận Criterion tồn tại
        if db.query(Criterion).filter(Criterion.id == cid).first():
            db.add(EvidenceCriteria(evidence_id=ev.id, criteria_id=cid))

    # 5. Lưu file vật lý và tạo Document
    ext, file_size = file_service.validate_file(file)
    doc = Document(
        evidence_id=ev.id,
        title=file.filename,
        file_type=ext.replace('.', ''),
        file_size=file_size,
        current_version=1
    )
    db.add(doc)
    db.flush()

    file_path = file_service.save_file(str(ev.id), doc.current_version, file)

    doc_ver = DocumentVersion(
        document_id=doc.id,
        version_number=doc.current_version,
        file_path=file_path,
        uploaded_by=current_user.id
    )
    db.add(doc_ver)

    db.commit()
    db.refresh(ev)

    return {
        "message": "Upload và tạo minh chứng thành công!",
        "evidence": serialize_evidence(ev, db)
    }

@router.delete("/{id}")
def delete_evidence(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.delete"]))
):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy minh chứng.")

    db.delete(ev)
    db.commit()
    return {"message": "Đã xóa minh chứng thành công"}

@router.patch("/{id}/workflow")
def update_workflow(
    id: uuid.UUID,
    workflow: WorkflowUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.update", "evidence.review"]))
):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy minh chứng.")
        
    ev.status = workflow.status.upper()
    db.commit()
    return {"message": f"Cập nhật trạng thái thành công: {ev.status}"}

@router.get("/documents/{version_id}/download")
def download_file(
    version_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    doc_ver = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
    if not doc_ver or not os.path.exists(doc_ver.file_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file trên máy chủ")
        
    return FileResponse(path=doc_ver.file_path, filename=doc_ver.document.title)
