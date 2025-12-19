"""
认证相关的Pydantic模型
"""
from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    """令牌响应模型"""
    access_token: str = Field(description="访问令牌")
    refresh_token: str = Field(description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")


class TokenPayload(BaseModel):
    """令牌负载模型"""
    sub: str = Field(description="主体（用户ID或管理员ID）")
    user_type: str = Field(description="用户类型: user/admin")
    exp: Optional[int] = Field(default=None, description="过期时间")


class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str = Field(min_length=1, max_length=50, description="用户名或QQ号")
    password: str = Field(min_length=6, max_length=50, description="密码")


class RegisterRequest(BaseModel):
    """用户注册请求模型"""
    qq_number: str = Field(min_length=5, max_length=20, description="QQ号")
    password: str = Field(min_length=6, max_length=50, description="密码")
    nickname: str = Field(min_length=1, max_length=50, description="昵称")


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求模型"""
    refresh_token: str = Field(description="刷新令牌")


class UserInfo(BaseModel):
    """用户信息响应模型"""
    id: int = Field(description="用户ID")
    qq_number: str = Field(description="QQ号")
    nickname: str = Field(description="昵称")
    avatar: Optional[str] = Field(default=None, description="头像URL")
    other_nicknames: Optional[list[str]] = Field(default=None, description="其他昵称")

    class Config:
        from_attributes = True


class AdminInfo(BaseModel):
    """管理员信息响应模型"""
    id: int = Field(description="管理员ID")
    username: str = Field(description="用户名")

    class Config:
        from_attributes = True
