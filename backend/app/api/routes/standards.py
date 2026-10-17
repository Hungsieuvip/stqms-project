import uuid
import os
import tempfile
import subprocess
from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session, joinedload

from app.api import deps
from app.models.quality import Standard, Criterion, StandardAssignment
from app.models.evidence import EvidenceCriteria
from app.models.evaluation import EvaluationDetail
from app.models.training import Task
from app.models.user import User
from app.schemas.quality import StandardCreate, StandardUpdate, StandardResponse, StandardAssignmentCreate, StandardAssignmentResponse
from app.services.ai_standard_parser import analyze_document_content, execute_import_to_db
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[StandardResponse])
@router.get("/", response_model=List[StandardResponse])
def get_standards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    standards = db.query(Standard).options(
        joinedload(Standard.criteria).joinedload(Criterion.requirements)
    ).order_by(Standard.sequence_num.asc(), Standard.code.asc()).all()

    # Sắp xếp các criteria con theo sequence_num
    for std in standards:
        std.criteria.sort(key=lambda c: (c.sequence_num, c.code))

    return standards

@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
def create_standard(
    standard_in: StandardCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.create"]))
):
    clean_code = standard_in.code.strip()
    existing = db.query(Standard).filter(Standard.code == clean_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã tiêu chuẩn '{clean_code}' đã tồn tại trong hệ thống."
        )

    data = standard_in.model_dump()
    data["code"] = clean_code
    data["name"] = standard_in.name.strip()
    if data.get("issued_date") is None:
        data["issued_date"] = date.today()

    new_standard = Standard(**data)
    db.add(new_standard)
    db.commit()
    db.refresh(new_standard)
    new_standard.criteria = []
    log_audit(db, current_user.id, "CREATE", "standards", new_standard.id, new_values={"code": new_standard.code, "name": new_standard.name})
    return new_standard

