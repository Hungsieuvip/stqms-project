from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.api import deps
from app.models.training import Plan
from app.schemas.training import PlanCreate, PlanUpdate, PlanResponse, PaginatedPlanResponse
from app.models.user import User

router = APIRouter()

@router.post("", response_model=PlanResponse)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["plan.create"]))
):
    plan = Plan(**data.model_dump(exclude_unset=True))
    if not plan.owner_id:
        plan.owner_id = current_user.id
        
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.get("", response_model=PaginatedPlanResponse)
def list_plans(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["plan.read"])),
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1)
):
    query = db.query(Plan)
    if status:
        query = query.filter(Plan.status == status.upper())
    
    total = query.count()
    items = query.order_by(Plan.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}

@router.get("/{id}", response_model=PlanResponse)
def get_plan_detail(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["plan.read"]))
):
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan