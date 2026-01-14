"""
报名相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SignupInfo(BaseModel):
    """报名信息"""
    submitter_name: str = Field(..., description="提交者显示名称")
    submitter_qq_number: Optional[str] = Field(default=None, description="提交者QQ号")
    player_name: str = Field(..., description="报名者显示名称")
    player_qq_number: Optional[str] = Field(default=None, description="报名者QQ号")
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
    slot_position: int = Field(..., ge=0, le=24, description="锁定位置（0-24）")


class SignupPresenceRequest(BaseModel):
    """标记到场状态的请求模型"""
    presence_status: Optional[str] = Field(None, description="到场状态: ready(就绪)/absent(缺席)/null(空)")


class SignupAssignRequest(BaseModel):
    """排表模式分配坑位的请求模型"""
    signup_id: int = Field(..., description="报名ID")
    slot_position: int = Field(..., ge=0, le=24, description="坑位位置（0-24）")


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
    slot_position: Optional[int] = Field(default=None, description="锁定位置（已废弃，使用allocation_result）")
    presence_status: Optional[str] = Field(default=None, description="到场状态: ready(就绪)/absent(缺席)/null(空)")
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    edit_count: int = Field(default=0, description="编辑次数")
    created_at: datetime
    updated_at: Optional[datetime] = None
    # 分配结果（可选，由API填充）
    allocation_status: Optional[str] = Field(default=None, description="分配状态: allocated/waitlist/unallocated")
    allocated_slot: Optional[int] = Field(default=None, description="已分配的坑位索引(0-24)")
    waitlist_position: Optional[int] = Field(default=None, description="候补位置(0-based)")

    model_config = {
        "from_attributes": True
    }
