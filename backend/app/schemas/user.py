import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    roles: Optional[List[str]] = ["TEACHER"]
    is_active: Optional[bool] = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None


class UserRoleUpdate(BaseModel):
    roles: List[str]


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    is_active: bool
    role: Optional[str] = None  # primary role name
    roles: List[str] = []
    permissions: List[str] = []
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedUserResponse(BaseModel):
    total: int
    items: List[UserResponse]
    page: int
    size: int
