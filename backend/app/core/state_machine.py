"""
Evidence Workflow State Machine
================================
Quản lý chuyển trạng thái hợp lệ cho minh chứng theo quy trình kiểm định.

Luồng: DRAFT → SUBMITTED → PASSED → APPROVED
       ↘ NEEDS_REVISION ↗    ↘ REJECTED ↗
"""

from typing import Optional, Set

# ==========================================
# EVIDENCE STATE TRANSITIONS
# ==========================================
EVIDENCE_TRANSITIONS: dict[str, list[str]] = {
    "DRAFT":           ["SUBMITTED"],
    "SUBMITTED":       ["PASSED", "NEEDS_REVISION", "REJECTED"],
    "NEEDS_REVISION":  ["SUBMITTED", "DRAFT"],
    "PASSED":          ["APPROVED", "REJECTED"],
    "REJECTED":        ["DRAFT"],
    "APPROVED":        [],  # Terminal state
}

# Các trạng thái yêu cầu lý do bắt buộc
REJECTION_REQUIRED_STATES: Set[str] = {"NEEDS_REVISION", "REJECTED"}

# Các trạng thái yêu cầu quyền reviewer (không phải author)
REVIEWER_ONLY_TRANSITIONS: dict[str, set[str]] = {
    "SUBMITTED": {"PASSED", "NEEDS_REVISION", "REJECTED"},
    "PASSED": {"APPROVED", "REJECTED"},
}

# Các trạng thái chỉ author mới được chuyển
AUTHOR_ONLY_TRANSITIONS: dict[str, set[str]] = {
    "DRAFT": {"SUBMITTED"},
    "NEEDS_REVISION": {"SUBMITTED", "DRAFT"},
    "REJECTED": {"DRAFT"},
}

# Vietnamese labels for statuses
STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Bản nháp",
    "SUBMITTED": "Đã nộp",
    "NEEDS_REVISION": "Cần chỉnh sửa",
    "PASSED": "Đã duyệt sơ bộ",
    "REJECTED": "Bị từ chối",
    "APPROVED": "Đã phê duyệt",
}

# ==========================================
# TASK STATE TRANSITIONS
# ==========================================
TASK_TRANSITIONS: dict[str, list[str]] = {
    "TODO":        ["IN_PROGRESS"],
    "IN_PROGRESS": ["COMPLETED", "OVERDUE"],
    "OVERDUE":     ["IN_PROGRESS", "COMPLETED"],
    "COMPLETED":   [],  # Terminal state
}

# ==========================================
# EVALUATION STATE TRANSITIONS
# ==========================================
EVALUATION_TRANSITIONS: dict[str, list[str]] = {
    "ONGOING":         ["COMPLETED"],
    "COMPLETED":       ["APPROVED", "NEEDS_REVISION"],
    "NEEDS_REVISION":  ["ONGOING"],
    "APPROVED":        [],  # Terminal state
}


def validate_evidence_transition(
    current_status: str,
    new_status: str,
    reason: Optional[str] = None,
) -> None:
    """
    Validate evidence status transition.
    
    Raises ValueError with Vietnamese message if transition is invalid.
    """
    current_status = current_status.upper()
    new_status = new_status.upper()

    allowed = EVIDENCE_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        allowed_labels = [f"'{STATUS_LABELS.get(s, s)}'" for s in allowed]
        raise ValueError(
            f"Không thể chuyển từ '{STATUS_LABELS.get(current_status, current_status)}' "
            f"sang '{STATUS_LABELS.get(new_status, new_status)}'. "
            f"Chỉ cho phép chuyển sang: {', '.join(allowed_labels) if allowed_labels else 'không có (trạng thái cuối cùng)'}."
        )

    if new_status in REJECTION_REQUIRED_STATES and not (reason and reason.strip()):
        raise ValueError(
            f"Phải cung cấp lý do khi chuyển sang trạng thái "
            f"'{STATUS_LABELS.get(new_status, new_status)}'."
        )


def is_reviewer_transition(current_status: str, new_status: str) -> bool:
    """Check if this transition requires reviewer role (not author)."""
    current_status = current_status.upper()
    new_status = new_status.upper()
    reviewer_targets = REVIEWER_ONLY_TRANSITIONS.get(current_status, set())
    return new_status in reviewer_targets


def is_author_transition(current_status: str, new_status: str) -> bool:
    """Check if this transition can only be done by the author."""
    current_status = current_status.upper()
    new_status = new_status.upper()
    author_targets = AUTHOR_ONLY_TRANSITIONS.get(current_status, set())
    return new_status in author_targets


def get_available_transitions(current_status: str) -> list[dict]:
    """Get list of available transitions with labels."""
    current_status = current_status.upper()
    allowed = EVIDENCE_TRANSITIONS.get(current_status, [])
    return [
        {
            "status": s,
            "label": STATUS_LABELS.get(s, s),
            "requires_reason": s in REJECTION_REQUIRED_STATES,
        }
        for s in allowed
    ]
