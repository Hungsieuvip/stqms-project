from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
import uuid

class EvidenceCreate(BaseModel):
    name: str  # Title
    description: Optional[str] = None
    type: Optional[str] = None
    issue_date: Optional[date] = None
    provider: Optional[str] = None
    primary_criteria_id: uuid.UUID  # Dùng để generate code
    additional_criteria_ids: List[uuid.UUID] = []

class EvidenceResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    type: Optional[str]
    issue_date: Optional[date]
    provider: Optional[str]
    status: str
    author_id: Optional[uuid.UUID]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WorkflowUpdate(BaseModel):
    status: str # DRAFT, SUBMITTED, UNDER_REVIEW, NEEDS_REVISION, PASSED, APPROVED