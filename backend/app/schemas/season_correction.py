"""
赛季修正系数相关的 Pydantic 模型
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class SeasonCorrectionFactorBase(BaseModel):
    """赛季修正系数基础模型"""
    dungeon: str = Field(..., min_length=1, max_length=50, description="副本名称")
    start_date: date = Field(..., description="时间段开始日期")
    end_date: Optional[date] = Field(None, description="时间段结束日期（NULL表示永久有效）")
    correction_factor: Decimal = Field(default=Decimal("1.00"), ge=0.01, le=999.99, description="修正系数")
    description: Optional[str] = Field(None, description="描述")


class SeasonCorrectionFactorCreate(SeasonCorrectionFactorBase):
    """创建赛季修正系数的请求模型"""
    pass


class SeasonCorrectionFactorUpdate(BaseModel):
    """更新赛季修正系数的请求模型"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    correction_factor: Optional[Decimal] = Field(None, ge=0.01, le=999.99)
    description: Optional[str] = None


class SeasonCorrectionFactorOut(SeasonCorrectionFactorBase):
    """赛季修正系数的响应模型"""
    id: int

    class Config:
        from_attributes = True
