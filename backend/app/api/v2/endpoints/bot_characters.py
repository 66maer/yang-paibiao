"""
Bot API - 角色管理
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.api.deps import get_current_bot, verify_bot_guild_access_by_qq
from app.models.bot import Bot
from app.models.user import User
from app.models.guild import Guild
from app.models.character import Character, CharacterPlayer
from app.schemas.bot import (
    BotCreateCharacterRequest,
    BotCharacterSimple,
    BotCharacterListResponse
)
from app.schemas.character import CharacterResponse
from app.schemas.common import ResponseModel

router = APIRouter()


@router.post(
    "/guilds/{guild_qq_number}/characters",
    response_model=ResponseModel[CharacterResponse]
)
async def create_character(
    guild_qq_number: str,
    payload: BotCreateCharacterRequest,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    创建角色（通过QQ群号）

    - 如果角色已存在且用户已关联，返回现有角色
    - 如果角色已存在但用户未关联，创建CharacterPlayer关联
    - 如果角色不存在，创建Character + CharacterPlayer
    - 如果未提供server参数，自动使用群组的服务器
    """
    # 验证Bot权限
    guild = await verify_bot_guild_access_by_qq(bot, guild_qq_number, db)

    # 确定服务器（优先使用请求中的server，否则使用guild的server）
    server = payload.server if payload.server else guild.server

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

    # 检查角色是否已存在（name + server）
    char_result = await db.execute(
        select(Character).where(
            Character.name == payload.name,
            Character.server == server,
            Character.deleted_at.is_(None)
        )
    )
    character = char_result.scalar_one_or_none()

    if character:
        # 检查用户是否已关联该角色
        cp_result = await db.execute(
            select(CharacterPlayer).where(
                CharacterPlayer.character_id == character.id,
                CharacterPlayer.user_id == user.id
            )
        )
        character_player = cp_result.scalar_one_or_none()

        if character_player:
            # 已关联，返回现有角色
            await db.refresh(character)
            return ResponseModel(
                data=CharacterResponse.from_orm(character),
                message="角色已存在"
            )
        else:
            # 未关联，创建关联
            character_player = CharacterPlayer(
                character_id=character.id,
                user_id=user.id,
                relation_type=payload.relation_type,
                priority=0
            )
            db.add(character_player)
            await db.commit()
            await db.refresh(character)
            return ResponseModel(
                data=CharacterResponse.from_orm(character),
                message="角色关联成功"
            )
    else:
        # 创建新角色
        character = Character(
            name=payload.name,
            server=server,
            xinfa=payload.xinfa,
            remark=None
        )
        db.add(character)
        await db.flush()

        # 创建角色-玩家关联
        character_player = CharacterPlayer(
            character_id=character.id,
            user_id=user.id,
            relation_type=payload.relation_type,
            priority=0
        )
        db.add(character_player)
        await db.commit()
        await db.refresh(character)

        return ResponseModel(
            data=CharacterResponse.from_orm(character),
            message="角色创建成功"
        )


@router.get(
    "/guilds/{guild_qq_number}/characters/{qq_number}",
    response_model=ResponseModel[BotCharacterListResponse]
)
async def get_user_characters(
    guild_qq_number: str,
    qq_number: str,
    bot: Bot = Depends(get_current_bot),
    db: AsyncSession = Depends(get_db)
):
    """
    查看指定用户的角色列表（通过QQ群号）
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

    # 查询该用户关联的所有角色
    result = await db.execute(
        select(Character, CharacterPlayer)
        .join(CharacterPlayer)
        .where(
            CharacterPlayer.user_id == user.id,
            Character.deleted_at.is_(None)
        )
        .order_by(CharacterPlayer.priority, Character.created_at)
    )
    rows = result.all()

    # 转换为BotCharacterSimple
    characters = [
        BotCharacterSimple(
            id=character.id,
            user_id=character_player.user_id,
            name=character.name,
            server=character.server,
            xinfa=character.xinfa,
            relation_type=character_player.relation_type,
            priority=character_player.priority,
            created_at=character.created_at
        )
        for character, character_player in rows
    ]

    return ResponseModel(data=BotCharacterListResponse(characters=characters))
