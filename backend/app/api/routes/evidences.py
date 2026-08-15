from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid
import os

from app.api import deps
from app.models.evidence import Evidence, EvidenceCriteria, Document, DocumentVersion
from app.models.quality import Criterion, Standard
from app.schemas.evidence import EvidenceCreate, EvidenceResponse, WorkflowUpdate
from app.models.user import User
from app.services import file_service

router = APIRouter()

# 1. GENERATE CODE LOGIC
def generate_evidence_code(db: Session, criteria_id: uuid.UUID) -> str:
    crit = db.query(Criterion).filter(Criterion.id == criteria_id).first()
    if not crit:
        raise HTTPException(status_code=404, detail="Primary criteria not found")
    
    std = db.query(Standard).filter(Standard.id == crit.standard_id).first()
    
    # Lấy số sequence của minh chứng hiện tại trong tiêu chí này
    count = db.query(EvidenceCriteria).filter(EvidenceCriteria.criteria_id == criteria_id).count()
    seq_str = f"{(count + 1):02d}"
    
    # Giả định crit.code format là "1.1", std.code là "1"
    # Lọc ký tự chuẩn hóa nếu cần
    return f"MC.{std.code}.{crit.code}.{seq_str}"

# 2. CRUD & SEARCH
@router.post("", response_model=EvidenceResponse)
def create_evidence(
    data: EvidenceCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.create"]))
):
    # Tạo mã tự động
    generated_code = generate_evidence_code(db, data.primary_criteria_id)
    
    ev = Evidence(
        code=generated_code,
        name=data.name,
        description=data.description,
        type=data.type,
        issue_date=data.issue_date,
        provider=data.provider,
        author_id=current_user.id,
        status="DRAFT"
    )
    db.add(ev)
    db.flush() # Lấy ev.id
    
    # Gắn Criteria
    all_crit_ids = set([data.primary_criteria_id] + data.additional_criteria_ids)
    for cid in all_crit_ids:
        db.add(EvidenceCriteria(evidence_id=ev.id, criteria_id=cid))
        
    db.commit()
    db.refresh(ev)
    return ev

@router.get("")
def search_evidences(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.read"])),
    search: str = None,
    status: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20)
):
    query = db.query(Evidence)
    if search:
        query = query.filter(or_(
            Evidence.code.ilike(f"%{search}%"),
            Evidence.name.ilike(f"%{search}%")
        ))
    if status:
        query = query.filter(Evidence.status == status.upper())
        
    items = query.order_by(Evidence.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": [EvidenceResponse.model_validate(i) for i in items]}

# 3. WORKFLOW
@router.patch("/{id}/workflow")
def update_workflow(
    id: uuid.UUID,
    workflow: WorkflowUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.update", "evidence.review"]))
):
    valid_statuses = {"DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_REVISION", "PASSED", "APPROVED"}
    if workflow.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid workflow status")
        
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    ev.status = workflow.status
    db.commit()
    return {"message": f"Status updated to {ev.status}"}

# 4. FILE UPLOAD/DOWNLOAD
@router.post("/{id}/upload")
def upload_evidence_file(
    id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.update"]))
):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    ext, file_size = file_service.validate_file(file)
    
    # Kiểm tra xem document đã tồn tại chưa để tăng version
    doc = db.query(Document).filter(Document.evidence_id == id, Document.title == file.filename).first()
    if doc:
        doc.current_version += 1
    else:
        doc = Document(evidence_id=id, title=file.filename, file_type=ext.replace('.', ''), file_size=file_size, current_version=1)
        db.add(doc)
        db.flush()
        
    # Lưu file vật lý
    file_path = file_service.save_file(str(id), doc.current_version, file)
    
    # Lưu metadata version
    doc_ver = DocumentVersion(
        document_id=doc.id,
        version_number=doc.current_version,
        file_path=file_path,
        uploaded_by=current_user.id
    )
    db.add(doc_ver)
    db.commit()
    
    return {"message": "File uploaded successfully", "document_id": doc.id, "version": doc.current_version}

@router.get("/documents/{version_id}/download")
def download_file(
    version_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.read"]))
):
    doc_ver = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
    if not doc_ver or not os.path.exists(doc_ver.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(path=doc_ver.file_path, filename=doc_ver.document.title)