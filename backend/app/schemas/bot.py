"""
Bot API的Schema定义
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ============ 成员管理 ============

class BotMemberAdd(BaseModel):
    """批量添加成员 - 单个成员信息"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    nickname: str = Field(..., min_length=1, max_length=50, description="昵称")
    group_nickname: Optional[str] = Field(None, max_length=50, description="群内昵称")


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
    group_nickname: str = Field(..., max_length=50, description="群内昵称")


# ============ 团队查询 ============

class BotTeamSimple(BaseModel):
    """团队简要信息"""
    id: int = Field(..., description="团队ID")
    title: str = Field(..., description="团队标题")
    team_time: datetime = Field(..., description="开团时间")
    dungeon: str = Field(..., description="副本名称")
    max_members: int = Field(..., description="最大成员数")
    status: str = Field(..., description="状态")
    created_at: datetime = Field(..., description="创建时间")

    class Config:
        from_attributes = True


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


# ============ 角色管理 ============

class BotCreateCharacterRequest(BaseModel):
    """创建角色请求"""
    qq_number: str = Field(..., pattern=r'^\d{5,15}$', description="QQ号")
    name: str = Field(..., min_length=1, max_length=50, description="角色名")
    server: str = Field(..., min_length=1, max_length=30, description="服务器")
    xinfa: str = Field(..., min_length=1, max_length=20, description="心法")
    relation_type: str = Field(default="owner", pattern=r'^(owner|shared)$', description="关系类型")


class BotCharacterSimple(BaseModel):
    """角色简要信息"""
    id: int = Field(..., description="角色ID")
    name: str = Field(..., description="角色名")
    server: str = Field(..., description="服务器")
    xinfa: str = Field(..., description="心法")
    relation_type: str = Field(..., description="关系类型")

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
