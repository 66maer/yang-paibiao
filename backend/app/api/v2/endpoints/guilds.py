"""
群组成员相关用户接口
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild_member import GuildMember
from app.models.guild import Guild
from app.schemas.common import ResponseModel
from app.schemas.guild import GuildMemberInfo, UpdateMemberRole

router = APIRouter(prefix="/guilds", tags=["群组用户接口"])


@router.put("/{guild_id}/members/me/nickname", response_model=ResponseModel)
async def update_my_guild_nickname(
    guild_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    修改当前用户在指定群组的群内昵称
    请求体：{"group_nickname": "新昵称"}
    """
    new_nickname = payload.get("group_nickname")
    if new_nickname is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="缺少 group_nickname 字段")

    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    guild = guild_result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 查找当前用户的成员关系
    result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = result.scalar_one_or_none()
    if gm is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    gm.group_nickname = new_nickname
    await db.commit()

    return ResponseModel(message="群昵称更新成功")


@router.get("/{guild_id}/members", response_model=ResponseModel[List[GuildMemberInfo]])
async def get_guild_members(
    guild_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取群组成员列表
    只有群组成员才能查看成员列表
    """
    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    guild = guild_result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 验证当前用户是否为该群组成员
    check_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    if check_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 获取所有成员列表，包含用户信息
    result = await db.execute(
        select(GuildMember)
        .options(selectinload(GuildMember.user))
        .where(
            GuildMember.guild_id == guild_id,
            GuildMember.left_at.is_(None)
        )
        .order_by(
            # 群主排第一，管理员第二，普通成员第三
            GuildMember.role.desc(),
            GuildMember.joined_at.asc()
        )
    )
    members = result.scalars().all()

    return ResponseModel(data=members, message="获取成员列表成功")


@router.put("/{guild_id}/members/{user_id}/role", response_model=ResponseModel)
async def update_member_role(
    guild_id: int,
    user_id: int,
    payload: UpdateMemberRole,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新群组成员角色
    只有群主和管理员(helper)可以修改成员角色
    - 群主可以修改任何人的角色（包括设置新的管理员）
    - 管理员只能修改普通成员的角色为管理员或普通成员，不能修改群主
    - 不能将群主角色转让给他人（需要使用转让群主接口）
    """
    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    guild = guild_result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 获取当前用户在该群组的角色
    current_member_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    current_member = current_member_result.scalar_one_or_none()
    if current_member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 验证权限：只有群主和管理员可以修改成员角色
    if current_member.role not in ['owner', 'helper']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足，只有群主和管理员可以修改成员角色")

    # 获取目标成员
    target_member_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == user_id,
            GuildMember.left_at.is_(None)
        )
    )
    target_member = target_member_result.scalar_one_or_none()
    if target_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="目标成员不存在")

    # 不允许通过此接口修改为群主
    if payload.role == 'owner':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能通过此接口转让群主，请使用转让群主接口")

    # 不允许修改群主的角色
    if target_member.role == 'owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="不能修改群主的角色")

    # 如果当前用户是管理员（非群主），不能修改其他管理员的角色
    if current_member.role == 'helper' and target_member.role == 'helper' and target_member.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="管理员不能修改其他管理员的角色")

    # 更新角色
    target_member.role = payload.role
    await db.commit()

    return ResponseModel(message="成员角色更新成功")
