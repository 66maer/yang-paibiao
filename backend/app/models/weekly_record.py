"""
每周记录数据模型
"""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class CharacterCDStatus(Base):
    """角色CD状态表 - 记录角色在本周打过哪些副本（所有使用该角色的用户共享）"""

    __tablename__ = "character_cd_status"

    id = Column(Integer, primary_key=True, index=True, comment="状态ID")
    character_id = Column(
        Integer,
        ForeignKey("characters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="角色ID"
    )
    week_start_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="周起始日期（周一早7点）"
    )
    dungeon_name = Column(
        String(50),
        nullable=False,
        index=True,
        comment="副本名称"
    )
    is_cleared = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="是否通关"
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
    character = relationship("Character")

    def __repr__(self):
        return f"<CharacterCDStatus(id={self.id}, character_id={self.character_id}, dungeon='{self.dungeon_name}', cleared={self.is_cleared})>"


class WeeklyRecordConfig(Base):
    """每周记录列配置表"""

    __tablename__ = "weekly_record_configs"

    id = Column(Integer, primary_key=True, index=True, comment="配置ID")
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="用户ID"
    )
    week_start_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="周起始日期（周一早7点）"
    )
    columns_json = Column(
        JSON,
        nullable=False,
        comment="列配置JSON数组"
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
        return f"<WeeklyRecordConfig(id={self.id}, user_id={self.user_id}, week_start_date='{self.week_start_date}')>"


class WeeklyRecord(Base):
    """每周记录表 - 记录用户用某角色打副本获得的工资（用户私有）"""

    __tablename__ = "weekly_records"

    id = Column(Integer, primary_key=True, index=True, comment="记录ID")
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="用户ID"
    )
    character_id = Column(
        Integer,
        ForeignKey("characters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="角色ID"
    )
    week_start_date = Column(
        Date,
        nullable=False,
        index=True,
        comment="周起始日期（周一早7点）"
    )
    dungeon_name = Column(
        String(50),
        nullable=False,
        index=True,
        comment="副本名称"
    )
    gold_amount = Column(
        Integer,
        default=0,
        nullable=False,
        comment="人均金团金额"
    )
    gold_record_id = Column(
        Integer,
        ForeignKey("gold_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="关联的金团记录ID"
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
    character = relationship("Character")
    gold_record = relationship("GoldRecord")

    def __repr__(self):
        return f"<WeeklyRecord(id={self.id}, character_id={self.character_id}, dungeon='{self.dungeon_name}', gold={self.gold_amount})>"
