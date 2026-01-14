"""add edit_count to signups table

Revision ID: add_edit_count
Revises: add_subsidy_gold
Create Date: 2026-01-14 12:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_edit_count'
down_revision = 'add_subsidy_gold'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """添加 edit_count 字段到 signups 表"""
    op.add_column(
        'signups',
        sa.Column('edit_count', sa.Integer(), nullable=False, server_default='0', comment='编辑次数（用于限制普通用户修改次数）')
    )


def downgrade() -> None:
    """移除 edit_count 字段"""
    op.drop_column('signups', 'edit_count')
