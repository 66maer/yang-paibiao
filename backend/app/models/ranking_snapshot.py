"""
排名快照模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Date, DECIMAL
from app.models.base import Base


class RankingSnapshot(Base):
    """
    排名快照模型
    记录每次排名计算的快照，用于追踪排名变化
    """
    __tablename__ = "ranking_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, index=True, comment="群组ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="用户ID")
    rank_position = Column(Integer, nullable=False, comment="排名位置")
    rank_score = Column(DECIMAL(12, 2), nullable=False, comment="Rank分数")
    heibenren_count = Column(Integer, nullable=False, comment="黑本次数")
    total_gold = Column(Integer, nullable=False, comment="总金团金额")
    average_gold = Column(DECIMAL(12, 2), nullable=False, comment="平均金团金额")
    corrected_average_gold = Column(DECIMAL(12, 2), nullable=False, comment="修正后的平均金团金额")
    last_heibenren_date = Column(Date, nullable=True, comment="最近一次黑本日期")
    last_heibenren_car_number = Column(Integer, nullable=True, comment="最近一次黑本的车次")
    snapshot_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True, comment="快照时间")

    # 变化记录字段（与上一次分数变化时的快照比较）
    prev_score = Column(DECIMAL(12, 2), nullable=True, comment="上一次分数变化时的分数")
    prev_rank = Column(Integer, nullable=True, comment="上一次分数变化时的排名")
    score_change = Column(DECIMAL(12, 2), nullable=True, default=0, comment="分数变化值")
    rank_change_value = Column(Integer, nullable=True, default=0, comment="排名变化值（正数表示上升）")

    # 软删除字段（成员退群时隐藏红黑榜记录）
    deleted_at = Column(DateTime, nullable=True, comment="软删除时间")

    def __repr__(self):
        return f"<RankingSnapshot(id={self.id}, guild_id={self.guild_id}, user_id={self.user_id}, rank={self.rank_position})>"
