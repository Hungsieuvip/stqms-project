from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.rbac import Role, Permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user

# ==========================================
# RBAC DEPENDENCY (TASK 04)
# ==========================================
class RequirePermissions:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Lấy tất cả permission của user từ các roles
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name)
        
        # Admin bypass (Optionally)
        if "ADMIN" in [r.name for r in current_user.roles]:
            return current_user

        missing_permissions = [p for p in self.required_permissions if p not in user_permissions]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Missing: {', '.join(missing_permissions)}"
            )
        return current_user