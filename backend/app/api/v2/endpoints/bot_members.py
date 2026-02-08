"""
Bot API - 成员管理
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access_by_qq
from app.models.bot import Bot
from app.models.guild import Guild
from app.models.user import User
from app.models.guild_member import GuildMember
from app.models.ranking_snapshot import RankingSnapshot
from app.models.member_change_history import MemberChangeHistory
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
    BotSyncMembersRequest,
    BotSyncMembersResponse,
    BotSyncMemberResult,
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
                
                # 恢复该用户在该群组的红黑榜记录（如果有被软删除的）
                await db.execute(
                    update(RankingSnapshot)
                    .where(
                        RankingSnapshot.guild_id == guild.id,
                        RankingSnapshot.user_id == user.id,
                        RankingSnapshot.deleted_at.isnot(None)
                    )
                    .values(deleted_at=None)
                )
                
                # 记录变更历史
                history = MemberChangeHistory(
                    guild_id=guild.id,
                    user_id=user.id,
                    action="restore",
                    reason="bot_sync",
                    notes="成员重新加入群组，恢复红黑榜记录"
                )
                db.add(history)
                
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
                
                # 记录变更历史
                history = MemberChangeHistory(
                    guild_id=guild.id,
                    user_id=user.id,
                    action="join",
                    reason="bot_sync",
                    notes="新成员加入群组"
                )
                db.add(history)
                
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
            
            # 软删除该用户在该群组的红黑榜记录
            await db.execute(
                update(RankingSnapshot)
                .where(
                    RankingSnapshot.guild_id == guild.id,
                    RankingSnapshot.user_id == user.id,
                    RankingSnapshot.deleted_at.is_(None)
                )
                .values(deleted_at=datetime.utcnow())
            )
            
            # 记录变更历史
            history = MemberChangeHistory(
                guild_id=guild.id,
                user_id=user.id,
                action="leave",
                reason="bot_sync",
                notes="成员离开群组，红黑榜记录已隐藏"
            )
            db.add(history)
            
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
                GuildMember.group_nickname.like(search_pattern)
            )
        )
    )

    members = []
    for user, guild_member in result.all():
        # 检查 other_nicknames 数组中是否有匹配项
        matches_other_nicknames = False
        if user.other_nicknames:
            for other_nick in user.other_nicknames:
                if other_nick and nickname.lower() in other_nick.lower():
                    matches_other_nicknames = True
                    break
        
        # 如果不匹配且也不在 nickname 或 group_nickname 中匹配，则跳过
        if not matches_other_nicknames:
            matches_nickname = user.nickname and nickname.lower() in user.nickname.lower()
            matches_group_nickname = guild_member.group_nickname and nickname.lower() in guild_member.group_nickname.lower()
            if not (matches_nickname or matches_group_nickname):
                continue
        
        members.append(BotMemberInfo(
            user_id=user.id,
            qq_number=user.qq_number,
            nickname=user.nickname,
            group_nickname=guild_member.group_nickname,
            other_nickname=user.other_nicknames[0] if user.other_nicknames else None
        ))

    return ResponseModel(data=BotMemberSearchResponse(members=members))


@router.post(
    "/guilds/{guild_qq_number}/members/sync",
    response_model=ResponseModel[BotSyncMembersResponse]
)
async def sync_members(
    guild_qq_number: str,
    payload: BotSyncMembersRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    同步群组成员（通过QQ群号）
    
    以传入的成员列表为准：
    - 新成员：添加到群组
    - 已存在成员：更新信息
    - 曾离开成员：恢复（清除left_at），同时恢复关联的金团记录
    - 不在列表中的活跃成员：软删除（设置left_at），同时软删除关联的金团记录
    - 记录所有变更历史
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)
    
    results = []
    added_count = 0
    updated_count = 0
    removed_count = 0
    restored_count = 0
    unchanged_count = 0
    error_count = 0
    
    # 构建传入的QQ号集合
    input_qq_numbers = {m.qq_number for m in payload.members}
    
    # 获取当前群组的所有活跃成员
    current_members_result = await db.execute(
        select(GuildMember, User)
        .join(User, User.id == GuildMember.user_id)
        .where(
            GuildMember.guild_id == guild.id,
            GuildMember.left_at.is_(None),
            User.deleted_at.is_(None)
        )
    )
    current_members = {row.User.qq_number: (row.GuildMember, row.User) for row in current_members_result.all()}
    current_qq_numbers = set(current_members.keys())
    
    # 1. 处理传入的成员列表（添加/更新/恢复）
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
                # 创建新用户
                user = User(
                    qq_number=member_data.qq_number,
                    password_hash=get_password_hash("123456"),
                    nickname=member_data.nickname
                )
                db.add(user)
                await db.flush()
            
            # 查找群成员关系
            gm_result = await db.execute(
                select(GuildMember).where(
                    GuildMember.guild_id == guild.id,
                    GuildMember.user_id == user.id
                )
            )
            gm = gm_result.scalar_one_or_none()
            
            if gm and gm.left_at is None:
                # 已是活跃成员，检查是否需要更新
                if member_data.group_nickname and gm.group_nickname != member_data.group_nickname:
                    gm.group_nickname = member_data.group_nickname
                    updated_count += 1
                    results.append(BotSyncMemberResult(
                        qq_number=member_data.qq_number,
                        action="updated",
                        message="更新群昵称"
                    ))
                else:
                    unchanged_count += 1
                    results.append(BotSyncMemberResult(
                        qq_number=member_data.qq_number,
                        action="unchanged",
                        message="成员信息无变化"
                    ))
            elif gm and gm.left_at is not None:
                # 曾离开，恢复
                gm.left_at = None
                gm.joined_at = datetime.utcnow()
                if member_data.group_nickname:
                    gm.group_nickname = member_data.group_nickname
                
                # 恢复关联的红黑榜记录
                await db.execute(
                    update(RankingSnapshot)
                    .where(
                        RankingSnapshot.guild_id == guild.id,
                        RankingSnapshot.user_id == user.id,
                        RankingSnapshot.deleted_at.isnot(None)
                    )
                    .values(deleted_at=None)
                )
                
                # 记录变更历史
                history = MemberChangeHistory(
                    guild_id=guild.id,
                    user_id=user.id,
                    action="restore",
                    reason="bot_sync",
                    notes="成员重新加入群组，恢复红黑榜记录"
                )
                db.add(history)
                
                restored_count += 1
                results.append(BotSyncMemberResult(
                    qq_number=member_data.qq_number,
                    action="restored",
                    message="成员恢复"
                ))
            else:
                # 新成员
                gm = GuildMember(
                    guild_id=guild.id,
                    user_id=user.id,
                    role="member",
                    group_nickname=member_data.group_nickname
                )
                db.add(gm)
                
                # 记录变更历史
                history = MemberChangeHistory(
                    guild_id=guild.id,
                    user_id=user.id,
                    action="join",
                    reason="bot_sync",
                    notes="新成员加入群组"
                )
                db.add(history)
                
                added_count += 1
                results.append(BotSyncMemberResult(
                    qq_number=member_data.qq_number,
                    action="added",
                    message="新成员添加"
                ))
            
            await db.flush()
            
        except Exception as e:
            error_count += 1
            results.append(BotSyncMemberResult(
                qq_number=member_data.qq_number,
                action="error",
                message=str(e)
            ))
    
    # 2. 处理不在传入列表中的活跃成员（移除）
    members_to_remove = current_qq_numbers - input_qq_numbers
    for qq_number in members_to_remove:
        try:
            gm, user = current_members[qq_number]
            
            # 不能移除群主
            if gm.role == "owner":
                results.append(BotSyncMemberResult(
                    qq_number=qq_number,
                    action="error",
                    message="不能移除群主"
                ))
                error_count += 1
                continue
            
            # 软删除成员
            gm.left_at = datetime.utcnow()
            
            # 软删除关联的红黑榜记录
            await db.execute(
                update(RankingSnapshot)
                .where(
                    RankingSnapshot.guild_id == guild.id,
                    RankingSnapshot.user_id == user.id,
                    RankingSnapshot.deleted_at.is_(None)
                )
                .values(deleted_at=datetime.utcnow())
            )
            
            # 记录变更历史
            history = MemberChangeHistory(
                guild_id=guild.id,
                user_id=user.id,
                action="leave",
                reason="bot_sync",
                notes="成员离开群组（同步移除），红黑榜记录已隐藏"
            )
            db.add(history)
            
            await db.flush()
            
            removed_count += 1
            results.append(BotSyncMemberResult(
                qq_number=qq_number,
                action="removed",
                message="成员已移除"
            ))
            
        except Exception as e:
            error_count += 1
            results.append(BotSyncMemberResult(
                qq_number=qq_number,
                action="error",
                message=str(e)
            ))
    
    await db.commit()
    
    return ResponseModel(data=BotSyncMembersResponse(
        added_count=added_count,
        updated_count=updated_count,
        removed_count=removed_count,
        restored_count=restored_count,
        unchanged_count=unchanged_count,
        error_count=error_count,
        results=results
    ))
