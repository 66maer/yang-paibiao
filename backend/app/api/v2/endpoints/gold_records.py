"""
金团记录用户接口
"""
import logging
from typing import Optional
from datetime import date

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.guild import Guild
from app.models.guild_member import GuildMember
from app.models.gold_record import GoldRecord
from app.models.character import Character
from app.models.team import Team
from app.models.signup import Signup
from app.schemas.common import ResponseModel, success
from app.schemas.gold_record import GoldRecordCreate, GoldRecordUpdate, GoldRecordOut

router = APIRouter(prefix="/guilds", tags=["金团记录"])


def _ensure_member_with_role(member: GuildMember, roles: list[str]):
    """验证成员角色权限"""
    if member is None or member.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if member.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")


async def _get_heibenren_info(
    db: AsyncSession,
    guild_id: int,
    user_id: Optional[int],
    original_info: dict
) -> dict:
    """
    获取黑本人显示信息
    读取时只动态覆盖用户名（不覆盖角色名，角色名在记录时已确定）
    """
    result_info = dict(original_info) if original_info else {}

    # 如果有用户ID，从数据库获取用户昵称（动态覆盖）
    if user_id:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user:
            # 尝试获取群昵称
            gm_result = await db.execute(
                select(GuildMember).where(
                    GuildMember.guild_id == guild_id,
                    GuildMember.user_id == user_id,
                    GuildMember.left_at.is_(None)
                )
            )
            gm = gm_result.scalar_one_or_none()
            if gm and gm.group_nickname:
                result_info['user_name'] = gm.group_nickname
            else:
                result_info['user_name'] = user.nickname

    # 注意：character_name 在记录时已经覆盖并写入数据库，读取时直接使用数据库中的值

    return result_info


async def _auto_update_weekly_records(db: AsyncSession, gold_record: GoldRecord):
    """
    自动更新每周记录（金团记录联动）
    根据 team_id 查找报名的角色，自动记录人均金团金额
    工资计算公式：(总金团 - 总补贴) / 打工人数
    """
    from app.api.v2.endpoints.my_records import auto_create_weekly_record

    # 计算人均金额：(总金团 - 总补贴) / 打工人数
    effective_gold = gold_record.total_gold - (gold_record.subsidy_gold or 0)
    per_person_gold = effective_gold // gold_record.worker_count
    logger.debug(f"[每周记录] 计算人均金额: effective_gold={effective_gold}, "
                 f"worker_count={gold_record.worker_count}, per_person_gold={per_person_gold}")

    # 查找该团队的所有有效报名（非老板、未取消）
    result = await db.execute(
        select(Signup).where(
            Signup.team_id == gold_record.team_id,
            Signup.cancelled_at.is_(None),
            Signup.is_rich == False,  # 排除老板
            Signup.signup_user_id.isnot(None),  # 必须有关联用户
            Signup.signup_character_id.isnot(None)  # 必须有关联角色
        )
    )
    signups = result.scalars().all()
    original_count = len(signups)
    logger.info(f"[每周记录] 查找到报名记录: team_id={gold_record.team_id}, 报名数量={original_count}")

    # 按 character_id 去重（同一角色可能报名多个位置，保留最后一个）
    character_signup_map = {}
    for signup in signups:
        character_signup_map[signup.signup_character_id] = signup
    signups = list(character_signup_map.values())

    if len(signups) != original_count:
        logger.info(f"[每周记录] 去重后报名数量: {len(signups)} (原始: {original_count})")

    # 为每个报名的角色创建/更新每周记录
    for idx, signup in enumerate(signups):
        try:
            logger.debug(f"[每周记录] 处理报名 {idx+1}/{len(signups)}: signup_id={signup.id}, "
                        f"user_id={signup.signup_user_id}, character_id={signup.signup_character_id}")
            await auto_create_weekly_record(
                db=db,
                user_id=signup.signup_user_id,
                character_id=signup.signup_character_id,
                dungeon_name=gold_record.dungeon,
                gold_amount=per_person_gold,
                gold_record_id=gold_record.id
            )
        except Exception as e:
            logger.error(f"[每周记录] 创建单条记录失败: signup_id={signup.id}, user_id={signup.signup_user_id}, "
                        f"character_id={signup.signup_character_id}, error_type={type(e).__name__}, error={str(e)}",
                        exc_info=True)
            raise

    logger.debug(f"[每周记录] 准备提交事务: gold_record_id={gold_record.id}")
    await db.commit()
    logger.info(f"[每周记录] 事务提交成功: gold_record_id={gold_record.id}, 更新数量={len(signups)}")


