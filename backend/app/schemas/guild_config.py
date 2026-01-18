"""
群组配置相关的 Pydantic 模型
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DungeonOption(BaseModel):
    """副本选项"""
    name: str = Field(..., min_length=1, max_length=50, description="副本名称")
    type: str = Field(..., description="副本类型（primary/secondary）")
    order: int = Field(..., ge=0, description="排序顺序")


class GuildDungeonConfigBase(BaseModel):
    """群组副本配置基础模型"""
    dungeon_options: List[DungeonOption] = Field(default_factory=list, description="副本选项配置")


class GuildDungeonConfigCreate(GuildDungeonConfigBase):
    """创建群组副本配置的请求模型"""
    pass


class GuildDungeonConfigUpdate(BaseModel):
    """更新群组副本配置的请求模型"""
    dungeon_options: List[DungeonOption] = Field(..., description="副本选项配置")


class GuildDungeonConfigOut(GuildDungeonConfigBase):
    """群组副本配置的响应模型"""
    id: int
    guild_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DungeonOptionsResponse(BaseModel):
    """副本选项响应"""
    options: List[DungeonOption]
