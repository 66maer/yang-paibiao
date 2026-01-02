"""
Bot API - 团队查询
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access
from app.models.bot import Bot
from app.models.team import Team
from app.schemas.bot import BotTeamSimple
from app.schemas.common import ResponseModel

router = APIRouter()


@router.get(
    "/guilds/{guild_id}/teams",
    response_model=ResponseModel[List[BotTeamSimple]]
)
async def get_open_teams(
    guild_id: int,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    查看当前开放的团队列表

    - 只返回status=open且is_hidden=false的团队
    - 按team_time排序
    """
    # 验证Bot权限
    await verify_bot_guild_access(bot, guild_id, db)

    # 查询开放团队
    result = await db.execute(
        select(Team)
        .where(
            Team.guild_id == guild_id,
            Team.status == "open",
            Team.is_hidden == False
        )
        .order_by(Team.team_time)
    )
    teams = result.scalars().all()

    # 转换为BotTeamSimple
    team_list = [
        BotTeamSimple(
            id=team.id,
            title=team.title,
            team_time=team.team_time,
            dungeon=team.dungeon,
            max_members=team.max_members,
            status=team.status,
            created_at=team.created_at
        )
        for team in teams
    ]

    return ResponseModel(data=team_list)