@router.post("/ai-parse")
@router.post("/ai-parse/")
async def ai_parse_standards(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    use_sample_tt57: Optional[bool] = Form(False),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Endpoint phân tích văn bản thông tư bằng AI / NLP hoặc nạp bộ mẫu TT 57.
    Trả về cấu trúc cây Tiêu chuẩn -> Tiêu chí -> Yêu cầu để người dùng xem trước và duyệt.
    """
    extracted_text = raw_text or ""
    filename = None
    is_tt57 = bool(use_sample_tt57)

    if file:
        filename = file.filename
        content = await file.read()
        if filename and filename.lower().endswith(".pdf"):
            try:
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                res = subprocess.run(["pdftotext", tmp_path, "-"], capture_output=True, text=True, timeout=10)
                if res.returncode == 0 and res.stdout.strip():
                    extracted_text = res.stdout
                os.remove(tmp_path)
            except Exception:
                pass
        else:
            try:
                extracted_text = content.decode("utf-8", errors="ignore")
            except Exception:
                pass

        if "57" in (filename or ""):
            is_tt57 = True

    parsed_result = analyze_document_content(
        raw_text=extracted_text,
        filename=filename,
        is_tt57=is_tt57
    )

    return parsed_result

@router.post("/ai-import")
@router.post("/ai-import/")
def ai_import_standards(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.create"]))
):
    """
    Endpoint lưu kết quả Tiêu chuẩn & Tiêu chí đã được xem xét vào cơ sở dữ liệu.
    """
    try:
        result = execute_import_to_db(db, payload)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi lưu dữ liệu tiêu chuẩn: {str(e)}"
        )

@router.put("/{standard_id}", response_model=StandardResponse)
def update_standard(
    standard_id: uuid.UUID,
    standard_in: StandardUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.update"]))
):
    std = db.query(Standard).options(
        joinedload(Standard.criteria)
    ).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy tiêu chuẩn cần cập nhật."
        )

    update_data = standard_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        clean_code = update_data["code"].strip()
        conflict = db.query(Standard).filter(Standard.code == clean_code, Standard.id != standard_id).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã tiêu chuẩn '{clean_code}' đã được sử dụng bởi tiêu chuẩn khác."
            )
        update_data["code"] = clean_code

    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].strip()

    for field, value in update_data.items():
        setattr(std, field, value)

    db.commit()
    db.refresh(std)
    std.criteria.sort(key=lambda c: (c.sequence_num, c.code))
    log_audit(db, current_user.id, "UPDATE", "standards", std.id, new_values=update_data)
    return std

@router.delete("/{standard_id}")
def delete_standard(
    standard_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.delete"]))
):
    std = db.query(Standard).options(
        joinedload(Standard.criteria)
    ).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy tiêu chuẩn."
        )

    # === DELETION GUARD: Kiểm tra ràng buộc trước khi xóa ===
    criteria_ids = [c.id for c in std.criteria]
    
    if criteria_ids:
        # Kiểm tra có minh chứng nào đang liên kết với tiêu chí thuộc tiêu chuẩn này
        evidence_count = db.query(EvidenceCriteria).filter(
            EvidenceCriteria.criteria_id.in_(criteria_ids)
        ).count()
        if evidence_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa tiêu chuẩn '{std.code}' vì có {evidence_count} minh chứng "
                       f"đang liên kết với các tiêu chí thuộc tiêu chuẩn này. "
                       f"Hãy xóa hoặc gỡ liên kết minh chứng trước."
            )

        # Kiểm tra có đánh giá nào đang liên kết
        eval_count = db.query(EvaluationDetail).filter(
            EvaluationDetail.criteria_id.in_(criteria_ids)
        ).count()
        if eval_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa tiêu chuẩn '{std.code}' vì có {eval_count} bản đánh giá "
                       f"đang liên kết. Hãy xóa kết quả đánh giá trước."
            )

        # Kiểm tra có nhiệm vụ nào đang liên kết
        task_count = db.query(Task).filter(
            Task.criteria_id.in_(criteria_ids)
        ).count()
        if task_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa tiêu chuẩn '{std.code}' vì có {task_count} nhiệm vụ "
                       f"đang liên kết. Hãy xóa hoặc gỡ liên kết nhiệm vụ trước."
            )

    std_id = std.id
    std_code = std.code
    db.delete(std)
    db.commit()
    log_audit(db, current_user.id, "DELETE", "standards", std_id, old_values={"code": std_code})
    return {"message": f"Đã xóa tiêu chuẩn '{std_code}' thành công"}


# ==========================================
# STANDARD ASSIGNMENTS (TASK 2.5)
# ==========================================
@router.get("/{standard_id}/assignments")
def get_standard_assignments(
    standard_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    std = db.query(Standard).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiêu chuẩn.")

    assignments = db.query(StandardAssignment).options(
        joinedload(StandardAssignment.user)
    ).filter(StandardAssignment.standard_id == standard_id).all()

    return [
        {
            "id": a.id,
            "standard_id": a.standard_id,
            "user_id": a.user_id,
            "user_name": a.user.username if a.user else None,
            "user_email": a.user.email if a.user else None,
            "user_full_name": a.user.full_name if a.user else None,
            "role_in_standard": a.role_in_standard,
            "assigned_at": a.assigned_at,
        }
        for a in assignments
    ]


@router.post("/{standard_id}/assign")
def assign_user_to_standard(
    standard_id: uuid.UUID,
    assignment_in: StandardAssignmentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.update"])),
):
    std = db.query(Standard).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiêu chuẩn.")

    user = db.query(User).filter(User.id == assignment_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    # Check if already assigned
    existing = db.query(StandardAssignment).filter(
        StandardAssignment.standard_id == standard_id,
        StandardAssignment.user_id == assignment_in.user_id
    ).first()

    if existing:
        existing.role_in_standard = assignment_in.role_in_standard or "LEAD"
        db.commit()
        db.refresh(existing)
        return {
            "message": f"Đã cập nhật vai trò phân công cho {user.username}",
            "assignment_id": existing.id
        }

    assignment = StandardAssignment(
        standard_id=standard_id,
        user_id=assignment_in.user_id,
        role_in_standard=assignment_in.role_in_standard or "LEAD",
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": f"Đã phân công {user.username} phụ trách tiêu chuẩn {std.code}",
        "assignment_id": assignment.id
    }


@router.delete("/{standard_id}/assign/{user_id}")
def remove_standard_assignment(
    standard_id: uuid.UUID,
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.update"])),
):
    assignment = db.query(StandardAssignment).filter(
        StandardAssignment.standard_id == standard_id,
        StandardAssignment.user_id == user_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Không tìm thấy phân công nhân sự này.")

    db.delete(assignment)
    db.commit()
    return {"message": "Đã gỡ phân công thành công"}
