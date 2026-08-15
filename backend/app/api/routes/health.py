from fastapi import APIRouter

router = APIRouter()

@router.get("/health", status_code=200)
def health_check():
    return {"status": "ok", "message": "Backend is running flawlessly"}