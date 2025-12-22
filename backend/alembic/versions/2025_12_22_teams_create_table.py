"""create teams table (minimal)

Revision ID: a1b2c3d4e5f6
Revises: 92d7a2bf0198
Create Date: 2025-12-22 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '92d7a2bf0198'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'teams',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False, comment='团队ID'),
        sa.Column('guild_id', sa.Integer(), sa.ForeignKey('guilds.id', ondelete='CASCADE'), nullable=False, comment='群组ID'),
        sa.Column('name', sa.String(length=50), nullable=False, comment='团队名称'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='更新时间'),
    )
    op.create_index('ix_teams_id', 'teams', ['id'])
    op.create_index('idx_teams_guild_id', 'teams', ['guild_id'])
    op.create_index('idx_teams_name', 'teams', ['name'])


def downgrade() -> None:
    op.drop_index('idx_teams_name', table_name='teams')
    op.drop_index('idx_teams_guild_id', table_name='teams')
    op.drop_index('ix_teams_id', table_name='teams')
    op.drop_table('teams')
