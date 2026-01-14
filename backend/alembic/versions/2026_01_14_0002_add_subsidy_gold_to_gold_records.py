"""add subsidy_gold to gold_records

Revision ID: add_subsidy_gold
Revises: add_secondary_xinfas
Create Date: 2026-01-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_subsidy_gold'
down_revision: Union[str, None] = 'add_secondary_xinfas'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 subsidy_gold 列，默认值为 0
    op.add_column('gold_records', sa.Column('subsidy_gold', sa.Integer(), nullable=False, server_default='0', comment='总补贴金额'))


def downgrade() -> None:
    op.drop_column('gold_records', 'subsidy_gold')
