"""
管理员角色管理接口
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_db
from app.models.admin import SystemAdmin
from app.models.character import Character, CharacterPlayer
from app.models.user import User
from app.schemas.character import (
    CharacterResponse,
    CharacterListResponse,
    CharacterPlayerCreate,
    CharacterPlayerResponse,
)
from app.schemas.common import ResponseModel

router = APIRouter()


@router.get("", response_model=ResponseModel[CharacterListResponse])
async def list_all_characters(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    server: Optional[str] = Query(None, description="服务器筛选"),
    xinfa: Optional[str] = Query(None, description="心法筛选"),
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有角色列表（管理员）
    
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认20，最大100）
    - **keyword**: 搜索关键词（可选）
    - **server**: 服务器筛选（可选）
    - **xinfa**: 心法筛选（可选）
    """
    # 构建查询
    query = select(Character).where(Character.deleted_at.is_(None))
    
    # 关键词搜索
    if keyword:
        query = query.where(
            or_(
                Character.name.ilike(f"%{keyword}%"),
                Character.server.ilike(f"%{keyword}%"),
                Character.xinfa.ilike(f"%{keyword}%"),
            )
        )
    
    # 服务器筛选
    if server:
        query = query.where(Character.server == server)
    
    # 心法筛选
    if xinfa:
        query = query.where(Character.xinfa == xinfa)
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 分页查询
    query = query.options(selectinload(Character.players))
    query = query.order_by(Character.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    characters = result.scalars().all()
    
    # 计算总页数
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return ResponseModel(data=CharacterListResponse(
        items=[CharacterResponse.model_validate(char) for char in characters],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    ))


@router.post("/{character_id}/players", response_model=ResponseModel[CharacterPlayerResponse], status_code=status.HTTP_201_CREATED)
async def add_character_player(
    character_id: int,
    player_data: CharacterPlayerCreate,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """添加角色玩家关联（管理员）"""
    # 检查角色是否存在
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.deleted_at.is_(None))
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )
    
    # 检查用户是否存在
    result = await db.execute(
        select(User).where(User.id == player_data.user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查关联是否已存在
    result = await db.execute(
        select(CharacterPlayer).where(
            CharacterPlayer.character_id == character_id,
            CharacterPlayer.user_id == player_data.user_id
        )
    )
    existing_relation = result.scalar_one_or_none()
    
    if existing_relation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户已关联此角色"
        )
    
    # 创建关联
    char_player = CharacterPlayer(
        character_id=character_id,
        user_id=player_data.user_id,
        relation_type=player_data.relation_type,
        priority=player_data.priority,
        notes=player_data.notes
    )
    db.add(char_player)
    await db.commit()
    await db.refresh(char_player)
    
    return ResponseModel(data=CharacterPlayerResponse.model_validate(char_player))


@router.delete("/{character_id}/players/{user_id}", response_model=ResponseModel)
async def remove_character_player(
    character_id: int,
    user_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """移除角色玩家关联（管理员）"""
    result = await db.execute(
        select(CharacterPlayer).where(
            CharacterPlayer.character_id == character_id,
            CharacterPlayer.user_id == user_id
        )
    )
    char_player = result.scalar_one_or_none()
    
    if not char_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="关联不存在"
        )
    
    await db.delete(char_player)
    await db.commit()
    
    return ResponseModel(message="关联移除成功")
