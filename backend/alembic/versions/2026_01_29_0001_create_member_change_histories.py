"""create member_change_histories table and add deleted_at to ranking_snapshots

Revision ID: create_member_change_histories
Revises: add_quick_team_options
Create Date: 2026-01-29 12:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'create_member_change_histories'
down_revision = 'add_quick_team_options'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """创建成员变更历史表，并为红黑榜添加软删除字段"""
    # 1. 创建成员变更历史表
    op.create_table(
        'member_change_histories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'guild_id',
            sa.Integer(),
            sa.ForeignKey('guilds.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
            comment='群组ID'
        ),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
            comment='用户ID'
        ),
        sa.Column(
            'action',
            sa.String(20),
            nullable=False,
            index=True,
            comment='操作类型: join(加入), leave(离开), restore(恢复)'
        ),
        sa.Column(
            'reason',
            sa.String(50),
            nullable=True,
            comment='原因: bot_sync(机器人同步), manual(手动), kick(被踢), quit(主动退出)'
        ),
        sa.Column(
            'operator_id',
            sa.Integer(),
            sa.ForeignKey('users.id'),
            nullable=True,
            comment='操作者用户ID（如果有）'
        ),
        sa.Column(
            'notes',
            sa.Text(),
            nullable=True,
            comment='备注信息'
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
            comment='创建时间'
        ),
    )
    
    # 创建复合索引，用于查询特定群组成员的变更历史
    op.create_index(
        'ix_member_change_histories_guild_user',
        'member_change_histories',
        ['guild_id', 'user_id']
    )
    
    # 2. 为 ranking_snapshots 表添加 deleted_at 字段（成员退群时隐藏红黑榜记录）
    op.add_column(
        'ranking_snapshots',
        sa.Column(
            'deleted_at',
            sa.DateTime(),
            nullable=True,
            comment='软删除时间'
        )
    )
    
    # 创建索引，便于查询未删除的记录
    op.create_index(
        'ix_ranking_snapshots_deleted_at',
        'ranking_snapshots',
        ['deleted_at']
    )


def downgrade() -> None:
    """删除成员变更历史表和红黑榜的软删除字段"""
    # 删除 ranking_snapshots 的 deleted_at 字段
    op.drop_index('ix_ranking_snapshots_deleted_at', table_name='ranking_snapshots')
    op.drop_column('ranking_snapshots', 'deleted_at')
    
    # 删除成员变更历史表
    op.drop_index('ix_member_change_histories_guild_user', table_name='member_change_histories')
    op.drop_table('member_change_histories')
