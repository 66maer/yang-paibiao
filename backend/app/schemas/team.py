"""
团队（开团）相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="团队名称")


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)


class TeamOut(TeamBase):
    id: int
    guild_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
