from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api import deps
from app.models.academic_year import AcademicYear
from app.models.evaluation import Evaluation
from app.models.training import Plan
from app.schemas.academic_year import (
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearResponse
)
from app.models.user import User
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("", response_model=List[AcademicYearResponse])
def get_academic_years(
    db: Session = Depends(deps.get_db),
    active_only: Optional[bool] = None,
    current_user: User = Depends(deps.get_current_user)
):
    """Lấy danh sách các năm học / chu kỳ kiểm định"""
    query = db.query(AcademicYear)
    if active_only is not None:
        query = query.filter(AcademicYear.is_active == active_only)
    return query.order_by(AcademicYear.start_date.desc()).all()

@router.post("", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.create"]))
):
    """Tạo mới một năm học"""
    existing = db.query(AcademicYear).filter(AcademicYear.code == data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Năm học với mã '{data.code}' đã tồn tại trong hệ thống."
        )

    academic_year = AcademicYear(
        code=data.code,
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
        description=data.description
    )
    db.add(academic_year)
    db.commit()
    db.refresh(academic_year)
    log_audit(db, current_user.id, "CREATE", "academic_years", academic_year.id, new_values={"code": academic_year.code, "name": academic_year.name})
    return academic_year

@router.get("/{id}", response_model=AcademicYearResponse)
def get_academic_year(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Xem chi tiết một năm học"""
    item = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy năm học.")
    return item

@router.put("/{id}", response_model=AcademicYearResponse)
def update_academic_year(
    id: uuid.UUID,
    data: AcademicYearUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.update"]))
):
    """Cập nhật thông tin năm học"""
    item = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy năm học.")

    if data.code is not None and data.code != item.code:
        conflict = db.query(AcademicYear).filter(AcademicYear.code == data.code).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã năm học '{data.code}' đã bị trùng."
            )
        item.code = data.code

    if data.name is not None:
        item.name = data.name
    if data.start_date is not None:
        item.start_date = data.start_date
    if data.end_date is not None:
        item.end_date = data.end_date
    if data.is_active is not None:
        item.is_active = data.is_active
    if data.description is not None:
        item.description = data.description

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete_academic_year(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.delete"]))
):
    """Xóa năm học (Có Deletion Guard ràng buộc dữ liệu)"""
    item = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy năm học.")

    # Guard: kiểm tra liên kết với evaluations
    eval_count = db.query(Evaluation).filter(Evaluation.academic_year_id == id).count()
    if eval_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể xóa năm học '{item.name}' vì đang có {eval_count} đợt đánh giá liên kết."
        )

    # Guard: kiểm tra liên kết với plans
    plan_count = db.query(Plan).filter(Plan.academic_year_id == id).count()
    if plan_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể xóa năm học '{item.name}' vì đang có {plan_count} kế hoạch kiểm định liên kết."
        )

    ay_id = item.id
    ay_code = item.code
    db.delete(item)
    db.commit()
    log_audit(db, current_user.id, "DELETE", "academic_years", ay_id, old_values={"code": ay_code})
    return {"message": f"Đã xóa thành công năm học '{item.name}'"}
