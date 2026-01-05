"""
Bot API的Schema定义
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.utils.nickname_validator import validate_nickname_raise


# ============ 成员管理 ============

class BotMemberAdd(BaseModel):
    """批量添加成员 - 单个成员信息"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    nickname: str = Field(..., min_length=1, max_length=6, description="昵称（最多6个字符）")
    group_nickname: Optional[str] = Field(None, max_length=6, description="群内昵称（最多6个字符）")
    
    @field_validator('nickname', 'group_nickname')
    @classmethod
    def validate_nicknames(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_nickname_raise(v)
        return v


class BotAddMembersRequest(BaseModel):
    """批量添加成员请求"""
    members: List[BotMemberAdd] = Field(..., min_items=1, max_items=100, description="成员列表")


class BotMemberResult(BaseModel):
    """批量操作单个成员结果"""
    qq_number: str = Field(..., description="QQ号")
    status: str = Field(..., description="状态: created_and_added/added/re_added/already_member/error")
    user_id: Optional[int] = Field(None, description="用户ID")
    message: str = Field(..., description="结果消息")


class BotAddMembersResponse(BaseModel):
    """批量添加成员响应"""
    success_count: int = Field(..., description="成功数量")
    failed_count: int = Field(..., description="失败数量")
    results: List[BotMemberResult] = Field(..., description="详细结果")


class BotRemoveMembersRequest(BaseModel):
    """批量移除成员请求"""
    qq_numbers: List[str] = Field(..., min_items=1, max_items=100, description="QQ号列表")


class BotRemoveResult(BaseModel):
    """批量移除单个成员结果"""
    qq_number: str = Field(..., description="QQ号")
    status: str = Field(..., description="状态: removed/not_member/owner_cannot_remove/error")
    message: str = Field(..., description="结果消息")


class BotRemoveMembersResponse(BaseModel):
    """批量移除成员响应"""
    success_count: int = Field(..., description="成功数量")
    failed_count: int = Field(..., description="失败数量")
    results: List[BotRemoveResult] = Field(..., description="详细结果")


class BotUpdateNicknameRequest(BaseModel):
    """修改群昵称请求"""
    group_nickname: str = Field(..., max_length=6, description="群内昵称（最多6个字符）")
    
    @field_validator('group_nickname')
    @classmethod
    def validate_group_nickname(cls, v: str) -> str:
        return validate_nickname_raise(v)


class BotMemberInfo(BaseModel):
    """成员信息"""
    user_id: int = Field(..., description="用户ID")
    qq_number: str = Field(..., description="QQ号")
    nickname: str = Field(..., description="昵称")
    group_nickname: Optional[str] = Field(None, description="群内昵称")
    other_nickname: Optional[str] = Field(None, description="其他昵称")

    class Config:
        from_attributes = True


class BotMemberSearchResponse(BaseModel):
    """成员搜索响应"""
    members: List[BotMemberInfo] = Field(..., description="匹配的成员列表")


# ============ 团队查询 ============

class BotTeamSimple(BaseModel):
    """团队简要信息"""
    id: int = Field(..., description="团队ID")
    guild_id: int = Field(..., description="群组ID")
    title: str = Field(..., description="团队标题")
    team_time: datetime = Field(..., description="开团时间")
    dungeon: str = Field(..., description="副本名称")
    max_members: int = Field(..., description="最大成员数")
    status: str = Field(..., description="状态")
    created_at: datetime = Field(..., description="创建时间")
    # 报名统计
    signup_count: int = Field(0, description="当前报名人数")
    cancelled_count: int = Field(0, description="已取消报名人数")
    total_signup_count: int = Field(0, description="总报名数（包含已取消）")
    # 缓存用时间戳（团队更新时间和最新报名时间的最大值）
    latest_change_at: datetime = Field(..., description="最新变更时间")

    class Config:
        from_attributes = True


class BotSignupDetail(BaseModel):
    """报名详情"""
    id: int = Field(..., description="报名ID")
    submitter_id: int = Field(..., description="提交者ID")
    submitter_name: str = Field(..., description="提交者显示名称")
    signup_user_id: Optional[int] = Field(None, description="报名用户ID")
    signup_info: dict = Field(..., description="报名信息")
    priority: int = Field(..., description="优先级")
    is_rich: bool = Field(..., description="是否老板")
    is_proxy: bool = Field(..., description="是否代报")
    slot_position: Optional[int] = Field(None, description="坑位位置")
    presence_status: Optional[str] = Field(None, description="到场状态")
    created_at: datetime = Field(..., description="报名时间")


class BotTeamDetail(BaseModel):
    """团队详细信息（用于截图）"""
    id: int = Field(..., description="团队ID")
    guild_id: int = Field(..., description="群组ID")
    creator_id: int = Field(..., description="创建者ID")
    creator_name: str = Field(..., description="创建者显示名称")
    title: str = Field(..., description="团队标题")
    team_time: datetime = Field(..., description="开团时间")
    dungeon: str = Field(..., description="副本名称")
    max_members: int = Field(..., description="最大成员数")
    is_xuanjing_booked: bool = Field(..., description="是否预定玄晶")
    is_yuntie_booked: bool = Field(..., description="是否预定陨铁")
    is_hidden: bool = Field(..., description="是否隐藏")
    is_locked: bool = Field(..., description="是否锁定")
    status: str = Field(..., description="状态")
    notice: Optional[str] = Field(None, description="团队告示")
    rules: List[dict] = Field(..., description="团队规则")
    slot_view: Optional[List[int]] = Field(None, description="坑位视图")
    signups: List[BotSignupDetail] = Field(default=[], description="报名列表")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    # 报名统计
    signup_count: int = Field(0, description="当前报名人数")
    cancelled_count: int = Field(0, description="已取消报名人数")
    total_signup_count: int = Field(0, description="总报名数（包含已取消）")
    # 缓存用时间戳（团队更新时间和最新报名时间的最大值）
    latest_change_at: datetime = Field(..., description="最新变更时间")


# ============ 报名管理 ============

class BotSignupRequest(BaseModel):
    """报名请求"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    character_id: Optional[int] = Field(None, description="角色ID（优先使用）")
    character_name: Optional[str] = Field(None, max_length=50, description="角色名称")
    xinfa: str = Field(..., min_length=1, max_length=20, description="心法")
    is_rich: bool = Field(default=False, description="是否老板")


class BotCancelSignupRequest(BaseModel):
    """取消报名请求"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    signup_id: Optional[int] = Field(None, description="报名ID（用于精确取消）")
    character_id: Optional[int] = Field(None, description="角色ID（用于精确取消）")


class BotSignupInfo(BaseModel):
    """用户报名信息"""
    id: int = Field(..., description="报名ID")
    team_id: int = Field(..., description="团队ID")
    submitter_id: int = Field(..., description="提交者ID")
    signup_user_id: int = Field(..., description="报名用户ID")
    signup_character_id: Optional[int] = Field(None, description="报名角色ID")
    signup_info: dict = Field(..., description="报名信息")
    is_rich: bool = Field(..., description="是否老板")
    created_at: datetime = Field(..., description="报名时间")

    class Config:
        from_attributes = True


class BotUserSignupsResponse(BaseModel):
    """用户报名列表响应"""
    signups: List[BotSignupInfo] = Field(..., description="报名列表")


# ============ 角色管理 ============

class BotCreateCharacterRequest(BaseModel):
    """创建角色请求"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    name: str = Field(..., min_length=1, max_length=50, description="角色名")
    server: Optional[str] = Field(None, min_length=1, max_length=30, description="服务器（若不提供则使用群组服务器）")
    xinfa: str = Field(..., min_length=1, max_length=20, description="心法")
    relation_type: str = Field(default="owner", pattern=r'^(owner|shared)$', description="关系类型")


class BotCharacterSimple(BaseModel):
    """角色简要信息"""
    id: int = Field(..., description="角色ID")
    user_id: int = Field(..., description="用户ID")
    name: str = Field(..., description="角色名")
    server: str = Field(..., description="服务器")
    xinfa: str = Field(..., description="心法")
    relation_type: str = Field(..., description="关系类型")
    priority: Optional[int] = Field(None, description="优先级")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    cd_status: Optional[dict] = Field(None, description="本周CD状态 {dungeon_name: is_cleared}")

    class Config:
        from_attributes = True


class BotCharacterListResponse(BaseModel):
    """角色列表响应"""
    characters: List[BotCharacterSimple] = Field(..., description="角色列表")


# ============ 管理员 - Bot管理 ============

class BotCreateRequest(BaseModel):
    """创建Bot请求"""
    bot_name: str = Field(..., min_length=1, max_length=50, pattern=r'^[a-zA-Z0-9_]+$', description="Bot名称（字母、数字、下划线）")
    description: Optional[str] = Field(None, description="Bot描述")


class BotCreateResponse(BaseModel):
    """创建Bot响应"""
    id: int = Field(..., description="Bot ID")
    bot_name: str = Field(..., description="Bot名称")
    api_key: str = Field(..., description="API Key（只返回一次）")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")

    class Config:
        from_attributes = True


class BotUpdateRequest(BaseModel):
    """更新Bot请求"""
    description: Optional[str] = Field(None, description="描述")
    is_active: Optional[bool] = Field(None, description="是否激活")


class BotGuildInfo(BaseModel):
    """Bot授权的群组信息"""
    guild_id: int = Field(..., description="群组ID")
    guild_name: str = Field(..., description="群组名称")
    created_at: datetime = Field(..., description="授权时间")

    class Config:
        from_attributes = True


class BotDetailResponse(BaseModel):
    """Bot详情响应"""
    id: int = Field(..., description="Bot ID")
    bot_name: str = Field(..., description="Bot名称")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    last_used_at: Optional[datetime] = Field(None, description="最后使用时间")
    authorized_guilds: List[BotGuildInfo] = Field(default=[], description="授权的群组列表")

    class Config:
        from_attributes = True


class BotListItem(BaseModel):
    """Bot列表项"""
    id: int = Field(..., description="Bot ID")
    bot_name: str = Field(..., description="Bot名称")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")
    last_used_at: Optional[datetime] = Field(None, description="最后使用时间")
    guild_count: int = Field(default=0, description="授权群组数量")

    class Config:
        from_attributes = True


class BotListResponse(BaseModel):
    """Bot列表响应"""
    items: List[BotListItem] = Field(..., description="Bot列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    pages: int = Field(..., description="总页数")


class BotAuthorizeGuildRequest(BaseModel):
    """授权群组请求"""
    guild_id: int = Field(..., description="群组ID")


class BotRegenerateKeyResponse(BaseModel):
    """重新生成API Key响应"""
    api_key: str = Field(..., description="新的API Key（只返回一次）")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True
