"""migrate_configs_to_guild_level

Revision ID: f8e7d6c5b4a3
Revises: add_ranking_change_fields
Create Date: 2026-01-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8e7d6c5b4a3'
down_revision: Union[str, None] = 'add_ranking_change_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 为 season_correction_factors 表添加 guild_id 字段
    op.add_column(
        'season_correction_factors',
        sa.Column('guild_id', sa.Integer(), nullable=True, comment='群组ID，NULL表示全局配置')
    )
    
    # 添加外键约束
    op.create_foreign_key(
        'fk_season_correction_factors_guild_id',
        'season_correction_factors',
        'guilds',
        ['guild_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # 创建索引
    op.create_index(
        'ix_season_correction_factors_guild_id',
        'season_correction_factors',
        ['guild_id'],
        unique=False
    )
    
    # 2. 创建群组副本配置表
    op.create_table(
        'guild_dungeon_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('guild_id', sa.Integer(), nullable=False, comment='群组ID'),
        sa.Column('dungeon_options', sa.JSON(), nullable=False, comment='副本选项配置'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='更新时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('guild_id', name='uq_guild_dungeon_configs_guild_id')
    )
    
    # 创建索引
    op.create_index('ix_guild_dungeon_configs_id', 'guild_dungeon_configs', ['id'], unique=False)
    op.create_index('ix_guild_dungeon_configs_guild_id', 'guild_dungeon_configs', ['guild_id'], unique=True)


def downgrade() -> None:
    # 删除群组副本配置表
    op.drop_index('ix_guild_dungeon_configs_guild_id', table_name='guild_dungeon_configs')
    op.drop_index('ix_guild_dungeon_configs_id', table_name='guild_dungeon_configs')
    op.drop_table('guild_dungeon_configs')
    
    # 删除 season_correction_factors 的 guild_id 字段
    op.drop_index('ix_season_correction_factors_guild_id', table_name='season_correction_factors')
    op.drop_constraint('fk_season_correction_factors_guild_id', 'season_correction_factors', type_='foreignkey')
    op.drop_column('season_correction_factors', 'guild_id')
