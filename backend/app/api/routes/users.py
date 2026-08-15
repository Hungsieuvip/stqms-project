from fastapi import APIRouter, Depends
from app.api.deps import RequirePermissions, get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_users(
    # Bắt buộc user phải có quyền 'users.read'
    current_user: User = Depends(RequirePermissions(["users.read"]))
):
    return {"message": "List of users. You have 'users.read' permission!"}

@router.post("/")
def create_user(
    current_user: User = Depends(RequirePermissions(["users.create"]))
):
    return {"message": "User created. You have 'users.create' permission!"}