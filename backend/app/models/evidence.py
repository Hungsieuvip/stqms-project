import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, Date, DateTime, BigInteger, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class Evidence(Base):
    __tablename__ = "evidences"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False) # Sử dụng làm Title
    description: Mapped[str] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(100), nullable=True)
    issue_date: Mapped[Date] = mapped_column(Date, nullable=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # ĐÃ SỬA: Thay UUID thành Integer
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="DRAFT")
    submission_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)

    criteria: Mapped[list["EvidenceCriteria"]] = relationship("EvidenceCriteria", back_populates="evidence", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="evidence", cascade="all, delete-orphan")

class EvidenceCriteria(Base):
    __tablename__ = "evidence_criteria"
    __table_args__ = {'extend_existing': True}

    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidences.id", ondelete="CASCADE"), primary_key=True)
    criteria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id", ondelete="CASCADE"), primary_key=True)
    requirement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=True)

    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="criteria")
    
class Document(Base):
    __tablename__ = "documents"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidences.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50))
    file_size: Mapped[int] = mapped_column(BigInteger)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="documents")
    versions: Mapped[list["DocumentVersion"]] = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    
    # ĐÃ SỬA: Thay UUID thành Integer
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    document: Mapped["Document"] = relationship("Document", back_populates="versions")