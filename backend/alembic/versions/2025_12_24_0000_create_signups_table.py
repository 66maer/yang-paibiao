"""create signups table

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2025-12-24 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = 'd9e0f1a2b3c4'
down_revision: Union[str, None] = 'c8d9e0f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 signups 表
    op.create_table(
        'signups',
        sa.Column('id', sa.Integer(), primary_key=True, index=True, comment='报名ID'),
        sa.Column('team_id', sa.Integer(), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False, index=True, comment='开团ID'),
        sa.Column('submitter_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=False, comment='提交者用户ID（当前登录用户）'),
        sa.Column('signup_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, comment='报名用户ID（可为null，表示系统外的人）'),
        sa.Column('signup_character_id', sa.Integer(), sa.ForeignKey('characters.id', ondelete='SET NULL'), nullable=True, comment='报名角色ID（可为null，表示未录入系统的角色）'),
        sa.Column('signup_info', JSON, nullable=False, comment='报名信息（包含提交者名称、报名者名称、角色名称、心法）'),
        sa.Column('priority', sa.Integer(), default=0, nullable=False, comment='优先级（用于排序）'),
        sa.Column('is_rich', sa.Boolean(), default=False, nullable=False, comment='是否老板'),
        sa.Column('is_proxy', sa.Boolean(), default=False, nullable=False, comment='是否代报（自动判断）'),
        sa.Column('slot_position', sa.Integer(), nullable=True, comment='锁定位置（1-25或null）'),
        sa.Column('is_absent', sa.Boolean(), default=False, nullable=False, comment='是否缺席'),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True, comment='取消时间（软删除）'),
        sa.Column('cancelled_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, comment='取消者用户ID'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now(), comment='更新时间'),
    )
    
    # 创建索引
    op.create_index('idx_signups_team_id', 'signups', ['team_id'])
    op.create_index('idx_signups_submitter_id', 'signups', ['submitter_id'])
    op.create_index('idx_signups_signup_user_id', 'signups', ['signup_user_id'])
    op.create_index('idx_signups_signup_character_id', 'signups', ['signup_character_id'])
    op.create_index('idx_signups_cancelled_at', 'signups', ['cancelled_at'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_signups_cancelled_at', table_name='signups')
    op.drop_index('idx_signups_signup_character_id', table_name='signups')
    op.drop_index('idx_signups_signup_user_id', table_name='signups')
    op.drop_index('idx_signups_submitter_id', table_name='signups')
    op.drop_index('idx_signups_team_id', table_name='signups')
    
    # 删除表
    op.drop_table('signups')
