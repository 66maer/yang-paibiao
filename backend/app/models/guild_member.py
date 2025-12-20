from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class GuildMember(Base):
    """群组成员关联模型
    角色取值与前端约定一致：owner / helper / member
    """
    __tablename__ = "guild_members"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False, comment="群组ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    role = Column(String(20), nullable=False, comment="角色: owner, helper, member")
    group_nickname = Column(String(50), nullable=True, comment="群内昵称")
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="加入时间")
    left_at = Column(DateTime, nullable=True, comment="离开时间")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")

    # 关系
    guild = relationship("Guild", back_populates="members")
    user = relationship("User", back_populates="guild_memberships")
