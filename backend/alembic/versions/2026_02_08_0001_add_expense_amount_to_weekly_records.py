"""add expense_amount to weekly_records

Revision ID: add_expense_amount
Revises: create_member_change_histories
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_expense_amount'
down_revision: Union[str, None] = 'create_member_change_histories'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('weekly_records', sa.Column('expense_amount', sa.Integer(), nullable=False, server_default='0', comment='消费金额'))


def downgrade() -> None:
    op.drop_column('weekly_records', 'expense_amount')
