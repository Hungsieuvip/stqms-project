import uuid
import os
import tempfile
import subprocess
from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session, joinedload

from app.api import deps
from app.models.quality import Standard, Criterion
from app.models.user import User
from app.schemas.quality import StandardCreate, StandardUpdate, StandardResponse
from app.services.ai_standard_parser import analyze_document_content, execute_import_to_db

router = APIRouter()

@router.get("", response_model=List[StandardResponse])
@router.get("/", response_model=List[StandardResponse])
def get_standards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    standards = db.query(Standard).options(
        joinedload(Standard.criteria).joinedload(Criterion.requirements)
    ).order_by(Standard.code.asc()).all()

    # Sắp xếp các criteria con theo sequence_num
    for std in standards:
        std.criteria.sort(key=lambda c: (c.sequence_num, c.code))

    return standards

@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
def create_standard(
    standard_in: StandardCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.create"]))
):
    clean_code = standard_in.code.strip()
    existing = db.query(Standard).filter(Standard.code == clean_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã tiêu chuẩn '{clean_code}' đã tồn tại trong hệ thống."
        )

    data = standard_in.model_dump()
    data["code"] = clean_code
    data["name"] = standard_in.name.strip()
    if data.get("issued_date") is None:
        data["issued_date"] = date.today()

    new_standard = Standard(**data)
    db.add(new_standard)
    db.commit()
    db.refresh(new_standard)
    new_standard.criteria = []
    return new_standard

@router.post("/ai-parse")
@router.post("/ai-parse/")
async def ai_parse_standards(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    use_sample_tt57: Optional[bool] = Form(False),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Endpoint phân tích văn bản thông tư bằng AI / NLP hoặc nạp bộ mẫu TT 57.
    Trả về cấu trúc cây Tiêu chuẩn -> Tiêu chí -> Yêu cầu để người dùng xem trước và duyệt.
    """
    extracted_text = raw_text or ""
    filename = None
    is_tt57 = bool(use_sample_tt57)

    if file:
        filename = file.filename
        content = await file.read()
        if filename and filename.lower().endswith(".pdf"):
            try:
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name
                res = subprocess.run(["pdftotext", tmp_path, "-"], capture_output=True, text=True, timeout=10)
                if res.returncode == 0 and res.stdout.strip():
                    extracted_text = res.stdout
                os.remove(tmp_path)
            except Exception:
                pass
        else:
            try:
                extracted_text = content.decode("utf-8", errors="ignore")
            except Exception:
                pass

        if "57" in (filename or ""):
            is_tt57 = True

    parsed_result = analyze_document_content(
        raw_text=extracted_text,
        filename=filename,
        is_tt57=is_tt57
    )

    return parsed_result

@router.post("/ai-import")
@router.post("/ai-import/")
def ai_import_standards(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.create"]))
):
    """
    Endpoint lưu kết quả Tiêu chuẩn & Tiêu chí đã được xem xét vào cơ sở dữ liệu.
    """
    try:
        result = execute_import_to_db(db, payload)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi lưu dữ liệu tiêu chuẩn: {str(e)}"
        )

@router.put("/{standard_id}", response_model=StandardResponse)
def update_standard(
    standard_id: uuid.UUID,
    standard_in: StandardUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.update"]))
):
    std = db.query(Standard).options(
        joinedload(Standard.criteria)
    ).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy tiêu chuẩn cần cập nhật."
        )

    update_data = standard_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        clean_code = update_data["code"].strip()
        conflict = db.query(Standard).filter(Standard.code == clean_code, Standard.id != standard_id).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã tiêu chuẩn '{clean_code}' đã được sử dụng bởi tiêu chuẩn khác."
            )
        update_data["code"] = clean_code

    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].strip()

    for field, value in update_data.items():
        setattr(std, field, value)

    db.commit()
    db.refresh(std)
    std.criteria.sort(key=lambda c: (c.sequence_num, c.code))
    return std

@router.delete("/{standard_id}")
def delete_standard(
    standard_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RequirePermissions(["standards.delete"]))
):
    std = db.query(Standard).filter(Standard.id == standard_id).first()
    if not std:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy tiêu chuẩn."
        )
    db.delete(std)
    db.commit()
    return {"message": "Đã xóa tiêu chuẩn thành công"}
