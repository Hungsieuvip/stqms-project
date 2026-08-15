from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date
import uuid

from app.api import deps
from app.models.training import Task
from app.schemas.training import TaskCreate, TaskUpdate, TaskResponse, PaginatedTaskResponse
from app.models.user import User

router = APIRouter()

def auto_update_overdue(db: Session, task: Task):
    """Cập nhật trạng thái OVERDUE nếu đã quá hạn và chưa hoàn thành"""
    if task.status not in ["COMPLETED"] and task.due_date and task.due_date < date.today():
        if task.status != "OVERDUE":
            task.status = "OVERDUE"
            db.commit()

@router.post("", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["task.create"]))
):
    task = Task(**data.model_dump(by_alias=True, exclude_unset=True))
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("", response_model=PaginatedTaskResponse)
def search_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["task.read"])),
    search: str = None,
    status: str = None,
    assignee_id: uuid.UUID = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20)
):
    query = db.query(Task)
    
    if search:
        query = query.filter(Task.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Task.status == status.upper())
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
        
    items = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    
    # Auto check overdue before returning
    for item in items:
        auto_update_overdue(db, item)
        
    return {"total": query.count(), "items": items}

@router.patch("/{id}", response_model=TaskResponse)
def update_task(
    id: uuid.UUID,
    data: TaskUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["task.update", "task.assign"]))
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = data.model_dump(by_alias=True, exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    return task