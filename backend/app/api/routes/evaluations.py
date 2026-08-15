from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from typing import List

from app.api import deps
from app.models.evaluation import EvaluationHistory, EvaluationDetail
from app.models.quality import Criterion
from app.models.evidence import Evidence, EvidenceCriteria
from app.schemas.evaluation import EvaluationCreate, EvaluationHistoryResponse
from app.schemas.evidence import EvidenceResponse
from app.models.user import User

router = APIRouter()

@router.get("/criteria/{criterion_id}/evidences", response_model=List[EvidenceResponse])
def get_evidences_for_criterion(
    criterion_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["evaluation.read", "evidence.read"]))
):
    """Xem toàn bộ minh chứng liên quan đến một tiêu chí"""
    # Lấy thông qua bảng trung gian evidence_criteria
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
    """Đánh giá tiêu chí và lưu vào lịch sử"""
    # Kiểm tra criterion tồn tại
    criterion = db.query(Criterion).filter(Criterion.id == criterion_id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    # 1. Lưu vào lịch sử (Append-only)
    history = EvaluationHistory(
        criterion_id=criterion_id,
        evaluator_id=current_user.id,
        result=data.result.value,
        level=data.level.value if data.level else None,
        comment=data.comment
    )
    db.add(history)
    
    # 2. (Optional) Nếu đang trong một đợt evaluation, update record mới nhất ở evaluation_details
    # Ở đây ta cập nhật nếu record đã tồn tại (Giả định logic liên kết đợt đánh giá có thể mở rộng sau)
    detail = db.query(EvaluationDetail).filter(EvaluationDetail.criteria_id == criterion_id).first()
    if detail:
        detail.status = data.result.value
        detail.level = data.level.value if data.level else None
        detail.comments = data.comment
        detail.evaluated_by = current_user.id
        
    db.commit()
    db.refresh(history)
    
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