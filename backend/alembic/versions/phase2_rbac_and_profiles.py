"""Phase 2: Add User profile fields, Standard sequence_num, and StandardAssignment table

Revision ID: phase2_rbac_002
Revises: phase1_sm_001
Create Date: 2024-10-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision: str = 'phase2_rbac_002'
down_revision: Union[str, None] = 'phase1_sm_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Bổ sung trường User profile
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('department_id', UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True))

    # 2. Bổ sung sequence_num cho standards
    op.add_column('standards', sa.Column('sequence_num', sa.Integer(), server_default='0', nullable=True))

    # 3. Tạo bảng standard_assignments
    op.create_table(
        'standard_assignments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('standard_id', UUID(as_uuid=True), sa.ForeignKey('standards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role_in_standard', sa.String(50), server_default='LEAD', nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )
    op.create_index('ix_standard_assignments_standard_id', 'standard_assignments', ['standard_id'])
    op.create_index('ix_standard_assignments_user_id', 'standard_assignments', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_standard_assignments_user_id')
    op.drop_index('ix_standard_assignments_standard_id')
    op.drop_table('standard_assignments')
    op.drop_column('standards', 'sequence_num')
    op.drop_column('users', 'department_id')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'full_name')
