import uuid
from datetime import date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class AcademicYear(Base):
    """Quản lý các Năm học / Chu kỳ kiểm định chất lượng giáo dục"""
    __tablename__ = "academic_years"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False) # VD: "2024-2025"
    name: Mapped[str] = mapped_column(String(255), nullable=False)             # VD: "Năm học 2024 - 2025"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
