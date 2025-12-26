from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base


class GoldRecord(Base):
    """
    金团记录模型
    """
    __tablename__ = "gold_records"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, index=True, comment="群组ID")
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True, comment="关联的开团ID")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    dungeon = Column(String(50), nullable=False, index=True, comment="副本名称")
    run_date = Column(Date, nullable=False, index=True, comment="运行日期")
    total_gold = Column(Integer, nullable=False, comment="总金团")
    worker_count = Column(Integer, nullable=False, comment="打工人数")
    special_drops = Column(JSON, nullable=True, comment="特殊掉落（字符串数组）")
    heibenren_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="黑本人用户ID")
    heibenren_character_id = Column(Integer, ForeignKey("characters.id"), nullable=True, comment="黑本人角色ID")
    heibenren_info = Column(JSON, nullable=True, comment="黑本人显示信息")
    notes = Column(Text, nullable=True, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")
    deleted_at = Column(DateTime, nullable=True, comment="软删除时间")
