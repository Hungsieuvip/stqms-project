from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.api import deps
from app.models.standard import Standard  # hoặc app.models.standards tùy cấu trúc model
from app.models.user import User
from app.schemas.standard import StandardCreate, StandardUpdate, StandardResponse

router = APIRouter()

@router.get("", response_model=List[StandardResponse])
@router.get("/", response_model=List[StandardResponse])
def get_standards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    standards = db.query(Standard).order_by(Standard.id.desc()).all()
    return standards

@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
def create_standard(
    standard_in: StandardCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Kiểm tra xem mã tiêu chuẩn đã tồn tại chưa
    existing = db.query(Standard).filter(Standard.code == standard_in.code.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã tiêu chuẩn '{standard_in.code}' đã tồn tại trong hệ thống."
        )

    # Chuyển đổi dữ liệu, đặt giá trị mặc định an toàn cho các trường ngày tháng/năm
    data = standard_in.model_dump() if hasattr(standard_in, 'model_dump') else standard_in.dict()
    data["code"] = data["code"].strip()
    data["name"] = data["name"].strip()
    
    if "issue_date" in data and data["issue_date"] is None:
        data["issue_date"] = date.today()
    if "year" in data and data["year"] is None:
        data["year"] = date.today().year

    new_standard = Standard(**data)
    db.add(new_standard)
    db.commit()
    db.refresh(new_standard)
    return new_standard

@router.delete("/{standard_id}")
def delete_standard(
    standard_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    std = db.query(Standard).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(status_code=404, detail="Không tìm thấy tiêu chuẩn")
    db.delete(std)
    db.commit()
    return {"message": "Đã xóa tiêu chuẩn thành công"}