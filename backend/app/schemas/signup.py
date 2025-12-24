"""
报名相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SignupInfo(BaseModel):
    """报名信息"""
    submitter_name: str = Field(..., description="提交者显示名称")
    player_name: str = Field(..., description="报名者显示名称")
    character_name: str = Field(default="", description="角色显示名称")
    xinfa: str = Field(..., min_length=1, description="心法")


class SignupBase(BaseModel):
    """报名基础模型"""
    signup_user_id: Optional[int] = Field(default=None, description="报名用户ID（可为null，表示系统外的人）")
    signup_character_id: Optional[int] = Field(default=None, description="报名角色ID（可为null，表示未录入系统的角色）")
    signup_info: SignupInfo = Field(..., description="报名信息")
    is_rich: bool = Field(default=False, description="是否老板")


class SignupCreate(SignupBase):
    """创建报名的请求模型"""
    pass


class SignupUpdate(BaseModel):
    """更新报名的请求模型"""
    signup_user_id: Optional[int] = Field(default=None, description="报名用户ID")
    signup_character_id: Optional[int] = Field(default=None, description="报名角色ID")
    signup_info: Optional[SignupInfo] = Field(default=None, description="报名信息")
    is_rich: Optional[bool] = Field(default=None, description="是否老板")


class SignupLockRequest(BaseModel):
    """锁定报名位置的请求模型"""
    slot_position: int = Field(..., ge=1, le=25, description="锁定位置（1-25）")


class SignupAbsentRequest(BaseModel):
    """标记缺席的请求模型"""
    is_absent: bool = Field(..., description="是否缺席")


class SignupOut(BaseModel):
    """报名的响应模型"""
    id: int
    team_id: int
    submitter_id: int
    signup_user_id: Optional[int] = None
    signup_character_id: Optional[int] = None
    signup_info: SignupInfo
    priority: int
    is_rich: bool
    is_proxy: bool
    slot_position: Optional[int] = None
    is_absent: bool
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
