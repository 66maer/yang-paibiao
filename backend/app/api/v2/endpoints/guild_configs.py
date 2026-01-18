"""
群组配置管理接口
用于管理群组级别的副本配置和赛季修正系数
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text

from app.api import deps
from app.models.guild import Guild
from app.models.guild_dungeon_config import GuildDungeonConfig
from app.models.season_correction_factor import SeasonCorrectionFactor
from app.schemas.guild_config import (
    DungeonOption,
    GuildDungeonConfigUpdate,
    DungeonOptionsResponse,
    QuickTeamOption,
    QuickTeamOptionsUpdate,
    QuickTeamOptionsResponse
)
from app.schemas.season_correction import (
    SeasonCorrectionFactorCreate,
    SeasonCorrectionFactorUpdate,
    SeasonCorrectionFactorOut
)
from app.schemas.common import ResponseModel, success

router = APIRouter()


# ==================== 副本配置 ====================

@router.get("/dungeons", response_model=DungeonOptionsResponse)
async def get_guild_dungeon_options(
    type: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild)
):
    """
    获取当前群组的副本选项配置
    如果群组没有配置，则返回全局默认配置
    """
    # 先查找群组配置
    result = await db.execute(
        select(GuildDungeonConfig).where(GuildDungeonConfig.guild_id == current_guild.id)
    )
    guild_config = result.scalar_one_or_none()
    
    if guild_config and guild_config.dungeon_options:
        options = guild_config.dungeon_options
    else:
        # 如果群组没有配置，从全局配置获取
        result = await db.execute(
            text("SELECT value FROM system_configs WHERE key = 'dungeon_options'")
        )
        row = result.fetchone()
        if not row:
            options = []
        else:
            options = row[0]
    
    # 如果指定了类型，进行过滤
    if type:
        options = [opt for opt in options if opt.get("type") == type]
    
    # 按 order 字段排序
    options.sort(key=lambda x: x.get("order", 0))
    
    return {"options": options}


@router.put("/dungeons", response_model=DungeonOptionsResponse)
async def update_guild_dungeon_options(
    data: GuildDungeonConfigUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild),
    member_role: str = Depends(deps.get_current_member_role)
):
    """
    更新当前群组的副本选项配置（需要群管理员权限）
    """
    # 检查权限
    if member_role not in ["owner", "helper"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有群主和管理员可以修改配置"
        )
    
    # 查找或创建群组配置
    result = await db.execute(
        select(GuildDungeonConfig).where(GuildDungeonConfig.guild_id == current_guild.id)
    )
    guild_config = result.scalar_one_or_none()
    
    options_data = [opt.model_dump() for opt in data.dungeon_options]
    
    if guild_config:
        guild_config.dungeon_options = options_data
    else:
        guild_config = GuildDungeonConfig(
            guild_id=current_guild.id,
            dungeon_options=options_data
        )
        db.add(guild_config)
    
    await db.commit()
    await db.refresh(guild_config)
    
    return {"options": data.dungeon_options}


# ==================== 赛季修正系数 ====================

@router.get("/seasons/{dungeon}", response_model=ResponseModel[List[SeasonCorrectionFactorOut]])
async def get_guild_season_corrections(
    dungeon: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild)
):
    """获取当前群组指定副本的所有赛季修正系数"""
    # 先查找群组级别的配置
    result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(
            SeasonCorrectionFactor.guild_id == current_guild.id,
            SeasonCorrectionFactor.dungeon == dungeon
        )
        .order_by(SeasonCorrectionFactor.start_date.desc())
    )
    factors = result.scalars().all()

    # 如果群组没有配置，则返回全局配置（guild_id 为 NULL）
    if not factors:
        result = await db.execute(
            select(SeasonCorrectionFactor)
            .where(
                SeasonCorrectionFactor.guild_id.is_(None),
                SeasonCorrectionFactor.dungeon == dungeon
            )
            .order_by(SeasonCorrectionFactor.start_date.desc())
        )
        factors = result.scalars().all()

    return success([SeasonCorrectionFactorOut.model_validate(f) for f in factors])


@router.post("/seasons", response_model=ResponseModel[SeasonCorrectionFactorOut])
async def create_guild_season_correction(
    payload: SeasonCorrectionFactorCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild),
    member_role: str = Depends(deps.get_current_member_role)
):
    """创建当前群组的赛季修正系数"""
    # 检查权限
    if member_role not in ["owner", "helper"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有群主和管理员可以修改配置"
        )
    
    # 检查时间段是否重叠
    conditions = [
        SeasonCorrectionFactor.guild_id == current_guild.id,
        SeasonCorrectionFactor.dungeon == payload.dungeon
    ]

    overlap_conditions = []
    overlap_conditions.append(
        and_(
            SeasonCorrectionFactor.start_date <= payload.start_date,
            or_(
                SeasonCorrectionFactor.end_date.is_(None),
                SeasonCorrectionFactor.end_date >= payload.start_date
            )
        )
    )

    if payload.end_date:
        overlap_conditions.append(
            and_(
                SeasonCorrectionFactor.start_date <= payload.end_date,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date >= payload.end_date
                )
            )
        )
        overlap_conditions.append(
            and_(
                SeasonCorrectionFactor.start_date >= payload.start_date,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date <= payload.end_date
                )
            )
        )

    result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(and_(*conditions, or_(*overlap_conditions)))
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="时间段与已有配置重叠"
        )

    # 创建时设置 guild_id
    factor_data = payload.model_dump()
    factor_data['guild_id'] = current_guild.id
    factor = SeasonCorrectionFactor(**factor_data)
    db.add(factor)
    await db.commit()
    await db.refresh(factor)

    return success(SeasonCorrectionFactorOut.model_validate(factor))


@router.put("/seasons/{factor_id}", response_model=ResponseModel[SeasonCorrectionFactorOut])
async def update_guild_season_correction(
    factor_id: int,
    payload: SeasonCorrectionFactorUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild),
    member_role: str = Depends(deps.get_current_member_role)
):
    """更新当前群组的赛季修正系数"""
    # 检查权限
    if member_role not in ["owner", "helper"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有群主和管理员可以修改配置"
        )
    
    result = await db.execute(
        select(SeasonCorrectionFactor).where(
            SeasonCorrectionFactor.id == factor_id,
            SeasonCorrectionFactor.guild_id == current_guild.id
        )
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配置不存在")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(factor, field, value)

    await db.commit()
    await db.refresh(factor)

    return success(SeasonCorrectionFactorOut.model_validate(factor))


@router.delete("/seasons/{factor_id}", response_model=ResponseModel)
async def delete_guild_season_correction(
    factor_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild),
    member_role: str = Depends(deps.get_current_member_role)
):
    """删除当前群组的赛季修正系数"""
    # 检查权限
    if member_role not in ["owner", "helper"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有群主和管理员可以修改配置"
        )
    
    result = await db.execute(
        select(SeasonCorrectionFactor).where(
            SeasonCorrectionFactor.id == factor_id,
            SeasonCorrectionFactor.guild_id == current_guild.id
        )
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配置不存在")

    await db.delete(factor)
    await db.commit()

    return success(message="删除成功")


# ==================== 快捷开团配置 ====================

# 默认快捷开团选项
DEFAULT_QUICK_TEAM_OPTIONS = [
    {"name": "🚗 第一车 19:50", "label": "第一车", "hour": 19, "minute": 50, "order": 1},
    {"name": "🚙 第二车 22:00", "label": "第二车", "hour": 22, "minute": 0, "order": 2},
]


@router.get("/quick-team", response_model=QuickTeamOptionsResponse)
async def get_guild_quick_team_options(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild)
):
    """
    获取当前群组的快捷开团选项配置
    如果群组没有配置，则返回默认配置
    """
    result = await db.execute(
        select(GuildDungeonConfig).where(GuildDungeonConfig.guild_id == current_guild.id)
    )
    guild_config = result.scalar_one_or_none()

    if guild_config and guild_config.quick_team_options:
        options = guild_config.quick_team_options
    else:
        options = DEFAULT_QUICK_TEAM_OPTIONS

    # 按 order 字段排序
    options.sort(key=lambda x: x.get("order", 0))

    return {"options": options}


@router.put("/quick-team", response_model=QuickTeamOptionsResponse)
async def update_guild_quick_team_options(
    data: QuickTeamOptionsUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
    current_guild: Guild = Depends(deps.get_current_guild),
    member_role: str = Depends(deps.get_current_member_role)
):
    """
    更新当前群组的快捷开团选项配置（需要群管理员权限）
    """
    # 检查权限
    if member_role not in ["owner", "helper"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有群主和管理员可以修改配置"
        )

    # 查找或创建群组配置
    result = await db.execute(
        select(GuildDungeonConfig).where(GuildDungeonConfig.guild_id == current_guild.id)
    )
    guild_config = result.scalar_one_or_none()

    options_data = [opt.model_dump() for opt in data.quick_team_options]

    if guild_config:
        guild_config.quick_team_options = options_data
    else:
        guild_config = GuildDungeonConfig(
            guild_id=current_guild.id,
            quick_team_options=options_data
        )
        db.add(guild_config)

    await db.commit()
    await db.refresh(guild_config)

    return {"options": data.quick_team_options}
