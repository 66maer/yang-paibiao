"""
管理员 - Bot管理接口
"""
import secrets
import math
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.api.deps import get_current_admin
from app.models.admin import SystemAdmin
from app.models.bot import Bot, BotGuild
from app.models.guild import Guild
from app.schemas.bot import (
    BotCreateRequest,
    BotCreateResponse,
    BotUpdateRequest,
    BotDetailResponse,
    BotListItem,
    BotListResponse,
    BotAuthorizeGuildRequest,
    BotRegenerateKeyResponse,
    BotGuildInfo
)
from app.schemas.common import ResponseModel
from app.core.security import get_password_hash

router = APIRouter()


def generate_bot_api_key(bot_name: str) -> str:
    """生成Bot API Key"""
    random_part = secrets.token_urlsafe(32)
    return f"bot_{bot_name}_{random_part}"


@router.post("", response_model=ResponseModel[BotCreateResponse])
async def create_bot(
    payload: BotCreateRequest,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    创建Bot

    - 生成唯一的API Key
    - API Key只返回一次，请妥善保管
    """
    # 检查bot_name是否已存在
    existing = await db.execute(
        select(Bot).where(Bot.bot_name == payload.bot_name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bot名称 {payload.bot_name} 已存在"
        )

    # 生成API Key
    api_key = generate_bot_api_key(payload.bot_name)

    # 创建Bot
    bot = Bot(
        bot_name=payload.bot_name,
        api_key_hash=get_password_hash(api_key),
        description=payload.description,
        is_active=True
    )
    db.add(bot)
    await db.commit()
    await db.refresh(bot)

    return ResponseModel(
        data=BotCreateResponse(
            id=bot.id,
            bot_name=bot.bot_name,
            api_key=api_key,  # 只返回一次！
            description=bot.description,
            is_active=bot.is_active,
            created_at=bot.created_at
        ),
        message="Bot创建成功，请妥善保管API Key"
    )


@router.get("", response_model=ResponseModel[BotListResponse])
async def list_bots(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索Bot名称"),
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    查询Bot列表

    - 支持分页和搜索
    """
    # 构建查询
    query = select(Bot)

    if search:
        query = query.where(Bot.bot_name.ilike(f"%{search}%"))

    # 计算总数
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar()

    # 分页查询
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Bot.created_at.desc())

    result = await db.execute(query)
    bots = result.scalars().all()

    # 查询每个Bot的授权群组数量
    items = []
    for bot in bots:
        guild_count_result = await db.execute(
            select(func.count()).select_from(BotGuild).where(BotGuild.bot_id == bot.id)
        )
        guild_count = guild_count_result.scalar()

        items.append(BotListItem(
            id=bot.id,
            bot_name=bot.bot_name,
            description=bot.description,
            is_active=bot.is_active,
            created_at=bot.created_at,
            last_used_at=bot.last_used_at,
            guild_count=guild_count
        ))

    return ResponseModel(data=BotListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0
    ))


@router.get("/{bot_id}", response_model=ResponseModel[BotDetailResponse])
async def get_bot_detail(
    bot_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    查询Bot详情

    - 包含授权的群组列表
    """
    # 查询Bot
    bot_result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = bot_result.scalar_one_or_none()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot不存在"
        )

    # 查询授权的群组
    guild_result = await db.execute(
        select(BotGuild, Guild)
        .join(Guild, BotGuild.guild_id == Guild.id)
        .where(BotGuild.bot_id == bot_id, Guild.deleted_at.is_(None))
    )
    guild_rows = guild_result.all()

    authorized_guilds = [
        BotGuildInfo(
            guild_id=guild.id,
            guild_name=guild.name,
            created_at=bot_guild.created_at
        )
        for bot_guild, guild in guild_rows
    ]

    return ResponseModel(data=BotDetailResponse(
        id=bot.id,
        bot_name=bot.bot_name,
        description=bot.description,
        is_active=bot.is_active,
        created_at=bot.created_at,
        updated_at=bot.updated_at,
        last_used_at=bot.last_used_at,
        authorized_guilds=authorized_guilds
    ))


@router.put("/{bot_id}", response_model=ResponseModel)
async def update_bot(
    bot_id: int,
    payload: BotUpdateRequest,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新Bot

    - 可更新描述和激活状态
    """
    # 查询Bot
    bot_result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = bot_result.scalar_one_or_none()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot不存在"
        )

    # 更新字段
    if payload.description is not None:
        bot.description = payload.description
    if payload.is_active is not None:
        bot.is_active = payload.is_active

    await db.commit()

    return ResponseModel(message="Bot更新成功")


@router.delete("/{bot_id}", response_model=ResponseModel)
async def delete_bot(
    bot_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    删除Bot

    - 级联删除bot_guilds记录
    """
    # 查询Bot
    bot_result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = bot_result.scalar_one_or_none()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot不存在"
        )

    # 删除Bot（会级联删除bot_guilds）
    await db.delete(bot)
    await db.commit()

    return ResponseModel(message="Bot删除成功")


@router.post("/{bot_id}/authorize-guild", response_model=ResponseModel)
async def authorize_guild(
    bot_id: int,
    payload: BotAuthorizeGuildRequest,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    授权Bot访问群组
    """
    # 检查Bot存在
    bot_result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = bot_result.scalar_one_or_none()
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot不存在"
        )

    # 检查群组存在
    guild_result = await db.execute(
        select(Guild).where(Guild.id == payload.guild_id, Guild.deleted_at.is_(None))
    )
    guild = guild_result.scalar_one_or_none()
    if not guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="群组不存在"
        )

    # 检查是否已授权
    existing = await db.execute(
        select(BotGuild).where(
            BotGuild.bot_id == bot_id,
            BotGuild.guild_id == payload.guild_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已授权，无需重复操作"
        )

    # 创建授权
    bot_guild = BotGuild(
        bot_id=bot_id,
        guild_id=payload.guild_id,
        created_by=current_admin.id
    )
    db.add(bot_guild)
    await db.commit()

    return ResponseModel(message=f"已授权Bot {bot.bot_name} 访问群组 {guild.name}")


@router.delete("/{bot_id}/guilds/{guild_id}", response_model=ResponseModel)
async def revoke_guild_authorization(
    bot_id: int,
    guild_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    取消Bot对群组的授权
    """
    # 检查授权是否存在
    result = await db.execute(
        select(BotGuild).where(
            BotGuild.bot_id == bot_id,
            BotGuild.guild_id == guild_id
        )
    )
    bot_guild = result.scalar_one_or_none()

    if not bot_guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="授权不存在"
        )

    # 删除授权
    await db.delete(bot_guild)
    await db.commit()

    return ResponseModel(message="授权已取消")


@router.post("/{bot_id}/regenerate-key", response_model=ResponseModel[BotRegenerateKeyResponse])
async def regenerate_api_key(
    bot_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    重新生成API Key

    - 旧的API Key将立即失效
    - 新的API Key只返回一次
    """
    # 查询Bot
    bot_result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = bot_result.scalar_one_or_none()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot不存在"
        )

    # 生成新的API Key
    api_key = generate_bot_api_key(bot.bot_name)

    # 更新API Key哈希
    bot.api_key_hash = get_password_hash(api_key)
    bot.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(bot)

    return ResponseModel(
        data=BotRegenerateKeyResponse(
            api_key=api_key,  # 只返回一次！
            updated_at=bot.updated_at
        ),
        message="API Key已重新生成，请妥善保管"
    )
