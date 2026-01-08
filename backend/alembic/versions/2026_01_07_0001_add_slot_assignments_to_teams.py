"""add slot_assignments and waitlist to teams

Revision ID: 2026_01_07_0001
Revises: 2026_01_05_0001_create_weekly_records_tables
Create Date: 2026-01-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_01_07_0001'
down_revision = '2380be5e95a3'
branch_labels = None
depends_on = None


def upgrade():
    # 添加 slot_assignments 字段 - 坑位分配情况 [{signup_id, locked}, ...]
    op.add_column(
        'teams',
        sa.Column(
            'slot_assignments',
            sa.JSON(),
            nullable=True,
            comment='坑位分配情况 [{signup_id, locked}, ...]'
        )
    )
    
    # 添加 waitlist 字段 - 候补列表 [signup_id, ...]
    op.add_column(
        'teams',
        sa.Column(
            'waitlist',
            sa.JSON(),
            nullable=True,
            comment='候补列表 [signup_id, ...]'
        )
    )


def downgrade():
    op.drop_column('teams', 'waitlist')
    op.drop_column('teams', 'slot_assignments')
