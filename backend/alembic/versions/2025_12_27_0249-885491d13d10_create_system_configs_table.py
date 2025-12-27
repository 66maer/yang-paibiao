"""create_system_configs_table

Revision ID: 885491d13d10
Revises: 8be218b2240f
Create Date: 2025-12-27 02:49:00.746050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '885491d13d10'
down_revision: Union[str, None] = '8be218b2240f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 system_configs 表
    op.create_table(
        'system_configs',
        sa.Column('key', sa.String(100), primary_key=True),
        sa.Column('value', sa.JSON(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('NOW()'), nullable=False)
    )

    # 插入初始副本配置数据
    op.execute("""
        INSERT INTO system_configs (key, value, description) VALUES
        ('dungeon_options', '[
          {"name": "绝地天通", "type": "primary", "order": 1},
          {"name": "英雄太极宫", "type": "primary", "order": 2},
          {"name": "英雄天泣林", "type": "primary", "order": 3},
          {"name": "英雄磨刀楼", "type": "primary", "order": 4},
          {"name": "英雄寂灭殿", "type": "primary", "order": 5},
          {"name": "25H 红", "type": "secondary", "order": 6},
          {"name": "25H 橙", "type": "secondary", "order": 7},
          {"name": "10H 橙武", "type": "secondary", "order": 8}
        ]'::jsonb, '副本选项配置')
    """)


def downgrade() -> None:
    # 删除表
    op.drop_table('system_configs')
