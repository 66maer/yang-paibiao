"""
管理员 - 群组管理接口
"""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models import Guild, Subscription, User
from app.schemas.common import PaginatedResponse
from app.schemas.guild import (
    GuildCreate,
    GuildUpdate,
    GuildTransferOwner,
    GuildListItem,
    GuildDetail,
    GuildCreateResponse,
    GuildOwner,
    GuildSubscriptionInfo,
    SubscriptionResponse,
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionWithGuild
)

router = APIRouter()


@router.get("", response_model=PaginatedResponse[GuildListItem])
async def list_guilds(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    ukey: Optional[str] = Query(None, description="群组ukey筛选"),
    guild_qq_number: Optional[str] = Query(None, description="群QQ号筛选"),
    server: Optional[str] = Query(None, description="服务器筛选"),
    status: str = Query("active", regex="^(active|deleted|all)$", description="状态筛选"),
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """获取所有群组列表（支持分页和过滤）"""
    
    # 构建查询
    query = select(Guild).options(
        selectinload(Guild.owner),
        selectinload(Guild.subscriptions)
    )
    
    # 状态过滤
    if status == "active":
        query = query.where(Guild.deleted_at.is_(None))
    elif status == "deleted":
        query = query.where(Guild.deleted_at.isnot(None))
    # status == "all" 不过滤
    
    # 其他过滤条件
    if ukey:
        query = query.where(Guild.ukey == ukey)
    if guild_qq_number:
        query = query.where(Guild.guild_qq_number == guild_qq_number)
    if server:
        query = query.where(Guild.server == server)
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # 分页
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Guild.created_at.desc())
    
    result = await db.execute(query)
    guilds = result.scalars().all()
    
    # 构建响应
    items = []
    for guild in guilds:
        # 获取当前有效订阅
        current_sub = None
        today = date.today()
        for sub in guild.subscriptions:
            if sub.start_date <= today <= sub.end_date:
                current_sub = GuildSubscriptionInfo(
                    is_active=True,
                    end_date=sub.end_date
                )
                break
        
        if not current_sub:
            current_sub = GuildSubscriptionInfo(is_active=False, end_date=None)
        
        items.append(GuildListItem(
            id=guild.id,
            guild_qq_number=guild.guild_qq_number,
            ukey=guild.ukey,
            name=guild.name,
            server=guild.server,
            avatar=guild.avatar,
            description=guild.description,
            owner=GuildOwner(
                id=guild.owner.id,
                qq_number=guild.owner.qq_number,
                nickname=guild.owner.nickname
            ),
            subscription=current_sub,
            member_count=0,  # TODO: 实现成员统计
            created_at=guild.created_at
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.post("", response_model=GuildCreateResponse)
async def create_guild(
    guild_data: GuildCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """创建新群组并分配给群主（可同时创建订阅）"""
    
    # 检查群QQ号是否已存在
    result = await db.execute(
        select(Guild).where(Guild.guild_qq_number == guild_data.guild_qq_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="群QQ号已存在")
    
    # 检查ukey是否已存在
    result = await db.execute(
        select(Guild).where(Guild.ukey == guild_data.ukey)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="群组ukey已存在")
    
    # 查找群主用户
    result = await db.execute(
        select(User).where(User.qq_number == guild_data.owner_qq_number)
    )
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="群主用户不存在")
    
    # 创建群组
    guild = Guild(
        guild_qq_number=guild_data.guild_qq_number,
        ukey=guild_data.ukey,
        name=guild_data.name,
        server=guild_data.server,
        avatar=guild_data.avatar,
        description=guild_data.description,
        owner_id=owner.id
    )
    db.add(guild)
    await db.flush()  # 获取 guild.id
    
    # 创建订阅（如果提供）
    subscription = None
    if guild_data.subscription:
        subscription = Subscription(
            guild_id=guild.id,
            start_date=guild_data.subscription.start_date,
            end_date=guild_data.subscription.end_date,
            features=guild_data.subscription.features,
            notes=guild_data.subscription.notes,
            created_by=current_admin.id
        )
        db.add(subscription)
    
    await db.commit()
    await db.refresh(guild)
    if subscription:
        await db.refresh(subscription)
    
    # 重新加载关系
    await db.refresh(guild, ["owner"])
    
    # 构建响应
    guild_detail = GuildDetail(
        id=guild.id,
        guild_qq_number=guild.guild_qq_number,
        ukey=guild.ukey,
        name=guild.name,
        server=guild.server,
        avatar=guild.avatar,
        description=guild.description,
        owner=GuildOwner(
            id=guild.owner.id,
            qq_number=guild.owner.qq_number,
            nickname=guild.owner.nickname
        ),
        preferences=guild.preferences or {},
        current_subscription=SubscriptionResponse.from_orm(subscription) if subscription else None,
        subscription_history=[],
        stats={"member_count": 0, "team_count": 0},
        created_at=guild.created_at,
        updated_at=guild.updated_at
    )
    
    return GuildCreateResponse(
        guild=guild_detail,
        subscription=SubscriptionResponse.from_orm(subscription) if subscription else None
    )


@router.get("/{guild_id}", response_model=GuildDetail)
async def get_guild(
    guild_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """获取群组的详细信息，包含订阅历史"""
    
    result = await db.execute(
        select(Guild)
        .options(selectinload(Guild.owner), selectinload(Guild.subscriptions))
        .where(Guild.id == guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    # 获取当前有效订阅
    today = date.today()
    current_sub = None
    for sub in guild.subscriptions:
        if sub.start_date <= today <= sub.end_date:
            current_sub = SubscriptionResponse.from_orm(sub)
            break
    
    # 订阅历史
    sub_history = [SubscriptionResponse.from_orm(sub) for sub in guild.subscriptions]
    sub_history.sort(key=lambda x: x.start_date, reverse=True)
    
    return GuildDetail(
        id=guild.id,
        guild_qq_number=guild.guild_qq_number,
        ukey=guild.ukey,
        name=guild.name,
        server=guild.server,
        avatar=guild.avatar,
        description=guild.description,
        owner=GuildOwner(
            id=guild.owner.id,
            qq_number=guild.owner.qq_number,
            nickname=guild.owner.nickname
        ),
        preferences=guild.preferences or {},
        current_subscription=current_sub,
        subscription_history=sub_history,
        stats={"member_count": 0, "team_count": 0},  # TODO: 实现统计
        created_at=guild.created_at,
        updated_at=guild.updated_at
    )


@router.put("/{guild_id}", response_model=GuildDetail)
async def update_guild(
    guild_id: int,
    guild_data: GuildUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """更新群组基本信息"""
    
    result = await db.execute(
        select(Guild)
        .options(selectinload(Guild.owner), selectinload(Guild.subscriptions))
        .where(Guild.id == guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    # 更新字段
    update_data = guild_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guild, field, value)
    
    await db.commit()
    await db.refresh(guild)
    
    # 获取当前有效订阅
    today = date.today()
    current_sub = None
    for sub in guild.subscriptions:
        if sub.start_date <= today <= sub.end_date:
            current_sub = SubscriptionResponse.from_orm(sub)
            break
    
    # 订阅历史
    sub_history = [SubscriptionResponse.from_orm(sub) for sub in guild.subscriptions]
    sub_history.sort(key=lambda x: x.start_date, reverse=True)
    
    return GuildDetail(
        id=guild.id,
        guild_qq_number=guild.guild_qq_number,
        ukey=guild.ukey,
        name=guild.name,
        server=guild.server,
        avatar=guild.avatar,
        description=guild.description,
        owner=GuildOwner(
            id=guild.owner.id,
            qq_number=guild.owner.qq_number,
            nickname=guild.owner.nickname
        ),
        preferences=guild.preferences or {},
        current_subscription=current_sub,
        subscription_history=sub_history,
        stats={"member_count": 0, "team_count": 0},
        created_at=guild.created_at,
        updated_at=guild.updated_at
    )


@router.post("/{guild_id}/transfer")
async def transfer_guild_owner(
    guild_id: int,
    transfer_data: GuildTransferOwner,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """转让群主权限给其他用户"""
    
    result = await db.execute(
        select(Guild).where(Guild.id == guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    # 查找新群主用户
    result = await db.execute(
        select(User).where(User.qq_number == transfer_data.new_owner_qq_number)
    )
    new_owner = result.scalar_one_or_none()
    
    if not new_owner:
        raise HTTPException(status_code=404, detail="新群主用户不存在")
    
    if new_owner.id == guild.owner_id:
        raise HTTPException(status_code=400, detail="该用户已经是群主")
    
    # 转让群主
    guild.owner_id = new_owner.id
    
    await db.commit()
    
    return {"message": "群主转让成功"}


@router.delete("/{guild_id}")
async def delete_guild(
    guild_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """软删除群组"""
    
    result = await db.execute(
        select(Guild).where(Guild.id == guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    if guild.deleted_at is not None:
        raise HTTPException(status_code=400, detail="群组已被删除")
    
    # 软删除
    from datetime import datetime
    guild.deleted_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "群组删除成功"}


# ============ 订阅管理接口 ============

@router.post("/subscriptions", response_model=SubscriptionResponse, tags=["订阅管理"])
async def create_subscription(
    sub_data: SubscriptionCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """为群组新增订阅或续费"""
    
    # 检查群组是否存在
    result = await db.execute(
        select(Guild).where(Guild.id == sub_data.guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    # 创建订阅
    subscription = Subscription(
        guild_id=sub_data.guild_id,
        start_date=sub_data.start_date,
        end_date=sub_data.end_date,
        features=sub_data.features,
        notes=sub_data.notes,
        created_by=current_admin.id
    )
    
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    
    return SubscriptionResponse.from_orm(subscription)


@router.get("/subscriptions", response_model=PaginatedResponse[SubscriptionWithGuild], tags=["订阅管理"])
async def list_subscriptions(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    guild_id: Optional[int] = Query(None, description="群组ID筛选"),
    status: str = Query("active", regex="^(active|expired|all)$", description="状态筛选"),
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """获取所有群组订阅列表（支持分页和过滤）"""
    
    # 构建查询
    query = select(Subscription).options(selectinload(Subscription.guild))
    
    # 群组过滤
    if guild_id:
        query = query.where(Subscription.guild_id == guild_id)
    
    # 状态过滤
    today = date.today()
    if status == "active":
        query = query.where(Subscription.start_date <= today, Subscription.end_date >= today)
    elif status == "expired":
        query = query.where(Subscription.end_date < today)
    # status == "all" 不过滤
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # 分页
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Subscription.created_at.desc())
    
    result = await db.execute(query)
    subscriptions = result.scalars().all()
    
    # 构建响应
    items = []
    for sub in subscriptions:
        items.append(SubscriptionWithGuild(
            id=sub.id,
            guild_id=sub.guild_id,
            guild_name=sub.guild.name,
            guild_qq_number=sub.guild.guild_qq_number,
            start_date=sub.start_date,
            end_date=sub.end_date,
            features=sub.features,
            notes=sub.notes,
            is_active=sub.is_active,
            created_by=sub.created_by,
            created_at=sub.created_at,
            updated_at=sub.updated_at
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{guild_id}/subscriptions", response_model=list[SubscriptionResponse], tags=["订阅管理"])
async def get_guild_subscriptions(
    guild_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """获取特定群组的所有订阅记录"""
    
    # 检查群组是否存在
    result = await db.execute(
        select(Guild).where(Guild.id == guild_id)
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(status_code=404, detail="群组不存在")
    
    # 获取订阅记录
    result = await db.execute(
        select(Subscription)
        .where(Subscription.guild_id == guild_id)
        .order_by(Subscription.start_date.desc())
    )
    subscriptions = result.scalars().all()
    
    return [SubscriptionResponse.from_orm(sub) for sub in subscriptions]


@router.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse, tags=["订阅管理"])
async def update_subscription(
    subscription_id: int,
    sub_data: SubscriptionUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """更新订阅信息（延期、修改权限等）"""
    
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="订阅不存在")
    
    # 更新字段
    update_data = sub_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subscription, field, value)
    
    await db.commit()
    await db.refresh(subscription)
    
    return SubscriptionResponse.from_orm(subscription)


@router.delete("/subscriptions/{subscription_id}", tags=["订阅管理"])
async def delete_subscription(
    subscription_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """删除订阅记录（慎用）"""
    
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="订阅不存在")
    
    await db.delete(subscription)
    await db.commit()
    
    return {"message": "订阅删除成功"}
