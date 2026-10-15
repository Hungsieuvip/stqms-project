from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.api import deps
from app.core import security
from app.models.user import User

router = APIRouter()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    role: Optional[str] = "viewer"
    roles: Optional[list[str]] = []

    class Config:
        from_attributes = True

@router.post("/login", response_model=TokenResponse)
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(deps.get_db)
):
    account = username.strip()
    
    # Tìm kiếm theo cả username hoặc email (hỗ trợ username có ký tự @ như tài khoản khách)
    user = db.query(User).filter(
        (User.username == account) | (User.email == account)
    ).first()

    if not user or not security.verify_password(password, user.hashed_password):
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
    return {"message": "Successfully logged out. Please remove token on client."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(deps.get_current_user)):
    primary_role = "viewer"
    if current_user.roles:
        roles_lower = [r.name.lower() for r in current_user.roles]
        if "admin" in roles_lower:
            primary_role = "admin"
        elif "qa_manager" in roles_lower or "manager" in roles_lower:
            primary_role = "manager"
        elif "staff" in roles_lower or "teacher" in roles_lower:
            primary_role = "staff"
        elif "viewer" in roles_lower or "guest" in roles_lower:
            primary_role = "viewer"
        else:
            primary_role = roles_lower[0]

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        role=primary_role,
        roles=[r.name for r in current_user.roles]
    )