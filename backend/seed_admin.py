import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import app.models.rbac
from app.core.security import get_password_hash
from app.models.user import User
from app.core.config import settings

# Import session t? database c?a d? �n
try:
    from app.db.session import SessionLocal
except ImportError:
    try:
        from app.database import SessionLocal
    except ImportError:
        from app.db import SessionLocal

def seed():
    db = SessionLocal()
    try:
        # Ki?m tra xem user admin d� c� chua
        user = db.query(User).filter((User.username == "admin") | (User.email == "admin@stqms.vn")).first()
        hashed_pw = get_password_hash("Admin@123456")
        
        if user:
            user.username = "admin"
            user.email = "admin@stqms.vn"
            user.hashed_password = hashed_pw
            user.is_active = True
            print("===> Da cap nhat mat khau cho tai khoan Admin thanh cong!")
        else:
            new_user = User(
                username="admin",
                email="admin@stqms.vn",
                hashed_password=hashed_pw,
                is_active=True
            )
            db.add(new_user)
            print("===> Da tao moi tai khoan Admin thanh cong!")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Loi: {e}")
    finally:
        db.close()

    # Seed tài khoản khách (Viewer / Guest)
    try:
        from seed_guest import seed_guest
        seed_guest()
    except Exception as e:
        print(f"Lỗi khi seed guest: {e}")

if __name__ == "__main__":
    seed()

