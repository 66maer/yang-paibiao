"""
群组相关的 Pydantic 模型
"""
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from app.utils.nickname_validator import validate_nickname_raise


# ============ 订阅相关 Schemas ============

class SubscriptionBase(BaseModel):
    """订阅基础模型"""
    start_date: date = Field(..., description="订阅开始日期")
    end_date: date = Field(..., description="订阅结束日期")
    features: Dict[str, Any] = Field(default_factory=dict, description="订阅功能配置")
    notes: Optional[str] = Field(None, description="备注信息")


class SubscriptionCreate(SubscriptionBase):
    """创建订阅"""
    guild_id: int = Field(..., description="群组ID")


class SubscriptionUpdate(BaseModel):
    """更新订阅"""
    end_date: Optional[date] = None
    features: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    """订阅响应模型"""
    id: int
    guild_id: int
    is_active: bool = Field(..., description="是否有效")
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubscriptionWithGuild(SubscriptionResponse):
    """带群组信息的订阅响应"""
    guild_name: str = Field(..., description="群组名称")
    guild_qq_number: str = Field(..., description="群QQ号")


# ============ 群组相关 Schemas ============

class GuildOwner(BaseModel):
    """群主信息"""
    id: int
    qq_number: str
    nickname: str

    class Config:
        from_attributes = True


class GuildBase(BaseModel):
    """群组基础模型"""
    guild_qq_number: str = Field(..., min_length=5, max_length=20, description="群QQ号")
    ukey: str = Field(..., min_length=1, max_length=20, description="群组唯一标识")
    name: str = Field(..., min_length=1, max_length=50, description="群组名称")
    server: str = Field(..., min_length=1, max_length=30, description="游戏服务器")
    avatar: Optional[str] = Field(None, max_length=255, description="群组头像URL")
    description: Optional[str] = Field(None, description="群组描述")


class GuildCreate(GuildBase):
    """创建群组"""
    owner_qq_number: str = Field(..., description="群主QQ号")
    subscription: Optional[SubscriptionBase] = Field(None, description="初始订阅信息")


class GuildUpdate(BaseModel):
    """更新群组"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    server: Optional[str] = Field(None, min_length=1, max_length=30)
    avatar: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class GuildTransferOwner(BaseModel):
    """转让群主"""
    new_owner_qq_number: str = Field(..., description="新群主QQ号")


class GuildSubscriptionInfo(BaseModel):
    """群组订阅简要信息"""
    is_active: bool
    end_date: Optional[date] = None

    class Config:
        from_attributes = True


class GuildListItem(GuildBase):
    """群组列表项"""
    id: int
    owner: GuildOwner
    subscription: Optional[GuildSubscriptionInfo] = None
    member_count: int = Field(default=0, description="成员数量")
    created_at: datetime

    class Config:
        from_attributes = True


class GuildDetail(GuildBase):
    """群组详情"""
    id: int
    owner: GuildOwner
    preferences: Dict[str, Any] = Field(default_factory=dict)
    current_subscription: Optional[SubscriptionResponse] = None
    subscription_history: List[SubscriptionResponse] = Field(default_factory=list)
    stats: Dict[str, int] = Field(default_factory=dict, description="统计信息")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GuildCreateResponse(BaseModel):
    """创建群组响应"""
    guild: GuildDetail
    subscription: Optional[SubscriptionResponse] = None


# ============ 群组成员相关 Schemas ============

class GuildMemberUser(BaseModel):
    """成员用户信息"""
    id: int
    qq_number: str
    nickname: str
    other_nicknames: Optional[List[str]] = Field(None, description="其他昵称（用于搜索）")
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class GuildMemberInfo(BaseModel):
    """群组成员信息"""
    id: int
    user_id: int
    role: str = Field(..., description="角色: owner, helper, member")
    group_nickname: Optional[str] = Field(None, description="群内昵称")
    joined_at: datetime
    user: GuildMemberUser

    class Config:
        from_attributes = True


class UpdateMemberRole(BaseModel):
    """更新成员角色"""
    role: str = Field(..., description="角色: owner, helper, member")

    @classmethod
    def model_validate(cls, value):
        if isinstance(value, dict) and 'role' in value:
            if value['role'] not in ['owner', 'helper', 'member']:
                raise ValueError('role必须是owner、helper或member之一')
        return super().model_validate(value)


class UpdateMemberNickname(BaseModel):
    """更新成员群昵称"""
    group_nickname: Optional[str] = Field(None, description="群内昵称")
