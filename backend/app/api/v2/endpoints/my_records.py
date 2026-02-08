"""
我的记录 - 每周记录接口
"""
from datetime import date, datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.character import Character, CharacterPlayer
from app.models.weekly_record import WeeklyRecord, WeeklyRecordConfig, CharacterCDStatus
from app.schemas.common import ResponseModel, success
from app.schemas.weekly_record import (
    ColumnConfig,
    WeeklyRecordConfigCreate,
    WeeklyRecordConfigResponse,
    WeeklyRecordUpdate,
    WeeklyRecordCreate,
    WeeklyMatrixResponse,
    CharacterRowData,
    CharacterInfo,
    CellData,
    WeekOption,
)

router = APIRouter(prefix="/users/me/weekly-records", tags=["我的记录"])


def get_week_start_date(target_date: date = None) -> date:
    """
    获取指定日期所在周的起始日期（周一早7点为周起点）
    如果当前时间在周一早7点前，则认为还是上一周
    """
    if target_date is None:
        now = datetime.now()
        target_date = now.date()
        # 如果是周一且在早上7点前，算作上一周
        if now.weekday() == 0 and now.hour < 7:
            target_date = target_date - timedelta(days=1)
    
    # 计算周一
    days_since_monday = target_date.weekday()
    week_start = target_date - timedelta(days=days_since_monday)
    return week_start


def is_current_week(week_start: date) -> bool:
    """判断是否是当前周"""
    current_week_start = get_week_start_date()
    return week_start == current_week_start


async def get_default_columns(db: AsyncSession) -> List[ColumnConfig]:
    """获取默认列配置（从主要副本列表）"""
    result = await db.execute(
        text("SELECT value FROM system_configs WHERE key = 'dungeon_options'")
    )
    row = result.fetchone()
    
    if not row:
        # 默认副本列表
        return [
            ColumnConfig(name="25人英雄武林巅峰", type="primary", order=0),
            ColumnConfig(name="25人英雄逐北怒涛", type="primary", order=1),
            ColumnConfig(name="25人英雄西陇魂墟", type="primary", order=2),
        ]
    
    options = row[0]
    # 只返回 primary 类型的副本
    primary_options = [opt for opt in options if opt.get("type") == "primary"]
    primary_options.sort(key=lambda x: x.get("order", 0))
    
    return [
        ColumnConfig(name=opt["name"], type="primary", order=opt.get("order", i))
        for i, opt in enumerate(primary_options)
    ]


