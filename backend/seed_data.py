import sys
import os
import uuid
from datetime import date

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.rbac import Role, Permission
from app.models.quality import Standard, Criterion

def seed():
    db = SessionLocal()
    try:
        print("===> 1. Khởi tạo/Cập nhật Vai trò (Roles)...")
        roles_data = {
            "ADMIN": "Quản trị viên toàn quyền hệ thống",
            "MANAGER": "Quản lý chất lượng (QA Manager)",
            "STAFF": "Chuyên viên / Giảng viên thực hiện",
            "VIEWER": "Khách xem (Chỉ đọc dữ liệu)"
        }
        role_objs = {}
        for r_name in roles_data.keys():
            r = db.query(Role).filter(Role.name == r_name).first()
            if not r:
                r = Role(name=r_name)
                db.add(r)
                db.flush()
                print(f"  + Đã tạo Role: {r_name}")
            role_objs[r_name] = r

        print("===> 2. Khởi tạo Danh sách Quyền (Permissions)...")
        all_permissions = [
            # Standards
            "standards.read", "standards.create", "standards.update", "standards.delete",
            # Criteria
            "criteria.read", "criteria.create", "criteria.update", "criteria.delete",
            # Evidences
            "evidence.read", "evidence.create", "evidence.update", "evidence.review", "evidence.delete",
            # Plans & Tasks
            "plan.read", "plan.create", "plan.update", "plan.delete",
            "task.read", "task.create", "task.update", "task.assign", "task.delete",
            # Evaluations
            "evaluation.read", "evaluation.create", "evaluation.update", "evaluation.delete",
            # Users & Audit
            "users.read", "users.create", "users.update", "users.delete",
            "audit.read"
        ]
        perm_objs = {}
        for p_name in all_permissions:
            p = db.query(Permission).filter(Permission.name == p_name).first()
            if not p:
                p = Permission(name=p_name)
                db.add(p)
                db.flush()
                print(f"  + Đã tạo Permission: {p_name}")
            perm_objs[p_name] = p

        print("===> 3. Gán Quyền cho từng Vai trò (Role-Permissions)...")
        # Phân bổ permissions theo vai trò
        role_perms_mapping = {
            "ADMIN": list(perm_objs.values()),
            "MANAGER": [
                p for name, p in perm_objs.items()
                if name.startswith(("standards.", "criteria.", "evaluation."))
                or name in ["evidence.read", "evidence.update", "evidence.review", "plan.read", "plan.create", "task.read", "task.create", "task.update", "task.assign", "audit.read"]
            ],
            "STAFF": [
                p for name, p in perm_objs.items()
                if name in [
                    "standards.read", "criteria.read", 
                    "evidence.read", "evidence.create", "evidence.update",
                    "plan.read", "task.read", "task.update",
                    "evaluation.read"
                ]
            ],
            "VIEWER": [
                p for name, p in perm_objs.items()
                if name.endswith(".read")
            ]
        }

        for r_name, perms in role_perms_mapping.items():
            r = role_objs[r_name]
            current_perms = set(r.permissions)
            for p in perms:
                if p not in current_perms:
                    r.permissions.append(p)
            print(f"  + Role {r_name} hiện có {len(r.permissions)} quyền.")

        print("===> 4. Khởi tạo/Cập nhật các Tài khoản chuẩn...")
        users_data = [
            {
                "username": "admin",
                "email": "admin@stqms.vn",
                "password": "Admin@123456",
                "role": "ADMIN"
            },
            {
                "username": "qamanager",
                "email": "qa@stqms.vn",
                "password": "Manager@123456",
                "role": "MANAGER"
            },
            {
                "username": "staff1",
                "email": "staff1@stqms.vn",
                "password": "Staff@123456",
                "role": "STAFF"
            },
            {
                "username": "Passview123@",
                "email": "passview123@stqms.vn",
                "password": "Passview123@",
                "role": "VIEWER"
            }
        ]

        for u_item in users_data:
            user = db.query(User).filter(
                (User.username == u_item["username"]) | (User.email == u_item["email"])
            ).first()
            target_role = role_objs[u_item["role"]]

            if user:
                user.username = u_item["username"]
                user.email = u_item["email"]
                user.hashed_password = get_password_hash(u_item["password"])
                user.is_active = True
                if target_role not in user.roles:
                    user.roles = [target_role]
                print(f"  * Đã cập nhật tài khoản '{u_item['username']}' (Role: {u_item['role']})")
            else:
                user = User(
                    username=u_item["username"],
                    email=u_item["email"],
                    hashed_password=get_password_hash(u_item["password"]),
                    is_active=True,
                    roles=[target_role]
                )
                db.add(user)
                print(f"  + Đã tạo mới tài khoản '{u_item['username']}' (Role: {u_item['role']})")

        print("===> 5. Khởi tạo Tiêu chuẩn & Tiêu chí mẫu chuẩn...")
        std_code = "TT_12_2017"
        standard = db.query(Standard).filter(Standard.code == std_code).first()
        if not standard:
            standard = Standard(
                code=std_code,
                name="Thông tư 12/2017/TT-BGDĐT: Kiểm định chất lượng cơ sở giáo dục đại học",
                description="Bộ tiêu chuẩn đánh giá chất lượng cơ sở giáo dục đại học ban hành bởi Bộ Giáo dục và Đào tạo.",
                issued_date=date(2017, 5, 19),
                is_active=True
            )
            db.add(standard)
            db.flush()
            print(f"  + Đã tạo Bộ tiêu chuẩn: {std_code}")

            # Thêm tiêu chí mẫu
            criteria_sample = [
                ("TC01", "Tầm nhìn, sứ mạng và văn hóa", "Cơ sở GDĐH có tuyên bố rõ ràng về tầm nhìn, sứ mạng và các giá trị cốt lõi.", 1),
                ("TC02", "Quản trị, lãnh đạo và quản lý", "Hệ thống quản trị, bộ máy lãnh đạo hoạt động hiệu quả, tuân thủ pháp luật.", 2),
                ("TC03", "Đào tạo và Đảm bảo chất lượng", "Các chương trình đào tạo được thiết kế, rà soát định kỳ và đảm bảo chuẩn đầu ra.", 3),
            ]
            for c_code, c_name, c_desc, c_seq in criteria_sample:
                crit = Criterion(
                    standard_id=standard.id,
                    code=c_code,
                    name=c_name,
                    description=c_desc,
                    sequence_num=c_seq,
                    is_active=True
                )
                db.add(crit)
                print(f"    - Đã tạo Tiêu chí mẫu: {c_code} - {c_name}")
        else:
            print(f"  * Bộ tiêu chuẩn '{std_code}' đã tồn tại sẵn trong DB.")

        db.commit()
        print("===> HOÀN TẤT SEED DỮ LIỆU THÀNH CÔNG!")
    except Exception as e:
        db.rollback()
        print(f"LỖI SEED DỮ LIỆU: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
