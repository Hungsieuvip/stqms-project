from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class StandardBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    year: Optional[int] = None
    issue_date: Optional[date] = None

class StandardCreate(StandardBase):
    pass

class StandardUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    year: Optional[int] = None
    issue_date: Optional[date] = None

class StandardResponse(StandardBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True