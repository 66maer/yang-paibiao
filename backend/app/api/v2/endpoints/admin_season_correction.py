"""
赛季修正系数管理接口（管理员）
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.api import deps
from app.models.season_correction_factor import SeasonCorrectionFactor
from app.schemas.season_correction import (
    SeasonCorrectionFactorCreate,
    SeasonCorrectionFactorUpdate,
    SeasonCorrectionFactorOut
)
from app.schemas.common import ResponseModel, success

router = APIRouter()


@router.get("/seasons/{dungeon}", response_model=ResponseModel[List[SeasonCorrectionFactorOut]])
async def get_season_corrections(
    dungeon: str,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """获取指定副本的所有赛季修正系数"""
    result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(SeasonCorrectionFactor.dungeon == dungeon)
        .order_by(SeasonCorrectionFactor.start_date.desc())
    )
    factors = result.scalars().all()
    return success([SeasonCorrectionFactorOut.model_validate(f) for f in factors])


@router.post("/seasons", response_model=ResponseModel[SeasonCorrectionFactorOut])
async def create_season_correction(
    payload: SeasonCorrectionFactorCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """创建赛季修正系数"""
    # 检查时间段是否重叠
    conditions = [
        SeasonCorrectionFactor.dungeon == payload.dungeon
    ]

    # 检查新时间段是否与现有时间段重叠
    overlap_conditions = []

    # 情况1：新时间段的开始日期在现有时间段内
    overlap_conditions.append(
        and_(
            SeasonCorrectionFactor.start_date <= payload.start_date,
            or_(
                SeasonCorrectionFactor.end_date.is_(None),
                SeasonCorrectionFactor.end_date >= payload.start_date
            )
        )
    )

    # 情况2：如果新时间段有结束日期，检查结束日期是否在现有时间段内
    if payload.end_date:
        overlap_conditions.append(
            and_(
                SeasonCorrectionFactor.start_date <= payload.end_date,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date >= payload.end_date
                )
            )
        )

        # 情况3：新时间段完全包含现有时间段
        overlap_conditions.append(
            and_(
                SeasonCorrectionFactor.start_date >= payload.start_date,
                or_(
                    SeasonCorrectionFactor.end_date.is_(None),
                    SeasonCorrectionFactor.end_date <= payload.end_date
                )
            )
        )

    result = await db.execute(
        select(SeasonCorrectionFactor)
        .where(and_(*conditions, or_(*overlap_conditions)))
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="时间段与已有配置重叠"
        )

    factor = SeasonCorrectionFactor(**payload.model_dump())
    db.add(factor)
    await db.commit()
    await db.refresh(factor)

    return success(SeasonCorrectionFactorOut.model_validate(factor))


@router.put("/seasons/{factor_id}", response_model=ResponseModel[SeasonCorrectionFactorOut])
async def update_season_correction(
    factor_id: int,
    payload: SeasonCorrectionFactorUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """更新赛季修正系数"""
    result = await db.execute(
        select(SeasonCorrectionFactor).where(SeasonCorrectionFactor.id == factor_id)
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配置不存在")

    # 更新字段
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(factor, field, value)

    await db.commit()
    await db.refresh(factor)

    return success(SeasonCorrectionFactorOut.model_validate(factor))


@router.delete("/seasons/{factor_id}", response_model=ResponseModel)
async def delete_season_correction(
    factor_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """删除赛季修正系数"""
    result = await db.execute(
        select(SeasonCorrectionFactor).where(SeasonCorrectionFactor.id == factor_id)
    )
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配置不存在")

    await db.delete(factor)
    await db.commit()

    return success(message="删除成功")
