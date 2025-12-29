"""
团队（开团）用户接口
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild import Guild
from app.models.guild_member import GuildMember
from app.models.team import Team
from app.schemas.common import ResponseModel, success
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut, TeamClose
from app.schemas.team_log import TeamLogOut
from app.schemas.ranking import HeibenRecommendationRequest, HeibenRecommendationResponse, HeibenRecommendationItem
from app.services.ranking_service import RankingService
from app.services.team_log_service import TeamLogService
from app.models.team_log import TeamLog

router = APIRouter(prefix="/guilds", tags=["团队/开团"]) 


def _ensure_member_with_role(member: GuildMember, roles: list[str]):
    if member is None or member.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if member.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")


@router.post("/{guild_id}/teams", response_model=ResponseModel[TeamOut])
async def create_team(
    guild_id: int,
    payload: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建开团"""
    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    guild = guild_result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 验证权限：群主或管理员可开团
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    _ensure_member_with_role(gm, roles=["owner", "helper"]) 

    # 创建团队，将 rules 转换为 JSON
    team = Team(
        guild_id=guild_id,
        creator_id=current_user.id,
        title=payload.title,
        team_time=payload.team_time,
        dungeon=payload.dungeon,
        max_members=payload.max_members,
        is_xuanjing_booked=payload.is_xuanjing_booked,
        is_yuntie_booked=payload.is_yuntie_booked,
        is_hidden=payload.is_hidden,
        is_locked=payload.is_locked,
        notice=payload.notice,
        rule=[r.model_dump() for r in payload.rules] if payload.rules else [],
        status="open"
    )
    db.add(team)
    await db.flush()  # 先flush以获取team.id

    # 记录开团日志
    await TeamLogService.log_team_created(
        db, team.id, guild_id, current_user.id,
        payload.title, payload.dungeon, payload.team_time.isoformat()
    )

    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="创建成功")


