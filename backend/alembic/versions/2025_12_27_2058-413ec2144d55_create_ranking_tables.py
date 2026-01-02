"""create_ranking_tables

Revision ID: 413ec2144d55
Revises: 5bbd7bf44283
Create Date: 2025-12-27 20:58:34.217532

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '413ec2144d55'
down_revision: Union[str, None] = '5bbd7bf44283'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建赛季修正系数表
    op.create_table(
        'season_correction_factors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dungeon', sa.String(length=50), nullable=False, comment='副本名称'),
        sa.Column('start_date', sa.Date(), nullable=False, comment='时间段开始日期'),
        sa.Column('end_date', sa.Date(), nullable=True, comment='时间段结束日期'),
        sa.Column('correction_factor', sa.DECIMAL(precision=5, scale=2), nullable=False, server_default='1.00', comment='修正系数'),
        sa.Column('description', sa.Text(), nullable=True, comment='描述'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='更新时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='check_dates')
    )

    # 创建索引
    op.create_index('ix_season_correction_factors_id', 'season_correction_factors', ['id'], unique=False)
    op.create_index('ix_season_correction_factors_dungeon', 'season_correction_factors', ['dungeon'], unique=False)
    op.create_index('ix_season_correction_factors_start_date', 'season_correction_factors', ['start_date'], unique=False)

    # 创建排名快照表
    op.create_table(
        'ranking_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('guild_id', sa.Integer(), nullable=False, comment='群组ID'),
        sa.Column('user_id', sa.Integer(), nullable=False, comment='用户ID'),
        sa.Column('rank_position', sa.Integer(), nullable=False, comment='排名位置'),
        sa.Column('rank_score', sa.DECIMAL(precision=12, scale=2), nullable=False, comment='Rank分数'),
        sa.Column('heibenren_count', sa.Integer(), nullable=False, comment='黑本次数'),
        sa.Column('total_gold', sa.Integer(), nullable=False, comment='总金团金额'),
        sa.Column('average_gold', sa.DECIMAL(precision=12, scale=2), nullable=False, comment='平均金团金额'),
        sa.Column('corrected_average_gold', sa.DECIMAL(precision=12, scale=2), nullable=False, comment='修正后的平均金团金额'),
        sa.Column('last_heibenren_date', sa.Date(), nullable=True, comment='最近一次黑本日期'),
        sa.Column('last_heibenren_car_number', sa.Integer(), nullable=True, comment='最近一次黑本的车次'),
        sa.Column('snapshot_date', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='快照时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # 创建索引
    op.create_index('ix_ranking_snapshots_id', 'ranking_snapshots', ['id'], unique=False)
    op.create_index('ix_ranking_snapshots_guild_id', 'ranking_snapshots', ['guild_id'], unique=False)
    op.create_index('ix_ranking_snapshots_user_id', 'ranking_snapshots', ['user_id'], unique=False)
    op.create_index('ix_ranking_snapshots_snapshot_date', 'ranking_snapshots', ['snapshot_date'], unique=False)
    op.create_index('ix_ranking_snapshots_guild_user', 'ranking_snapshots', ['guild_id', 'user_id'], unique=False)
    op.create_index('ix_ranking_snapshots_guild_snapshot', 'ranking_snapshots', ['guild_id', 'snapshot_date'], unique=False)


def downgrade() -> None:
    # 删除排名快照表
    op.drop_index('ix_ranking_snapshots_guild_snapshot', table_name='ranking_snapshots')
    op.drop_index('ix_ranking_snapshots_guild_user', table_name='ranking_snapshots')
    op.drop_index('ix_ranking_snapshots_snapshot_date', table_name='ranking_snapshots')
    op.drop_index('ix_ranking_snapshots_user_id', table_name='ranking_snapshots')
    op.drop_index('ix_ranking_snapshots_guild_id', table_name='ranking_snapshots')
    op.drop_index('ix_ranking_snapshots_id', table_name='ranking_snapshots')
    op.drop_table('ranking_snapshots')

    # 删除赛季修正系数表
    op.drop_index('ix_season_correction_factors_start_date', table_name='season_correction_factors')
    op.drop_index('ix_season_correction_factors_dungeon', table_name='season_correction_factors')
    op.drop_index('ix_season_correction_factors_id', table_name='season_correction_factors')
    op.drop_table('season_correction_factors')
