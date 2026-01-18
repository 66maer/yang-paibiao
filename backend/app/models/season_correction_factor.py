"""
赛季修正系数模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, Text, DECIMAL, CheckConstraint, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class SeasonCorrectionFactor(Base):
    """
    赛季修正系数模型
    用于存储不同副本在不同时间段的金额修正系数
    支持群组级别配置（guild_id 不为空）或全局配置（guild_id 为空）
    """
    __tablename__ = "season_correction_factors"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=True, index=True, comment="群组ID，NULL表示全局配置")
    dungeon = Column(String(50), nullable=False, index=True, comment="副本名称")
    start_date = Column(Date, nullable=False, index=True, comment="时间段开始日期")
    end_date = Column(Date, nullable=True, comment="时间段结束日期（NULL表示永久有效）")
    correction_factor = Column(DECIMAL(5, 2), nullable=False, default=1.00, comment="修正系数")
    description = Column(Text, nullable=True, comment="描述")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")

    # 关系
    guild = relationship("Guild", backref="season_correction_factors")

    __table_args__ = (
        CheckConstraint('end_date IS NULL OR end_date >= start_date', name='check_dates'),
    )

    def __repr__(self):
        return f"<SeasonCorrectionFactor(id={self.id}, dungeon='{self.dungeon}', factor={self.correction_factor})>"
