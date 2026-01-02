"""
系统管理员数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.models.base import Base


class SystemAdmin(Base):
    """系统管理员表"""

    __tablename__ = "system_admins"

    id = Column(Integer, primary_key=True, index=True, comment="管理员ID")
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="用户名"
    )
    password_hash = Column(
        String(255),
        nullable=False,
        comment="密码哈希值"
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

    def __repr__(self):
        return f"<SystemAdmin(id={self.id}, username='{self.username}')>"
