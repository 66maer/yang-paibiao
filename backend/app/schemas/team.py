"""
团队（开团）相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, model_validator


class RuleItem(BaseModel):
    """单个位置的报名规则"""
    allowRich: bool = Field(default=False, description="允许老板")
    allowXinfaList: List[Any] = Field(default_factory=list, description="允许的心法列表")


class TeamBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="开团标题")
    team_time: datetime = Field(..., description="开团时间")
    dungeon: str = Field(..., min_length=1, max_length=50, description="副本名称")
    max_members: int = Field(default=25, ge=1, le=100, description="最大人数")
    is_xuanjing_booked: bool = Field(default=False, description="是否预定玄晶")
    is_yuntie_booked: bool = Field(default=False, description="是否预定陨铁")
    is_hidden: bool = Field(default=False, description="是否对成员隐藏")
    is_locked: bool = Field(default=False, description="是否锁定")
    notice: Optional[str] = Field(default=None, description="团队告示")
    rules: List[RuleItem] = Field(..., description="团队面板规则数组，长度通常为25")


class TeamCreate(TeamBase):
    """创建开团的请求模型"""
    pass


class TeamUpdate(BaseModel):
    """更新开团的请求模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    team_time: Optional[datetime] = None
    dungeon: Optional[str] = Field(None, min_length=1, max_length=50)
    max_members: Optional[int] = Field(None, ge=1, le=100)
    is_xuanjing_booked: Optional[bool] = None
    is_yuntie_booked: Optional[bool] = None
    is_hidden: Optional[bool] = None
    is_locked: Optional[bool] = None
    notice: Optional[str] = None
    rules: Optional[List[RuleItem]] = None
    slot_view: Optional[List[int]] = Field(None, description="坑位视觉映射数组（用于连连看模式）")


class TeamClose(BaseModel):
    """关闭开团的请求模型"""
    status: str = Field(..., description="关闭状态: completed(完成) 或 cancelled(取消)")

    @model_validator(mode='after')
    def validate_status(self):
        """验证状态值必须是 completed 或 cancelled"""
        if self.status not in ["completed", "cancelled"]:
            raise ValueError("status 必须是 'completed' 或 'cancelled'")
        return self


class SlotAssignmentItem(BaseModel):
    """坑位分配项"""
    signup_id: Optional[int] = Field(default=None, description="报名ID")
    locked: bool = Field(default=False, description="是否锁定")


class TeamOut(BaseModel):
    """开团的响应模型"""
    id: int
    guild_id: int
    creator_id: int
    title: str
    team_time: datetime
    dungeon: str
    max_members: int
    is_xuanjing_booked: bool
    is_yuntie_booked: bool
    is_hidden: bool
    is_locked: bool
    status: str
    notice: Optional[str] = None
    rules: List[RuleItem]
    slot_view: Optional[List[int]] = Field(default=None, description="坑位视觉映射数组（已废弃）")
    slot_assignments: Optional[List[SlotAssignmentItem]] = Field(default=None, description="坑位分配情况")
    waitlist: Optional[List[int]] = Field(default=None, description="候补列表")
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    closed_by: Optional[int] = None

    @model_validator(mode='before')
    @classmethod
    def map_rule_to_rules(cls, data: Any) -> Any:
        """将数据库的 rule 字段映射到 rules"""
        if isinstance(data, dict):
            if 'rule' in data and 'rules' not in data:
                data['rules'] = data['rule']
            return data
        # 处理 SQLAlchemy 模型对象
        if hasattr(data, 'rule') and not hasattr(data, 'rules'):
            # 创建一个字典副本并添加 rules 字段
            data_dict = {c.name: getattr(data, c.name) for c in data.__table__.columns}
            data_dict['rules'] = data.rule
            return data_dict
        return data

    class Config:
        from_attributes = True
