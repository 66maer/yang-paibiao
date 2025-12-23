"""add team_templates table

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2025-12-23 00:01:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'team_templates',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('guild_id', sa.Integer(), sa.ForeignKey('guilds.id'), nullable=False),
        sa.Column('title', sa.String(length=50), nullable=True),
        sa.Column('notice', sa.Text(), nullable=True),
        sa.Column('rules', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_team_templates_id', 'team_templates', ['id'])


def downgrade() -> None:
    op.drop_index('ix_team_templates_id', table_name='team_templates')
    op.drop_table('team_templates')
