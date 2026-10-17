"""
Seed RBAC Roles and Permissions
===============================
Thiết lập 6 vai trò và bảng quyền hạn chuẩn theo Ma trận Phân quyền.
"""
from app.db.session import SessionLocal
import app.models
from app.models.rbac import Role, Permission, RolePermission, UserRole
from app.models.user import User

ALL_PERMISSIONS = [
    # Standards
    ("standards.read", "Xem danh sách tiêu chuẩn"),
    ("standards.create", "Tạo mới tiêu chuẩn"),
    ("standards.update", "Chỉnh sửa tiêu chuẩn"),
    ("standards.delete", "Xóa tiêu chuẩn"),
    ("standards.ai_import", "Thêm nhanh tiêu chuẩn bằng AI"),
    
    # Criteria
    ("criteria.read", "Xem danh mục tiêu chí"),
    ("criteria.create", "Tạo mới tiêu chí"),
    ("criteria.update", "Chỉnh sửa tiêu chí"),
    ("criteria.delete", "Xóa tiêu chí"),
    
    # Evidences
    ("evidence.read", "Xem minh chứng"),
    ("evidence.read_all", "Xem tất cả minh chứng của trường"),
    ("evidence.create", "Upload/Tạo mới minh chứng"),
    ("evidence.update", "Chỉnh sửa minh chứng"),
    ("evidence.delete", "Xóa minh chứng"),
    ("evidence.submit", "Nộp minh chứng"),
    ("evidence.review", "Duyệt sơ bộ minh chứng (PASSED/NEEDS_REVISION/REJECTED)"),
    ("evidence.approve", "Phê duyệt cuối minh chứng (APPROVED)"),
    ("evidence.reject", "Từ chối minh chứng"),
    
    # Tasks & Plans
    ("task.read", "Xem nhiệm vụ"),
    ("task.read_all", "Xem tất cả nhiệm vụ"),
    ("task.create", "Tạo nhiệm vụ"),
    ("task.update", "Cập nhật tiến độ nhiệm vụ"),
    ("task.assign", "Phân công nhiệm vụ"),
    ("plan.read", "Xem kế hoạch kiểm định"),
    ("plan.create", "Tạo kế hoạch kiểm định"),
    ("plan.update", "Chỉnh sửa kế hoạch"),
    ("plan.delete", "Xóa kế hoạch"),
    
    # Evaluations
    ("evaluation.read", "Xem kết quả đánh giá"),
    ("evaluation.create", "Tạo và chấm tự đánh giá"),
    ("evaluation.approve", "Phê duyệt kết quả đánh giá"),
    ("evaluation.export", "Xuất báo cáo tự đánh giá"),
    
    # Users & Roles
    ("users.read", "Xem danh sách người dùng"),
    ("users.create", "Tạo tài khoản người dùng"),
    ("users.update", "Chỉnh sửa thông tin người dùng"),
    ("users.delete", "Xóa tài khoản người dùng"),
    ("users.assign_role", "Phân quyền vai trò"),
    
    # System
    ("audit.read", "Xem nhật ký hệ thống"),
    ("notification.read", "Xem thông báo cá nhân"),
]

ROLE_DEFINITIONS = {
    "ADMIN": {
        "description": "Quản trị hệ thống toàn quyền",
        "permissions": [p[0] for p in ALL_PERMISSIONS]  # All permissions
    },
    "PRINCIPAL": {
        "description": "Hiệu trưởng / Chủ tịch Hội đồng kiểm định",
        "permissions": [
            "standards.read",
            "criteria.read",
            "evidence.read", "evidence.read_all", "evidence.approve", "evidence.reject",
            "task.read", "task.read_all", "task.create", "task.update", "task.assign",
            "plan.read", "plan.create", "plan.update",
            "evaluation.read", "evaluation.create", "evaluation.approve", "evaluation.export",
            "users.read",
            "audit.read",
            "notification.read",
        ]
    },
    "SECRETARY": {
        "description": "Thư ký kiểm định",
        "permissions": [
            "standards.read", "standards.create", "standards.update", "standards.ai_import",
            "criteria.read", "criteria.create", "criteria.update",
            "evidence.read", "evidence.read_all", "evidence.create", "evidence.update", "evidence.delete", "evidence.submit", "evidence.review", "evidence.reject",
            "task.read", "task.read_all", "task.create", "task.update", "task.assign",
            "plan.read", "plan.create", "plan.update", "plan.delete",
            "evaluation.read", "evaluation.create", "evaluation.export",
            "users.read",
            "notification.read",
        ]
    },
    "STANDARD_LEAD": {
        "description": "Trưởng tiêu chuẩn",
        "permissions": [
            "standards.read",
            "criteria.read", "criteria.create", "criteria.update",
            "evidence.read", "evidence.create", "evidence.update", "evidence.delete", "evidence.submit", "evidence.review", "evidence.reject",
            "task.read", "task.update", "task.assign",
            "plan.read",
            "evaluation.read", "evaluation.create",
            "users.read",
            "notification.read",
        ]
    },
    "TEACHER": {
        "description": "Giáo viên / Nhân viên",
        "permissions": [
            "standards.read",
            "criteria.read",
            "evidence.read", "evidence.create", "evidence.update", "evidence.delete", "evidence.submit",
            "task.read", "task.update",
            "evaluation.read",
            "notification.read",
        ]
    },
    "REVIEWER": {
        "description": "Khách / Đánh giá ngoài",
        "permissions": [
            "standards.read",
            "criteria.read",
            "evidence.read",
            "evaluation.read",
            "notification.read",
        ]
    }
}


def seed_rbac():
    db = SessionLocal()
    try:
        # 1. Seed all permissions
        perm_map = {}
        for code, desc in ALL_PERMISSIONS:
            p = db.query(Permission).filter(Permission.name == code).first()
            if not p:
                p = Permission(name=code)
                db.add(p)
                db.flush()
            perm_map[code] = p
        db.commit()
        print(f"✓ Total permissions in DB: {len(perm_map)}")

        # 2. Seed roles and map permissions
        for role_name, defn in ROLE_DEFINITIONS.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.flush()

            # Clear old role_permissions and reassign
            db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
            for p_code in defn["permissions"]:
                if p_code in perm_map:
                    db.add(RolePermission(role_id=role.id, permission_id=perm_map[p_code].id))
            print(f"✓ Role '{role_name}': mapped {len(defn['permissions'])} permissions")

        # 3. Ensure admin user has ADMIN role
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
            if admin_role and admin_role not in admin.roles:
                admin.roles.append(admin_role)
                print("✓ Attached ADMIN role to admin user")

        db.commit()
        print("🎉 Seeded RBAC roles and permissions successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_rbac()
