"""
开团模板 用户接口
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild import Guild
from app.models.guild_member import GuildMember
from app.models.template import TeamTemplate
from app.schemas.common import ResponseModel, success
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateOut

router = APIRouter(prefix="/guilds", tags=["开团模板"]) 


async def _get_member(db: AsyncSession, guild_id: int, user_id: int) -> GuildMember | None:
    result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == user_id,
            GuildMember.left_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


def _ensure_member_with_role(member: GuildMember, roles: list[str] | None = None):
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if roles and member.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")


@router.post("/{guild_id}/templates", response_model=ResponseModel[TemplateOut])
async def create_template(
    guild_id: int,
    payload: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    if guild_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 权限：群主或管理员可创建
    gm = await _get_member(db, guild_id, current_user.id)
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    tpl = TeamTemplate(
        guild_id=guild_id,
        title=payload.title,
        notice=payload.notice,
        rules=[r.model_dump() for r in payload.rules] if payload.rules else [],
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return success(TemplateOut.model_validate(tpl), message="创建成功")


@router.get("/{guild_id}/templates", response_model=ResponseModel[List[TemplateOut]])
async def list_templates(
    guild_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 需为该群成员
    gm = await _get_member(db, guild_id, current_user.id)
    _ensure_member_with_role(gm, roles=None)

    result = await db.execute(select(TeamTemplate).where(TeamTemplate.guild_id == guild_id))
    items = result.scalars().all()
    return success([TemplateOut.model_validate(x) for x in items], message="获取成功")


@router.get("/{guild_id}/templates/{template_id}", response_model=ResponseModel[TemplateOut])
async def get_template(
    guild_id: int,
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    gm = await _get_member(db, guild_id, current_user.id)
    _ensure_member_with_role(gm, roles=None)

    result = await db.execute(
        select(TeamTemplate).where(TeamTemplate.id == template_id, TeamTemplate.guild_id == guild_id)
    )
    tpl = result.scalar_one_or_none()
    if tpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return success(TemplateOut.model_validate(tpl), message="获取成功")


@router.put("/{guild_id}/templates/{template_id}", response_model=ResponseModel[TemplateOut])
async def update_template(
    guild_id: int,
    template_id: int,
    payload: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    gm = await _get_member(db, guild_id, current_user.id)
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    result = await db.execute(
        select(TeamTemplate).where(TeamTemplate.id == template_id, TeamTemplate.guild_id == guild_id)
    )
    tpl = result.scalar_one_or_none()
    if tpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    if payload.title is not None:
        tpl.title = payload.title
    if payload.notice is not None:
        tpl.notice = payload.notice
    if payload.rules is not None:
        tpl.rules = [r.model_dump() for r in payload.rules]

    await db.commit()
    await db.refresh(tpl)
    return success(TemplateOut.model_validate(tpl), message="更新成功")


@router.delete("/{guild_id}/templates/{template_id}", response_model=ResponseModel)
async def delete_template(
    guild_id: int,
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    gm = await _get_member(db, guild_id, current_user.id)
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    result = await db.execute(
        select(TeamTemplate).where(TeamTemplate.id == template_id, TeamTemplate.guild_id == guild_id)
    )
    tpl = result.scalar_one_or_none()
    if tpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    await db.delete(tpl)
    await db.commit()
    return success(message="删除成功")
