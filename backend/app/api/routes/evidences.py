import uuid
import os
import json
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.api import deps
from app.models.evidence import Evidence, EvidenceCriteria, Document, DocumentVersion, EvidenceReviewLog
from app.models.quality import Criterion, Standard
from app.models.user import User
from app.schemas.evidence import EvidenceCreate, EvidenceResponse, WorkflowUpdate
from app.services import file_service
from app.core.state_machine import (
    validate_evidence_transition,
    is_reviewer_transition,
    is_author_transition,
    get_available_transitions,
    STATUS_LABELS,
    REJECTION_REQUIRED_STATES,
)
from app.services.notification_service import notify_evidence_status_change
from app.services.audit_service import log_audit

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
        "rejection_reason": ev.rejection_reason,
        "reviewed_by": ev.reviewed_by,
        "reviewed_at": ev.reviewed_at,
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
    criteria_ids: Optional[str] = Form(None),
    primary_criteria_id: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.create"]))
):
    # 1. Parse criteria_ids
    parsed_criteria_ids = []
    if criteria_ids:
        try:
            loaded = json.loads(criteria_ids)
            if isinstance(loaded, list):
                parsed_criteria_ids = [uuid.UUID(str(c)) for c in loaded if c]
        except Exception:
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
    log_audit(db, current_user.id, "UPLOAD", "evidences", ev.id, new_values={"code": ev.code, "name": ev.name, "status": ev.status})

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

    # Chỉ cho phép xóa minh chứng ở trạng thái DRAFT hoặc REJECTED
    if ev.status not in ("DRAFT", "REJECTED"):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa minh chứng ở trạng thái '{STATUS_LABELS.get(ev.status, ev.status)}'. "
                   f"Chỉ có thể xóa minh chứng ở trạng thái 'Bản nháp' hoặc 'Bị từ chối'."
        )

    ev_id = ev.id
    ev_code = ev.code
    db.delete(ev)
    db.commit()
    log_audit(db, current_user.id, "DELETE", "evidences", ev_id, old_values={"code": ev_code})
    return {"message": "Đã xóa minh chứng thành công"}


# ==========================================
# WORKFLOW ENDPOINT - State Machine
# ==========================================
@router.patch("/{id}/workflow")
def update_workflow(
    id: uuid.UUID,
    workflow: WorkflowUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evidence.update"]))
):
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy minh chứng.")

    old_status = ev.status.upper()
    new_status = workflow.status.upper()

    # 1. Validate transition hợp lệ bằng State Machine
    try:
        validate_evidence_transition(old_status, new_status, workflow.note)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Cập nhật trạng thái
    ev.status = new_status

    # 3. Lưu rejection reason nếu có
    if new_status in REJECTION_REQUIRED_STATES:
        ev.rejection_reason = workflow.note
    elif new_status in ("APPROVED", "PASSED"):
        ev.rejection_reason = None  # Xóa lý do từ chối cũ khi được duyệt

    # 4. Cập nhật thông tin reviewer
    if is_reviewer_transition(old_status, new_status):
        ev.reviewed_by = current_user.id
        ev.reviewed_at = datetime.utcnow()

    # 5. Cập nhật submission_date nếu nộp
    if new_status == "SUBMITTED":
        ev.submission_date = datetime.utcnow()

    # 6. Tạo review log (append-only history)
    review_log = EvidenceReviewLog(
        evidence_id=ev.id,
        reviewer_id=current_user.id,
        from_status=old_status,
        to_status=new_status,
        reason=workflow.note,
    )
    db.add(review_log)

    # 7. Tạo thông báo tự động
    try:
        notify_evidence_status_change(
            db=db,
            evidence_id=ev.id,
            evidence_code=ev.code,
            evidence_name=ev.name,
            author_id=ev.author_id,
            reviewer_id=current_user.id,
            old_status=old_status,
            new_status=new_status,
            reason=workflow.note,
        )
    except Exception:
        pass  # Notification failure shouldn't block workflow

    db.commit()
    log_audit(db, current_user.id, f"WORKFLOW_{new_status}", "evidences", ev.id, old_values={"status": old_status}, new_values={"status": new_status, "rejection_reason": workflow.note})

    return {
        "message": f"Cập nhật trạng thái thành công: {STATUS_LABELS.get(old_status, old_status)} → {STATUS_LABELS.get(new_status, new_status)}",
        "old_status": old_status,
        "new_status": new_status,
        "rejection_reason": ev.rejection_reason,
    }


# ==========================================
# TRANSITIONS INFO ENDPOINT
# ==========================================
@router.get("/{id}/transitions")
def get_evidence_transitions(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Trả về danh sách các trạng thái có thể chuyển từ trạng thái hiện tại."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy minh chứng.")

    transitions = get_available_transitions(ev.status)
    return {
        "current_status": ev.status,
        "current_label": STATUS_LABELS.get(ev.status, ev.status),
        "available_transitions": transitions,
    }


# ==========================================
# REVIEW HISTORY ENDPOINT
# ==========================================
@router.get("/{id}/review-history")
def get_review_history(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Xem lịch sử duyệt minh chứng."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy minh chứng.")

    logs = db.query(EvidenceReviewLog).filter(
        EvidenceReviewLog.evidence_id == id
    ).order_by(EvidenceReviewLog.created_at.desc()).all()

    result = []
    for log in logs:
        reviewer = db.query(User).filter(User.id == log.reviewer_id).first() if log.reviewer_id else None
        result.append({
            "id": log.id,
            "from_status": log.from_status,
            "from_label": STATUS_LABELS.get(log.from_status, log.from_status),
            "to_status": log.to_status,
            "to_label": STATUS_LABELS.get(log.to_status, log.to_status),
            "reason": log.reason,
            "reviewer_name": reviewer.username if reviewer else "Hệ thống",
            "created_at": log.created_at,
        })

    return {"items": result}


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
