"""add change fields to ranking_snapshots table

Revision ID: add_ranking_change_fields
Revises: add_edit_count
Create Date: 2026-01-18 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from decimal import Decimal


# revision identifiers, used by Alembic.
revision = 'add_ranking_change_fields'
down_revision = 'add_edit_count'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """添加变化记录字段到 ranking_snapshots 表，并根据历史数据计算变化值"""
    # 1. 添加新字段
    op.add_column(
        'ranking_snapshots',
        sa.Column('prev_score', sa.DECIMAL(12, 2), nullable=True, comment='上一次分数变化时的分数')
    )
    op.add_column(
        'ranking_snapshots',
        sa.Column('prev_rank', sa.Integer(), nullable=True, comment='上一次分数变化时的排名')
    )
    op.add_column(
        'ranking_snapshots',
        sa.Column('score_change', sa.DECIMAL(12, 2), nullable=True, server_default='0', comment='分数变化值')
    )
    op.add_column(
        'ranking_snapshots',
        sa.Column('rank_change_value', sa.Integer(), nullable=True, server_default='0', comment='排名变化值（正数表示上升）')
    )

    # 2. 根据历史数据计算变化值
    conn = op.get_bind()

    # 获取所有快照，按 guild_id, user_id, snapshot_date 排序
    result = conn.execute(text("""
        SELECT id, guild_id, user_id, rank_score, rank_position, snapshot_date
        FROM ranking_snapshots
        ORDER BY guild_id, user_id, snapshot_date ASC
    """))
    rows = result.fetchall()

    # 按 (guild_id, user_id) 分组处理
    user_snapshots = {}
    for row in rows:
        key = (row.guild_id, row.user_id)
        if key not in user_snapshots:
            user_snapshots[key] = []
        user_snapshots[key].append({
            'id': row.id,
            'rank_score': row.rank_score,
            'rank_position': row.rank_position
        })

    # 计算并更新每条记录的变化值
    for _, snapshots in user_snapshots.items():
        prev_score = None
        prev_rank = None
        score_change = Decimal('0')
        rank_change_value = 0

        for i, snapshot in enumerate(snapshots):
            current_score = Decimal(str(snapshot['rank_score']))
            current_rank = snapshot['rank_position']

            if i == 0:
                # 第一条记录，无变化
                prev_score = None
                prev_rank = None
                score_change = Decimal('0')
                rank_change_value = 0
            else:
                last_snapshot = snapshots[i - 1]
                last_score = Decimal(str(last_snapshot['rank_score']))
                last_rank = last_snapshot['rank_position']

                # 判断分数是否变化
                if abs(float(current_score) - float(last_score)) >= 0.01:
                    # 分数变了，记录与上一次的变化
                    prev_score = last_score
                    prev_rank = last_rank
                    score_change = current_score - last_score
                    rank_change_value = last_rank - current_rank
                # 如果分数没变，保持上一条记录的变化值（已经在循环外维护）

            # 更新数据库
            conn.execute(text("""
                UPDATE ranking_snapshots
                SET prev_score = :prev_score,
                    prev_rank = :prev_rank,
                    score_change = :score_change,
                    rank_change_value = :rank_change_value
                WHERE id = :id
            """), {
                'prev_score': prev_score,
                'prev_rank': prev_rank,
                'score_change': score_change,
                'rank_change_value': rank_change_value,
                'id': snapshot['id']
            })


def downgrade() -> None:
    """移除变化记录字段"""
    op.drop_column('ranking_snapshots', 'rank_change_value')
    op.drop_column('ranking_snapshots', 'score_change')
    op.drop_column('ranking_snapshots', 'prev_rank')
    op.drop_column('ranking_snapshots', 'prev_score')
