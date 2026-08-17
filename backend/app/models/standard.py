from sqlalchemy import Column, Integer, String, Text, Date, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base  # hoặc: from app.models.base import Base / from app.db.session import Base tuỳ dự án

class Standard(Base):
    __tablename__ = "standards"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    issue_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Quan hệ với requirements (tiêu chí) nếu có
    # requirements = relationship("Requirement", back_populates="standard", cascade="all, delete-orphan")