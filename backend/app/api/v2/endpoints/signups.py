"""
报名管理接口
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild_member import GuildMember
from app.models.team import Team
from app.models.signup import Signup
from app.models.character import Character
from app.schemas.common import ResponseModel, success
from app.schemas.signup import (
    SignupCreate,
    SignupUpdate,
    SignupLockRequest,
    SignupAbsentRequest,
    SignupOut,
    SignupInfo
)

router = APIRouter(prefix="/guilds", tags=["报名管理"])


def _ensure_member_with_role(member: GuildMember, roles: list[str]):
    """验证成员角色"""
    if member is None or member.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if member.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")


async def _get_guild_member(
    db: AsyncSession,
    guild_id: int,
    user_id: int
) -> Optional[GuildMember]:
    """获取群组成员"""
    result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == user_id,
            GuildMember.left_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


async def _verify_team_access(
    db: AsyncSession,
    guild_id: int,
    team_id: int,
    current_user: User,
    require_admin: bool = False
) -> Team:
    """验证团队访问权限"""
    # 验证成员身份
    member = await _get_guild_member(db, guild_id, current_user.id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    
    # 如果需要管理员权限
    if require_admin:
        _ensure_member_with_role(member, roles=["owner", "helper"])
    
    # 验证团队存在
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")
    
    return team


async def _process_signup_info(
    db: AsyncSession,
    signup_info: SignupInfo,
    signup_user_id: Optional[int],
    signup_character_id: Optional[int],
    submitter: User
) -> dict:
    """
    处理报名信息的字段覆盖逻辑
    返回处理后的 signup_info 字典
    """
    result_info = {
        "submitter_name": submitter.nickname,  # 总是使用当前登录用户
        "player_name": signup_info.player_name,
        "character_name": signup_info.character_name,
        "xinfa": signup_info.xinfa
    }
    
    # 如果有 signup_user_id，从数据库取用户昵称覆盖
    if signup_user_id:
        user_result = await db.execute(
            select(User).where(User.id == signup_user_id, User.deleted_at.is_(None))
        )
        signup_user = user_result.scalar_one_or_none()
        if signup_user:
            result_info["player_name"] = signup_user.nickname
    
    # 如果有 signup_character_id，从数据库取角色名和心法覆盖
    if signup_character_id:
        char_result = await db.execute(
            select(Character).where(Character.id == signup_character_id)
        )
        character = char_result.scalar_one_or_none()
        if character:
            result_info["character_name"] = character.name
            result_info["xinfa"] = character.xinfa
    
    return result_info


@router.post("/{guild_id}/teams/{team_id}/signups", response_model=ResponseModel[SignupOut])
async def create_signup(
    guild_id: int,
    team_id: int,
    payload: SignupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """提交报名"""
    # 验证团队访问权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=False)
    
    # 处理 signup_info 字段（ID 覆盖逻辑）
    processed_info = await _process_signup_info(
        db,
        payload.signup_info,
        payload.signup_user_id,
        payload.signup_character_id,
        current_user
    )
    
    # 判断是否代报
    is_proxy = (
        payload.signup_user_id is None or 
        payload.signup_user_id != current_user.id
    )
    
    # 创建报名
    signup = Signup(
        team_id=team_id,
        submitter_id=current_user.id,
        signup_user_id=payload.signup_user_id,
        signup_character_id=payload.signup_character_id,
        signup_info=processed_info,
        is_rich=payload.is_rich,
        is_proxy=is_proxy,
        priority=0,
        is_absent=False
    )
    
    db.add(signup)
    await db.commit()
    await db.refresh(signup)
    
    return success(SignupOut.model_validate(signup), message="报名成功")


@router.get("/{guild_id}/teams/{team_id}/signups", response_model=ResponseModel[List[SignupOut]])
async def list_signups(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取报名列表（含历史）"""
    # 验证团队访问权限，需要管理员权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=True)
    
    # 获取所有报名（包括已取消的）
    result = await db.execute(
        select(Signup).where(
            Signup.team_id == team_id
        ).order_by(Signup.created_at.asc())
    )
    signups = result.scalars().all()
    
    return success([SignupOut.model_validate(s) for s in signups], message="获取成功")


