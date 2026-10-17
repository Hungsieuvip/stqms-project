import uuid
from datetime import datetime, date
from typing import Optional, List, Union
from enum import Enum
from pydantic import BaseModel, ConfigDict

class ResultEnum(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PENDING = "PENDING"

class LevelEnum(str, Enum):
    LEVEL_1 = "LEVEL_1"
    LEVEL_2 = "LEVEL_2"
    LEVEL_3 = "LEVEL_3"
    LEVEL_4 = "LEVEL_4"

class EvaluationCreate(BaseModel):
    result: ResultEnum
    level: Optional[LevelEnum] = None
    comment: Optional[str] = None

class EvaluationHistoryResponse(BaseModel):
    id: uuid.UUID
    criterion_id: uuid.UUID
    evaluator_id: Optional[Union[int, uuid.UUID, str]] = None
    result: str
    level: Optional[str] = None
    comment: Optional[str] = None
    evaluated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EvaluationDetailResponse(BaseModel):
    id: uuid.UUID
    evaluation_id: uuid.UUID
    criteria_id: uuid.UUID
    criteria_code: Optional[str] = None
    criteria_name: Optional[str] = None
    evaluated_by: Optional[int] = None
    evaluator_name: Optional[str] = None
    score: Optional[float] = None
    status: Optional[str] = None
    level: Optional[str] = None
    comments: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class EvaluationSessionCreate(BaseModel):
    standard_id: uuid.UUID
    academic_year_id: Optional[uuid.UUID] = None
    name: str
    status: Optional[str] = "ONGOING" # ONGOING, COMPLETED, APPROVED
    evaluation_date: Optional[date] = None

class EvaluationSessionUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    academic_year_id: Optional[uuid.UUID] = None
    evaluation_date: Optional[date] = None

class EvaluationSessionResponse(BaseModel):
    id: uuid.UUID
    standard_id: uuid.UUID
    standard_code: Optional[str] = None
    standard_name: Optional[str] = None
    academic_year_id: Optional[uuid.UUID] = None
    academic_year_name: Optional[str] = None
    name: str
    status: str
    evaluation_date: Optional[date] = None
    total_criteria: int = 0
    passed_criteria: int = 0
    completion_rate: float = 0.0
    details: Optional[List[EvaluationDetailResponse]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
