"""
Bot API - 报名管理（重构版）

处理模式：
1. 自己报名：submitter_id = signup_user_id = 当前用户
2. 代他人报名：submitter_id = 当前用户，signup_user_id = null
3. 登记老板：submitter_id = 当前用户，signup_user_id = null，is_rich = true
4. 取消报名：必须使用 signup_id 精确取消
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access_by_qq
from app.models.bot import Bot
from app.models.user import User
from app.models.guild_member import GuildMember
from app.models.team import Team
from app.models.signup import Signup
from app.models.character import Character, CharacterPlayer
from app.schemas.bot import BotSignupRequest, BotCancelSignupRequest, BotSignupInfo, BotUserSignupsResponse
from app.schemas.signup import SignupOut
from app.schemas.common import ResponseModel
from app.core.logging import get_logger
from app.services.slot_allocation_service import SlotAllocationService

logger = get_logger(__name__)
router = APIRouter()


async def _get_user_nickname(
    db: AsyncSession,
    guild_id: int,
    user_id: int
) -> str:
    """
    获取用户昵称，优先级：群昵称 > 用户主昵称 > 用户其他昵称
    """
    # 先尝试获取群昵称
    member_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == user_id,
            GuildMember.left_at.is_(None)
        )
    )
    member = member_result.scalar_one_or_none()
    if member and member.group_nickname:
        return member.group_nickname

    # 获取用户信息
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()
    if not user:
        return "未知用户"

    # 优先返回主昵称
    if user.nickname:
        return user.nickname

    # 最后尝试其他昵称
    if user.other_nicknames and len(user.other_nicknames) > 0:
        return user.other_nicknames[0]

    return "未知用户"


@router.post(
    "/guilds/{guild_qq_number}/teams/{team_id}/signups",
    response_model=ResponseModel[SignupOut]
)
async def create_signup(
    guild_qq_number: str,
    team_id: int,
    payload: BotSignupRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    提交报名（通过QQ群号）

    支持三种模式：
    1. 自己报名（is_proxy=False）：
       - submitter_id = signup_user_id = 当前用户
       - 可选：通过 character_id 关联角色
    
    2. 代他人报名（is_proxy=True, is_rich=False）：
       - submitter_id = 当前用户
       - signup_user_id = null（无法确定被代报者的系统用户ID）
       - player_name 必填（被代报者的昵称）
    
    3. 登记老板（is_proxy=True, is_rich=True）：
       - submitter_id = 当前用户
       - signup_user_id = null
       - player_name 必填（老板的昵称）
    """
    logger.info(f"收到报名请求 - 群号: {guild_qq_number}, 团队ID: {team_id}, QQ: {payload.qq_number}, 代报: {payload.is_proxy}, 老板: {payload.is_rich}")

    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)
    logger.debug(f"验证通过 - 公会ID: {guild.id}")

    # 验证团队存在
    team_result = await db.execute(
        select(Team).where(Team.id == team_id, Team.guild_id == guild.id)
    )
    team = team_result.scalar_one_or_none()

    if not team:
        logger.warning(f"团队不存在 - 团队ID: {team_id}, 公会ID: {guild.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="团队不存在"
        )

    logger.debug(f"找到团队 - 团队名称: {team.title}")

    # 查找提交者用户
    submitter_result = await db.execute(
        select(User).where(
            User.qq_number == payload.qq_number,
            User.deleted_at.is_(None)
        )
    )
    submitter = submitter_result.scalar_one_or_none()

    if not submitter:
        logger.warning(f"用户未注册 - QQ号: {payload.qq_number}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {payload.qq_number} 未注册"
        )

    # 获取提交者昵称
    submitter_nickname = await _get_user_nickname(db, guild.id, submitter.id)
    logger.debug(f"找到提交者 - 用户ID: {submitter.id}, 昵称: {submitter_nickname}")

    # 根据模式处理
    if payload.is_proxy:
        # 代报名或登记老板模式
        if not payload.player_name:
            logger.warning(f"代报名缺少player_name - QQ: {payload.qq_number}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="代报名或登记老板时必须提供 player_name"
            )

        # 构建 signup_info
        if payload.is_rich:
            # 登记老板模式
            logger.info(f"登记老板模式 - 提交者: {submitter_nickname}, 老板名称: {payload.player_name}, 心法: {payload.xinfa}")
            signup_info = {
                "submitter_name": submitter_nickname,
                "submitter_qq_number": payload.qq_number,
                "player_name": payload.player_name,  # 老板名称
                "player_qq_number": None,
                "character_name": "",
                "xinfa": payload.xinfa,
            }
        else:
            # 代他人报名模式
            logger.info(f"代他人报名模式 - 提交者: {submitter_nickname}, 被代报者: {payload.player_name}, 心法: {payload.xinfa}")
            signup_info = {
                "submitter_name": submitter_nickname,
                "submitter_qq_number": payload.qq_number,
                "player_name": payload.player_name,
                "player_qq_number": None,
                "character_name": payload.character_name or "",
                "xinfa": payload.xinfa,
            }
        
        # 创建报名记录
        signup = Signup(
            team_id=team_id,
            submitter_id=submitter.id,
            signup_user_id=None,  # 代报名时无法确定用户ID
            signup_character_id=None,  # 代报名时无法确定角色ID
            signup_info=signup_info,
            is_rich=payload.is_rich,
            is_proxy=True,
            priority=0
        )
    else:
        # 自己报名模式
        logger.info(f"自己报名模式 - 用户: {submitter_nickname}, 心法: {payload.xinfa}")
        signup_character_id = None
        character_name = payload.character_name or ""

        # 如果提供了 character_id，验证角色
        if payload.character_id:
            char_result = await db.execute(
                select(Character)
                .join(CharacterPlayer)
                .where(
                    Character.id == payload.character_id,
                    CharacterPlayer.user_id == submitter.id,
                    Character.deleted_at.is_(None)
                )
            )
            character = char_result.scalar_one_or_none()

            if not character:
                logger.warning(f"角色不存在或不属于用户 - 角色ID: {payload.character_id}, 用户ID: {submitter.id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"角色ID {payload.character_id} 不存在或不属于该用户"
                )

            signup_character_id = character.id
            character_name = character.name
            logger.debug(f"关联角色 - 角色ID: {character.id}, 角色名: {character_name}")
            # 如果角色有心法，可以覆盖（但通常保持请求中的心法）
        
        # 构建 signup_info
        signup_info = {
            "submitter_name": submitter_nickname,
            "submitter_qq_number": payload.qq_number,
            "player_name": submitter_nickname,
            "player_qq_number": payload.qq_number,
            "character_name": character_name,
            "xinfa": payload.xinfa,
        }
        
        # 创建报名记录
        signup = Signup(
            team_id=team_id,
            submitter_id=submitter.id,
            signup_user_id=submitter.id,  # 自己报名
            signup_character_id=signup_character_id,
            signup_info=signup_info,
            is_rich=payload.is_rich,
            is_proxy=False,
            priority=0
        )

    db.add(signup)
    await db.flush()  # 先flush以获取signup.id
    
    # 调用排坑服务重新分配
    allocation_result = await SlotAllocationService.reallocate(db, team_id, signup.id)
    
    await db.commit()
    await db.refresh(signup)
    
    # 获取分配结果
    allocation_status = "unallocated"
    allocated_slot = None
    waitlist_position = None
    
    if signup.id in allocation_result.signup_results:
        alloc_status, alloc_index = allocation_result.signup_results[signup.id]
        allocation_status = alloc_status
        if alloc_status == "allocated":
            allocated_slot = alloc_index
        elif alloc_status == "waitlist":
            waitlist_position = alloc_index

    logger.info(f"报名成功 - 报名ID: {signup.id}, 团队ID: {team_id}, 提交者: {submitter_nickname}, 分配状态: {allocation_status}")

    # 构建响应
    signup_out = SignupOut.model_validate(signup)
    signup_out.allocation_status = allocation_status
    signup_out.allocated_slot = allocated_slot
    signup_out.waitlist_position = waitlist_position

    # 根据分配状态返回不同的消息
    if allocation_status == "allocated":
        response_message = "报名成功"
    elif allocation_status == "waitlist":
        response_message = "登记成功，在候补列表"
    else:
        response_message = "报名成功，但暂时无法分配坑位"

    return ResponseModel(data=signup_out, message=response_message)


