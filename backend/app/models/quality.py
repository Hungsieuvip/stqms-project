import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Text, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class Standard(Base):
    __tablename__ = "standards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    issued_date: Mapped[Date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    criteria: Mapped[list["Criterion"]] = relationship("Criterion", back_populates="standard", cascade="all, delete")

class Criterion(Base):
    __tablename__ = "criteria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    sequence_num: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    standard: Mapped["Standard"] = relationship("Standard", back_populates="criteria")
    requirements: Mapped[list["Requirement"]] = relationship("Requirement", back_populates="criterion", cascade="all, delete")

class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    criteria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False) # Sử dụng description thay cho 'content' để tuân thủ DB Lock
    sequence_num: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    criterion: Mapped["Criterion"] = relationship("Criterion", back_populates="requirements")