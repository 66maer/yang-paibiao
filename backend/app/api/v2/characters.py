"""
角色管理接口
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_admin, get_db
from app.models.user import User
from app.models.admin import SystemAdmin
from app.models.character import Character, CharacterPlayer
from app.schemas.character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterPlayerCreate,
    CharacterPlayerUpdate,
    CharacterResponse,
    CharacterListResponse,
    CharacterPlayerResponse,
)
from app.schemas.common import ResponseModel

router = APIRouter(prefix="/characters", tags=["角色管理"])


@router.post("", response_model=ResponseModel[CharacterResponse], status_code=status.HTTP_201_CREATED)
async def create_character(
    character_data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建角色（用户）
    
    - **name**: 角色名
    - **server**: 服务器
    - **xinfa**: 心法
    - **remark**: 备注（可选）
    """
    # 检查角色名是否已存在（同一服务器）
    result = await db.execute(
        select(Character).where(
            Character.name == character_data.name,
            Character.server == character_data.server,
            Character.deleted_at.is_(None)
        )
    )
    existing_char = result.scalar_one_or_none()
    
    if existing_char:
        # 角色已存在，检查当前用户是否已与该角色有映射关系
        existing_relation = await db.execute(
            select(CharacterPlayer).where(
                CharacterPlayer.character_id == existing_char.id,
                CharacterPlayer.user_id == current_user.id
            )
        )
        char_player_relation = existing_relation.scalar_one_or_none()
        
        if char_player_relation:
            # 用户已与该角色有映射关系，直接返回现有关系
            character_to_return = existing_char
        else:
            # 创建新的用户-角色映射关系
            char_player = CharacterPlayer(
                character_id=existing_char.id,
                user_id=current_user.id,
                relation_type=character_data.relation_type,
                priority=character_data.priority
            )
            db.add(char_player)
            await db.commit()
            character_to_return = existing_char
    else:
        # 角色不存在，创建新角色
        new_character = Character(
            name=character_data.name,
            server=character_data.server,
            xinfa=character_data.xinfa,
            secondary_xinfas=character_data.secondary_xinfas,
            remark=character_data.remark,
        )
        db.add(new_character)
        await db.flush()  # 获取 ID
        
        # 创建角色-玩家关联（使用用户指定的关系类型）
        char_player = CharacterPlayer(
            character_id=new_character.id,
            user_id=current_user.id,
            relation_type=character_data.relation_type,
            priority=character_data.priority
        )
        db.add(char_player)
        
        await db.commit()
        await db.refresh(new_character)
        character_to_return = new_character
    
    # 加载关联数据（预加载players和user，避免N+1查询）
    result = await db.execute(
        select(Character)
        .options(
            selectinload(Character.players).selectinload(CharacterPlayer.user)
        )
        .where(Character.id == character_to_return.id)
    )
    character_with_players = result.scalar_one()
    
    return ResponseModel(data=CharacterResponse.model_validate(character_with_players))


