import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Text, ForeignKey, DECIMAL, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class Evaluation(Base):
    """Đợt tự đánh giá / Đánh giá tiêu chuẩn chất lượng giáo dục"""
    __tablename__ = "evaluations"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_year_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ONGOING") # ONGOING, COMPLETED, APPROVED
    evaluation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    academic_year = relationship("AcademicYear")
    standard = relationship("Standard")
    details: Mapped[list["EvaluationDetail"]] = relationship("EvaluationDetail", back_populates="evaluation", cascade="all, delete-orphan")

class EvaluationDetail(Base):
    __tablename__ = "evaluation_details"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    criteria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="RESTRICT"))
    
    evaluated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    score: Mapped[Optional[float]] = mapped_column(DECIMAL(5,2), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # PASS, FAIL, PENDING
    level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    evaluation: Mapped["Evaluation"] = relationship("Evaluation", back_populates="details")
    criteria = relationship("Criterion")
    evaluator = relationship("User")

class EvaluationHistory(Base):
    __tablename__ = "evaluation_histories"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criterion_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="CASCADE"))
    evaluator_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    result: Mapped[str] = mapped_column(String(50), nullable=False)
    level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    evaluator = relationship("User")
    criterion = relationship("Criterion")
