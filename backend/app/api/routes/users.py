import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.api import deps
from app.core.security import get_password_hash
from app.services.audit_service import log_audit
from app.models.user import User
from app.models.rbac import Role, UserRole
from app.models.organization import Department
from app.schemas.user import (
    UserCreate, UserUpdate, UserRoleUpdate, UserResponse,
    PaginatedUserResponse, RoleResponse
)

router = APIRouter()

ROLE_DESCRIPTIONS = {
    "ADMIN": "Quản trị hệ thống toàn quyền",
    "PRINCIPAL": "Hiệu trưởng / Chủ tịch Hội đồng kiểm định",
    "SECRETARY": "Thư ký kiểm định",
    "STANDARD_LEAD": "Trưởng tiêu chuẩn",
    "TEACHER": "Giáo viên / Nhân viên",
    "REVIEWER": "Khách / Đánh giá ngoài",
    "MANAGER": "Quản lý chuyên môn",
    "STAFF": "Nhân viên",
    "VIEWER": "Người xem"
}


def serialize_user(u: User) -> dict:
    roles_list = [r.name for r in u.roles] if u.roles else []
    perms = set()
    for r in u.roles:
        for p in r.permissions:
            perms.add(p.name)

    dept_name = u.department.name if u.department else None

    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "full_name": u.full_name,
        "phone": u.phone,
        "department_id": u.department_id,
        "department_name": dept_name,
        "is_active": u.is_active,
        "role": roles_list[0] if roles_list else "TEACHER",
        "roles": roles_list,
        "permissions": sorted(list(perms)),
        "created_at": u.created_at,
    }


# ==========================================
# GET ROLES LIST
# ==========================================
@router.get("/roles/list")
def list_roles(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Lấy danh sách tất cả các vai trò trong hệ thống để chọn."""
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": ROLE_DESCRIPTIONS.get(r.name, r.name),
            "permission_count": len(r.permissions),
        }
        for r in roles
    ]


# ==========================================
# GET USERS (PAGINATED + SEARCH + FILTER)
# ==========================================
@router.get("", response_model=PaginatedUserResponse)
@router.get("/", response_model=PaginatedUserResponse)
def get_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.read"])),
    search: Optional[str] = Query(None, description="Tìm theo tên, email, username"),
    role: Optional[str] = Query(None, description="Lọc theo tên role"),
    department_id: Optional[uuid.UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(User).options(
        joinedload(User.roles).joinedload(Role.permissions),
        joinedload(User.department)
    )

    if search and search.strip():
        kw = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(kw),
                User.email.ilike(kw),
                User.full_name.ilike(kw),
                User.phone.ilike(kw),
            )
        )

    if role and role.strip():
        query = query.filter(User.roles.any(Role.name.ilike(role.strip())))

    if department_id:
        query = query.filter(User.department_id == department_id)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.distinct().count()
    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()

    items = [serialize_user(u) for u in users]
    page = (skip // limit) + 1

    return {
        "total": total,
        "items": items,
        "page": page,
        "size": limit,
    }


# ==========================================
# CREATE USER
# ==========================================
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.create"])),
):
    # 1. Kiểm tra username & email trùng
    if db.query(User).filter(User.username == user_in.username.strip()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tên đăng nhập '{user_in.username}' đã tồn tại."
        )

    if db.query(User).filter(User.email == user_in.email.strip().lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_in.email}' đã được sử dụng."
        )

    # 2. Tạo User
    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip() if user_in.full_name else None,
        phone=user_in.phone.strip() if user_in.phone else None,
        department_id=user_in.department_id,
        is_active=user_in.is_active if user_in.is_active is not None else True,
    )
    db.add(new_user)
    db.flush()

    # 3. Gán roles
    role_names = user_in.roles or ["TEACHER"]
    for rname in role_names:
        r = db.query(Role).filter(Role.name == rname.strip().upper()).first()
        if r and r not in new_user.roles:
            new_user.roles.append(r)

    db.commit()
    db.refresh(new_user)
    log_audit(db, current_user.id, "CREATE", "users", new_user.id, new_values={"username": new_user.username, "email": new_user.email})
    return serialize_user(new_user)


# ==========================================
# GET USER BY ID
# ==========================================
@router.get("/{id}", response_model=UserResponse)
def get_user_by_id(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.read"])),
):
    user = db.query(User).options(
        joinedload(User.roles).joinedload(Role.permissions),
        joinedload(User.department)
    ).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
    return serialize_user(user)


# ==========================================
# UPDATE USER
# ==========================================
@router.put("/{id}", response_model=UserResponse)
def update_user(
    id: int,
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.update"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    # Kiểm tra trùng email nếu sửa email
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email.strip().lower(), User.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Email '{user_in.email}' đã được sử dụng.")
        user.email = user_in.email.strip().lower()

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip() if user_in.full_name else None

    if user_in.phone is not None:
        user.phone = user_in.phone.strip() if user_in.phone else None

    if user_in.department_id is not None:
        user.department_id = user_in.department_id

    if user_in.is_active is not None:
        # Ngăn tự vô hiệu hóa tài khoản của chính mình nếu là ADMIN
        if user.id == current_user.id and not user_in.is_active:
            raise HTTPException(status_code=400, detail="Không thể tự vô hiệu hóa tài khoản của chính bạn.")
        user.is_active = user_in.is_active

    if user_in.password and user_in.password.strip():
        user.hashed_password = get_password_hash(user_in.password.strip())

    # Cập nhật roles nếu có
    if user_in.roles is not None:
        user.roles.clear()
        for rname in user_in.roles:
            r = db.query(Role).filter(Role.name == rname.strip().upper()).first()
            if r:
                user.roles.append(r)

    db.commit()
    db.refresh(user)
    return serialize_user(user)


# ==========================================
# ASSIGN ROLES
# ==========================================
@router.post("/{id}/roles", response_model=UserResponse)
def assign_user_roles(
    id: int,
    role_in: UserRoleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.assign_role"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    user.roles.clear()
    for rname in role_in.roles:
        r = db.query(Role).filter(Role.name == rname.strip().upper()).first()
        if r:
            user.roles.append(r)

    db.commit()
    db.refresh(user)
    return serialize_user(user)


# ==========================================
# DELETE USER
# ==========================================
@router.delete("/{id}")
def delete_user(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["users.delete"])),
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    # 1. Không cho phép tự xóa tài khoản của chính mình
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự xóa tài khoản của chính mình."
        )

    # 2. Không cho phép xóa ADMIN cuối cùng
    admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
    if admin_role and admin_role in user.roles:
        admin_count = db.query(UserRole).filter(UserRole.role_id == admin_role.id).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa tài khoản Quản trị viên (ADMIN) duy nhất còn lại của hệ thống."
            )

    u_id = user.id
    u_name = user.username
    db.delete(user)
    db.commit()
    log_audit(db, current_user.id, "DELETE", "users", u_id, old_values={"username": u_name})
    return {"message": f"Đã xóa tài khoản '{u_name}' thành công"}
