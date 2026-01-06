"""API 数据模型"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class TeamInfo(BaseModel):
    """团队信息"""
    id: int
    guild_id: int
    title: str
    team_time: datetime
    dungeon: str
    max_members: int
    status: str
    created_at: datetime
    # 报名统计
    signup_count: int = 0
    cancelled_count: int = 0
    total_signup_count: int = 0
    # 最新变更时间（用于缓存）
    latest_change_at: datetime


class SignupRequest(BaseModel):
    """
    报名请求
    
    支持三种模式：
    1. 自己报名：qq_number 为报名者 QQ，is_proxy=False
    2. 代他人报名：qq_number 为提交者 QQ，is_proxy=True，player_name 为被报名者昵称
    3. 登记老板：qq_number 为提交者 QQ，is_proxy=True，is_rich=True，player_name 为老板昵称
    """
    qq_number: str  # 提交者的 QQ 号
    xinfa: str  # 心法 key（必填）
    character_id: Optional[int] = None  # 角色 ID（可选，用于自己报名时匹配角色）
    character_name: Optional[str] = None  # 角色名（可选）
    is_rich: bool = False  # 是否老板
    is_proxy: bool = False  # 是否代报名
    player_name: Optional[str] = None  # 被报名者/老板的昵称（代报名时必填）


class SignupInfo(BaseModel):
    """报名信息"""
    id: int
    team_id: int
    submitter_id: int
    signup_user_id: Optional[int] = None  # 可能为空（代报名时）
    signup_character_id: Optional[int] = None
    signup_info: Dict[str, Any]
    is_rich: bool
    created_at: datetime


class CharacterInfo(BaseModel):
    """角色信息"""
    id: int
    user_id: int
    name: str
    server: str
    xinfa: str
    relation_type: str
    priority: Optional[int] = None
    created_at: Optional[datetime] = None
    cd_status: Optional[Dict[str, bool]] = None  # 本周CD状态 {dungeon_name: is_cleared}


class CharacterCreateRequest(BaseModel):
    """创建角色请求"""
    qq_number: str
    name: str
    xinfa: str
    server: Optional[str] = None  # 可选，后端会自动使用群组服务器
    relation_type: str = "owner"


class MemberInfo(BaseModel):
    """成员信息"""
    qq_number: str
    nickname: Optional[str] = None
    group_nickname: Optional[str] = None


class MemberBatchRequest(BaseModel):
    """批量添加成员请求"""
    members: List[MemberInfo]


class UserSearchResult(BaseModel):
    """用户搜索结果"""
    user_id: int
    qq_number: str
    nickname: Optional[str] = None
    group_nickname: Optional[str] = None
    other_nickname: Optional[str] = None


class UpdateNicknameRequest(BaseModel):
    """修改昵称请求"""
    new_nickname: str
