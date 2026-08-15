from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime
import uuid

# Pagination
class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list

# Standard
class StandardBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    issued_date: Optional[date] = None

class StandardCreate(StandardBase):
    pass

class StandardUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    issued_date: Optional[date] = None

class StandardResponse(StandardBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Criterion
class CriterionBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    sequence_num: int

class CriterionCreate(CriterionBase):
    standard_id: uuid.UUID

class CriterionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    sequence_num: Optional[int] = None

class CriterionResponse(CriterionBase):
    id: uuid.UUID
    standard_id: uuid.UUID
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Requirement
class RequirementBase(BaseModel):
    code: str
    description: str
    sequence_num: int

class RequirementCreate(RequirementBase):
    criteria_id: uuid.UUID

class RequirementUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    sequence_num: Optional[int] = None

class RequirementResponse(RequirementBase):
    id: uuid.UUID
    criteria_id: uuid.UUID
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)