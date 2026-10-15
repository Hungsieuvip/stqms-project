import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import get_password_hash
from app.models.user import User
from app.models.rbac import Role
from app.db.session import SessionLocal

def seed_guest():
    db = SessionLocal()
    try:
        # 1. Đảm bảo Role VIEWER tồn tại
        viewer_role = db.query(Role).filter(Role.name == "VIEWER").first()
        if not viewer_role:
            viewer_role = Role(name="VIEWER")
            db.add(viewer_role)
            db.flush()
            print("===> Đã tạo Role 'VIEWER' thành công!")
        else:
            print("===> Role 'VIEWER' đã tồn tại.")

        # 2. Tạo hoặc cập nhật tài khoản khách
        guest_username = "Passview123@"
        guest_email = "passview123@stqms.vn"
        guest_password = "Passview123@"
        hashed_pw = get_password_hash(guest_password)

        guest_user = db.query(User).filter(
            (User.username == guest_username) | (User.email == guest_email)
        ).first()

        if guest_user:
            guest_user.username = guest_username
            guest_user.email = guest_email
            guest_user.hashed_password = hashed_pw
            guest_user.is_active = True
            
            # Gán role VIEWER nếu chưa có
            if viewer_role not in guest_user.roles:
                guest_user.roles.append(viewer_role)

            print(f"===> Đã cập nhật tài khoản khách '{guest_username}' thành công!")
        else:
            new_guest = User(
                username=guest_username,
                email=guest_email,
                hashed_password=hashed_pw,
                is_active=True,
                roles=[viewer_role]
            )
            db.add(new_guest)
            print(f"===> Đã tạo mới tài khoản khách '{guest_username}' thành công!")

        db.commit()
        print("===> Hoàn tất lưu dữ liệu vào Database!")

    except Exception as e:
        db.rollback()
        print(f"Lỗi khi seed tài khoản khách: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_guest()
