"""
Bot API - 成员管理
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access_by_qq
from app.models.bot import Bot
from app.models.guild import Guild
from app.models.user import User
from app.models.guild_member import GuildMember
from app.schemas.bot import (
    BotAddMembersRequest,
    BotAddMembersResponse,
    BotMemberResult,
    BotRemoveMembersRequest,
    BotRemoveMembersResponse,
    BotRemoveResult,
    BotUpdateNicknameRequest,
    BotMemberInfo,
    BotMemberSearchResponse,
)
from app.schemas.common import ResponseModel
from app.core.security import get_password_hash

router = APIRouter()


@router.post(
    "/guilds/{guild_qq_number}/members/batch",
    response_model=ResponseModel[BotAddMembersResponse]
)
async def batch_add_members(
    guild_qq_number: str,
    payload: BotAddMembersRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    批量添加群组成员（通过QQ群号）

    - 如果QQ号不存在，自动创建用户
    - 如果用户已存在但不在群组，添加到群组
    - 如果用户曾经离开群组，重新激活
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    results = []
    success_count = 0
    failed_count = 0

    for member_data in payload.members:
        try:
            # 查找或创建用户
            user_result = await db.execute(
                select(User).where(
                    User.qq_number == member_data.qq_number,
                    User.deleted_at.is_(None)
                )
            )
            user = user_result.scalar_one_or_none()

            if not user:
                # 创建新用户（密码设为123456）
                user = User(
                    qq_number=member_data.qq_number,
                    password_hash=get_password_hash("123456"),
                    nickname=member_data.nickname
                )
                db.add(user)
                await db.flush()
                status_msg = "created_and_added"
            else:
                status_msg = "found"

            # 检查群成员关系
            gm_result = await db.execute(
                select(GuildMember).where(
                    GuildMember.guild_id == guild.id,
                    GuildMember.user_id == user.id
                )
            )
            gm = gm_result.scalar_one_or_none()

            if gm and gm.left_at is None:
                # 已经是活跃成员
                results.append(BotMemberResult(
                    qq_number=member_data.qq_number,
                    status="already_member",
                    user_id=user.id,
                    message="用户已是群成员"
                ))
                continue
            elif gm and gm.left_at is not None:
                # 曾经是成员，重新激活
                gm.left_at = None
                gm.joined_at = datetime.utcnow()
                if member_data.group_nickname:
                    gm.group_nickname = member_data.group_nickname
                status_msg = "re_added"
            else:
                # 新成员
                gm = GuildMember(
                    guild_id=guild.id,
                    user_id=user.id,
                    role="member",
                    group_nickname=member_data.group_nickname
                )
                db.add(gm)
                status_msg = "added"

            await db.flush()
            success_count += 1
            results.append(BotMemberResult(
                qq_number=member_data.qq_number,
                status=status_msg,
                user_id=user.id,
                message="成功添加"
            ))

        except Exception as e:
            failed_count += 1
            results.append(BotMemberResult(
                qq_number=member_data.qq_number,
                status="error",
                message=str(e)
            ))

    await db.commit()

    return ResponseModel(data=BotAddMembersResponse(
        success_count=success_count,
        failed_count=failed_count,
        results=results
    ))


@router.post(
    "/guilds/{guild_qq_number}/members/batch-remove",
    response_model=ResponseModel[BotRemoveMembersResponse]
)
async def batch_remove_members(
    guild_qq_number: str,
    payload: BotRemoveMembersRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    批量移除群组成员（通过QQ群号）

    - 设置left_at为当前时间（软删除）
    - 不删除历史报名数据
    - 不能移除群主（owner）
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    results = []
    success_count = 0
    failed_count = 0

    for qq_number in payload.qq_numbers:
        try:
            # 查找用户
            user_result = await db.execute(
                select(User).where(
                    User.qq_number == qq_number,
                    User.deleted_at.is_(None)
                )
            )
            user = user_result.scalar_one_or_none()

            if not user:
                results.append(BotRemoveResult(
                    qq_number=qq_number,
                    status="not_member",
                    message="用户不存在"
                ))
                failed_count += 1
                continue

            # 查找群成员关系
            gm_result = await db.execute(
                select(GuildMember).where(
                    GuildMember.guild_id == guild.id,
                    GuildMember.user_id == user.id,
                    GuildMember.left_at.is_(None)
                )
            )
            gm = gm_result.scalar_one_or_none()

            if not gm:
                results.append(BotRemoveResult(
                    qq_number=qq_number,
                    status="not_member",
                    message="用户不在该群组"
                ))
                failed_count += 1
                continue

            # 检查是否是群主
            if gm.role == "owner":
                results.append(BotRemoveResult(
                    qq_number=qq_number,
                    status="owner_cannot_remove",
                    message="不能移除群主"
                ))
                failed_count += 1
                continue

            # 软删除：设置left_at
            gm.left_at = datetime.utcnow()
            await db.flush()

            success_count += 1
            results.append(BotRemoveResult(
                qq_number=qq_number,
                status="removed",
                message="成功移除"
            ))

        except Exception as e:
            failed_count += 1
            results.append(BotRemoveResult(
                qq_number=qq_number,
                status="error",
                message=str(e)
            ))

    await db.commit()

    return ResponseModel(data=BotRemoveMembersResponse(
        success_count=success_count,
        failed_count=failed_count,
        results=results
    ))


@router.put(
    "/guilds/{guild_qq_number}/members/{qq_number}/nickname",
    response_model=ResponseModel
)
async def update_member_nickname(
    guild_qq_number: str,
    qq_number: str,
    payload: BotUpdateNicknameRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    修改群成员的群昵称（通过QQ群号）
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 查找用户
    user_result = await db.execute(
        select(User).where(
            User.qq_number == qq_number,
            User.deleted_at.is_(None)
        )
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {qq_number} 未注册"
        )

    # 查找群成员关系
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild.id,
            GuildMember.user_id == user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()

    if not gm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不在该群组"
        )

    # 更新群昵称
    gm.group_nickname = payload.group_nickname
    await db.commit()

    return ResponseModel(message="群昵称更新成功")


@router.get(
    "/guilds/{guild_qq_number}/members/search",
    response_model=ResponseModel[BotMemberSearchResponse]
)
async def search_members(
    guild_qq_number: str,
    nickname: str,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    通过昵称搜索群成员（通过QQ群号）

    - 支持模糊匹配
    - 同时搜索 nickname（用户昵称）、group_nickname（群昵称）、other_nickname（其他昵称）
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 查询匹配的成员
    # 使用LIKE进行模糊匹配
    search_pattern = f"%{nickname}%"

    result = await db.execute(
        select(User, GuildMember)
        .join(GuildMember, GuildMember.user_id == User.id)
        .where(
            GuildMember.guild_id == guild.id,
            GuildMember.left_at.is_(None),
            User.deleted_at.is_(None),
            (
                User.nickname.like(search_pattern) |
                GuildMember.group_nickname.like(search_pattern) |
                User.other_nickname.like(search_pattern)
            )
        )
    )

    members = []
    for user, guild_member in result.all():
        members.append(BotMemberInfo(
            user_id=user.id,
            qq_number=user.qq_number,
            nickname=user.nickname,
            group_nickname=guild_member.group_nickname,
            other_nickname=user.other_nickname
        ))

    return ResponseModel(data=BotMemberSearchResponse(members=members))
