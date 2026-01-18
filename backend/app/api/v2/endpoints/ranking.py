"""
红黑榜查询接口（用户）
"""
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.api import deps
from app.models.user import User
from app.models.guild import Guild
from app.models.guild_member import GuildMember
from app.schemas.ranking import RankingItemOut, GuildRankingResponse
from app.schemas.common import ResponseModel, success
from app.services.ranking_service import RankingService

router = APIRouter(prefix="/guilds", tags=["红黑榜"])


@router.get("/{guild_id}/ranking", response_model=ResponseModel[GuildRankingResponse])
async def get_guild_ranking(
    guild_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """获取群组红黑榜"""
    # 验证成员权限
    gm_result = await db.execute(
        select(GuildMember).where(
            and_(
                GuildMember.guild_id == guild_id,
                GuildMember.user_id == current_user.id,
                GuildMember.left_at.is_(None)
            )
        )
    )
    gm = gm_result.scalar_one_or_none()
    if gm is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="非该群组成员"
        )

    # 获取群组信息
    guild_result = await db.execute(
        select(Guild).where(and_(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    )
    guild = guild_result.scalar_one_or_none()
    if not guild:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 计算排名（包含详细信息）
    ranking_service = RankingService(db)
    current_rankings = await ranking_service.calculate_guild_rankings(guild_id, include_detail=True)

    # 获取排名变化
    changes = await ranking_service.get_ranking_changes(guild_id, current_rankings)

    # 获取当前使用的修正系数（优先使用群组级别配置，如没有则使用全局配置）
    from app.models.season_correction_factor import SeasonCorrectionFactor
    from app.schemas.ranking import SeasonFactorInfo
    from datetime import datetime
    today = date.today()

    # 先获取群组级别的配置
    factors_result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(
            and_(
                SeasonCorrectionFactor.guild_id == guild_id,
                SeasonCorrectionFactor.start_date <= today,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date >= today
                )
            )
        )
        .order_by(SeasonCorrectionFactor.dungeon, SeasonCorrectionFactor.start_date.desc())
    )
    guild_factors = list(factors_result.scalars().all())
    guild_dungeons = set(f.dungeon for f in guild_factors)

    # 获取全局配置（guild_id 为 NULL），仅补充群组配置中没有的副本
    global_factors_result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(
            and_(
                SeasonCorrectionFactor.guild_id.is_(None),
                SeasonCorrectionFactor.start_date <= today,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date >= today
                )
            )
        )
        .order_by(SeasonCorrectionFactor.dungeon, SeasonCorrectionFactor.start_date.desc())
    )
    global_factors = [f for f in global_factors_result.scalars().all() if f.dungeon not in guild_dungeons]

    # 合并配置
    all_factors = guild_factors + global_factors
    season_factors = [
        SeasonFactorInfo(
            dungeon=factor.dungeon,
            start_date=factor.start_date,
            end_date=factor.end_date,
            correction_factor=factor.correction_factor,
            description=factor.description
        )
        for factor in all_factors
    ]

    # 获取用户信息
    user_ids = [r["user_id"] for r in current_rankings]
    users_result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users_map = {user.id: user for user in users_result.scalars().all()}

    # 获取群昵称
    gm_result = await db.execute(
        select(GuildMember).where(
            and_(
                GuildMember.guild_id == guild_id,
                GuildMember.user_id.in_(user_ids),
                GuildMember.left_at.is_(None)
            )
        )
    )
    gm_map = {gm.user_id: gm for gm in gm_result.scalars().all()}

    # 构建响应
    ranking_items = []
    for ranking in current_rankings:
        user_id = ranking["user_id"]
        user = users_map.get(user_id)
        if not user:
            continue

        gm_member = gm_map.get(user_id)
        change_info = changes.get(user_id, {
            "change": "new",
            "rank_change_value": 0,
            "score_change_value": 0,
            "prev_rank": None,
            "prev_score": None
        })

        # 计算距离最近一次黑本的天数
        days_ago = None
        if ranking["last_heibenren_date"]:
            days_ago = (date.today() - ranking["last_heibenren_date"]).days

        ranking_items.append(RankingItemOut(
            rank_position=ranking["rank_position"],
            user_id=user_id,
            user_name=gm_member.group_nickname if (gm_member and gm_member.group_nickname) else user.nickname,
            user_avatar=user.avatar,
            heibenren_count=ranking["heibenren_count"],
            average_gold=ranking["average_gold"],
            corrected_average_gold=ranking["corrected_average_gold"],
            rank_score=ranking["rank_score"],
            last_heibenren_date=ranking["last_heibenren_date"],
            last_heibenren_car_number=ranking["last_heibenren_car_number"],
            last_heibenren_days_ago=days_ago,
            rank_change=change_info["change"],
            rank_change_value=change_info["rank_change_value"],
            score_change_value=change_info["score_change_value"],
            prev_rank=change_info["prev_rank"],
            prev_score=change_info["prev_score"],
            calculation_detail=ranking.get("calculation_detail")
        ))

    from datetime import datetime
    response = GuildRankingResponse(
        guild_id=guild_id,
        guild_name=guild.name,
        snapshot_date=datetime.utcnow(),
        rankings=ranking_items,
        season_factors=season_factors
    )

    return success(response)
