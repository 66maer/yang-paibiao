"""
团队（开团）用户接口
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild import Guild
from app.models.guild_member import GuildMember
from app.models.team import Team
from app.schemas.common import ResponseModel, success
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut

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

    team = Team(guild_id=guild_id, name=payload.name)
    db.add(team)
    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="创建成功")


@router.get("/{guild_id}/teams", response_model=ResponseModel[List[TeamOut]])
async def list_teams(
    guild_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

    result = await db.execute(select(Team).where(Team.guild_id == guild_id))
    teams = result.scalars().all()
    return success([TeamOut.model_validate(t) for t in teams], message="获取成功")


@router.get("/{guild_id}/teams/{team_id}", response_model=ResponseModel[TeamOut])
async def get_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

    result = await db.execute(select(Team).where(Team.id == team_id, Team.guild_id == guild_id))
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

    result = await db.execute(select(Team).where(Team.id == team_id, Team.guild_id == guild_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    if payload.name is not None:
        team.name = payload.name
    await db.commit()
    await db.refresh(team)

    return success(TeamOut.model_validate(team), message="更新成功")


@router.delete("/{guild_id}/teams/{team_id}", response_model=ResponseModel)
async def delete_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

    result = await db.execute(select(Team).where(Team.id == team_id, Team.guild_id == guild_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    await db.delete(team)
    await db.commit()
    return success(message="删除成功")
