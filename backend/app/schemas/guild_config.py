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


# ==================== 快捷开团配置 ====================

class QuickTeamOption(BaseModel):
    """快捷开团选项"""
    name: str = Field(..., min_length=1, max_length=20, description="选项名称（显示在按钮上）")
    label: Optional[str] = Field(None, max_length=10, description="标题标签（用于自动生成标题，为空则使用name）")
    hour: int = Field(..., ge=0, le=23, description="小时")
    minute: int = Field(..., ge=0, le=59, description="分钟")
    order: int = Field(..., ge=0, description="排序顺序")


class QuickTeamOptionsUpdate(BaseModel):
    """更新快捷开团选项的请求模型"""
    quick_team_options: List[QuickTeamOption] = Field(..., description="快捷开团选项配置")


class QuickTeamOptionsResponse(BaseModel):
    """快捷开团选项响应"""
    options: List[QuickTeamOption]
