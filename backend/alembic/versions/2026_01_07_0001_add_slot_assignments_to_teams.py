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
    # 使用 IF NOT EXISTS 避免重复添加
    op.execute("""
        ALTER TABLE teams
        ADD COLUMN IF NOT EXISTS slot_assignments JSON;
    """)
    op.execute("""
        COMMENT ON COLUMN teams.slot_assignments IS '坑位分配情况 [{signup_id, locked}, ...]';
    """)

    # 添加 waitlist 字段 - 候补列表 [signup_id, ...]
    op.execute("""
        ALTER TABLE teams
        ADD COLUMN IF NOT EXISTS waitlist JSON;
    """)
    op.execute("""
        COMMENT ON COLUMN teams.waitlist IS '候补列表 [signup_id, ...]';
    """)


def downgrade():
    op.execute("""
        ALTER TABLE teams
        DROP COLUMN IF EXISTS waitlist;
    """)
    op.execute("""
        ALTER TABLE teams
        DROP COLUMN IF EXISTS slot_assignments;
    """)
