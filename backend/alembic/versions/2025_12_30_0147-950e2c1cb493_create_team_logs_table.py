"""create_team_logs_table

Revision ID: 950e2c1cb493
Revises: 413ec2144d55
Create Date: 2025-12-30 01:47:00.884956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '950e2c1cb493'
down_revision: Union[str, None] = '413ec2144d55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 team_logs 表
    op.create_table(
        'team_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False, comment='关联的团队ID'),
        sa.Column('guild_id', sa.Integer(), nullable=False, comment='关联的群组ID'),
        sa.Column('action_type', sa.String(length=50), nullable=False, comment='操作类型'),
        sa.Column('action_user_id', sa.Integer(), nullable=True, comment='执行操作的用户ID'),
        sa.Column('action_detail', sa.JSON(), nullable=False, comment='操作详情'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='操作时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['action_user_id'], ['users.id'], ondelete='SET NULL')
    )

    # 创建索引
    op.create_index('ix_team_logs_id', 'team_logs', ['id'], unique=False)
    op.create_index('ix_team_logs_team_id', 'team_logs', ['team_id'], unique=False)
    op.create_index('ix_team_logs_guild_id', 'team_logs', ['guild_id'], unique=False)
    op.create_index('ix_team_logs_action_type', 'team_logs', ['action_type'], unique=False)
    op.create_index('ix_team_logs_created_at', 'team_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_team_logs_created_at', table_name='team_logs')
    op.drop_index('ix_team_logs_action_type', table_name='team_logs')
    op.drop_index('ix_team_logs_guild_id', table_name='team_logs')
    op.drop_index('ix_team_logs_team_id', table_name='team_logs')
    op.drop_index('ix_team_logs_id', table_name='team_logs')

    # 删除表
    op.drop_table('team_logs')
