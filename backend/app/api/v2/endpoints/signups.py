"""
报名管理接口
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
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
    SignupPresenceRequest,
    SignupAssignRequest,
    SignupOut,
    SignupInfo
)
from app.services.team_log_service import TeamLogService
from app.services.slot_allocation_service import SlotAllocationService

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


async def _enrich_signup_response(
    db: AsyncSession,
    guild_id: int,
    signup: Signup
) -> SignupOut:
    """
    在返回 signup 数据时，动态覆盖 signup_info 中的昵称和 QQ 号
    不修改数据库，仅处理返回数据
    """
    # 复制 signup_info（避免修改原始数据）
    enriched_info = dict(signup.signup_info)

    # 确保必需字段存在且不为 None
    if enriched_info.get("character_name") is None:
        enriched_info["character_name"] = ""

    # 获取提交者的昵称和 QQ 号
    submitter_nickname = await _get_user_nickname(db, guild_id, signup.submitter_id)
    submitter_result = await db.execute(
        select(User).where(User.id == signup.submitter_id, User.deleted_at.is_(None))
    )
    submitter = submitter_result.scalar_one_or_none()

    enriched_info["submitter_name"] = submitter_nickname
    enriched_info["submitter_qq_number"] = submitter.qq_number if submitter else None

    # 如果有 signup_user_id，获取报名者的昵称和 QQ 号
    if signup.signup_user_id:
        player_nickname = await _get_user_nickname(db, guild_id, signup.signup_user_id)
        player_result = await db.execute(
            select(User).where(User.id == signup.signup_user_id, User.deleted_at.is_(None))
        )
        player = player_result.scalar_one_or_none()

        enriched_info["player_name"] = player_nickname
        enriched_info["player_qq_number"] = player.qq_number if player else None
    else:
        # 没有 signup_user_id，player_qq_number 为 None
        enriched_info["player_qq_number"] = None

    # 创建 SignupOut 对象
    signup_dict = {
        "id": signup.id,
        "team_id": signup.team_id,
        "submitter_id": signup.submitter_id,
        "signup_user_id": signup.signup_user_id,
        "signup_character_id": signup.signup_character_id,
        "signup_info": enriched_info,
        "priority": signup.priority,
        "is_rich": signup.is_rich,
        "is_proxy": signup.is_proxy,
        "slot_position": signup.slot_position,
        "presence_status": signup.presence_status,
        "cancelled_at": signup.cancelled_at,
        "cancelled_by": signup.cancelled_by,
        "created_at": signup.created_at,
        "updated_at": signup.updated_at
    }

    return SignupOut(**signup_dict)


async def _process_signup_info(
    db: AsyncSession,
    signup_info: SignupInfo,
    signup_character_id: Optional[int]
) -> dict:
    """
    处理报名信息的字段覆盖逻辑（仅在报名时使用）
    只检查 signup_character_id，不检查 signup_user_id
    返回处理后的 signup_info 字典
    
    注意：心法(xinfa)使用前端传递的值，不再用角色主心法覆盖
    这是为了支持多修角色切换心法报名的场景
    """
    result_info = {
        "submitter_name": signup_info.submitter_name,  # 使用前端提供的值
        "player_name": signup_info.player_name,  # 使用前端提供的值
        "character_name": signup_info.character_name if signup_info.character_name is not None else "",
        "xinfa": signup_info.xinfa  # 始终使用前端传递的心法，支持多修切换
    }

    # 如果有 signup_character_id，从数据库取角色名覆盖（但保留前端传递的心法）
    if signup_character_id:
        char_result = await db.execute(
            select(Character).where(Character.id == signup_character_id)
        )
        character = char_result.scalar_one_or_none()
        if character:
            result_info["character_name"] = character.name
            # 不再覆盖心法，使用前端传递的值

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
    
    # 处理 signup_info 字段（只检查 character_id）
    processed_info = await _process_signup_info(
        db,
        payload.signup_info,
        payload.signup_character_id
    )
    
    # 判断是否代报
    is_proxy = (
        payload.signup_user_id is None or
        payload.signup_user_id != current_user.id
    )

    # 非代报时，检查是否重复报名（同一个 signup_user_id 不能重复）
    if not is_proxy and payload.signup_user_id is not None:
        existing_signup = await db.execute(
            select(Signup).where(
                Signup.team_id == team_id,
                Signup.signup_user_id == payload.signup_user_id,
                Signup.cancelled_at.is_(None)  # 只检查未取消的报名
            )
        )
        if existing_signup.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="您已报名此团队，不能重复报名"
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
        priority=0
    )
    
    db.add(signup)
    await db.flush()  # 先flush以获取signup.id

    # 记录报名日志
    submitter_name = None
    if is_proxy:
        # 获取提交者名称用于代报名记录
        submitter_result = await db.execute(
            select(GuildMember).where(
                GuildMember.guild_id == guild_id,
                GuildMember.user_id == current_user.id,
                GuildMember.left_at.is_(None)
            )
        )
        submitter_gm = submitter_result.scalar_one_or_none()
        submitter_user_result = await db.execute(select(User).where(User.id == current_user.id))
        submitter_user = submitter_user_result.scalar_one_or_none()
        if submitter_user:
            submitter_name = (submitter_gm.group_nickname
                            if (submitter_gm and submitter_gm.group_nickname)
                            else submitter_user.nickname)

    await TeamLogService.log_signup_created(
        db, team_id, guild_id, current_user.id,
        signup.id,
        processed_info.get("player_name", ""),
        processed_info.get("character_name", ""),
        processed_info.get("xinfa", ""),
        is_proxy,
        payload.is_rich,
        None,  # slot_position
        submitter_name
    )

    # 调用排坑服务重新分配
    allocation_result = await SlotAllocationService.reallocate(db, team_id, signup.id)
    
    await db.commit()
    await db.refresh(signup)

    # 使用 enrich 函数处理昵称和 QQ 号
    enriched_signup = await _enrich_signup_response(db, guild_id, signup)
    
    # 添加分配结果到响应，并根据分配状态返回不同的消息
    response_message = "报名成功"
    if signup.id in allocation_result.signup_results:
        alloc_status, alloc_index = allocation_result.signup_results[signup.id]
        enriched_signup.allocation_status = alloc_status
        if alloc_status == "allocated":
            enriched_signup.allocated_slot = alloc_index
            response_message = f"报名成功，已分配到 {alloc_index + 1} 号坑位"
        elif alloc_status == "waitlist":
            enriched_signup.waitlist_position = alloc_index
            response_message = f"报名成功，当前为候补第 {alloc_index + 1} 位"
        else:
            # unallocated 或其他状态
            response_message = "报名成功，但暂时无法分配坑位"

    return success(enriched_signup, message=response_message)


@router.get("/{guild_id}/teams/{team_id}/signups", response_model=ResponseModel[List[SignupOut]])
async def list_signups(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取报名列表（含历史）"""
    # 验证团队访问权限，普通成员也可以查看报名列表
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=False)
    
    # 获取所有报名（包括已取消的）
    result = await db.execute(
        select(Signup).where(
            Signup.team_id == team_id
        ).order_by(Signup.created_at.asc())
    )
    signups = result.scalars().all()

    # 使用 enrich 函数处理每个报名的昵称和 QQ 号
    enriched_signups = [await _enrich_signup_response(db, guild_id, s) for s in signups]

    return success(enriched_signups, message="获取成功")


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
    
    # 编辑次数限制检查：非管理员每车最多编辑3次
    MAX_EDIT_COUNT = 3
    if not is_admin and signup.edit_count >= MAX_EDIT_COUNT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"已达到修改次数上限（{MAX_EDIT_COUNT}次），无法继续修改"
        )
    
    # 非管理员编辑时增加编辑计数
    if not is_admin:
        signup.edit_count = (signup.edit_count or 0) + 1
    
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
            signup.signup_character_id
        )
        signup.signup_info = processed_info

    # 重新判断是否代报
    signup.is_proxy = (
        signup.signup_user_id is None or
        signup.signup_user_id != current_user.id
    )
    
    await db.commit()
    await db.refresh(signup)

    # 使用 enrich 函数处理昵称和 QQ 号
    enriched_signup = await _enrich_signup_response(db, guild_id, signup)

    return success(enriched_signup, message="更新成功")


