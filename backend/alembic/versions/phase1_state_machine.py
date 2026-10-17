"""Phase 1: Add State Machine columns and EvidenceReviewLog table

Revision ID: phase1_sm_001
Revises: dfc9ef57a70d
Create Date: 2024-10-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision: str = 'phase1_sm_001'
down_revision: Union[str, None] = 'dfc9ef57a70d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Thêm cột rejection_reason, reviewed_by, reviewed_at cho bảng evidences
    op.add_column('evidences', sa.Column('rejection_reason', sa.Text(), nullable=True))
    op.add_column('evidences', sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('evidences', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    
    # 2. Tạo bảng evidence_review_logs
    op.create_table(
        'evidence_review_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('evidence_id', UUID(as_uuid=True), sa.ForeignKey('evidences.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('from_status', sa.String(50), nullable=False),
        sa.Column('to_status', sa.String(50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # 3. Tạo index cho truy vấn nhanh
    op.create_index('ix_evidence_review_logs_evidence_id', 'evidence_review_logs', ['evidence_id'])


def downgrade() -> None:
    op.drop_index('ix_evidence_review_logs_evidence_id')
    op.drop_table('evidence_review_logs')
    op.drop_column('evidences', 'reviewed_at')
    op.drop_column('evidences', 'reviewed_by')
    op.drop_column('evidences', 'rejection_reason')
