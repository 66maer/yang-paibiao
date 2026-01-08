from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base

class Team(Base):
    """
    团队（开团）模型
    """
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False, comment="群组ID")
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    title = Column(String(100), nullable=False, comment="开团标题")
    team_time = Column(DateTime, nullable=False, comment="开团时间")
    dungeon = Column(String(50), nullable=False, comment="副本名称")
    max_members = Column(Integer, default=25, comment="最大人数")
    is_xuanjing_booked = Column(Boolean, default=False, comment="是否预定玄晶")
    is_yuntie_booked = Column(Boolean, default=False, comment="是否预定陨铁")
    is_hidden = Column(Boolean, default=False, comment="是否对成员隐藏")
    is_locked = Column(Boolean, default=False, comment="是否锁定")
    status = Column(String(20), default="open", comment="状态: open(开启), completed(完成), cancelled(取消), deleted(删除)")
    rule = Column(JSON, nullable=False, comment="报名规则")
    slot_view = Column(JSON, nullable=True, comment="坑位视觉映射（已废弃，使用slot_assignments）")
    slot_assignments = Column(JSON, nullable=True, comment="坑位分配情况 [{signup_id, locked}, ...]")
    waitlist = Column(JSON, nullable=True, comment="候补列表 [signup_id, ...]")
    notice = Column(Text, nullable=True, comment="团队告示")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")
    closed_at = Column(DateTime, nullable=True, comment="关闭时间")
    closed_by = Column(Integer, ForeignKey("users.id"), nullable=True, comment="关闭者ID")