@router.post("/{guild_id}/teams/{team_id}/signups/{signup_id}/lock", response_model=ResponseModel[SignupOut])
async def lock_signup(
    guild_id: int,
    team_id: int,
    signup_id: int,
    payload: SignupLockRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """锁定报名位置（使用新的排坑服务）"""
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
    
    # 使用排坑服务锁定坑位
    allocation_result = await SlotAllocationService.lock_slot(
        db, team_id, signup_id, payload.slot_position
    )

    # 记录坑位分配日志
    await TeamLogService.log_slot_assigned(
        db, team_id, guild_id, current_user.id,
        signup.id,
        signup.signup_info.get("player_name", ""),
        signup.signup_info.get("character_name", ""),
        signup.signup_info.get("xinfa", ""),
        payload.slot_position
    )

    await db.commit()
    await db.refresh(signup)

    # 使用 enrich 函数处理昵称和 QQ 号
    enriched_signup = await _enrich_signup_response(db, guild_id, signup)
    
    # 添加分配结果
    enriched_signup.allocation_status = "allocated"
    enriched_signup.allocated_slot = payload.slot_position

    return success(enriched_signup, message="锁定成功")


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

    # 记录取消报名日志
    await TeamLogService.log_signup_cancelled(
        db, team_id, guild_id, current_user.id,
        signup.id,
        signup.signup_info.get("player_name", ""),
        signup.signup_info.get("character_name", ""),
        signup.signup_info.get("xinfa", ""),
        is_submitter
    )

    # 重新分配坑位（取消的报名会被移除，候补可能会补上）
    await SlotAllocationService.reallocate(db, team_id)

    await db.commit()

    return success(message="取消成功")


@router.post("/{guild_id}/teams/{team_id}/signups/{signup_id}/presence", response_model=ResponseModel[SignupOut])
async def update_presence_status(
    guild_id: int,
    team_id: int,
    signup_id: int,
    payload: SignupPresenceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记到场状态（进组标记模式）"""
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

    # 验证状态值
    valid_statuses = ["ready", "absent", None]
    if payload.presence_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的状态值，必须是: {valid_statuses}"
        )

    # 记录进组标记日志
    previous_status = signup.presence_status
    await TeamLogService.log_presence_marked(
        db, team_id, guild_id, current_user.id,
        signup.id,
        signup.signup_info.get("player_name", ""),
        payload.presence_status,
        previous_status
    )

    # 更新到场状态
    signup.presence_status = payload.presence_status

    await db.commit()
    await db.refresh(signup)

    # 使用 enrich 函数处理昵称和 QQ 号
    enriched_signup = await _enrich_signup_response(db, guild_id, signup)

    return success(enriched_signup, message="标记成功")


@router.delete("/{guild_id}/teams/{team_id}/signups/{signup_id}/slot", response_model=ResponseModel[SignupOut])
async def remove_slot_assignment(
    guild_id: int,
    team_id: int,
    signup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除坑位分配（使用新的排坑服务，移除报名的锁定状态）"""
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

    # 获取当前坑位位置用于日志
    current_status, current_slot = await SlotAllocationService.get_signup_allocation_status(
        db, team_id, signup_id
    )
    
    if current_status == "allocated" and current_slot is not None:
        await TeamLogService.log_slot_unassigned(
            db, team_id, guild_id, current_user.id,
            signup.id,
            signup.signup_info.get("player_name", ""),
            current_slot
        )

    # 使用排坑服务移除分配（会重新触发分配）
    allocation_result = await SlotAllocationService.remove_from_slot(db, team_id, signup_id)

    await db.commit()
    await db.refresh(signup)

    # 使用 enrich 函数处理昵称和 QQ 号
    enriched_signup = await _enrich_signup_response(db, guild_id, signup)
    
    # 获取新的分配状态
    if signup.id in allocation_result.signup_results:
        alloc_status, alloc_index = allocation_result.signup_results[signup.id]
        enriched_signup.allocation_status = alloc_status
        if alloc_status == "allocated":
            enriched_signup.allocated_slot = alloc_index
        elif alloc_status == "waitlist":
            enriched_signup.waitlist_position = alloc_index

    return success(enriched_signup, message="已删除坑位分配")


class SlotSwapRequest(BaseModel):
    """交换坑位的请求模型"""
    slot_index_a: int = Field(..., ge=0, le=24, description="坑位A索引")
    slot_index_b: int = Field(..., ge=0, le=24, description="坑位B索引")


@router.post("/{guild_id}/teams/{team_id}/slots/swap", response_model=ResponseModel)
async def swap_slots(
    guild_id: int,
    team_id: int,
    payload: SlotSwapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """交换两个坑位的分配（连连看模式）"""
    # 验证团队访问权限，需要管理员权限
    await _verify_team_access(db, guild_id, team_id, current_user, require_admin=True)
    
    # 使用排坑服务交换坑位
    await SlotAllocationService.swap_slots(
        db, team_id, payload.slot_index_a, payload.slot_index_b
    )
    
    await db.commit()
    
    return success(message="交换成功")
