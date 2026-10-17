import uuid
import logging
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.system import AuditLog

logger = logging.getLogger(__name__)

def log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    table_name: str,
    record_id: Optional[Any] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> Optional[AuditLog]:
    """
    Ghi nhận nhật ký kiểm toán (Audit Trail) cho toàn bộ thao tác CUD trong hệ thống.
    """
    try:
        # Xử lý an toàn record_id (có thể là UUID hoặc Int/String)
        rec_uuid = None
        if record_id is not None:
            if isinstance(record_id, uuid.UUID):
                rec_uuid = record_id
            else:
                try:
                    rec_uuid = uuid.UUID(str(record_id))
                except (ValueError, TypeError):
                    rec_uuid = None
                    if new_values is None:
                        new_values = {}
                    new_values["_target_record_id"] = str(record_id)

        audit_entry = AuditLog(
            user_id=user_id,
            action=action.upper(),
            table_name=table_name.lower(),
            record_id=rec_uuid,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
        return audit_entry
    except Exception as e:
        logger.error(f"Lỗi khi ghi Audit Log ({action} on {table_name}): {e}")
        db.rollback()
        return None
