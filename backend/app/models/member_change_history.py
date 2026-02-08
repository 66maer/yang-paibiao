"""
成员变更历史模型
记录群组成员的加入/离开/恢复等变更历史
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class MemberChangeHistory(Base):
    """成员变更历史表"""
    __tablename__ = "member_change_histories"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(
        Integer,
        ForeignKey("guilds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="群组ID"
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="用户ID"
    )
    action = Column(
        String(20),
        nullable=False,
        index=True,
        comment="操作类型: join(加入), leave(离开), restore(恢复)"
    )
    reason = Column(
        String(50),
        nullable=True,
        comment="原因: bot_sync(机器人同步), manual(手动), kick(被踢), quit(主动退出)"
    )
    operator_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        comment="操作者用户ID（如果有）"
    )
    notes = Column(
        Text,
        nullable=True,
        comment="备注信息"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="创建时间"
    )

    # 关系
    guild = relationship("Guild")
    user = relationship("User", foreign_keys=[user_id])
    operator = relationship("User", foreign_keys=[operator_id])

    def __repr__(self):
        return f"<MemberChangeHistory(id={self.id}, guild_id={self.guild_id}, user_id={self.user_id}, action='{self.action}')>"
