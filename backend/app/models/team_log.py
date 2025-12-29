"""
团队日志模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base


class TeamLog(Base):
    """团队操作日志表"""
    __tablename__ = "team_logs"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="关联的团队ID"
    )
    guild_id = Column(
        Integer,
        ForeignKey("guilds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="关联的群组ID"
    )
    action_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="操作类型"
    )
    action_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="执行操作的用户ID"
    )
    action_detail = Column(
        JSON,
        nullable=False,
        comment="操作详情"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="操作时间"
    )

    # 关系
    team = relationship("Team", foreign_keys=[team_id])
    guild = relationship("Guild", foreign_keys=[guild_id])
    action_user = relationship("User", foreign_keys=[action_user_id])

    def __repr__(self):
        return f"<TeamLog(id={self.id}, team_id={self.team_id}, action_type={self.action_type})>"
