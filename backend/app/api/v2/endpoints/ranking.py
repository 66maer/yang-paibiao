"""
红黑榜查询接口（用户）
"""
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

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

    # 计算排名
    ranking_service = RankingService(db)
    current_rankings = await ranking_service.calculate_guild_rankings(guild_id)

    # 获取排名变化
    changes = await ranking_service.get_ranking_changes(guild_id, current_rankings)

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
        change_info = changes.get(user_id, {"change": "new", "value": 0})

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
            rank_change_value=change_info["value"]
        ))

    from datetime import datetime
    response = GuildRankingResponse(
        guild_id=guild_id,
        guild_name=guild.name,
        snapshot_date=datetime.utcnow(),
        rankings=ranking_items
    )

    return success(response)
