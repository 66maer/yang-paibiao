"""add_unique_constraint_to_gold_records_team_id

Revision ID: 8be218b2240f
Revises: ae5ab434f5ea
Create Date: 2025-12-27 02:10:37.028530

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8be218b2240f'
down_revision: Union[str, None] = 'ae5ab434f5ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加部分唯一索引：team_id 不为 NULL 且 deleted_at 为 NULL 时保证唯一
    op.execute("""
        CREATE UNIQUE INDEX unique_team_id_when_not_null
        ON gold_records (team_id)
        WHERE team_id IS NOT NULL AND deleted_at IS NULL
    """)


def downgrade() -> None:
    # 删除唯一索引
    op.drop_index('unique_team_id_when_not_null', table_name='gold_records')