async def get_or_create_week_config(
    db: AsyncSession,
    user_id: int,
    week_start: date
) -> WeeklyRecordConfig:
    """获取或创建指定周的列配置"""
    # 查找现有配置
    result = await db.execute(
        select(WeeklyRecordConfig).where(
            WeeklyRecordConfig.user_id == user_id,
            WeeklyRecordConfig.week_start_date == week_start
        )
    )
    config = result.scalar_one_or_none()
    
    if config:
        return config
    
    # 查找最近一周的配置作为继承
    result = await db.execute(
        select(WeeklyRecordConfig).where(
            WeeklyRecordConfig.user_id == user_id,
            WeeklyRecordConfig.week_start_date < week_start
        ).order_by(WeeklyRecordConfig.week_start_date.desc()).limit(1)
    )
    prev_config = result.scalar_one_or_none()
    
    if prev_config:
        columns_json = prev_config.columns_json
    else:
        # 使用默认列配置
        default_columns = await get_default_columns(db)
        columns_json = [col.model_dump() for col in default_columns]
    
    # 创建新配置
    config = WeeklyRecordConfig(
        user_id=user_id,
        week_start_date=week_start,
        columns_json=columns_json
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    
    return config


@router.get("/matrix", response_model=ResponseModel[WeeklyMatrixResponse])
async def get_weekly_matrix(
    week_start: Optional[date] = Query(None, description="周起始日期，不传则为当前周"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取每周记录矩阵数据
    
    返回用户所有角色（行）与副本（列）的交叉数据
    """
    # 确定周起始日期
    if week_start is None:
        week_start = get_week_start_date()
    
    current_week = is_current_week(week_start)
    
    # 获取或创建列配置
    config = await get_or_create_week_config(db, current_user.id, week_start)
    columns = [ColumnConfig(**col) for col in config.columns_json]
    
    # 获取用户的所有角色
    result = await db.execute(
        select(Character).join(CharacterPlayer).where(
            CharacterPlayer.user_id == current_user.id,
            Character.deleted_at.is_(None)
        ).order_by(CharacterPlayer.priority.desc(), Character.id)
    )
    characters = result.scalars().all()
    
    # 获取该周的所有工资记录
    result = await db.execute(
        select(WeeklyRecord).where(
            WeeklyRecord.user_id == current_user.id,
            WeeklyRecord.week_start_date == week_start
        )
    )
    records = result.scalars().all()

    # 构建工资记录映射 {character_id: {dungeon_name: record}}
    record_map = {}
    for record in records:
        if record.character_id not in record_map:
            record_map[record.character_id] = {}
        record_map[record.character_id][record.dungeon_name] = record

    # 获取所有角色的CD状态
    character_ids = [char.id for char in characters]
    cd_result = await db.execute(
        select(CharacterCDStatus).where(
            CharacterCDStatus.character_id.in_(character_ids),
            CharacterCDStatus.week_start_date == week_start,
            CharacterCDStatus.is_cleared == True
        )
    )
    cd_statuses = cd_result.scalars().all()

    # 构建CD状态映射 {character_id: {dungeon_name: is_cleared}}
    cd_map = {}
    for cd_status in cd_statuses:
        if cd_status.character_id not in cd_map:
            cd_map[cd_status.character_id] = {}
        cd_map[cd_status.character_id][cd_status.dungeon_name] = cd_status.is_cleared
    
    # 构建行数据
    rows = []
    column_totals = {col.name: 0 for col in columns}
    column_expense_totals = {col.name: 0 for col in columns}
    grand_total = 0
    grand_expense_total = 0

    for char in characters:
        char_info = CharacterInfo(
            id=char.id,
            name=char.name,
            server=char.server,
            xinfa=char.xinfa,
            remark=char.remark
        )

        cells = {}
        row_total = 0
        row_expense_total = 0

        for col in columns:
            # 获取工资记录
            record = record_map.get(char.id, {}).get(col.name)
            # 获取CD状态
            is_cleared = cd_map.get(char.id, {}).get(col.name, False)

            if record or is_cleared:
                cells[col.name] = CellData(
                    record_id=record.id if record else None,
                    is_cleared=is_cleared,
                    gold_amount=record.gold_amount if record else 0,
                    expense_amount=record.expense_amount if record else 0,
                    gold_record_id=record.gold_record_id if record else None
                )
                if record:
                    row_total += record.gold_amount
                    column_totals[col.name] += record.gold_amount
                    row_expense_total += record.expense_amount
                    column_expense_totals[col.name] += record.expense_amount
            else:
                cells[col.name] = CellData()

        grand_total += row_total
        grand_expense_total += row_expense_total
        rows.append(CharacterRowData(
            character=char_info,
            cells=cells,
            row_total=row_total,
            row_expense_total=row_expense_total
        ))

    return success(WeeklyMatrixResponse(
        week_start_date=week_start,
        is_current_week=current_week,
        columns=columns,
        rows=rows,
        column_totals=column_totals,
        grand_total=grand_total,
        column_expense_totals=column_expense_totals,
        grand_expense_total=grand_expense_total
    ))


@router.get("/weeks", response_model=ResponseModel[List[WeekOption]])
async def get_week_list(
    limit: int = Query(12, ge=1, le=52, description="返回周数"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取有数据的周列表供选择
    """
    current_week_start = get_week_start_date()
    
    # 查询有记录或有配置的周
    result = await db.execute(
        select(WeeklyRecordConfig.week_start_date).where(
            WeeklyRecordConfig.user_id == current_user.id
        ).union(
            select(WeeklyRecord.week_start_date).where(
                WeeklyRecord.user_id == current_user.id
            )
        ).order_by(WeeklyRecordConfig.week_start_date.desc()).limit(limit)
    )
    weeks_with_data = set(row[0] for row in result.fetchall())
    
    # 生成周列表（包含当前周和过去的周）
    weeks = []
    for i in range(limit):
        week_start = current_week_start - timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        
        weeks.append(WeekOption(
            week_start_date=week_start,
            label=f"{week_start.strftime('%Y-%m-%d')} ~ {week_end.strftime('%Y-%m-%d')}",
            is_current=(week_start == current_week_start)
        ))
    
    return success(weeks)


@router.get("/columns", response_model=ResponseModel[List[ColumnConfig]])
async def get_weekly_columns(
    week_start: Optional[date] = Query(None, description="周起始日期"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取指定周的列配置"""
    if week_start is None:
        week_start = get_week_start_date()
    
    config = await get_or_create_week_config(db, current_user.id, week_start)
    columns = [ColumnConfig(**col) for col in config.columns_json]
    
    return success(columns)


@router.put("/columns", response_model=ResponseModel[List[ColumnConfig]])
async def update_weekly_columns(
    payload: WeeklyRecordConfigCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新当前周的列配置（仅当前周可编辑）
    
    注意：主要副本类型的列不可删除
    """
    week_start = get_week_start_date()
    
    # 获取当前配置
    config = await get_or_create_week_config(db, current_user.id, week_start)
    current_columns = [ColumnConfig(**col) for col in config.columns_json]
    
    # 验证主要副本列未被删除
    primary_names = {col.name for col in current_columns if col.type == "primary"}
    new_names = {col.name for col in payload.columns}
    
    missing_primary = primary_names - new_names
    if missing_primary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不能删除主要副本列: {', '.join(missing_primary)}"
        )
    
    # 更新列配置
    config.columns_json = [col.model_dump() for col in payload.columns]
    await db.commit()
    await db.refresh(config)
    
    return success([ColumnConfig(**col) for col in config.columns_json])


@router.post("", response_model=ResponseModel[CellData])
async def create_weekly_record(
    payload: WeeklyRecordCreate,
    week_start: Optional[date] = Query(None, description="周起始日期"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建每周记录"""
    if week_start is None:
        week_start = get_week_start_date()
    
    # 验证角色属于当前用户
    result = await db.execute(
        select(CharacterPlayer).where(
            CharacterPlayer.character_id == payload.character_id,
            CharacterPlayer.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="角色不属于当前用户"
        )
    
    # 1. 更新或创建角色CD状态
    cd_result = await db.execute(
        select(CharacterCDStatus).where(
            CharacterCDStatus.character_id == payload.character_id,
            CharacterCDStatus.week_start_date == week_start,
            CharacterCDStatus.dungeon_name == payload.dungeon_name
        )
    )
    cd_status = cd_result.scalar_one_or_none()

    if cd_status:
        cd_status.is_cleared = payload.is_cleared
    elif payload.is_cleared:
        # 只有当 is_cleared 为 True 时才创建CD状态记录
        cd_status = CharacterCDStatus(
            character_id=payload.character_id,
            week_start_date=week_start,
            dungeon_name=payload.dungeon_name,
            is_cleared=True
        )
        db.add(cd_status)

    # 2. 更新或创建工资记录
    record_result = await db.execute(
        select(WeeklyRecord).where(
            WeeklyRecord.user_id == current_user.id,
            WeeklyRecord.character_id == payload.character_id,
            WeeklyRecord.week_start_date == week_start,
            WeeklyRecord.dungeon_name == payload.dungeon_name
        )
    )
    record = record_result.scalar_one_or_none()

    if record:
        # 更新现有工资记录
        record.gold_amount = payload.gold_amount
        record.expense_amount = payload.expense_amount
    elif payload.gold_amount > 0 or payload.expense_amount > 0:
        # 当工资或消费大于0时才创建记录
        record = WeeklyRecord(
            user_id=current_user.id,
            character_id=payload.character_id,
            week_start_date=week_start,
            dungeon_name=payload.dungeon_name,
            gold_amount=payload.gold_amount,
            expense_amount=payload.expense_amount
        )
        db.add(record)

    await db.commit()
    if record:
        await db.refresh(record)

    return success(CellData(
        record_id=record.id if record else None,
        is_cleared=payload.is_cleared,
        gold_amount=payload.gold_amount,
        expense_amount=payload.expense_amount,
        gold_record_id=record.gold_record_id if record else None
    ))


@router.put("/{record_id}", response_model=ResponseModel[CellData])
async def update_weekly_record(
    record_id: int,
    payload: WeeklyRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新每周记录单元格数据"""
    # 获取工资记录
    result = await db.execute(
        select(WeeklyRecord).where(
            WeeklyRecord.id == record_id,
            WeeklyRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )

    # 1. 更新CD状态（如果需要）
    if payload.is_cleared is not None:
        cd_result = await db.execute(
            select(CharacterCDStatus).where(
                CharacterCDStatus.character_id == record.character_id,
                CharacterCDStatus.week_start_date == record.week_start_date,
                CharacterCDStatus.dungeon_name == record.dungeon_name
            )
        )
        cd_status = cd_result.scalar_one_or_none()

        if cd_status:
            cd_status.is_cleared = payload.is_cleared
        elif payload.is_cleared:
            # 创建新的CD状态记录
            cd_status = CharacterCDStatus(
                character_id=record.character_id,
                week_start_date=record.week_start_date,
                dungeon_name=record.dungeon_name,
                is_cleared=True
            )
            db.add(cd_status)

    # 2. 更新工资金额（如果需要）
    if payload.gold_amount is not None:
        record.gold_amount = payload.gold_amount

    # 3. 更新消费金额（如果需要）
    if payload.expense_amount is not None:
        record.expense_amount = payload.expense_amount

    await db.commit()
    await db.refresh(record)

    # 获取最新的CD状态
    cd_result = await db.execute(
        select(CharacterCDStatus).where(
            CharacterCDStatus.character_id == record.character_id,
            CharacterCDStatus.week_start_date == record.week_start_date,
            CharacterCDStatus.dungeon_name == record.dungeon_name
        )
    )
    cd_status = cd_result.scalar_one_or_none()

    return success(CellData(
        record_id=record.id,
        is_cleared=cd_status.is_cleared if cd_status else False,
        gold_amount=record.gold_amount,
        expense_amount=record.expense_amount,
        gold_record_id=record.gold_record_id
    ))


@router.delete("/{record_id}", response_model=ResponseModel)
async def delete_weekly_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除每周记录"""
    # 获取记录
    result = await db.execute(
        select(WeeklyRecord).where(
            WeeklyRecord.id == record_id,
            WeeklyRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    
    await db.delete(record)
    await db.commit()
    
    return success(message="删除成功")


@router.get("/cd-status/{user_id}", response_model=ResponseModel)
async def get_user_cd_status(
    user_id: int,
    dungeon: Optional[str] = Query(None, description="筛选副本名称"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取指定用户所有角色的本周CD状态
    返回 {character_id: {dungeon_name: is_cleared}} 的字典
    """
    week_start = get_week_start_date()

    # 获取该用户的所有角色
    char_result = await db.execute(
        select(Character.id).join(CharacterPlayer).where(
            CharacterPlayer.user_id == user_id,
            Character.deleted_at.is_(None)
        )
    )
    character_ids = [row[0] for row in char_result.fetchall()]

    if not character_ids:
        return success({})

    # 构建查询条件
    conditions = [
        CharacterCDStatus.character_id.in_(character_ids),
        CharacterCDStatus.week_start_date == week_start,
        CharacterCDStatus.is_cleared == True
    ]

    if dungeon:
        conditions.append(CharacterCDStatus.dungeon_name == dungeon)

    result = await db.execute(
        select(CharacterCDStatus.character_id, CharacterCDStatus.dungeon_name).where(
            and_(*conditions)
        )
    )

    # 构建返回数据
    cd_status = {}
    for character_id, dungeon_name in result.fetchall():
        if character_id not in cd_status:
            cd_status[character_id] = {}
        cd_status[character_id][dungeon_name] = True

    return success(cd_status)


# 供其他模块调用的辅助函数
async def auto_create_weekly_record(
    db: AsyncSession,
    user_id: int,
    character_id: int,
    dungeon_name: str,
    gold_amount: int,
    gold_record_id: int
):
    """
    自动创建/更新每周记录（金团记录联动时调用）
    同时更新角色CD状态和用户工资记录
    """
    week_start = get_week_start_date()

    # 1. 更新或创建角色CD状态
    cd_result = await db.execute(
        select(CharacterCDStatus).where(
            CharacterCDStatus.character_id == character_id,
            CharacterCDStatus.week_start_date == week_start,
            CharacterCDStatus.dungeon_name == dungeon_name
        )
    )
    cd_status = cd_result.scalar_one_or_none()

    if cd_status:
        cd_status.is_cleared = True
    else:
        cd_status = CharacterCDStatus(
            character_id=character_id,
            week_start_date=week_start,
            dungeon_name=dungeon_name,
            is_cleared=True
        )
        db.add(cd_status)

    # 2. 更新或创建工资记录
    record_result = await db.execute(
        select(WeeklyRecord).where(
            WeeklyRecord.user_id == user_id,
            WeeklyRecord.character_id == character_id,
            WeeklyRecord.week_start_date == week_start,
            WeeklyRecord.dungeon_name == dungeon_name
        )
    )
    existing = record_result.scalar_one_or_none()

    if existing:
        # 更新现有工资记录
        existing.gold_amount = gold_amount
        existing.gold_record_id = gold_record_id
    else:
        # 创建新工资记录
        record = WeeklyRecord(
            user_id=user_id,
            character_id=character_id,
            week_start_date=week_start,
            dungeon_name=dungeon_name,
            gold_amount=gold_amount,
            gold_record_id=gold_record_id
        )
        db.add(record)


async def get_character_cd_status(
    db: AsyncSession,
    character_id: int
) -> dict[str, bool]:
    """
    获取角色本周的CD状态
    返回 {dungeon_name: is_cleared} 的字典
    """
    week_start = get_week_start_date()

    result = await db.execute(
        select(CharacterCDStatus.dungeon_name, CharacterCDStatus.is_cleared).where(
            CharacterCDStatus.character_id == character_id,
            CharacterCDStatus.week_start_date == week_start,
            CharacterCDStatus.is_cleared == True
        )
    )

    return {row[0]: row[1] for row in result.fetchall()}
