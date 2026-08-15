from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime
import uuid

# --- PLAN ---
class PlanBase(BaseModel):
    name: str
    academic_year_id: uuid.UUID
    objective: Optional[str] = None
    target: Optional[str] = None
    description: Optional[str] = None
    start_date: date
    end_date: date

class PlanCreate(PlanBase):
    owner_id: Optional[uuid.UUID] = None

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    target: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class PlanResponse(PlanBase):
    id: uuid.UUID
    owner_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- TASK ---
class TaskBase(BaseModel):
    title: str = Field(alias="name") # Map schema 'title' to DB 'name'
    description: Optional[str] = None
    plan_id: uuid.UUID
    criteria_id: Optional[uuid.UUID] = None
    evidence_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    deadline: Optional[date] = Field(alias="due_date", default=None)
    priority: str = "MEDIUM"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(alias="name", default=None)
    description: Optional[str] = None
    assignee_id: Optional[uuid.UUID] = None
    deadline: Optional[date] = Field(alias="due_date", default=None)
    priority: Optional[str] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
class PaginatedPlanResponse(BaseModel):
    total: int
    items: List[PlanResponse]

class PaginatedTaskResponse(BaseModel):
    total: int
    items: List[TaskResponse]