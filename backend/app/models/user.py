"""
用户数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ARRAY, Text
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """用户表"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    qq_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="QQ号"
    )
    password_hash = Column(
        String(255),
        nullable=False,
        comment="密码哈希值"
    )
    nickname = Column(
        String(50),
        nullable=False,
        comment="昵称"
    )
    other_nicknames = Column(
        ARRAY(Text),
        nullable=True,
        comment="其他昵称（用于搜索）"
    )
    avatar = Column(
        String(255),
        nullable=True,
        comment="头像URL"
    )
    last_login_at = Column(
        DateTime,
        nullable=True,
        comment="最后登录时间"
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
    deleted_at = Column(
        DateTime,
        nullable=True,
        comment="删除时间（软删除）"
    )

    # 关系
    owned_guilds = relationship("Guild", back_populates="owner", foreign_keys="Guild.owner_id")

    def __repr__(self):
        return f"<User(id={self.id}, qq_number='{self.qq_number}', nickname='{self.nickname}')>"

    @property
    def is_deleted(self) -> bool:
        """是否已删除"""
        return self.deleted_at is not None
