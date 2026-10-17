"""phase3_academic_year_and_evaluations

Revision ID: phase3_advanced_003
Revises: phase2_rbac_002
Create Date: 2026-10-17 12:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
from datetime import date, datetime

# revision identifiers, used by Alembic.
revision = 'phase3_advanced_003'
down_revision = 'phase2_rbac_002'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Tạo bảng academic_years
    op.create_table(
        'academic_years',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    # 2. Thêm academic_year_id vào bảng evaluations
    op.add_column(
        'evaluations',
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_evaluations_academic_year',
        'evaluations', 'academic_years',
        ['academic_year_id'], ['id'],
        ondelete='SET NULL'
    )

    # 3. Thêm academic_year_id vào bảng plans
    op.add_column(
        'plans',
        sa.Column('academic_year_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_plans_academic_year',
        'plans', 'academic_years',
        ['academic_year_id'], ['id'],
        ondelete='SET NULL'
    )

    # 4. Chèn các năm học mẫu
    academic_years_table = sa.table(
        'academic_years',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('code', sa.String),
        sa.column('name', sa.String),
        sa.column('start_date', sa.Date),
        sa.column('end_date', sa.Date),
        sa.column('is_active', sa.Boolean),
        sa.column('description', sa.Text),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )

    now = datetime.now()
    op.bulk_insert(
        academic_years_table,
        [
            {
                'id': uuid.uuid4(),
                'code': '2024-2025',
                'name': 'Năm học 2024 - 2025',
                'start_date': date(2024, 9, 5),
                'end_date': date(2025, 5, 31),
                'is_active': True,
                'description': 'Năm học 2024 - 2025 Trường Tiểu học Hợp Minh',
                'created_at': now,
                'updated_at': now
            },
            {
                'id': uuid.uuid4(),
                'code': '2025-2026',
                'name': 'Năm học 2025 - 2026',
                'start_date': date(2025, 9, 5),
                'end_date': date(2026, 5, 31),
                'is_active': True,
                'description': 'Năm học 2025 - 2026 Trường Tiểu học Hợp Minh',
                'created_at': now,
                'updated_at': now
            },
            {
                'id': uuid.uuid4(),
                'code': '2026-2027',
                'name': 'Năm học 2026 - 2027',
                'start_date': date(2026, 9, 5),
                'end_date': date(2027, 5, 31),
                'is_active': False,
                'description': 'Năm học 2026 - 2027 Trường Tiểu học Hợp Minh (Kế hoạch)',
                'created_at': now,
                'updated_at': now
            }
        ]
    )

def downgrade():
    op.drop_constraint('fk_plans_academic_year', 'plans', type_='foreignkey')
    op.drop_column('plans', 'academic_year_id')
    op.drop_constraint('fk_evaluations_academic_year', 'evaluations', type_='foreignkey')
    op.drop_column('evaluations', 'academic_year_id')
    op.drop_table('academic_years')
