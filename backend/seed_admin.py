import sys
import os

# Đảm bảo Python nhận diện được thư mục app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import app.models.rbac

def create_admin():
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có user admin chưa
        user = db.query(User).filter(User.email == "admin@stqms.vn").first()
        if not user:
            print("Đang tạo tài khoản Admin...")
            admin_user = User(
                email="admin@stqms.vn",
                username="admin_stqms", # Đổi từ full_name sang username
                hashed_password=get_password_hash("Admin@123"),
                is_active=True
                # Đã xóa is_superuser vì bảng của bạn không có cột này
            )
            db.add(admin_user)
            db.commit()
            print("✅ TẠO TÀI KHOẢN THÀNH CÔNG!")
            print("-----------------------------------------")
            print("👉 Tên đăng nhập : admin@stqms.vn")
            print("👉 Mật khẩu      : Admin@123")
            print("-----------------------------------------")
        else:
            print("⚠️ Tài khoản admin@stqms.vn đã tồn tại trong hệ thống!")
    except Exception as e:
        print(f"❌ Có lỗi xảy ra: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()