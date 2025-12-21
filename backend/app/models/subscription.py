from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class Subscription(Base):
    """订阅模型"""
    __tablename__ = "guild_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False, comment="群组ID")
    
    start_date = Column(Date, nullable=False, comment="订阅开始日期")
    end_date = Column(Date, nullable=False, comment="订阅结束日期")
    
    features = Column(JSON, nullable=False, default=dict, comment="订阅功能配置")
    notes = Column(Text, nullable=True, comment="备注信息")
    
    created_by = Column(Integer, ForeignKey("system_admins.id"), nullable=False, comment="创建人（管理员ID）")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")

    # 关系
    guild = relationship("Guild", back_populates="subscriptions")
    creator = relationship("SystemAdmin", foreign_keys=[created_by])
    
    @property
    def is_active(self) -> bool:
        """判断订阅是否有效"""
        today = date.today()
        return self.start_date <= today <= self.end_date
