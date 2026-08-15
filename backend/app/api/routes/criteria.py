from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.quality import Criterion, Requirement
from app.schemas.quality import (
    CriterionCreate, CriterionUpdate, CriterionResponse,
    RequirementCreate, RequirementResponse, PaginatedResponse
)
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
def get_criteria(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.read"])),
    standard_id: uuid.UUID = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
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
def create_criterion(
    criterion_in: CriterionCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.create"]))
):
    db_obj = Criterion(**criterion_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}/requirements", response_model=list[RequirementResponse])
def get_criterion_requirements(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["criteria.read"]))
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