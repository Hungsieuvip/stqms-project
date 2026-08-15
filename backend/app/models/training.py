import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
# Đã dọn dẹp import và bổ sung Integer
from sqlalchemy import String, Date, Text, ForeignKey, DateTime, Boolean, Integer 
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.base_class import Base

class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Cột này tạm ẩn vì chưa có bảng academic_years
    # academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id", ondelete="RESTRICT"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=True)
    target: Mapped[str] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Date] = mapped_column(Date, nullable=False)
    
    # ĐÃ SỬA: Thay UUID thành Integer cho khớp với bảng users
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="PLANNING")

    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="plan", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id", ondelete="CASCADE"))
    
    name: Mapped[str] = mapped_column(String(500), nullable=False) 
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    criteria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="SET NULL"), nullable=True)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    
    # ĐÃ SỬA: Thay UUID thành Integer cho khớp với bảng users
    assignee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    due_date: Mapped[Date] = mapped_column(Date, nullable=True) 
    priority: Mapped[str] = mapped_column(String(50), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(50), default="TODO")

    plan: Mapped["Plan"] = relationship("Plan", back_populates="tasks")