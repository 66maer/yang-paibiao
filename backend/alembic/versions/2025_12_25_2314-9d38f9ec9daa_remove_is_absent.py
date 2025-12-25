"""remove_is_absent

Revision ID: 9d38f9ec9daa
Revises: c4be3c6e4f57
Create Date: 2025-12-25 23:14:35.427822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d38f9ec9daa'
down_revision: Union[str, None] = 'c4be3c6e4f57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 直接删除 is_absent 列
    op.drop_column('signups', 'is_absent')


def downgrade() -> None:
    # 重新添加 is_absent 列
    op.add_column('signups',
        sa.Column('is_absent', sa.Boolean(),
                  default=False, nullable=False,
                  comment='是否缺席'))
