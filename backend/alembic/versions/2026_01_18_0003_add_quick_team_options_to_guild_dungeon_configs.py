"""add_quick_team_options_to_guild_dungeon_configs

Revision ID: add_quick_team_options
Revises: f8e7d6c5b4a3
Create Date: 2026-01-18 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_quick_team_options'
down_revision: Union[str, None] = 'f8e7d6c5b4a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 quick_team_options 字段到 guild_dungeon_configs 表
    op.add_column(
        'guild_dungeon_configs',
        sa.Column('quick_team_options', sa.JSON(), nullable=False, server_default='[]', comment='快捷开团选项配置')
    )


def downgrade() -> None:
    # 删除 quick_team_options 字段
    op.drop_column('guild_dungeon_configs', 'quick_team_options')
