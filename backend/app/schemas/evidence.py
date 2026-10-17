from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Union
from datetime import date, datetime
import uuid

class CriterionSimple(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    standard_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)

class EvidenceCriteriaInfo(BaseModel):
    criteria_id: uuid.UUID
    requirement_id: Optional[uuid.UUID] = None
    criterion: Optional[CriterionSimple] = None
    model_config = ConfigDict(from_attributes=True)

class DocumentVersionInfo(BaseModel):
    id: uuid.UUID
    version_number: int
    file_path: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class DocumentInfo(BaseModel):
    id: uuid.UUID
    title: str
    file_type: str
    file_size: int
    current_version: int
    versions: List[DocumentVersionInfo] = []
    model_config = ConfigDict(from_attributes=True)

class EvidenceCreate(BaseModel):
    name: str  # Title
    description: Optional[str] = None
    type: Optional[str] = None
    issue_date: Optional[date] = None
    provider: Optional[str] = None
    primary_criteria_id: Optional[uuid.UUID] = None
    additional_criteria_ids: List[uuid.UUID] = []

class EvidenceResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    issue_date: Optional[date] = None
    provider: Optional[str] = None
    status: str
    author_id: Optional[Union[uuid.UUID, int, str]] = None
    
    # Phase 1: State Machine fields
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[Union[uuid.UUID, int, str]] = None
    reviewed_at: Optional[datetime] = None
    
    created_at: Optional[datetime] = None
    criteria: List[EvidenceCriteriaInfo] = []
    documents: List[DocumentInfo] = []
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    uploader_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class WorkflowUpdate(BaseModel):
    status: str  # DRAFT, SUBMITTED, NEEDS_REVISION, PASSED, APPROVED, REJECTED
    note: Optional[str] = None  # Lý do từ chối / ghi chú

class ReviewLogResponse(BaseModel):
    id: uuid.UUID
    from_status: str
    from_label: str
    to_status: str
    to_label: str
    reason: Optional[str] = None
    reviewer_name: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
