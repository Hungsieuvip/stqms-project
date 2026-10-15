from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.api import deps
from app.models.quality import Standard, Criterion, Requirement
from app.schemas.quality import (
    CriterionCreate, CriterionUpdate, CriterionResponse,
    RequirementCreate, RequirementResponse, PaginatedResponse
)
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
@router.get("/", response_model=PaginatedResponse)
def get_criteria(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    standard_id: Optional[uuid.UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    query = db.query(Criterion)
    if standard_id:
        query = query.filter(Criterion.standard_id == standard_id)
        
    total = query.count()
    items = query.order_by(Criterion.sequence_num.asc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "items": [CriterionResponse.model_validate(item) for item in items]
    }

@router.post("", response_model=CriterionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CriterionResponse, status_code=status.HTTP_201_CREATED)
def create_criterion(
    criterion_in: CriterionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.create"]))
):
    # Kiểm tra Standard có tồn tại không
    std = db.query(Standard).filter(Standard.id == criterion_in.standard_id).first()
    if not std:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy Bộ tiêu chuẩn tương ứng."
        )

    clean_code = criterion_in.code.strip()
    existing = db.query(Criterion).filter(
        Criterion.standard_id == criterion_in.standard_id,
        Criterion.code == clean_code
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã tiêu chí '{clean_code}' đã tồn tại trong bộ tiêu chuẩn này."
        )

    data = criterion_in.model_dump()
    data["code"] = clean_code
    data["name"] = criterion_in.name.strip()

    db_obj = Criterion(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=CriterionResponse)
def update_criterion(
    id: uuid.UUID,
    criterion_in: CriterionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.update"]))
):
    criterion = db.query(Criterion).filter(Criterion.id == id).first()
    if not criterion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tiêu chí.")

    update_data = criterion_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        clean_code = update_data["code"].strip()
        conflict = db.query(Criterion).filter(
            Criterion.standard_id == criterion.standard_id,
            Criterion.code == clean_code,
            Criterion.id != id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã tiêu chí '{clean_code}' đã tồn tại trong bộ tiêu chuẩn này."
            )
        update_data["code"] = clean_code

    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].strip()

    for field, value in update_data.items():
        setattr(criterion, field, value)

    db.commit()
    db.refresh(criterion)
    return criterion

@router.delete("/{id}")
def delete_criterion(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.delete"]))
):
    criterion = db.query(Criterion).filter(Criterion.id == id).first()
    if not criterion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tiêu chí.")

    db.delete(criterion)
    db.commit()
    return {"message": "Đã xóa tiêu chí thành công"}

@router.get("/{id}/requirements", response_model=list[RequirementResponse])
def get_criterion_requirements(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    criterion = db.query(Criterion).filter(Criterion.id == id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
        
    return criterion.requirements

@router.post("/{id}/requirements", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
def create_requirement(
    id: uuid.UUID,
    req_in: RequirementCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.update"]))
):
    if req_in.criteria_id != id:
        raise HTTPException(status_code=400, detail="URL ID and Body Criteria ID mismatch")
        
    db_obj = Requirement(**req_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
    
@router.patch("/{id}/status")
def toggle_criterion_status(
    id: uuid.UUID,
    is_active: bool,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.update"]))
):
    criterion = db.query(Criterion).filter(Criterion.id == id).first()
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    
    criterion.is_active = is_active
    db.commit()
    return {"message": f"Criterion status updated to {'active' if is_active else 'inactive'}"}
