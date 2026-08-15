from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid

from app.api import deps
from app.models.quality import Standard
from app.schemas.quality import StandardCreate, StandardUpdate, StandardResponse, PaginatedResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
def get_standards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.read"])),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = None,
    is_active: bool = None
):
    query = db.query(Standard)
    
    if search:
        query = query.filter(or_(
            Standard.code.ilike(f"%{search}%"),
            Standard.name.ilike(f"%{search}%")
        ))
    if is_active is not None:
        query = query.filter(Standard.is_active == is_active)
        
    total = query.count()
    items = query.order_by(Standard.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "items": [StandardResponse.model_validate(item) for item in items]
    }

@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
def create_standard(
    standard_in: StandardCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.create"]))
):
    if db.query(Standard).filter(Standard.code == standard_in.code).first():
        raise HTTPException(status_code=400, detail="Standard code already exists")
    
    db_obj = Standard(**standard_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=StandardResponse)
def get_standard(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.read"]))
):
    standard = db.query(Standard).filter(Standard.id == id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")
    return standard

@router.patch("/{id}/status")
def toggle_standard_status(
    id: uuid.UUID,
    is_active: bool,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standard.update"]))
):
    standard = db.query(Standard).filter(Standard.id == id).first()
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")
    
    standard.is_active = is_active
    db.commit()
    return {"message": f"Standard status updated to {'active' if is_active else 'inactive'}"}