"""
群组副本配置模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base


class GuildDungeonConfig(Base):
    """
    群组副本配置模型
    用于存储每个群组的副本选项配置
    """
    __tablename__ = "guild_dungeon_configs"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, unique=True, index=True, comment="群组ID")
    dungeon_options = Column(JSON, nullable=False, default=list, comment="副本选项配置")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")

    # 关系
    guild = relationship("Guild", backref="dungeon_config")

    def __repr__(self):
        return f"<GuildDungeonConfig(id={self.id}, guild_id={self.guild_id})>"
