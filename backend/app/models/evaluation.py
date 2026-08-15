import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
# Bổ sung thêm import Integer
from sqlalchemy import String, Date, Text, ForeignKey, DECIMAL, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base
from datetime import datetime

class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # ĐÃ ẨN: Tạm thời ẩn cột này giống như bên bảng Plan vì hệ thống chưa có bảng academic_years
    # academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="RESTRICT"))
    
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards.id", ondelete="RESTRICT"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ONGOING")
    evaluation_date: Mapped[Date] = mapped_column(Date, nullable=True)

    details: Mapped[list["EvaluationDetail"]] = relationship("EvaluationDetail", back_populates="evaluation")

class EvaluationDetail(Base):
    __tablename__ = "evaluation_details"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    criteria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="RESTRICT"))
    
    # ĐÃ SỬA: Đổi từ UUID sang Integer để khớp với bảng users
    evaluated_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    score: Mapped[float] = mapped_column(DECIMAL(5,2), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=True) # Map to Result (PASS, FAIL, PENDING)
    level: Mapped[str] = mapped_column(String(50), nullable=True)  # LEVEL_1, LEVEL_2, LEVEL_3
    comments: Mapped[str] = mapped_column(Text, nullable=True)

    evaluation: Mapped["Evaluation"] = relationship("Evaluation", back_populates="details")

class EvaluationHistory(Base):
    __tablename__ = "evaluation_histories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criterion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="CASCADE"))
    
    # ĐÃ SỬA: Đổi từ UUID sang Integer để khớp với bảng users
    evaluator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    result: Mapped[str] = mapped_column(String(50), nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())