from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.system import AuditLog
from app.schemas.system import PaginatedAuditLogResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedAuditLogResponse)
def get_audit_logs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["audit.read"])), # Cần quyền đặc biệt
    table_name: str = None,
    action: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1)
):
    query = db.query(AuditLog)
    
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
    if action:
        query = query.filter(AuditLog.action == action.upper())
        
    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}