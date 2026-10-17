from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid

from app.api import deps
from app.models.evaluation import Evaluation, EvaluationDetail, EvaluationHistory
from app.models.quality import Standard, Criterion
from app.models.academic_year import AcademicYear
from app.models.evidence import Evidence, EvidenceCriteria
from app.models.user import User
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationHistoryResponse,
    EvaluationSessionCreate,
    EvaluationSessionUpdate,
    EvaluationSessionResponse,
    EvaluationDetailResponse
)
from app.schemas.evidence import EvidenceResponse
from app.services.audit_service import log_audit

router = APIRouter()

# --- QUẢN LÝ ĐỢT / PHIÊN ĐÁNH GIÁ (EVALUATION SESSIONS) ---

@router.get("", response_model=List[EvaluationSessionResponse])
def get_evaluations(
    db: Session = Depends(deps.get_db),
    academic_year_id: Optional[uuid.UUID] = None,
    standard_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(deps.get_current_user)
):
    """Lấy danh sách các đợt/bài tự đánh giá tiêu chuẩn"""
    query = db.query(Evaluation).options(
        joinedload(Evaluation.standard),
        joinedload(Evaluation.academic_year),
        joinedload(Evaluation.details).joinedload(EvaluationDetail.criteria)
    )

    if academic_year_id:
        query = query.filter(Evaluation.academic_year_id == academic_year_id)
    if standard_id:
        query = query.filter(Evaluation.standard_id == standard_id)
    if status_filter:
        query = query.filter(Evaluation.status == status_filter.upper())

    evaluations = query.order_by(Evaluation.created_at.desc()).all()
    results = []

    for ev in evaluations:
        total_crit = len(ev.details) if ev.details else 0
        passed_crit = sum(1 for d in ev.details if d.status == "PASS") if ev.details else 0
        rate = round((passed_crit / total_crit * 100), 2) if total_crit > 0 else 0.0

        results.append(EvaluationSessionResponse(
            id=ev.id,
            standard_id=ev.standard_id,
            standard_code=ev.standard.code if ev.standard else None,
            standard_name=ev.standard.name if ev.standard else None,
            academic_year_id=ev.academic_year_id,
            academic_year_name=ev.academic_year.name if ev.academic_year else None,
            name=ev.name,
            status=ev.status,
            evaluation_date=ev.evaluation_date,
            total_criteria=total_crit,
            passed_criteria=passed_crit,
            completion_rate=rate,
            created_at=ev.created_at,
            updated_at=ev.updated_at
        ))

    return results

@router.post("", response_model=EvaluationSessionResponse, status_code=status.HTTP_201_CREATED)
def create_evaluation(
    data: EvaluationSessionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.create"]))
):
    """Tạo mới một đợt tự đánh giá tiêu chuẩn và tự động khởi tạo danh sách tiêu chí con"""
    standard = db.query(Standard).filter(Standard.id == data.standard_id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiêu chuẩn.")

    if data.academic_year_id:
        ay = db.query(AcademicYear).filter(AcademicYear.id == data.academic_year_id).first()
        if not ay:
            raise HTTPException(status_code=404, detail="Không tìm thấy năm học.")

    evaluation = Evaluation(
        standard_id=data.standard_id,
        academic_year_id=data.academic_year_id,
        name=data.name,
        status=data.status or "ONGOING",
        evaluation_date=data.evaluation_date
    )
    db.add(evaluation)
    db.flush()

    # Tự động nạp toàn bộ tiêu chí thuộc tiêu chuẩn vào evaluation_details
    criteria = db.query(Criterion).filter(Criterion.standard_id == data.standard_id).order_by(Criterion.sequence_num.asc()).all()
    for crit in criteria:
        detail = EvaluationDetail(
            evaluation_id=evaluation.id,
            criteria_id=crit.id,
            status="PENDING",
            evaluated_by=current_user.id
        )
        db.add(detail)

    db.commit()
    db.refresh(evaluation)
    log_audit(db, current_user.id, "CREATE", "evaluations", evaluation.id, new_values={"name": evaluation.name, "standard_code": standard.code})

    total_crit = len(criteria)
    return EvaluationSessionResponse(
        id=evaluation.id,
        standard_id=evaluation.standard_id,
        standard_code=standard.code,
        standard_name=standard.name,
        academic_year_id=evaluation.academic_year_id,
        academic_year_name=evaluation.academic_year.name if evaluation.academic_year else None,
        name=evaluation.name,
        status=evaluation.status,
        evaluation_date=evaluation.evaluation_date,
        total_criteria=total_crit,
        passed_criteria=0,
        completion_rate=0.0,
        created_at=evaluation.created_at,
        updated_at=evaluation.updated_at
    )

@router.get("/{id}", response_model=EvaluationSessionResponse)
def get_evaluation_detail(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Xem chi tiết một đợt đánh giá kèm toàn bộ kết quả từng tiêu chí"""
    ev = db.query(Evaluation).options(
        joinedload(Evaluation.standard),
        joinedload(Evaluation.academic_year),
        joinedload(Evaluation.details).joinedload(EvaluationDetail.criteria),
        joinedload(Evaluation.details).joinedload(EvaluationDetail.evaluator)
    ).filter(Evaluation.id == id).first()

    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt đánh giá.")

    details_list = []
    passed_crit = 0
    total_crit = len(ev.details) if ev.details else 0

    for d in (ev.details or []):
        if d.status == "PASS":
            passed_crit += 1
        details_list.append(EvaluationDetailResponse(
            id=d.id,
            evaluation_id=d.evaluation_id,
            criteria_id=d.criteria_id,
            criteria_code=d.criteria.code if d.criteria else None,
            criteria_name=d.criteria.name if d.criteria else None,
            evaluated_by=d.evaluated_by,
            evaluator_name=d.evaluator.full_name if d.evaluator else (d.evaluator.username if d.evaluator else None),
            score=float(d.score) if d.score is not None else None,
            status=d.status,
            level=d.level,
            comments=d.comments
        ))

    rate = round((passed_crit / total_crit * 100), 2) if total_crit > 0 else 0.0

    return EvaluationSessionResponse(
        id=ev.id,
        standard_id=ev.standard_id,
        standard_code=ev.standard.code if ev.standard else None,
        standard_name=ev.standard.name if ev.standard else None,
        academic_year_id=ev.academic_year_id,
        academic_year_name=ev.academic_year.name if ev.academic_year else None,
        name=ev.name,
        status=ev.status,
        evaluation_date=ev.evaluation_date,
        total_criteria=total_crit,
        passed_criteria=passed_crit,
        completion_rate=rate,
        details=details_list,
        created_at=ev.created_at,
        updated_at=ev.updated_at
    )

@router.put("/{id}", response_model=EvaluationSessionResponse)
def update_evaluation(
    id: uuid.UUID,
    data: EvaluationSessionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.update"]))
):
    """Cập nhật đợt đánh giá (Tên, Năm học, Ngày đánh giá, Trạng thái)"""
    ev = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt đánh giá.")

    if data.name is not None:
        ev.name = data.name
    if data.status is not None:
        ev.status = data.status.upper()
    if data.academic_year_id is not None:
        ay = db.query(AcademicYear).filter(AcademicYear.id == data.academic_year_id).first()
        if not ay:
            raise HTTPException(status_code=404, detail="Không tìm thấy năm học.")
        ev.academic_year_id = data.academic_year_id
    if data.evaluation_date is not None:
        ev.evaluation_date = data.evaluation_date

    db.commit()
    db.refresh(ev)
    return get_evaluation_detail(id, db, current_user)

@router.delete("/{id}")
def delete_evaluation(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.delete"]))
):
    """Xóa đợt đánh giá (Có Deletion Guard: Ngăn chặn xóa khi đã APPROVED)"""
    ev = db.query(Evaluation).filter(Evaluation.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt đánh giá.")

    if ev.status.upper() == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể xóa đợt đánh giá '{ev.name}' vì đã được Hội đồng tự đánh giá phê duyệt chính thức."
        )

    ev_id = ev.id
    ev_name = ev.name
    db.delete(ev)
    db.commit()
    log_audit(db, current_user.id, "DELETE", "evaluations", ev_id, old_values={"name": ev_name})
    return {"message": f"Đã xóa thành công đợt đánh giá '{ev_name}'"}


# --- ĐÁNH GIÁ TỪNG TIÊU CHÍ (CRITERION-LEVEL EVALUATION) ---

@router.get("/criteria/{criterion_id}/evidences", response_model=List[EvidenceResponse])
def get_evidences_for_criterion(
    criterion_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.read", "evidence.read"]))
):
    """Xem toàn bộ minh chứng liên quan đến một tiêu chí"""
    evidences = db.query(Evidence).join(EvidenceCriteria).filter(
        EvidenceCriteria.criteria_id == criterion_id
    ).all()
    return evidences

@router.post("/criteria/{criterion_id}", response_model=EvaluationHistoryResponse)
def evaluate_criterion(
    criterion_id: uuid.UUID,
    data: EvaluationCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.create"]))
):
    """Đánh giá tiêu chí và lưu vào lịch sử đánh giá"""
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiêu chí.")

    # 1. Lưu vào lịch sử (Append-only)
    history = EvaluationHistory(
        criterion_id=criterion_id,
        evaluator_id=current_user.id,
        result=data.result.value,
        level=data.level.value if data.level else None,
        comment=data.comment
    )
    db.add(history)
    
    # 2. Đồng bộ cập nhật EvaluationDetail nếu có
    details = db.query(EvaluationDetail).filter(EvaluationDetail.criteria_id == criterion_id).all()
    for detail in details:
        detail.status = data.result.value
        detail.level = data.level.value if data.level else None
        detail.comments = data.comment
        detail.evaluated_by = current_user.id
        
    db.commit()
    db.refresh(history)
    log_audit(db, current_user.id, f"EVALUATE_{data.result.value}", "criteria", criterion_id, new_values={"result": data.result.value, "level": data.level.value if data.level else None})
    return history

@router.get("/criteria/{criterion_id}/history", response_model=List[EvaluationHistoryResponse])
def get_evaluation_history(
    criterion_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.read"]))
):
    """Xem lịch sử đánh giá của một tiêu chí"""
    histories = db.query(EvaluationHistory).filter(
        EvaluationHistory.criterion_id == criterion_id
    ).order_by(EvaluationHistory.evaluated_at.desc()).all()
    return histories
