"""
Bot API - 团队查询
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access
from app.models.bot import Bot
from app.models.team import Team
from app.models.signup import Signup
from app.models.user import User
from app.models.guild_member import GuildMember
from app.schemas.bot import BotTeamSimple, BotTeamDetail, BotSignupDetail
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


@router.get(
    "/guilds/{guild_id}/teams/{team_id}/view",
    response_model=ResponseModel[BotTeamDetail]
)
async def get_team_for_screenshot(
    guild_id: int,
    team_id: int,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    获取团队详细信息（用于截图）

    - 验证Bot对该群组的访问权限
    - 返回团队完整信息，包括报名列表
    - 用于机器人生成团队截图
    """
    # 验证Bot权限
    await verify_bot_guild_access(bot, guild_id, db)

    # 查询团队
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="团队不存在"
        )

    # 查询创建者信息
    creator_result = await db.execute(
        select(User, GuildMember)
        .outerjoin(GuildMember,
                  (GuildMember.user_id == User.id) &
                  (GuildMember.guild_id == guild_id) &
                  (GuildMember.left_at.is_(None)))
        .where(User.id == team.creator_id)
    )
    creator_row = creator_result.first()
    creator_name = "未知"
    if creator_row:
        creator_user, creator_member = creator_row
        creator_name = (creator_member.group_nickname
                       if creator_member and creator_member.group_nickname
                       else creator_user.nickname)

    # 查询报名列表
    signups_result = await db.execute(
        select(Signup, User, GuildMember)
        .outerjoin(User, User.id == Signup.submitter_id)
        .outerjoin(GuildMember,
                  (GuildMember.user_id == Signup.submitter_id) &
                  (GuildMember.guild_id == guild_id) &
                  (GuildMember.left_at.is_(None)))
        .where(
            Signup.team_id == team_id,
            Signup.cancelled_at.is_(None)
        )
        .order_by(Signup.priority)
    )

    # 构建报名详情列表
    signup_list = []
    for signup, submitter_user, submitter_member in signups_result.all():
        submitter_name = "未知"
        if submitter_user:
            submitter_name = (submitter_member.group_nickname
                            if submitter_member and submitter_member.group_nickname
                            else submitter_user.nickname)

        signup_list.append(BotSignupDetail(
            id=signup.id,
            submitter_id=signup.submitter_id,
            submitter_name=submitter_name,
            signup_user_id=signup.signup_user_id,
            signup_info=signup.signup_info,
            priority=signup.priority,
            is_rich=signup.is_rich,
            is_proxy=signup.is_proxy,
            slot_position=signup.slot_position,
            presence_status=signup.presence_status,
            created_at=signup.created_at
        ))

    # 构建团队详情响应
    team_detail = BotTeamDetail(
        id=team.id,
        guild_id=team.guild_id,
        creator_id=team.creator_id,
        creator_name=creator_name,
        title=team.title,
        team_time=team.team_time,
        dungeon=team.dungeon,
        max_members=team.max_members,
        is_xuanjing_booked=team.is_xuanjing_booked,
        is_yuntie_booked=team.is_yuntie_booked,
        is_hidden=team.is_hidden,
        is_locked=team.is_locked,
        status=team.status,
        notice=team.notice,
        rules=team.rule,  # 数据库字段是 rule
        slot_view=team.slot_view,
        signups=signup_list,
        created_at=team.created_at,
        updated_at=team.updated_at
    )

    return ResponseModel(data=team_detail)
