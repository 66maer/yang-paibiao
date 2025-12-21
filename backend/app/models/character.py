"""
角色数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Character(Base):
    """角色表"""

    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True, comment="角色ID")
    name = Column(
        String(50),
        nullable=False,
        index=True,
        comment="角色名"
    )
    server = Column(
        String(30),
        nullable=False,
        index=True,
        comment="服务器"
    )
    xinfa = Column(
        String(20),
        nullable=False,
        comment="心法"
    )
    remark = Column(
        Text,
        nullable=True,
        comment="备注"
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
    players = relationship("CharacterPlayer", back_populates="character", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}', server='{self.server}', xinfa='{self.xinfa}')>"

    @property
    def is_deleted(self) -> bool:
        """是否已删除"""
        return self.deleted_at is not None


class CharacterPlayer(Base):
    """角色-玩家关联表"""

    __tablename__ = "character_players"

    id = Column(Integer, primary_key=True, index=True, comment="关联ID")
    character_id = Column(
        Integer,
        ForeignKey("characters.id", ondelete="CASCADE"),
        nullable=False,
        comment="角色ID"
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="用户ID"
    )
    relation_type = Column(
        String(20),
        nullable=False,
        default="owner",
        comment="关系类型: owner(主人), shared(共享)"
    )
    priority = Column(
        Integer,
        nullable=False,
        default=0,
        comment="优先级，数值越小优先级越高"
    )
    notes = Column(
        Text,
        nullable=True,
        comment="备注"
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

    # 关系
    character = relationship("Character", back_populates="players")
    user = relationship("User")

    def __repr__(self):
        return f"<CharacterPlayer(id={self.id}, character_id={self.character_id}, user_id={self.user_id}, relation_type='{self.relation_type}')>"
