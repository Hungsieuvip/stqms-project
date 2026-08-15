import os
import shutil
from fastapi import UploadFile, HTTPException, status
import uuid

UPLOAD_DIR = "uploads/evidences"
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".zip"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_file(file: UploadFile):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Kiểm tra dung lượng bằng cách seek đến cuối file
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max allowed is 50MB."
        )
    return ext, file_size

def save_file(evidence_id: str, version: int, file: UploadFile) -> str:
    ext, _ = validate_file(file)
    safe_filename = f"v{version}_{uuid.uuid4().hex[:8]}{ext}"
    evidence_dir = os.path.join(UPLOAD_DIR, str(evidence_id))
    os.makedirs(evidence_dir, exist_ok=True)
    
    file_path = os.path.join(evidence_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return file_path

def delete_file(file_path: str):
    if os.path.exists(file_path):
        os.remove(file_path)