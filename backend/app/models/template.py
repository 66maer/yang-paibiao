from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base


class TeamTemplate(Base):
    """
    开团模板模型
    - 隶属于某个群组（guild）
    - 包含团队告示与团队面板规则（JSON）
    """
    __tablename__ = "team_templates"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(Integer, ForeignKey("guilds.id"), nullable=False, comment="群组ID")

    title = Column(String(50), nullable=True, comment="模板标题（可选）")
    notice = Column(Text, nullable=True, comment="团队告示")
    rules = Column(JSON, nullable=False, default=list, comment="团队面板规则数组，长度通常为25")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, comment="更新时间")
