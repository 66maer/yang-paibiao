"""
用户 - 系统配置接口（公开）
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel

from app.api import deps


class DungeonOption(BaseModel):
    """副本选项"""
    name: str
    type: str  # primary 或 secondary
    order: int


class DungeonOptionsResponse(BaseModel):
    """副本选项响应"""
    options: List[DungeonOption]


router = APIRouter()


@router.get("/dungeons", response_model=DungeonOptionsResponse)
async def get_dungeon_options(
    type: str | None = None,  # 可选：过滤类型（primary/secondary）
    db: AsyncSession = Depends(deps.get_db),
):
    """
    获取副本选项配置（公开接口）

    - **type**: 可选，过滤副本类型（primary 或 secondary）
    """
    # 查询配置
    result = await db.execute(
        text("SELECT value FROM system_configs WHERE key = 'dungeon_options'")
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="副本配置不存在")

    options = row[0]  # JSONB 字段会自动解析为 Python 对象

    # 如果指定了类型，进行过滤
    if type:
        options = [opt for opt in options if opt.get("type") == type]

    # 按 order 字段排序
    options.sort(key=lambda x: x.get("order", 0))

    return {"options": options}