@router.post("/{guild_id}/gold-records", response_model=ResponseModel[GoldRecordOut])
async def create_gold_record(
    guild_id: int,
    payload: GoldRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建金团记录"""
    # 验证群组存在
    guild_result = await db.execute(select(Guild).where(Guild.id == guild_id, Guild.deleted_at.is_(None)))
    guild = guild_result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="群组不存在")

    # 验证权限：群主或管理员
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    _ensure_member_with_role(gm, roles=["owner", "helper"])

    # 如果关联了 team_id，验证团队存在且属于该群组
    if payload.team_id:
        team_result = await db.execute(
            select(Team).where(
                Team.id == payload.team_id,
                Team.guild_id == guild_id,
                Team.status != "deleted"
            )
        )
        if team_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 处理黑本人信息：如果有角色ID，从数据库获取角色名覆盖
    heibenren_info_dict = payload.heibenren_info.model_dump() if payload.heibenren_info else {}

    if payload.heibenren_character_id:
        char_result = await db.execute(
            select(Character).where(Character.id == payload.heibenren_character_id)
        )
        character = char_result.scalar_one_or_none()
        if character:
            heibenren_info_dict['character_name'] = character.name

    # 检查是否已存在该 team_id 的金团记录（upsert 逻辑）
    gold_record = None
    if payload.team_id:
        existing_result = await db.execute(
            select(GoldRecord).where(
                GoldRecord.team_id == payload.team_id,
                GoldRecord.guild_id == guild_id,
                GoldRecord.deleted_at.is_(None)
            )
        )
        gold_record = existing_result.scalar_one_or_none()

    if gold_record:
        # 存在则更新
        gold_record.dungeon = payload.dungeon
        gold_record.run_date = payload.run_date
        gold_record.total_gold = payload.total_gold
        gold_record.subsidy_gold = payload.subsidy_gold
        gold_record.worker_count = payload.worker_count
        gold_record.special_drops = payload.special_drops
        gold_record.xuanjing_drops = payload.xuanjing_drops
        gold_record.has_xuanjing = payload.has_xuanjing
        gold_record.heibenren_user_id = payload.heibenren_user_id
        gold_record.heibenren_character_id = payload.heibenren_character_id
        gold_record.heibenren_info = heibenren_info_dict
        gold_record.notes = payload.notes
    else:
        # 不存在则创建新记录
        gold_record = GoldRecord(
            guild_id=guild_id,
            team_id=payload.team_id,
            creator_id=current_user.id,
            dungeon=payload.dungeon,
            run_date=payload.run_date,
            total_gold=payload.total_gold,
            subsidy_gold=payload.subsidy_gold,
            worker_count=payload.worker_count,
            special_drops=payload.special_drops,
            xuanjing_drops=payload.xuanjing_drops,
            has_xuanjing=payload.has_xuanjing,
            heibenren_user_id=payload.heibenren_user_id,
            heibenren_character_id=payload.heibenren_character_id,
            heibenren_info=heibenren_info_dict,
            notes=payload.notes
        )
        db.add(gold_record)

    await db.commit()
    await db.refresh(gold_record)
    logger.info(f"[金团记录] 保存成功: id={gold_record.id}, guild_id={guild_id}, team_id={gold_record.team_id}, "
                f"dungeon={gold_record.dungeon}, total_gold={gold_record.total_gold}, "
                f"heibenren_user_id={gold_record.heibenren_user_id}, worker_count={gold_record.worker_count}")

    # 触发排名计算和快照保存
    if gold_record.heibenren_user_id:
        try:
            logger.info(f"[金团记录] 开始计算排名: guild_id={guild_id}, heibenren_user_id={gold_record.heibenren_user_id}")
            from app.services.ranking_service import RankingService
            ranking_service = RankingService(db)
            rankings = await ranking_service.calculate_guild_rankings(guild_id)
            logger.info(f"[金团记录] 排名计算完成: guild_id={guild_id}, 排名数量={len(rankings) if rankings else 0}")
            await ranking_service.save_ranking_snapshot(guild_id, rankings)
            logger.info(f"[金团记录] 排名快照保存成功: guild_id={guild_id}")
        except Exception as e:
            logger.error(f"[金团记录] 排名计算/快照保存失败: guild_id={guild_id}, gold_record_id={gold_record.id}, "
                        f"error_type={type(e).__name__}, error={str(e)}", exc_info=True)

    # 金团记录联动：自动更新每周记录
    if gold_record.team_id and gold_record.worker_count > 0:
        try:
            logger.info(f"[金团记录] 开始更新每周记录: gold_record_id={gold_record.id}, team_id={gold_record.team_id}, "
                        f"worker_count={gold_record.worker_count}, total_gold={gold_record.total_gold}, "
                        f"subsidy_gold={gold_record.subsidy_gold}")
            await _auto_update_weekly_records(db, gold_record)
            logger.info(f"[金团记录] 每周记录更新成功: gold_record_id={gold_record.id}")
        except Exception as e:
            logger.error(f"[金团记录] 每周记录更新失败: gold_record_id={gold_record.id}, team_id={gold_record.team_id}, "
                        f"error_type={type(e).__name__}, error={str(e)}", exc_info=True)

    # 读取时覆盖黑本人信息（只覆盖 user_name）
    try:
        gold_record.heibenren_info = await _get_heibenren_info(
            db, guild_id,
            gold_record.heibenren_user_id,
            gold_record.heibenren_info
        )
    except Exception as e:
        logger.error(f"[金团记录] 获取黑本人信息失败: gold_record_id={gold_record.id}, "
                    f"heibenren_user_id={gold_record.heibenren_user_id}, "
                    f"error_type={type(e).__name__}, error={str(e)}", exc_info=True)

    logger.info(f"[金团记录] 创建流程完成: gold_record_id={gold_record.id}")
    return success(GoldRecordOut.model_validate(gold_record), message="创建成功")


@router.get("/{guild_id}/gold-records", response_model=ResponseModel[list[GoldRecordOut]])
async def list_gold_records(
    guild_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=2000, description="每页数量"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    dungeon: Optional[str] = Query(None, description="副本名称"),
    team_id: Optional[int] = Query(None, description="关联的开团ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取金团记录列表"""
    # 验证权限：所有群组成员都可以查看
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 构建查询条件
    conditions = [
        GoldRecord.guild_id == guild_id,
        GoldRecord.deleted_at.is_(None)
    ]
    if start_date:
        conditions.append(GoldRecord.run_date >= start_date)
    if end_date:
        conditions.append(GoldRecord.run_date <= end_date)
    if dungeon:
        conditions.append(GoldRecord.dungeon == dungeon)
    if team_id:
        conditions.append(GoldRecord.team_id == team_id)

    # 查询金团记录
    result = await db.execute(
        select(GoldRecord)
        .where(and_(*conditions))
        .order_by(GoldRecord.run_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    gold_records = result.scalars().all()

    # 为每条记录覆盖黑本人信息（只覆盖 user_name）
    records_out = []
    for record in gold_records:
        record.heibenren_info = await _get_heibenren_info(
            db, guild_id,
            record.heibenren_user_id,
            record.heibenren_info
        )
        records_out.append(GoldRecordOut.model_validate(record))

    return success(records_out, message="获取成功")


@router.get("/{guild_id}/gold-records/{record_id}", response_model=ResponseModel[GoldRecordOut])
async def get_gold_record(
    guild_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取金团记录详情"""
    # 验证权限：所有群组成员都可以查看
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 查询金团记录
    result = await db.execute(
        select(GoldRecord).where(
            GoldRecord.id == record_id,
            GoldRecord.guild_id == guild_id,
            GoldRecord.deleted_at.is_(None)
        )
    )
    gold_record = result.scalar_one_or_none()
    if gold_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="金团记录不存在")

    # 覆盖黑本人信息（只覆盖 user_name）
    gold_record.heibenren_info = await _get_heibenren_info(
        db, guild_id,
        gold_record.heibenren_user_id,
        gold_record.heibenren_info
    )

    return success(GoldRecordOut.model_validate(gold_record), message="获取成功")


@router.put("/{guild_id}/gold-records/{record_id}", response_model=ResponseModel[GoldRecordOut])
async def update_gold_record(
    guild_id: int,
    record_id: int,
    payload: GoldRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新金团记录"""
    # 验证权限：群主或管理员或创建者
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()

    # 查询金团记录
    result = await db.execute(
        select(GoldRecord).where(
            GoldRecord.id == record_id,
            GoldRecord.guild_id == guild_id,
            GoldRecord.deleted_at.is_(None)
        )
    )
    gold_record = result.scalar_one_or_none()
    if gold_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="金团记录不存在")

    # 验证权限：群主、管理员或创建者
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if gm.role not in ["owner", "helper"] and gold_record.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")

    # 更新字段
    if payload.dungeon is not None:
        gold_record.dungeon = payload.dungeon
    if payload.run_date is not None:
        gold_record.run_date = payload.run_date
    if payload.total_gold is not None:
        gold_record.total_gold = payload.total_gold
    if payload.subsidy_gold is not None:
        gold_record.subsidy_gold = payload.subsidy_gold
    if payload.worker_count is not None:
        gold_record.worker_count = payload.worker_count
    if payload.special_drops is not None:
        gold_record.special_drops = payload.special_drops
    if payload.xuanjing_drops is not None:
        gold_record.xuanjing_drops = payload.xuanjing_drops
    if payload.has_xuanjing is not None:
        gold_record.has_xuanjing = payload.has_xuanjing
    if payload.notes is not None:
        gold_record.notes = payload.notes

    # 更新黑本人信息
    if payload.heibenren_user_id is not None:
        gold_record.heibenren_user_id = payload.heibenren_user_id
    if payload.heibenren_character_id is not None:
        gold_record.heibenren_character_id = payload.heibenren_character_id
    if payload.heibenren_info is not None:
        heibenren_info_dict = payload.heibenren_info.model_dump()
        # 如果有角色ID，从数据库获取角色名覆盖
        if gold_record.heibenren_character_id:
            char_result = await db.execute(
                select(Character).where(Character.id == gold_record.heibenren_character_id)
            )
            character = char_result.scalar_one_or_none()
            if character:
                heibenren_info_dict['character_name'] = character.name
        gold_record.heibenren_info = heibenren_info_dict

    await db.commit()
    await db.refresh(gold_record)

    # 触发排名计算和快照保存
    if gold_record.heibenren_user_id:
        from app.services.ranking_service import RankingService
        ranking_service = RankingService(db)
        rankings = await ranking_service.calculate_guild_rankings(guild_id)
        await ranking_service.save_ranking_snapshot(guild_id, rankings)

    # 覆盖黑本人信息（只覆盖 user_name）
    gold_record.heibenren_info = await _get_heibenren_info(
        db, guild_id,
        gold_record.heibenren_user_id,
        gold_record.heibenren_info
    )

    return success(GoldRecordOut.model_validate(gold_record), message="更新成功")


@router.delete("/{guild_id}/gold-records/{record_id}", response_model=ResponseModel)
async def delete_gold_record(
    guild_id: int,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除金团记录（软删除）"""
    # 验证权限：群主或管理员或创建者
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()

    # 查询金团记录
    result = await db.execute(
        select(GoldRecord).where(
            GoldRecord.id == record_id,
            GoldRecord.guild_id == guild_id,
            GoldRecord.deleted_at.is_(None)
        )
    )
    gold_record = result.scalar_one_or_none()
    if gold_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="金团记录不存在")

    # 验证权限：群主、管理员或创建者
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")
    if gm.role not in ["owner", "helper"] and gold_record.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")

    # 软删除：设置 deleted_at
    from datetime import datetime
    gold_record.deleted_at = datetime.utcnow()
    await db.commit()

    return success(message="删除成功")


@router.get("/{guild_id}/teams/{team_id}/gold-record", response_model=ResponseModel[Optional[GoldRecordOut]])
async def get_gold_record_by_team(
    guild_id: int,
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """通过开团ID获取金团记录"""
    # 验证权限：所有群组成员都可以查看
    gm_result = await db.execute(
        select(GuildMember).where(
            GuildMember.guild_id == guild_id,
            GuildMember.user_id == current_user.id,
            GuildMember.left_at.is_(None)
        )
    )
    gm = gm_result.scalar_one_or_none()
    if gm is None or gm.left_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="非该群组成员")

    # 验证团队存在
    team_result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.guild_id == guild_id,
            Team.status != "deleted"
        )
    )
    if team_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="团队不存在")

    # 查询金团记录
    result = await db.execute(
        select(GoldRecord).where(
            GoldRecord.team_id == team_id,
            GoldRecord.guild_id == guild_id,
            GoldRecord.deleted_at.is_(None)
        )
    )
    gold_record = result.scalar_one_or_none()

    if gold_record is None:
        return success(None, message="该开团尚未创建金团记录")

    # 覆盖黑本人信息（只覆盖 user_name）
    gold_record.heibenren_info = await _get_heibenren_info(
        db, guild_id,
        gold_record.heibenren_user_id,
        gold_record.heibenren_info
    )

    return success(GoldRecordOut.model_validate(gold_record), message="获取成功")