@router.put("/{guild_id}/teams/{team_id}/signups/{signup_id}", response_model=ResponseModel[SignupOut])
async def update_signup(
    guild_id: int,
    team_id: int,
    signup_id: int,
    payload: SignupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新报名信息"""
    # 验证团队访问权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=False)
    
    # 获取报名
    result = await db.execute(
        select(Signup).where(
            Signup.id == signup_id,
            Signup.team_id == team_id
        )
    )
    signup = result.scalar_one_or_none()
    if signup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报名不存在")
    
    # 权限验证：报名提交者或群主/管理员可更新
    member = await _get_guild_member(db, guild_id, current_user.id)
    is_admin = member and member.role in ["owner", "helper"]
    is_submitter = signup.submitter_id == current_user.id
    
    if not (is_submitter or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    
    # 更新字段
    if payload.signup_user_id is not None:
        signup.signup_user_id = payload.signup_user_id
    
    if payload.signup_character_id is not None:
        signup.signup_character_id = payload.signup_character_id
    
    if payload.is_rich is not None:
        signup.is_rich = payload.is_rich
    
    # 如果有更新 signup_info，需要重新处理字段覆盖逻辑
    if payload.signup_info is not None:
        processed_info = await _process_signup_info(
            db,
            payload.signup_info,
            signup.signup_user_id,
            signup.signup_character_id,
            current_user
        )
        signup.signup_info = processed_info
        
        # 重新判断是否代报
        signup.is_proxy = (
            signup.signup_user_id is None or 
            signup.signup_user_id != current_user.id
        )
    
    await db.commit()
    await db.refresh(signup)
    
    return success(SignupOut.model_validate(signup), message="更新成功")


@router.post("/{guild_id}/teams/{team_id}/signups/{signup_id}/lock", response_model=ResponseModel[SignupOut])
async def lock_signup(
    guild_id: int,
    team_id: int,
    signup_id: int,
    payload: SignupLockRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """锁定报名位置"""
    # 验证团队访问权限，需要管理员权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=True)
    
    # 获取报名
    result = await db.execute(
        select(Signup).where(
            Signup.id == signup_id,
            Signup.team_id == team_id
        )
    )
    signup = result.scalar_one_or_none()
    if signup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报名不存在")
    
    # 锁定位置
    signup.slot_position = payload.slot_position
    
    await db.commit()
    await db.refresh(signup)
    
    return success(SignupOut.model_validate(signup), message="锁定成功")


@router.post("/{guild_id}/teams/{team_id}/signups/{signup_id}/absent", response_model=ResponseModel[SignupOut])
async def mark_absent(
    guild_id: int,
    team_id: int,
    signup_id: int,
    payload: SignupAbsentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记缺席"""
    # 验证团队访问权限，需要管理员权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=True)
    
    # 获取报名
    result = await db.execute(
        select(Signup).where(
            Signup.id == signup_id,
            Signup.team_id == team_id
        )
    )
    signup = result.scalar_one_or_none()
    if signup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报名不存在")
    
    # 标记缺席
    signup.is_absent = payload.is_absent
    
    await db.commit()
    await db.refresh(signup)
    
    return success(SignupOut.model_validate(signup), message="标记成功")


@router.delete("/{guild_id}/teams/{team_id}/signups/{signup_id}", response_model=ResponseModel)
async def cancel_signup(
    guild_id: int,
    team_id: int,
    signup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取消报名"""
    # 验证团队访问权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=False)
    
    # 获取报名
    result = await db.execute(
        select(Signup).where(
            Signup.id == signup_id,
            Signup.team_id == team_id
        )
    )
    signup = result.scalar_one_or_none()
    if signup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报名不存在")
    
    # 权限验证：报名提交者或群主/管理员可取消
    member = await _get_guild_member(db, guild_id, current_user.id)
    is_admin = member and member.role in ["owner", "helper"]
    is_submitter = signup.submitter_id == current_user.id
    
    if not (is_submitter or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    
    # 软删除：标记取消时间和取消者
    signup.cancelled_at = datetime.utcnow()
    signup.cancelled_by = current_user.id
    
    await db.commit()
    
    return success(message="取消成功")
