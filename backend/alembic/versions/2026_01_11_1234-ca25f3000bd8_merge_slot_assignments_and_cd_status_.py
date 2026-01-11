"""merge slot assignments and cd status separation

Revision ID: ca25f3000bd8
Revises: 2026_01_07_0001, bc2985e6386b
Create Date: 2026-01-11 12:34:57.061228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca25f3000bd8'
down_revision: Union[str, None] = ('2026_01_07_0001', 'bc2985e6386b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
