import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {'extend_existing': True} 

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Đã sửa thành Integer để khớp với bảng users
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action: Mapped[str] = mapped_column(String(50), nullable=False) 
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    old_values = mapped_column(JSONB, nullable=True)
    new_values = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'extend_existing': True} 

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Đã sửa thành Integer để khớp với bảng users
    recipient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) 
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    related_entity: Mapped[str] = mapped_column(String(100), nullable=True)
    related_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())