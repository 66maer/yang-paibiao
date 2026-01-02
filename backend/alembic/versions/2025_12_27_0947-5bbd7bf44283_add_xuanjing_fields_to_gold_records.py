"""add_xuanjing_fields_to_gold_records

Revision ID: 5bbd7bf44283
Revises: 885491d13d10
Create Date: 2025-12-27 09:47:48.287002

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5bbd7bf44283'
down_revision: Union[str, None] = '885491d13d10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加玄晶掉落信息字段
    op.add_column('gold_records', sa.Column('xuanjing_drops', sa.JSON(), nullable=True, comment='玄晶掉落信息（包含价格）'))
    # 添加是否出玄晶标记字段
    op.add_column('gold_records', sa.Column('has_xuanjing', sa.Boolean(), nullable=False, server_default='false', comment='是否出玄晶'))
    # 为 has_xuanjing 字段创建索引
    op.create_index('ix_gold_records_has_xuanjing', 'gold_records', ['has_xuanjing'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_gold_records_has_xuanjing', table_name='gold_records')
    # 删除字段
    op.drop_column('gold_records', 'has_xuanjing')
    op.drop_column('gold_records', 'xuanjing_drops')
