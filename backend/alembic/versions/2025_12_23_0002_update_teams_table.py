"""update teams table structure

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2025-12-23 00:02:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 删除旧的 name 字段（如果存在）
    op.drop_column('teams', 'name')
    
    # 添加新字段
    op.add_column('teams', sa.Column('creator_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False))
    op.add_column('teams', sa.Column('title', sa.String(length=100), nullable=False))
    op.add_column('teams', sa.Column('team_time', sa.DateTime(), nullable=False))
    op.add_column('teams', sa.Column('dungeon', sa.String(length=50), nullable=False))
    op.add_column('teams', sa.Column('max_members', sa.Integer(), default=25))
    op.add_column('teams', sa.Column('is_xuanjing_booked', sa.Boolean(), default=False))
    op.add_column('teams', sa.Column('is_yuntie_booked', sa.Boolean(), default=False))
    op.add_column('teams', sa.Column('is_hidden', sa.Boolean(), default=False))
    op.add_column('teams', sa.Column('is_locked', sa.Boolean(), default=False))
    op.add_column('teams', sa.Column('status', sa.String(length=20), default='open'))
    op.add_column('teams', sa.Column('rule', JSON, nullable=False))
    op.add_column('teams', sa.Column('notice', sa.Text(), nullable=True))
    op.add_column('teams', sa.Column('closed_at', sa.DateTime(), nullable=True))
    op.add_column('teams', sa.Column('closed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    
    # 创建索引
    op.create_index('idx_teams_creator_id', 'teams', ['creator_id'])
    op.create_index('idx_teams_team_time', 'teams', ['team_time'])
    op.create_index('idx_teams_status', 'teams', ['status'])
    op.create_index('idx_teams_dungeon', 'teams', ['dungeon'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_teams_dungeon', table_name='teams')
    op.drop_index('idx_teams_status', table_name='teams')
    op.drop_index('idx_teams_team_time', table_name='teams')
    op.drop_index('idx_teams_creator_id', table_name='teams')
    
    # 删除新字段
    op.drop_column('teams', 'closed_by')
    op.drop_column('teams', 'closed_at')
    op.drop_column('teams', 'notice')
    op.drop_column('teams', 'rule')
    op.drop_column('teams', 'status')
    op.drop_column('teams', 'is_locked')
    op.drop_column('teams', 'is_hidden')
    op.drop_column('teams', 'is_yuntie_booked')
    op.drop_column('teams', 'is_xuanjing_booked')
    op.drop_column('teams', 'max_members')
    op.drop_column('teams', 'dungeon')
    op.drop_column('teams', 'team_time')
    op.drop_column('teams', 'title')
    op.drop_column('teams', 'creator_id')
    
    # 恢复旧的 name 字段
    op.add_column('teams', sa.Column('name', sa.String(length=50), nullable=False))
