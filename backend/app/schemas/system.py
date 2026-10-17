from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
import uuid

# --- AUDIT LOG ---
class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[Union[int, uuid.UUID, str]] = None
    action: str
    table_name: str
    record_id: Optional[uuid.UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAuditLogResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]

# --- NOTIFICATION ---
class NotificationResponse(BaseModel):
    id: uuid.UUID
    recipient_id: Union[int, uuid.UUID, str]
    title: str
    message: str
    type: str
    is_read: bool
    related_entity: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedNotificationResponse(BaseModel):
    total: int
    items: List[NotificationResponse]
    unread_count: int
