"""
排名相关的 Pydantic 模型
"""
from datetime import date, datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from decimal import Decimal


class RecordDetail(BaseModel):
    """单条金团记录详情"""
    record_id: int = Field(..., description="记录ID")
    dungeon: str = Field(..., description="副本名称")
    run_date: date = Field(..., description="日期")
    gold: int = Field(..., description="金团金额")
    correction_factor: Decimal = Field(..., description="修正系数")
    corrected_gold: Decimal = Field(..., description="修正后金额")
    recent_weight: Decimal = Field(..., description="近期加权系数")
    weighted_gold: Decimal = Field(..., description="加权后金额")


class RankingCalculationDetail(BaseModel):
    """排名计算详情"""
    records: List[RecordDetail] = Field(..., description="所有黑本记录")
    total_gold: int = Field(..., description="总金团金额")
    corrected_total_gold: Decimal = Field(..., description="修正后总金额")
    weighted_total_gold: Decimal = Field(..., description="加权后总金额")
    heibenren_count: int = Field(..., description="黑本次数")
    average_gold: Decimal = Field(..., description="平均金额")
    corrected_average_gold: Decimal = Field(..., description="修正后平均金额")
    weighted_average_gold: Decimal = Field(..., description="加权后平均金额")
    rank_modifier: Decimal = Field(..., description="Rank修正系数")
    rank_score: Decimal = Field(..., description="最终Rank分")


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
    score_change_value: Decimal = Field(Decimal("0"), description="分数变化值（与自己上次相比）")
    prev_rank: Optional[int] = Field(None, description="上一次的排名位置")
    prev_score: Optional[Decimal] = Field(None, description="上一次的Rank分数")
    calculation_detail: Optional[RankingCalculationDetail] = Field(None, description="计算详情")


class SeasonFactorInfo(BaseModel):
    """赛季修正系数信息"""
    dungeon: str = Field(..., description="副本名称")
    start_date: date = Field(..., description="开始日期")
    end_date: Optional[date] = Field(None, description="结束日期")
    correction_factor: Decimal = Field(..., description="修正系数")
    description: Optional[str] = Field(None, description="描述")


class GuildRankingResponse(BaseModel):
    """群组排名响应"""
    guild_id: int
    guild_name: str
    snapshot_date: datetime
    rankings: list[RankingItemOut]
    season_factors: List[SeasonFactorInfo] = Field(default_factory=list, description="当前使用的修正系数")


class HeibenRecommendationItem(BaseModel):
    """黑本推荐列表项"""
    user_id: int = Field(..., description="用户ID")
    user_name: str = Field(..., description="用户昵称")
    user_avatar: Optional[str] = Field(None, description="用户头像")
    rank_score: Decimal = Field(..., description="红黑分")
    heibenren_count: int = Field(0, description="黑本次数")
    frequency_modifier: Decimal = Field(..., description="频次修正系数")
    time_modifier: Decimal = Field(..., description="时间修正系数")
    participation_modifier: Decimal = Field(Decimal("1.0"), description="参与度惩罚系数（惩罚长期不跟车）")
    teams_since_last_participation: Optional[int] = Field(None, description="距离上次跟车的开团次数")
    recent_3_participations: List[int] = Field(default_factory=list, description="最近3次跟车距今的车次差")
    recommendation_score: Decimal = Field(..., description="黑本推荐分")
    last_heibenren_date: Optional[date] = Field(None, description="最近一次黑本日期")
    cars_since_last: Optional[int] = Field(None, description="距离上次黑本的车次数")
    is_new: bool = Field(False, description="是否无黑本记录")


class HeibenRecommendationRequest(BaseModel):
    """黑本推荐请求"""
    member_user_ids: List[Optional[int]] = Field(..., description="团队成员用户ID列表（可包含null值，表示未录入系统的报名者）")


class HeibenRecommendationResponse(BaseModel):
    """黑本推荐响应"""
    team_id: int
    recommendations: List[HeibenRecommendationItem]
    average_rank_score: Decimal = Field(..., description="团队成员平均红黑分")
