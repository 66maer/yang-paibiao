"""
报名数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base


class Signup(Base):
    """报名表"""

    __tablename__ = "signups"

    id = Column(Integer, primary_key=True, index=True, comment="报名ID")
    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="开团ID"
    )
    submitter_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
        comment="提交者用户ID（当前登录用户）"
    )
    signup_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="报名用户ID（可为null，表示系统外的人）"
    )
    signup_character_id = Column(
        Integer,
        ForeignKey("characters.id", ondelete="SET NULL"),
        nullable=True,
        comment="报名角色ID（可为null，表示未录入系统的角色）"
    )
    signup_info = Column(
        JSON,
        nullable=False,
        comment="报名信息（包含提交者名称、报名者名称、角色名称、心法）"
    )
    priority = Column(
        Integer,
        default=0,
        nullable=False,
        comment="优先级（用于排序）"
    )
    is_rich = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="是否老板"
    )
    is_proxy = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="是否代报（自动判断）"
    )
    slot_position = Column(
        Integer,
        nullable=True,
        comment="锁定位置（1-25或null）"
    )
    presence_status = Column(
        String(20),
        nullable=True,
        comment="到场状态: ready(就绪), absent(缺席), null(未标记)"
    )
    cancelled_at = Column(
        DateTime,
        nullable=True,
        comment="取消时间（软删除）"
    )
    cancelled_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="取消者用户ID"
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
    team = relationship("Team", foreign_keys=[team_id])
    submitter = relationship("User", foreign_keys=[submitter_id])
    signup_user = relationship("User", foreign_keys=[signup_user_id])
    signup_character = relationship("Character", foreign_keys=[signup_character_id])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])

    def __repr__(self):
        return f"<Signup(id={self.id}, team_id={self.team_id}, submitter_id={self.submitter_id})>"

    @property
    def is_cancelled(self) -> bool:
        """是否已取消"""
        return self.cancelled_at is not None