@router.get("/my", response_model=ResponseModel[CharacterListResponse])
async def get_my_characters(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词（角色名或心法）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取我的角色列表（用户）
    
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认20，最大100）
    - **keyword**: 搜索关键词（可选）
    """
    # 构建查询 - 通过关联表查询
    query = (
        select(Character)
        .join(CharacterPlayer)
        .where(
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        )
    )
    
    # 关键词搜索
    if keyword:
        query = query.where(
            or_(
                Character.name.ilike(f"%{keyword}%"),
                Character.xinfa.ilike(f"%{keyword}%"),
            )
        )
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 分页查询并加载关联数据（预加载players和user，避免N+1查询）
    query = query.options(
        selectinload(Character.players).selectinload(CharacterPlayer.user)
    )
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


@router.get("/user/{user_id}", response_model=ResponseModel[CharacterListResponse])
async def get_user_characters(
    user_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词（角色名或心法）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取指定用户的角色列表（用户）
    
    - **user_id**: 用户ID
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认20，最大100）
    - **keyword**: 搜索关键词（可选）
    """
    # 构建查询 - 通过关联表查询指定用户的角色
    query = (
        select(Character)
        .join(CharacterPlayer)
        .where(
            CharacterPlayer.user_id == user_id,
            Character.deleted_at.is_(None)
        )
    )
    
    # 关键词搜索
    if keyword:
        query = query.where(
            or_(
                Character.name.ilike(f"%{keyword}%"),
                Character.xinfa.ilike(f"%{keyword}%"),
            )
        )
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 分页查询并加载关联数据（预加载players和user，避免N+1查询）
    query = query.options(
        selectinload(Character.players).selectinload(CharacterPlayer.user)
    )
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


@router.get("/{character_id}", response_model=ResponseModel[CharacterResponse])
async def get_character(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取角色详情（用户）"""
    # 查询角色并验证权限（预加载players和user，避免N+1查询）
    result = await db.execute(
        select(Character)
        .options(
            selectinload(Character.players).selectinload(CharacterPlayer.user)
        )
        .join(CharacterPlayer)
        .where(
            Character.id == character_id,
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        )
    )
    character = result.scalar_one_or_none()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在或无权访问"
        )
    
    return ResponseModel(data=CharacterResponse.model_validate(character))


@router.put("/{character_id}", response_model=ResponseModel[CharacterResponse])
async def update_character(
    character_id: int,
    character_data: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新角色信息（用户，所有关联用户都可以修改）"""
    # 查询角色并验证权限（只要用户关联了该角色即可）
    result = await db.execute(
        select(Character)
        .join(CharacterPlayer)
        .where(
            Character.id == character_id,
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在或无权修改"
        )
    
    # 如果修改了名称或服务器，检查是否重复
    if character_data.name or character_data.server:
        new_name = character_data.name or character.name
        new_server = character_data.server or character.server
        
        if new_name != character.name or new_server != character.server:
            result = await db.execute(
                select(Character).where(
                    Character.name == new_name,
                    Character.server == new_server,
                    Character.id != character_id,
                    Character.deleted_at.is_(None)
                )
            )
            existing_char = result.scalar_one_or_none()
            
            if existing_char:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"该服务器已存在名为 {new_name} 的角色"
                )
    
    # 更新字段
    if character_data.name is not None:
        character.name = character_data.name
    if character_data.server is not None:
        character.server = character_data.server
    if character_data.xinfa is not None:
        character.xinfa = character_data.xinfa
    if character_data.secondary_xinfas is not None:
        character.secondary_xinfas = character_data.secondary_xinfas
    if character_data.remark is not None:
        character.remark = character_data.remark
    
    character.updated_at = datetime.utcnow()
    await db.commit()
    
    # 重新加载关联数据（预加载players和user，避免N+1查询）
    result = await db.execute(
        select(Character)
        .options(
            selectinload(Character.players).selectinload(CharacterPlayer.user)
        )
        .where(Character.id == character_id)
    )
    character = result.scalar_one()
    
    return ResponseModel(data=CharacterResponse.model_validate(character))


@router.delete("/{character_id}", response_model=ResponseModel)
async def delete_character(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除角色关联（删除当前用户与角色的关联关系）"""
    # 查询角色-玩家关联
    result = await db.execute(
        select(CharacterPlayer)
        .join(Character)
        .where(
            CharacterPlayer.character_id == character_id,
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        )
    )
    char_player = result.scalar_one_or_none()

    if not char_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色关联不存在"
        )

    # 删除关联记录
    await db.delete(char_player)
    await db.commit()

    return ResponseModel(message="角色关联已删除")


@router.patch("/{character_id}/relation", response_model=ResponseModel[CharacterResponse])
async def update_character_relation(
    character_id: int,
    relation_data: CharacterPlayerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新角色关系类型（用户）"""
    # 查询角色-玩家关联
    result = await db.execute(
        select(CharacterPlayer)
        .join(Character)
        .where(
            CharacterPlayer.character_id == character_id,
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        )
    )
    char_player = result.scalar_one_or_none()

    if not char_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色关联不存在"
        )

    # 更新关系类型
    if relation_data.relation_type is not None:
        char_player.relation_type = relation_data.relation_type
    if relation_data.priority is not None:
        char_player.priority = relation_data.priority
    if relation_data.notes is not None:
        char_player.notes = relation_data.notes

    char_player.updated_at = datetime.utcnow()
    await db.commit()

    # 返回更新后的角色信息
    result = await db.execute(
        select(Character)
        .options(selectinload(Character.players))
        .where(Character.id == character_id)
    )
    character = result.scalar_one()

    return ResponseModel(data=CharacterResponse.model_validate(character))


# ==================== 管理员接口 ====================

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
    
    # 分页查询（预加载players和user，避免N+1查询）
    query = query.options(
        selectinload(Character.players).selectinload(CharacterPlayer.user)
    )
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
