"""separate_cd_status_and_salary

Revision ID: bc2985e6386b
Revises: 2380be5e95a3
Create Date: 2026-01-09 01:21:33.884300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc2985e6386b'
down_revision: Union[str, None] = '2380be5e95a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 创建 character_cd_status 表
    op.create_table(
        'character_cd_status',
        sa.Column('id', sa.Integer(), nullable=False, comment='状态ID'),
        sa.Column('character_id', sa.Integer(), nullable=False, comment='角色ID'),
        sa.Column('week_start_date', sa.Date(), nullable=False, comment='周起始日期（周一早7点）'),
        sa.Column('dungeon_name', sa.String(length=50), nullable=False, comment='副本名称'),
        sa.Column('is_cleared', sa.Boolean(), nullable=False, server_default='false', comment='是否通关'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), comment='更新时间'),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('character_id', 'week_start_date', 'dungeon_name', name='uq_character_cd_status')
    )
    op.create_index('ix_character_cd_status_id', 'character_cd_status', ['id'])
    op.create_index('ix_character_cd_status_character_id', 'character_cd_status', ['character_id'])
    op.create_index('ix_character_cd_status_week_start_date', 'character_cd_status', ['week_start_date'])
    op.create_index('ix_character_cd_status_dungeon_name', 'character_cd_status', ['dungeon_name'])

    # 2. 迁移已有的 CD 状态数据（从 weekly_records 中提取唯一的角色CD状态）
    op.execute("""
        INSERT INTO character_cd_status (character_id, week_start_date, dungeon_name, is_cleared, created_at, updated_at)
        SELECT DISTINCT
            character_id,
            week_start_date,
            dungeon_name,
            is_cleared,
            MIN(created_at) as created_at,
            MAX(updated_at) as updated_at
        FROM weekly_records
        WHERE is_cleared = true
        GROUP BY character_id, week_start_date, dungeon_name, is_cleared
        ON CONFLICT (character_id, week_start_date, dungeon_name) DO NOTHING
    """)

    # 3. 从 weekly_records 删除 is_cleared 字段
    op.drop_column('weekly_records', 'is_cleared')


def downgrade() -> None:
    # 1. 在 weekly_records 添加 is_cleared 字段
    op.add_column('weekly_records', sa.Column('is_cleared', sa.Boolean(), nullable=False, server_default='false', comment='是否通关'))

    # 2. 从 character_cd_status 恢复数据到 weekly_records
    op.execute("""
        UPDATE weekly_records wr
        SET is_cleared = ccs.is_cleared
        FROM character_cd_status ccs
        WHERE wr.character_id = ccs.character_id
          AND wr.week_start_date = ccs.week_start_date
          AND wr.dungeon_name = ccs.dungeon_name
          AND ccs.is_cleared = true
    """)

    # 3. 删除索引和表
    op.drop_index('ix_character_cd_status_dungeon_name', 'character_cd_status')
    op.drop_index('ix_character_cd_status_week_start_date', 'character_cd_status')
    op.drop_index('ix_character_cd_status_character_id', 'character_cd_status')
    op.drop_index('ix_character_cd_status_id', 'character_cd_status')
    op.drop_table('character_cd_status')
