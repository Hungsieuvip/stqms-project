from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True

@router.post("/login", response_model=TokenResponse)
def login(db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Kiểm tra xem người dùng đang nhập email hay username
    if "@" in form_data.username:
        user = db.query(User).filter(User.email == form_data.username).first()
    else:
        user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is locked or inactive")
        
    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    # Trong stateless JWT, logout thường xử lý ở client (xóa token).
    # Có thể kết hợp Redis blacklist nếu cần strict logout.
    return {"message": "Successfully logged out. Please remove token on client."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(deps.get_current_user)):
    return current_user