"""
金团记录相关的 Pydantic 模型
"""
from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class HeibenrenInfo(BaseModel):
    """黑本人显示信息"""
    user_name: Optional[str] = Field(None, description="用户名称")
    character_name: Optional[str] = Field(None, description="角色名称")


class GoldRecordBase(BaseModel):
    """金团记录基础模型"""
    team_id: Optional[int] = Field(None, description="关联的开团ID")
    dungeon: str = Field(..., min_length=1, max_length=50, description="副本名称")
    run_date: date = Field(..., description="运行日期")
    total_gold: int = Field(..., ge=0, description="总金团")
    worker_count: int = Field(..., ge=0, description="打工人数")
    special_drops: Optional[List[str]] = Field(None, description="特殊掉落（字符串数组）")
    xuanjing_drops: Optional[Dict[str, int]] = Field(None, description="玄晶掉落信息（包含价格）")
    has_xuanjing: bool = Field(False, description="是否出玄晶")
    heibenren_user_id: Optional[int] = Field(None, description="黑本人用户ID")
    heibenren_character_id: Optional[int] = Field(None, description="黑本人角色ID")
    heibenren_info: Optional[HeibenrenInfo] = Field(None, description="黑本人显示信息")
    notes: Optional[str] = Field(None, description="备注")


class GoldRecordCreate(GoldRecordBase):
    """创建金团记录的请求模型"""
    pass


class GoldRecordUpdate(BaseModel):
    """更新金团记录的请求模型"""
    dungeon: Optional[str] = Field(None, min_length=1, max_length=50)
    run_date: Optional[date] = None
    total_gold: Optional[int] = Field(None, ge=0)
    worker_count: Optional[int] = Field(None, ge=0)
    special_drops: Optional[List[str]] = None
    xuanjing_drops: Optional[Dict[str, int]] = None
    has_xuanjing: Optional[bool] = None
    heibenren_user_id: Optional[int] = None
    heibenren_character_id: Optional[int] = None
    heibenren_info: Optional[HeibenrenInfo] = None
    notes: Optional[str] = None


class GoldRecordOut(BaseModel):
    """金团记录的响应模型"""
    id: int
    guild_id: int
    team_id: Optional[int] = None
    creator_id: int
    dungeon: str
    run_date: date
    total_gold: int
    worker_count: int
    special_drops: Optional[List[str]] = None
    xuanjing_drops: Optional[Dict[str, int]] = None
    has_xuanjing: bool = False
    heibenren_user_id: Optional[int] = None
    heibenren_character_id: Optional[int] = None
    heibenren_info: Optional[HeibenrenInfo] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
