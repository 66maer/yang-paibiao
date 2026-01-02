"""
用户相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.utils.nickname_validator import validate_nickname_raise


class UserRegister(BaseModel):
    """用户注册请求"""
    qq_number: str = Field(..., min_length=5, max_length=20, description="QQ号")
    password: str = Field(..., min_length=6, max_length=50, description="密码")
    nickname: str = Field(..., min_length=1, max_length=6, description="昵称（最多6个字符）")
    
    @field_validator('qq_number')
    @classmethod
    def validate_qq_number(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('QQ号必须是纯数字')
        return v
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        return validate_nickname_raise(v)


class AdminUserCreate(BaseModel):
    """管理员创建用户请求"""
    qq_number: str = Field(..., min_length=5, max_length=20, description="QQ号")
    password: str = Field(..., min_length=6, max_length=50, description="密码")
    nickname: str = Field(..., min_length=1, max_length=6, description="昵称（最多6个字符）")
    other_nicknames: Optional[List[str]] = Field(None, description="其他昵称")
    avatar: Optional[str] = Field(None, max_length=255, description="头像URL")
    
    @field_validator('qq_number')
    @classmethod
    def validate_qq_number(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('QQ号必须是纯数字')
        return v
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        return validate_nickname_raise(v)
    
    @field_validator('other_nicknames')
    @classmethod
    def validate_other_nicknames(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            return [validate_nickname_raise(nickname) for nickname in v]
        return v


class UserLogin(BaseModel):
    """用户登录请求"""
    qq_number: str = Field(..., description="QQ号")
    password: str = Field(..., description="密码")


class UserUpdate(BaseModel):
    """用户更新请求"""
    nickname: Optional[str] = Field(None, min_length=1, max_length=6, description="昵称（最多6个字符）")
    other_nicknames: Optional[List[str]] = Field(None, description="其他昵称")
    avatar: Optional[str] = Field(None, max_length=255, description="头像URL")
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_nickname_raise(v)
        return v
    
    @field_validator('other_nicknames')
    @classmethod
    def validate_other_nicknames(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is not None:
            return [validate_nickname_raise(nickname) for nickname in v]
        return v


class UserChangePassword(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=50, description="新密码")


class UserResponse(BaseModel):
    """用户响应"""
    id: int
    qq_number: str
    nickname: str
    other_nicknames: Optional[List[str]] = None
    avatar: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class UserLoginResponse(BaseModel):
    """用户登录响应"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UserListResponse(BaseModel):
    """用户列表响应"""
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserGuildItem(BaseModel):
    """当前用户的群组条目"""
    id: int
    name: str
    server_name: str
    role: str
    guild_nickname: str | None = None
    qq_group_id: str | None = None
    joined_at: datetime | None = None

    model_config = {"from_attributes": True}