@router.delete(
    "/guilds/{guild_qq_number}/teams/{team_id}/signups",
    response_model=ResponseModel
)
async def cancel_signup(
    guild_qq_number: str,
    team_id: int,
    payload: BotCancelSignupRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    取消报名（通过QQ群号）

    必须提供 signup_id 进行精确取消。
    只有报名的提交者或报名用户本人可以取消。
    """
    logger.info(f"收到取消报名请求 - 群号: {guild_qq_number}, 团队ID: {team_id}, QQ: {payload.qq_number}, 报名ID: {payload.signup_id}")

    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 查找操作者用户
    user_result = await db.execute(
        select(User).where(
            User.qq_number == payload.qq_number,
            User.deleted_at.is_(None)
        )
    )
    user = user_result.scalar_one_or_none()

    if not user:
        logger.warning(f"用户未注册 - QQ号: {payload.qq_number}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {payload.qq_number} 未注册"
        )

    logger.debug(f"找到操作者 - 用户ID: {user.id}")

    # 查找报名记录
    signup_result = await db.execute(
        select(Signup).where(
            Signup.id == payload.signup_id,
            Signup.team_id == team_id,
            Signup.cancelled_at.is_(None)
        )
    )
    signup = signup_result.scalar_one_or_none()

    if not signup:
        logger.warning(f"报名记录不存在或已取消 - 报名ID: {payload.signup_id}, 团队ID: {team_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"报名记录 {payload.signup_id} 不存在或已取消"
        )

    # 验证权限：只有提交者或报名用户本人可以取消
    can_cancel = (
        signup.submitter_id == user.id or
        (signup.signup_user_id is not None and signup.signup_user_id == user.id)
    )

    if not can_cancel:
        logger.warning(f"无权限取消报名 - 用户ID: {user.id}, 报名ID: {signup.id}, 提交者ID: {signup.submitter_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="你没有权限取消这条报名记录"
        )

    # 软删除：设置 cancelled_at
    signup.cancelled_at = datetime.utcnow()
    signup.cancelled_by = user.id

    # 重新分配坑位（取消的报名会被移除，候补可能会补上）
    await SlotAllocationService.reallocate(db, team_id)

    await db.commit()

    logger.info(f"取消报名成功 - 报名ID: {signup.id}, 团队ID: {team_id}, 操作者ID: {user.id}")

    return ResponseModel(message="报名已取消")


@router.get(
    "/guilds/{guild_qq_number}/teams/{team_id}/signups/{qq_number}",
    response_model=ResponseModel[BotUserSignupsResponse]
)
async def get_user_signups(
    guild_qq_number: str,
    team_id: int,
    qq_number: str,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    查询用户在某个团队的所有报名记录（通过QQ群号）

    返回该用户相关的所有有效（未取消）报名，包括：
    1. 自己给自己的报名
    2. 自己给别人的代报名
    3. 别人给自己的代报名（如果 signup_user_id 匹配）

    注意：代报名时 signup_user_id 通常为空，所以主要返回的是 submitter_id 匹配的记录
    """
    logger.info(f"查询用户报名记录 - 群号: {guild_qq_number}, 团队ID: {team_id}, QQ: {qq_number}")

    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 验证团队存在
    team_result = await db.execute(
        select(Team).where(Team.id == team_id, Team.guild_id == guild.id)
    )
    team = team_result.scalar_one_or_none()

    if not team:
        logger.warning(f"团队不存在 - 团队ID: {team_id}, 公会ID: {guild.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="团队不存在"
        )

    # 查找用户
    user_result = await db.execute(
        select(User).where(
            User.qq_number == qq_number,
            User.deleted_at.is_(None)
        )
    )
    user = user_result.scalar_one_or_none()

    if not user:
        logger.warning(f"用户未注册 - QQ号: {qq_number}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {qq_number} 未注册"
        )

    logger.debug(f"找到用户 - 用户ID: {user.id}")

    # 查找该用户相关的所有有效报名
    # 包括：submitter_id 是该用户 或 signup_user_id 是该用户
    signups_result = await db.execute(
        select(Signup).where(
            Signup.team_id == team_id,
            or_(
                Signup.submitter_id == user.id,
                Signup.signup_user_id == user.id
            ),
            Signup.cancelled_at.is_(None)
        ).order_by(Signup.created_at.desc())
    )
    signups = signups_result.scalars().all()

    logger.info(f"查询到 {len(signups)} 条报名记录 - 用户ID: {user.id}, 团队ID: {team_id}")

    # 转换为响应格式
    signup_list = [
        BotSignupInfo(
            id=signup.id,
            team_id=signup.team_id,
            submitter_id=signup.submitter_id,
            signup_user_id=signup.signup_user_id,
            signup_character_id=signup.signup_character_id,
            signup_info=signup.signup_info,
            is_rich=signup.is_rich,
            is_proxy=signup.is_proxy,
            created_at=signup.created_at
        )
        for signup in signups
    ]

    return ResponseModel(data=BotUserSignupsResponse(signups=signup_list))
