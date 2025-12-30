"""
机器人模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Bot(Base):
    """机器人表"""

    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True, comment="Bot ID")
    bot_name = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="Bot标识名（唯一）"
    )
    api_key_hash = Column(
        String(255),
        nullable=False,
        comment="API Key哈希值"
    )
    description = Column(
        Text,
        nullable=True,
        comment="Bot描述"
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="是否激活"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        comment="创建时间"
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        comment="更新时间"
    )
    last_used_at = Column(
        DateTime,
        nullable=True,
        comment="最后使用时间"
    )

    # 关系
    authorized_guilds = relationship(
        "BotGuild",
        back_populates="bot",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Bot(id={self.id}, bot_name='{self.bot_name}', is_active={self.is_active})>"


class BotGuild(Base):
    """Bot-Guild关联表，控制Bot的群组访问权限"""

    __tablename__ = "bot_guilds"

    id = Column(Integer, primary_key=True, index=True, comment="关联ID")
    bot_id = Column(
        Integer,
        ForeignKey("bots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Bot ID"
    )
    guild_id = Column(
        Integer,
        ForeignKey("guilds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="群组ID"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        comment="授权时间"
    )
    created_by = Column(
        Integer,
        ForeignKey("system_admins.id", ondelete="SET NULL"),
        nullable=True,
        comment="授权管理员ID"
    )

    # 关系
    bot = relationship("Bot", back_populates="authorized_guilds")
    guild = relationship("Guild")
    admin = relationship("SystemAdmin")

    def __repr__(self):
        return f"<BotGuild(bot_id={self.bot_id}, guild_id={self.guild_id})>"
