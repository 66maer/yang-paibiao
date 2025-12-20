"""
群组成员相关用户接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild_member import GuildMember
from app.models.guild import Guild
from app.schemas.common import ResponseModel

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