@router.get("/{guild_id}/teams", response_model=ResponseModel[List[TeamOut]])
async def list_teams(
    guild_id: int,
    status_filter: Optional[str] = Query(None, alias="status", description="按状态过滤: open, completed, cancelled"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取开团列表"""
    # 需为该群成员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    if gm_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 构建查询条件
    conditions = [
        Team.guild_id == guild_id,
        Team.status != "deleted"
    ]

    # 如果提供了 status 参数，添加状态过滤
    if status_filter:
        conditions.append(Team.status == status_filter)

    # 获取团队列表
    result = await db.execute(
        select(Team).where(*conditions).order_by(Team.team_time.desc())
    )
    teams = result.scalars().all()
    return success([TeamOut.model_validate(t) for t in teams], message="获取成功")


@router.get("/{guild_id}/teams/{team_id}", response_model=ResponseModel[TeamOut])
async def get_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取开团详情"""
    # 需为该群成员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    if gm_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")
    return success(TeamOut.model_validate(team), message="获取成功")


@router.put("/{guild_id}/teams/{team_id}", response_model=ResponseModel[TeamOut])
async def update_team(
    guild_id: int,
    team_id: int,
    payload: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新开团信息"""
    # 权限：群主或管理员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    _ensure_member_with_role(gm, roles=["owner", "helper"]) 

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 收集变更信息
    changes = {}

    # 更新字段并记录变更
    if payload.title is not None and payload.title != team.title:
        changes["title"] = {"old": team.title, "new": payload.title}
        team.title = payload.title
    if payload.team_time is not None and payload.team_time != team.team_time:
        changes["team_time"] = {"old": team.team_time.isoformat(), "new": payload.team_time.isoformat()}
        team.team_time = payload.team_time
    if payload.dungeon is not None and payload.dungeon != team.dungeon:
        changes["dungeon"] = {"old": team.dungeon, "new": payload.dungeon}
        team.dungeon = payload.dungeon
    if payload.max_members is not None and payload.max_members != team.max_members:
        changes["max_members"] = {"old": team.max_members, "new": payload.max_members}
        team.max_members = payload.max_members
    if payload.is_xuanjing_booked is not None and payload.is_xuanjing_booked != team.is_xuanjing_booked:
        changes["is_xuanjing_booked"] = {"old": team.is_xuanjing_booked, "new": payload.is_xuanjing_booked}
        team.is_xuanjing_booked = payload.is_xuanjing_booked
    if payload.is_yuntie_booked is not None and payload.is_yuntie_booked != team.is_yuntie_booked:
        changes["is_yuntie_booked"] = {"old": team.is_yuntie_booked, "new": payload.is_yuntie_booked}
        team.is_yuntie_booked = payload.is_yuntie_booked
    if payload.notice is not None and payload.notice != team.notice:
        changes["notice"] = {"old": team.notice, "new": payload.notice}
        team.notice = payload.notice
    if payload.rules is not None:
        team.rule = [r.model_dump() for r in payload.rules]
    if payload.slot_view is not None:
        team.slot_view = payload.slot_view

    # 单独处理 is_locked 和 is_hidden，记录为独立的操作日志
    if payload.is_locked is not None and payload.is_locked != team.is_locked:
        if payload.is_locked:
            await TeamLogService.create_log(db, team_id, guild_id, "team_locked", current_user.id, {})
        else:
            await TeamLogService.create_log(db, team_id, guild_id, "team_unlocked", current_user.id, {})
        team.is_locked = payload.is_locked

    if payload.is_hidden is not None and payload.is_hidden != team.is_hidden:
        if payload.is_hidden:
            await TeamLogService.create_log(db, team_id, guild_id, "team_hidden", current_user.id, {})
        else:
            await TeamLogService.create_log(db, team_id, guild_id, "team_shown", current_user.id, {})
        team.is_hidden = payload.is_hidden

    # 记录其他字段的变更
    if changes:
        await TeamLogService.log_team_updated(db, team_id, guild_id, current_user.id, changes)

    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="更新成功")


@router.post("/{guild_id}/teams/{team_id}/close", response_model=ResponseModel[TeamOut])
async def close_team(
    guild_id: int,
    team_id: int,
    payload: TeamClose,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """关闭开团（完成或取消）"""
    # 权限：群主或管理员或创建者
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()

    # 获取团队
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 验证权限：必须是群主、管理员或创建者
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    is_owner_or_helper = gm.role in ["owner", "helper"]
    is_creator = team.creator_id == current_user.id

    if not (is_owner_or_helper or is_creator):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足，只有群主、管理员或创建者可以关闭开团")

    # 检查团队是否已经关闭
    if team.status in ["completed", "cancelled", "deleted"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"团队已经处于{team.status}状态，无法再次关闭")

    # 更新团队状态
    team.status = payload.status
    team.closed_at = datetime.utcnow()
    team.closed_by = current_user.id

    # 记录关闭日志
    await TeamLogService.log_team_closed(db, team_id, guild_id, current_user.id, payload.status)

    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="关闭成功")


@router.post("/{guild_id}/teams/{team_id}/reopen", response_model=ResponseModel[TeamOut])
async def reopen_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """重新开启已关闭的开团"""
    # 权限：群主或管理员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    # 获取团队
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 检查团队是否已关闭
    if team.status not in ["completed", "cancelled"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能重新开启已关闭的团队")

    # 记录重新开启日志
    previous_status = team.status
    await TeamLogService.log_team_reopened(db, team_id, guild_id, current_user.id, previous_status)

    # 更新团队状态为开启
    team.status = "open"
    team.closed_at = None
    team.closed_by = None

    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="重新开启成功")


@router.delete("/{guild_id}/teams/{team_id}", response_model=ResponseModel)
async def delete_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除开团（软删除）"""
    # 权限：群主或管理员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 记录删除日志
    await TeamLogService.log_team_deleted(db, team_id, guild_id, current_user.id)

    # 软删除：更新状态
    team.status = "deleted"
    await db.commit()
    return success(message="删除成功")


@router.post("/{guild_id}/teams/{team_id}/heibenren-recommendations", response_model=ResponseModel[HeibenRecommendationResponse])
async def get_heibenren_recommendations(
    guild_id: int,
    team_id: int,
    payload: HeibenRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取团队黑本推荐列表"""
    # 验证用户是该群组成员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    if gm_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 验证团队存在
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 计算推荐列表
    ranking_service = RankingService(db)
    recommendations, average_rank_score = await ranking_service.calculate_heibenren_recommendations(
        guild_id, payload.member_user_ids
    )

    # 获取用户信息
    user_ids = [r["user_id"] for r in recommendations]
    users_result = await db.execute(
        select(User).where(User.id.in_(user_ids))
    )
    users_map = {user.id: user for user in users_result.scalars().all()}

    # 获取群昵称
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id.in_(user_ids),
            GuildMember.left_at.is_(None)
        )
    )
    gm_map = {gm.user_id: gm for gm in gm_result.scalars().all()}

    # 构建响应
    recommendation_items = []
    for rec in recommendations:
        user_id = rec["user_id"]
        user = users_map.get(user_id)
        if not user:
            continue

        gm_member = gm_map.get(user_id)
        recommendation_items.append(HeibenRecommendationItem(
            user_id=user_id,
            user_name=gm_member.group_nickname if (gm_member and gm_member.group_nickname) else user.nickname,
            user_avatar=user.avatar,
            rank_score=rec["rank_score"],
            heibenren_count=rec["heibenren_count"],
            frequency_modifier=rec["frequency_modifier"],
            time_modifier=rec["time_modifier"],
            recommendation_score=rec["recommendation_score"],
            last_heibenren_date=rec.get("last_heibenren_date"),
            cars_since_last=rec.get("cars_since_last"),
            is_new=rec["is_new"]
        ))

    response = HeibenRecommendationResponse(
        team_id=team_id,
        recommendations=recommendation_items,
        average_rank_score=average_rank_score
    )

    return success(response)


@router.get("/{guild_id}/teams/{team_id}/logs", response_model=ResponseModel[List[TeamLogOut]])
async def get_team_logs(
    guild_id: int,
    team_id: int,
    limit: int = Query(50, ge=1, le=200, description="返回记录数"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取团队日志"""
    # 验证权限：需为该群成员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    if gm_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 验证团队存在
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 查询日志
    logs_result = await db.execute(
        select(TeamLog)
        .where(TeamLog.team_id == team_id)
        .order_by(TeamLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    logs = logs_result.scalars().all()

    # 获取所有操作用户的信息
    user_ids = [log.action_user_id for log in logs if log.action_user_id]
    users_map = {}
    gm_map = {}

    if user_ids:
        users_result = await db.execute(
            select(User).where(User.id.in_(user_ids))
        )
        users_map = {user.id: user for user in users_result.scalars().all()}

        # 获取群昵称
        gm_result = await db.execute(
            select(GuildMember).where(
                GuildMember.guild_id == guild_id,
                GuildMember.user_id.in_(user_ids),
                GuildMember.left_at.is_(None)
            )
        )
        gm_map = {gm.user_id: gm for gm in gm_result.scalars().all()}

    # 构建响应
    log_items = []
    for log in logs:
        user_name = None
        if log.action_user_id:
            user = users_map.get(log.action_user_id)
            gm_member = gm_map.get(log.action_user_id)
            if user:
                user_name = (gm_member.group_nickname
                           if (gm_member and gm_member.group_nickname)
                           else user.nickname)

        log_dict = {
            "id": log.id,
            "team_id": log.team_id,
            "guild_id": log.guild_id,
            "action_type": log.action_type,
            "action_user_id": log.action_user_id,
            "action_user_name": user_name,
            "action_detail": log.action_detail,
            "created_at": log.created_at
        }
        log_items.append(TeamLogOut(**log_dict))

    return success(log_items, message="获取成功")
