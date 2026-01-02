"""
团队日志相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class TeamLogOut(BaseModel):
    """团队日志的响应模型"""
    id: int
    team_id: int
    guild_id: int
    action_type: str
    action_user_id: Optional[int] = None
    action_user_name: Optional[str] = Field(None, description="操作用户名称（动态获取）")
    action_detail: dict[str, Any]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
