"""fix weekly records unique constraint to include user_id

Revision ID: 6375bc70849f
Revises: ca25f3000bd8
Create Date: 2026-01-11 14:03:31.181744

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6375bc70849f'
down_revision: Union[str, None] = 'ca25f3000bd8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 删除旧的唯一约束（只包含 character_id, week_start_date, dungeon_name）
    op.drop_constraint('uq_weekly_records_char_week_dungeon', 'weekly_records', type_='unique')

    # 创建新的唯一约束（包含 user_id, character_id, week_start_date, dungeon_name）
    # 这样不同用户可以使用同一个角色打同一个副本并分别记录工资
    op.create_unique_constraint(
        'uq_weekly_records_user_char_week_dungeon',
        'weekly_records',
        ['user_id', 'character_id', 'week_start_date', 'dungeon_name']
    )


def downgrade() -> None:
    # 回退：删除新约束，恢复旧约束
    op.drop_constraint('uq_weekly_records_user_char_week_dungeon', 'weekly_records', type_='unique')
    op.create_unique_constraint(
        'uq_weekly_records_char_week_dungeon',
        'weekly_records',
        ['character_id', 'week_start_date', 'dungeon_name']
    )
