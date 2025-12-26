"""create_gold_records_table

Revision ID: ae5ab434f5ea
Revises: 9d38f9ec9daa
Create Date: 2025-12-26 13:51:29.575631

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae5ab434f5ea'
down_revision: Union[str, None] = '9d38f9ec9daa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'gold_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('guild_id', sa.Integer(), nullable=False, comment='群组ID'),
        sa.Column('team_id', sa.Integer(), nullable=True, comment='关联的开团ID'),
        sa.Column('creator_id', sa.Integer(), nullable=False, comment='创建者ID'),
        sa.Column('dungeon', sa.String(length=50), nullable=False, comment='副本名称'),
        sa.Column('run_date', sa.Date(), nullable=False, comment='运行日期'),
        sa.Column('total_gold', sa.Integer(), nullable=False, comment='总金团'),
        sa.Column('worker_count', sa.Integer(), nullable=False, comment='打工人数'),
        sa.Column('special_drops', sa.JSON(), nullable=True, comment='特殊掉落（字符串数组）'),
        sa.Column('heibenren_user_id', sa.Integer(), nullable=True, comment='黑本人用户ID'),
        sa.Column('heibenren_character_id', sa.Integer(), nullable=True, comment='黑本人角色ID'),
        sa.Column('heibenren_info', sa.JSON(), nullable=True, comment='黑本人显示信息'),
        sa.Column('notes', sa.Text(), nullable=True, comment='备注'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='更新时间'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True, comment='软删除时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id']),
        sa.ForeignKeyConstraint(['heibenren_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['heibenren_character_id'], ['characters.id'])
    )
    op.create_index(op.f('ix_gold_records_id'), 'gold_records', ['id'], unique=False)
    op.create_index(op.f('idx_gold_records_guild_id'), 'gold_records', ['guild_id'], unique=False)
    op.create_index(op.f('idx_gold_records_team_id'), 'gold_records', ['team_id'], unique=False)
    op.create_index(op.f('idx_gold_records_dungeon'), 'gold_records', ['dungeon'], unique=False)
    op.create_index(op.f('idx_gold_records_run_date'), 'gold_records', ['run_date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('idx_gold_records_run_date'), table_name='gold_records')
    op.drop_index(op.f('idx_gold_records_dungeon'), table_name='gold_records')
    op.drop_index(op.f('idx_gold_records_team_id'), table_name='gold_records')
    op.drop_index(op.f('idx_gold_records_guild_id'), table_name='gold_records')
    op.drop_index(op.f('ix_gold_records_id'), table_name='gold_records')
    op.drop_table('gold_records')
