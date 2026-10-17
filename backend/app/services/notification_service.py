"""
Notification Service
=====================
Tự động tạo thông báo khi có sự kiện quan trọng trong hệ thống.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.system import Notification


def notify_user(
    db: Session,
    recipient_id: int,
    title: str,
    message: str,
    notif_type: str = "INFO",
    related_entity: Optional[str] = None,
    related_entity_id: Optional[uuid.UUID] = None,
    auto_commit: bool = False,
) -> Notification:
    """
    Tạo một thông báo cho người dùng.
    
    Args:
        db: Database session
        recipient_id: ID người nhận
        title: Tiêu đề thông báo
        message: Nội dung chi tiết
        notif_type: Loại thông báo (INFO, WARNING, SUCCESS, ERROR, WORKFLOW)
        related_entity: Tên entity liên quan (evidence, task, evaluation...)
        related_entity_id: ID của entity liên quan
        auto_commit: Tự động commit hay không (default: False, để caller commit)
    """
    notif = Notification(
        recipient_id=recipient_id,
        title=title,
        message=message,
        type=notif_type,
        related_entity=related_entity,
        related_entity_id=related_entity_id,
    )
    db.add(notif)
    if auto_commit:
        db.commit()
    return notif


def notify_evidence_status_change(
    db: Session,
    evidence_id: uuid.UUID,
    evidence_code: str,
    evidence_name: str,
    author_id: Optional[int],
    reviewer_id: int,
    old_status: str,
    new_status: str,
    reason: Optional[str] = None,
) -> Optional[Notification]:
    """
    Gửi thông báo tự động khi trạng thái minh chứng thay đổi.
    Người nhận phụ thuộc vào loại chuyển trạng thái.
    """
    from app.core.state_machine import STATUS_LABELS

    old_label = STATUS_LABELS.get(old_status, old_status)
    new_label = STATUS_LABELS.get(new_status, new_status)

    # Xác định người nhận và nội dung theo loại transition
    if new_status in ("NEEDS_REVISION", "REJECTED"):
        # Thông báo cho author (người nộp)
        if not author_id:
            return None
        recipient_id = author_id
        if new_status == "REJECTED":
            title = f"🔴 Minh chứng [{evidence_code}] bị từ chối"
            message = (
                f"Minh chứng \"{evidence_name}\" ({evidence_code}) đã bị từ chối.\n"
                f"Lý do: {reason or 'Không rõ'}\n"
                f"Vui lòng xem lại và chỉnh sửa nếu cần."
            )
        else:  # NEEDS_REVISION
            title = f"🟡 Minh chứng [{evidence_code}] cần chỉnh sửa"
            message = (
                f"Minh chứng \"{evidence_name}\" ({evidence_code}) cần được chỉnh sửa.\n"
                f"Lý do: {reason or 'Không rõ'}\n"
                f"Vui lòng sửa và nộp lại."
            )
        notif_type = "WARNING"

    elif new_status == "APPROVED":
        # Thông báo cho author (người nộp)
        if not author_id:
            return None
        recipient_id = author_id
        title = f"✅ Minh chứng [{evidence_code}] đã được phê duyệt"
        message = (
            f"Minh chứng \"{evidence_name}\" ({evidence_code}) đã được phê duyệt chính thức.\n"
            f"Trạng thái: {old_label} → {new_label}"
        )
        notif_type = "SUCCESS"

    elif new_status == "PASSED":
        # Thông báo cho author rằng đã qua vòng duyệt sơ bộ
        if not author_id:
            return None
        recipient_id = author_id
        title = f"🔵 Minh chứng [{evidence_code}] đã duyệt sơ bộ"
        message = (
            f"Minh chứng \"{evidence_name}\" ({evidence_code}) đã được duyệt sơ bộ.\n"
            f"Đang chờ Hiệu trưởng phê duyệt cuối cùng."
        )
        notif_type = "INFO"

    elif new_status == "SUBMITTED":
        # Thông báo cho reviewer/admin rằng có minh chứng mới cần duyệt
        # Trong trường hợp này, ta không biết chính xác ai là reviewer
        # → sẽ cần thông báo cho tất cả Standard Lead/Secretary
        # Tạm thời bỏ qua, sẽ implement trong Phase 2 với StandardAssignment
        return None

    else:
        return None

    return notify_user(
        db=db,
        recipient_id=recipient_id,
        title=title,
        message=message,
        notif_type=notif_type,
        related_entity="evidence",
        related_entity_id=evidence_id,
    )


def notify_task_assigned(
    db: Session,
    task_id: uuid.UUID,
    task_name: str,
    assignee_id: int,
    assigner_name: str,
) -> Notification:
    """Thông báo khi được phân công nhiệm vụ."""
    return notify_user(
        db=db,
        recipient_id=assignee_id,
        title=f"📋 Bạn được phân công nhiệm vụ mới",
        message=f"Nhiệm vụ \"{task_name}\" đã được {assigner_name} phân công cho bạn.",
        notif_type="INFO",
        related_entity="task",
        related_entity_id=task_id,
    )
