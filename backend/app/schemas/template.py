"""
开团模板相关 Pydantic 模型
"""
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class RuleItem(BaseModel):
    allowRich: bool = Field(default=False, description="允许老板")
    allowXinfaList: List[Any] = Field(default_factory=list, description="允许的心法列表")


class TemplateBase(BaseModel):
    title: Optional[str] = Field(default=None, max_length=50, description="模板标题（可选）")
    notice: Optional[str] = Field(default=None, description="团队告示")
    rules: List[RuleItem] = Field(default_factory=list, description="团队面板规则数组，长度通常为25")


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=50)
    notice: Optional[str] = None
    rules: Optional[List[RuleItem]] = None


class TemplateOut(TemplateBase):
    id: int
    guild_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
