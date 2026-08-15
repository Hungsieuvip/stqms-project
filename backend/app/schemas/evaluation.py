from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class ResultEnum(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PENDING = "PENDING"

class LevelEnum(str, Enum):
    LEVEL_1 = "LEVEL_1"
    LEVEL_2 = "LEVEL_2"
    LEVEL_3 = "LEVEL_3"

class EvaluationCreate(BaseModel):
    result: ResultEnum
    level: Optional[LevelEnum] = None
    comment: Optional[str] = None

class EvaluationHistoryResponse(BaseModel):
    id: uuid.UUID
    criterion_id: uuid.UUID
    evaluator_id: Optional[uuid.UUID]
    result: str
    level: Optional[str]
    comment: Optional[str]
    evaluated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)