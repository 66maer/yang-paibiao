"""
角色相关的 Pydantic 模型
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class CharacterCreate(BaseModel):
    """创建角色请求"""
    name: str = Field(..., min_length=1, max_length=50, description="角色名")
    server: str = Field(..., min_length=1, max_length=30, description="服务器")
    xinfa: str = Field(..., min_length=1, max_length=20, description="心法")
    remark: Optional[str] = Field(None, description="备注")


class CharacterUpdate(BaseModel):
    """更新角色请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="角色名")
    server: Optional[str] = Field(None, min_length=1, max_length=30, description="服务器")
    xinfa: Optional[str] = Field(None, min_length=1, max_length=20, description="心法")
    remark: Optional[str] = Field(None, description="备注")


class CharacterPlayerCreate(BaseModel):
    """添加角色玩家关联请求"""
    user_id: int = Field(..., description="用户ID")
    relation_type: str = Field(default="owner", description="关系类型: owner(主人), shared(共享)")
    priority: int = Field(default=0, description="优先级，数值越小优先级越高")
    notes: Optional[str] = Field(None, description="备注")
    
    @field_validator('relation_type')
    @classmethod
    def validate_relation_type(cls, v: str) -> str:
        if v not in ['owner', 'shared']:
            raise ValueError('关系类型必须是 owner 或 shared')
        return v


class CharacterPlayerUpdate(BaseModel):
    """更新角色玩家关联请求"""
    relation_type: Optional[str] = Field(None, description="关系类型: owner(主人), shared(共享)")
    priority: Optional[int] = Field(None, description="优先级")
    notes: Optional[str] = Field(None, description="备注")
    
    @field_validator('relation_type')
    @classmethod
    def validate_relation_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['owner', 'shared']:
            raise ValueError('关系类型必须是 owner 或 shared')
        return v


class UserSimple(BaseModel):
    """用户简要信息"""
    id: int
    qq_number: str
    nickname: str
    
    model_config = {"from_attributes": True}


class CharacterPlayerResponse(BaseModel):
    """角色玩家关联响应"""
    id: int
    user_id: int
    relation_type: str
    priority: int
    notes: Optional[str] = None
    user: Optional[UserSimple] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class CharacterResponse(BaseModel):
    """角色响应"""
    id: int
    name: str
    server: str
    xinfa: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    players: Optional[List[CharacterPlayerResponse]] = None
    
    model_config = {"from_attributes": True}


class CharacterListResponse(BaseModel):
    """角色列表响应"""
    items: List[CharacterResponse]
    total: int
    page: int
    page_size: int
    pages: int
