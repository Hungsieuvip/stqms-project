from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

# --- AUDIT LOG ---
class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    table_name: str
    record_id: Optional[uuid.UUID]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAuditLogResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]

# --- NOTIFICATION ---
class NotificationResponse(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    related_entity: Optional[str]
    related_entity_id: Optional[uuid.UUID]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedNotificationResponse(BaseModel):
    total: int
    items: List[NotificationResponse]
    unread_count: int