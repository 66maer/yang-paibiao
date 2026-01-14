"""add secondary_xinfas to characters

Revision ID: add_secondary_xinfas
Revises: 6375bc70849f
Create Date: 2026-01-14 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY


# revision identifiers, used by Alembic.
revision: str = 'add_secondary_xinfas'
down_revision: Union[str, None] = '6375bc70849f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加 secondary_xinfas 字段（多修心法列表）
    op.add_column(
        'characters',
        sa.Column(
            'secondary_xinfas',
            ARRAY(sa.String(20)),
            nullable=True,
            comment='多修心法列表（主心法以外的心法）'
        )
    )
    
    # 添加注释
    op.execute("""
        COMMENT ON COLUMN characters.secondary_xinfas IS '多修心法列表（主心法以外的心法）';
    """)


def downgrade() -> None:
    op.drop_column('characters', 'secondary_xinfas')
