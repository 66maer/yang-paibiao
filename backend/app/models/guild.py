from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Guild(Base):
    """群组模型"""
    __tablename__ = "guilds"

    id = Column(Integer, primary_key=True, index=True)
    guild_qq_number = Column(String(20), unique=True, index=True, nullable=False, comment="群QQ号")
    ukey = Column(String(20), unique=True, index=True, nullable=False, comment="群组唯一标识")
    name = Column(String(50), nullable=False, comment="群组名称")
    server = Column(String(30), nullable=False, comment="游戏服务器")
    avatar = Column(String(255), nullable=True, comment="群组头像URL")
    description = Column(Text, nullable=True, comment="群组描述")
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="群主用户ID")
    
    preferences = Column(JSON, nullable=True, default=dict, comment="群组偏好设置")
    
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")

    # 关系
    owner = relationship("User", back_populates="owned_guilds", foreign_keys=[owner_id])
    subscriptions = relationship("Subscription", back_populates="guild", cascade="all, delete-orphan")
    members = relationship("GuildMember", back_populates="guild", cascade="all, delete-orphan")
    # TODO: teams relationship
