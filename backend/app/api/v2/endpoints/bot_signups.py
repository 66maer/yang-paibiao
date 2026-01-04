"""
Bot API - 报名管理
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access_by_qq
from app.models.bot import Bot
from app.models.user import User
from app.models.team import Team
from app.models.signup import Signup
from app.models.character import Character, CharacterPlayer
from app.schemas.bot import BotSignupRequest, BotCancelSignupRequest, BotSignupInfo, BotUserSignupsResponse
from app.schemas.signup import SignupOut
from app.schemas.common import ResponseModel

router = APIRouter()


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

    - 如果提供character_id，优先使用角色信息
    - 如果未提供character_id，必须提供character_name和xinfa
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 验证团队存在
    team_result = await db.execute(
        select(Team).where(Team.id == team_id, Team.guild_id == guild.id)
    )
    team = team_result.scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="团队不存在"
        )

    # 查找用户
    user_result = await db.execute(
        select(User).where(
            User.qq_number == payload.qq_number,
            User.deleted_at.is_(None)
        )
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {payload.qq_number} 未注册"
        )

    # 处理角色信息
    signup_character_id = None
    character_name = ""
    xinfa = payload.xinfa

    if payload.character_id:
        # 优先使用character_id
        char_result = await db.execute(
            select(Character)
            .join(CharacterPlayer)
            .where(
                Character.id == payload.character_id,
                CharacterPlayer.user_id == user.id,
                Character.deleted_at.is_(None)
            )
        )
        character = char_result.scalar_one_or_none()

        if not character:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"角色ID {payload.character_id} 不存在或不属于该用户"
            )

        signup_character_id = character.id
        character_name = character.name
        xinfa = character.xinfa
    elif payload.character_name:
        # 使用请求中的角色名
        character_name = payload.character_name
    else:
        # 模糊报名：只提供心法，不提供角色信息
        # character_name 留空，xinfa 使用请求中的值
        pass

    # 构建signup_info
    signup_info = {
        "submitter_name": user.nickname,
        "submitter_qq_number": user.qq_number,
        "player_name": user.nickname,
        "player_qq_number": user.qq_number,
        "character_name": character_name,
        "xinfa": xinfa
    }

    # 创建报名
    signup = Signup(
        team_id=team_id,
        submitter_id=user.id,
        signup_user_id=user.id,
        signup_character_id=signup_character_id,
        signup_info=signup_info,
        is_rich=payload.is_rich,
        is_proxy=False,  # Bot报名都是本人
        priority=0
    )

    db.add(signup)
    await db.commit()
    await db.refresh(signup)

    return ResponseModel(data=SignupOut.from_orm(signup))


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

    - 通过QQ号查找用户
    - 软删除报名记录（设置cancelled_at）
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 查找用户
    user_result = await db.execute(
        select(User).where(
            User.qq_number == payload.qq_number,
            User.deleted_at.is_(None)
        )
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {payload.qq_number} 未注册"
        )

    # 查找该用户在该团队的有效报名
    signup_result = await db.execute(
        select(Signup).where(
            Signup.team_id == team_id,
            Signup.signup_user_id == user.id,
            Signup.cancelled_at.is_(None)
        )
    )
    signup = signup_result.scalar_one_or_none()

    if not signup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到该用户的报名记录"
        )

    # 软删除：设置cancelled_at
    signup.cancelled_at = datetime.utcnow()
    # 注意：cancelled_by应该设置为操作者，但Bot没有用户ID，这里可以设置为None或者submitter_id
    signup.cancelled_by = signup.submitter_id

    await db.commit()

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

    - 返回该用户在指定团队的所有有效（未取消）报名
    - 用于取消报名时的多报名场景处理
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 验证团队存在
    team_result = await db.execute(
        select(Team).where(Team.id == team_id, Team.guild_id == guild.id)
    )
    team = team_result.scalar_one_or_none()

    if not team:
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ号 {qq_number} 未注册"
        )

    # 查找该用户在该团队的所有有效报名
    signups_result = await db.execute(
        select(Signup).where(
            Signup.team_id == team_id,
            Signup.signup_user_id == user.id,
            Signup.cancelled_at.is_(None)
        ).order_by(Signup.created_at.desc())
    )
    signups = signups_result.scalars().all()

    # 转换为响应格式
    signup_list = [
        BotSignupInfo(
            id=signup.id,
            signup_character_id=signup.signup_character_id,
            signup_info=signup.signup_info,
            is_rich=signup.is_rich,
            created_at=signup.created_at
        )
        for signup in signups
    ]

    return ResponseModel(data=BotUserSignupsResponse(signups=signup_list))
