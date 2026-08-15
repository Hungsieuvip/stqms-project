from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.system import Notification
from app.schemas.system import NotificationResponse, PaginatedNotificationResponse
from app.models.user import User


router = APIRouter()

@router.get("", response_model=PaginatedNotificationResponse)
def get_my_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user), # Ai cũng có thể xem thông báo của mình
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    unread_only: bool = Query(False)
):
    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
        
    total = query.count()
    unread_count = db.query(Notification).filter(Notification.recipient_id == current_user.id, Notification.is_read == False).count()
    
    items = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": items,
        "unread_count": unread_count
    }

@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == id, Notification.recipient_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif