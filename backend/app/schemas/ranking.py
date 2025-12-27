"""
排名相关的 Pydantic 模型
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class RankingItemOut(BaseModel):
    """排名列表项"""
    rank_position: int = Field(..., description="排名位置")
    user_id: int = Field(..., description="用户ID")
    user_name: str = Field(..., description="用户昵称")
    user_avatar: Optional[str] = Field(None, description="用户头像")
    heibenren_count: int = Field(..., description="黑本次数")
    average_gold: Decimal = Field(..., description="平均金团金额")
    corrected_average_gold: Decimal = Field(..., description="修正后的平均金团金额")
    rank_score: Decimal = Field(..., description="Rank分数")
    last_heibenren_date: Optional[date] = Field(None, description="最近一次黑本日期")
    last_heibenren_car_number: Optional[int] = Field(None, description="最近一次黑本的车次")
    last_heibenren_days_ago: Optional[int] = Field(None, description="距离最近一次黑本的天数")
    rank_change: str = Field(..., description="排名变化: up/down/same/new")
    rank_change_value: int = Field(0, description="排名变化值（正数表示上升）")


class GuildRankingResponse(BaseModel):
    """群组排名响应"""
    guild_id: int
    guild_name: str
    snapshot_date: datetime
    rankings: list[RankingItemOut]
