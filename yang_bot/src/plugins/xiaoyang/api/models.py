"""API 数据模型"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class TeamInfo(BaseModel):
    """团队信息"""
    id: int
    title: str
    team_time: datetime
    dungeon: str
    max_members: int
    status: str
    created_at: datetime


class SignupRequest(BaseModel):
    """报名请求"""
    qq_number: str
    character_id: Optional[int] = None
    character_name: Optional[str] = None
    xinfa: str
    is_rich: bool = False


class SignupInfo(BaseModel):
    """报名信息"""
    id: int
    team_id: int
    submitter_id: int
    signup_user_id: int
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
