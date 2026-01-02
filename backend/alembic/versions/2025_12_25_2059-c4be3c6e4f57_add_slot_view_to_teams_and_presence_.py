"""add slot_view to teams and presence_status to signups

Revision ID: c4be3c6e4f57
Revises: d9e0f1a2b3c4
Create Date: 2025-12-25 20:59:27.436486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4be3c6e4f57'
down_revision: Union[str, None] = 'd9e0f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 为 teams 表添加 slot_view 字段
    op.add_column('teams', sa.Column('slot_view', sa.JSON(), nullable=True, comment='坑位视觉映射（用于连连看模式）'))

    # 为 signups 表添加 presence_status 字段
    op.add_column('signups', sa.Column('presence_status', sa.String(length=20), nullable=True, comment='到场状态: present(在组), absent(缺席), late(迟到), null(未标记)'))


def downgrade() -> None:
    # 删除 signups 表的 presence_status 字段
    op.drop_column('signups', 'presence_status')

    # 删除 teams 表的 slot_view 字段
    op.drop_column('teams', 'slot_view')
