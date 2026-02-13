from typing import Optional
from pydantic import BaseModel, Field


class PublishCardRequest(BaseModel):
    qq_group_number: str = Field(..., description="QQ群号")
    card_type: str = Field(..., description="卡牌类型（恶魔/混沌/绝境/天使）")
    card_name: str = Field(..., description="卡牌名称")
    desc: str = Field(default="", description="卡牌描述")
    enhanced: str = Field(default="", description="强化效果")
    note: str = Field(default="", description="备注")
    detail: str = Field(default="", description="发群详情文字")
    target_team: int = Field(..., ge=1, le=5, description="目标队伍(1-5)")
    image_dir: str = Field(default="", description="图片目录名")
