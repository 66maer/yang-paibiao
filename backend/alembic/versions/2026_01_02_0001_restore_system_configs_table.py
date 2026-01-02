"""restore system_configs table

Revision ID: 2026_01_02_0001
Revises: 97798943a4a1
Create Date: 2026-01-02 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2026_01_02_0001'
down_revision: Union[str, None] = '97798943a4a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 检查表是否存在，如果不存在则创建
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_configs')"
    ))
    table_exists = result.scalar()
    
    if not table_exists:
        # 创建 system_configs 表
        op.create_table(
            'system_configs',
            sa.Column('key', sa.String(length=100), nullable=False),
            sa.Column('value', postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('updated_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('key', name='system_configs_pkey')
        )
        
        # 插入初始副本配置数据
        op.execute("""
            INSERT INTO system_configs (key, value, description) VALUES
            ('dungeon_options', '[
              {"name": "英雄·弓月城", "type": "primary", "order": 1},
              {"name": "挑战·缚罪之渊", "type": "primary", "order": 2},
              {"name": "普通·弓月城", "type": "secondary", "order": 3},
              {"name": "英雄·太极宫", "type": "secondary", "order": 4},
              {"name": "普通·太极宫", "type": "secondary", "order": 5}
            ]'::jsonb, '副本选项配置')
            ON CONFLICT (key) DO NOTHING
        """)


def downgrade() -> None:
    # 不删除表，避免数据丢失
    pass
