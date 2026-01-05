"""create weekly records tables

Revision ID: 2380be5e95a3
Revises: 2026_01_02_0001
Create Date: 2026-01-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2380be5e95a3'
down_revision: Union[str, None] = '2026_01_02_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建每周列配置表
    op.create_table(
        'weekly_record_configs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, comment='用户ID'),
        sa.Column('week_start_date', sa.Date(), nullable=False, comment='周起始日期（周一早7点）'),
        sa.Column('columns_json', sa.JSON(), nullable=False, comment='列配置JSON数组'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False, comment='更新时间'),
        comment='每周记录列配置表'
    )
    # 添加唯一约束：每个用户每周只有一条配置
    op.create_unique_constraint('uq_weekly_record_configs_user_week', 'weekly_record_configs', ['user_id', 'week_start_date'])
    # 添加索引
    op.create_index('ix_weekly_record_configs_user_id', 'weekly_record_configs', ['user_id'])
    op.create_index('ix_weekly_record_configs_week_start_date', 'weekly_record_configs', ['week_start_date'])

    # 创建每周记录表
    op.create_table(
        'weekly_records',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, comment='用户ID'),
        sa.Column('character_id', sa.Integer(), sa.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False, comment='角色ID'),
        sa.Column('week_start_date', sa.Date(), nullable=False, comment='周起始日期（周一早7点）'),
        sa.Column('dungeon_name', sa.String(50), nullable=False, comment='副本名称'),
        sa.Column('is_cleared', sa.Boolean(), default=False, nullable=False, comment='是否通关'),
        sa.Column('gold_amount', sa.Integer(), default=0, nullable=False, comment='人均金团金额'),
        sa.Column('gold_record_id', sa.Integer(), sa.ForeignKey('gold_records.id', ondelete='SET NULL'), nullable=True, comment='关联的金团记录ID'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False, comment='更新时间'),
        comment='每周记录表'
    )
    # 添加唯一约束：每个角色每周每个副本只有一条记录
    op.create_unique_constraint('uq_weekly_records_char_week_dungeon', 'weekly_records', ['character_id', 'week_start_date', 'dungeon_name'])
    # 添加索引
    op.create_index('ix_weekly_records_user_id', 'weekly_records', ['user_id'])
    op.create_index('ix_weekly_records_character_id', 'weekly_records', ['character_id'])
    op.create_index('ix_weekly_records_week_start_date', 'weekly_records', ['week_start_date'])
    op.create_index('ix_weekly_records_dungeon_name', 'weekly_records', ['dungeon_name'])
    op.create_index('ix_weekly_records_gold_record_id', 'weekly_records', ['gold_record_id'])


def downgrade() -> None:
    # 删除每周记录表
    op.drop_index('ix_weekly_records_gold_record_id', table_name='weekly_records')
    op.drop_index('ix_weekly_records_dungeon_name', table_name='weekly_records')
    op.drop_index('ix_weekly_records_week_start_date', table_name='weekly_records')
    op.drop_index('ix_weekly_records_character_id', table_name='weekly_records')
    op.drop_index('ix_weekly_records_user_id', table_name='weekly_records')
    op.drop_constraint('uq_weekly_records_char_week_dungeon', 'weekly_records', type_='unique')
    op.drop_table('weekly_records')

    # 删除每周列配置表
    op.drop_index('ix_weekly_record_configs_week_start_date', table_name='weekly_record_configs')
    op.drop_index('ix_weekly_record_configs_user_id', table_name='weekly_record_configs')
    op.drop_constraint('uq_weekly_record_configs_user_week', 'weekly_record_configs', type_='unique')
    op.drop_table('weekly_record_configs')
