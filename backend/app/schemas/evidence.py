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
    created_at: Optional[datetime] = None
    criteria: List[EvidenceCriteriaInfo] = []
    documents: List[DocumentInfo] = []
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    uploader_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class WorkflowUpdate(BaseModel):
    status: str # DRAFT, SUBMITTED, UNDER_REVIEW, NEEDS_REVISION, PASSED, APPROVED
    note: Optional[str] = None
