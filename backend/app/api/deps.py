"""
API依赖项
包含认证、权限检查等通用依赖
"""
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.logging import get_logger
from app.database import get_db
from app.core.security import verify_token, verify_password
from app.models.user import User
from app.models.admin import SystemAdmin
from app.models.bot import Bot, BotGuild
from app.models.guild import Guild
from app.models.guild_member import GuildMember

logger = get_logger(__name__)

# HTTP Bearer 认证
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    获取当前登录的用户

    Args:
        credentials: HTTP Bearer凭证
        db: 数据库会话

    Returns:
        User: 当前用户对象

    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = verify_token(token, token_type="access")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_type = payload.get("type")  # 修改为 type
    user_id = payload.get("sub")

    if user_type != "user" or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户类型",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 查询用户
    result = await db.execute(
        select(User).where(User.id == int(user_id), User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    return user


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> SystemAdmin:
    """
    获取当前登录的管理员

    Args:
        credentials: HTTP Bearer凭证
        db: 数据库会话

    Returns:
        SystemAdmin: 当前管理员对象

    Raises:
        HTTPException: 认证失败
    """
    token = credentials.credentials
    payload = verify_token(token, token_type="access")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_type = payload.get("type")  # 修改为 type
    admin_id = payload.get("sub")

    if user_type != "admin" or not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的管理员类型",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 查询管理员
    result = await db.execute(
        select(SystemAdmin).where(SystemAdmin.id == int(admin_id))
    )
    admin = result.scalar_one_or_none()

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员不存在"
        )

    return admin


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    获取当前用户（可选）
    如果未提供认证信息，返回None

    Args:
        credentials: HTTP Bearer凭证（可选）
        db: 数据库会话

    Returns:
        Optional[User]: 当前用户对象或None
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_current_bot(
    api_key: str = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db)
) -> Bot:
    """
    获取当前机器人

    Args:
        api_key: API Key（从X-API-Key请求头获取）
        db: 数据库会话

    Returns:
        Bot: 当前Bot对象

    Raises:
        HTTPException: 认证失败
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少API Key",
            headers={"WWW-Authenticate": "X-API-Key"},
        )

    # 从API Key提取bot_name（格式：bot_<bot_name>_<random>）
    try:
        parts = api_key.split('_')
        if len(parts) < 3 or parts[0] != 'bot':
            raise ValueError("Invalid API Key format")
        bot_name = parts[1]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的API Key格式"
        )

    # 查询Bot
    result = await db.execute(
        select(Bot).where(Bot.bot_name == bot_name)
    )
    bot = result.scalar_one_or_none()

    if not bot:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bot不存在"
        )

    # 验证API Key
    if not verify_password(api_key, bot.api_key_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的API Key"
        )

    # 检查是否激活
    if not bot.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bot已被停用"
        )

    # 更新最后使用时间（异步执行）
    bot.last_used_at = datetime.utcnow()
    await db.commit()

    return bot


async def verify_bot_guild_access_by_qq(
    bot: Bot,
    guild_qq_number: str,
    db: AsyncSession
) -> Guild:
    """
    验证Bot对指定QQ群的访问权限（通过QQ群号）

    Args:
        bot: Bot对象
        guild_qq_number: QQ群号
        db: 数据库会话

    Returns:
        Guild: 群组对象

    Raises:
        HTTPException: 权限验证失败
    """
    # 先根据 QQ 群号查询 guild
    guild_result = await db.execute(
        select(Guild).where(
            Guild.guild_qq_number == guild_qq_number,
            Guild.deleted_at.is_(None)
        )
    )
    guild = guild_result.scalar_one_or_none()

    if not guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QQ群 {guild_qq_number} 未注册"
        )

    # 检查Bot是否被授权访问该群组
    result = await db.execute(
        select(BotGuild).where(
            BotGuild.bot_id == bot.id,
            BotGuild.guild_id == guild.id
        )
    )
    bot_guild = result.scalar_one_or_none()

    if not bot_guild:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bot未被授权访问QQ群 {guild_qq_number}"
        )

    return guild


async def get_current_guild(
    x_guild_id: Optional[str] = Header(None, alias="X-Guild-Id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Guild:
    """
    获取当前选中的群组
    
    通过 X-Guild-Id 请求头获取群组 ID
    
    Args:
        x_guild_id: 群组ID（从X-Guild-Id请求头获取）
        db: 数据库会话
        current_user: 当前用户
    
    Returns:
        Guild: 当前群组对象
    
    Raises:
        HTTPException: 未选择群组或群组不存在
    """
    if not x_guild_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先选择一个群组"
        )
    
    try:
        guild_id = int(x_guild_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的群组ID"
        )
    
    # 查询群组
    result = await db.execute(
        select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None))
    )
    guild = result.scalar_one_or_none()
    
    if not guild:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="群组不存在"
        )
    
    # 验证用户是否是群组成员
    member_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该群组的成员"
        )
    
    return guild


async def get_current_member_role(
    x_guild_id: Optional[str] = Header(None, alias="X-Guild-Id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> str:
    """
    获取当前用户在选中群组中的角色
    
    Args:
        x_guild_id: 群组ID（从X-Guild-Id请求头获取）
        db: 数据库会话
        current_user: 当前用户
    
    Returns:
        str: 角色（owner/helper/member）
    
    Raises:
        HTTPException: 未选择群组或不是群组成员
    """
    if not x_guild_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先选择一个群组"
        )
    
    try:
        guild_id = int(x_guild_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的群组ID"
        )
    
    # 查询成员关系
    result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该群组的成员"
        )
    
    return member.role
