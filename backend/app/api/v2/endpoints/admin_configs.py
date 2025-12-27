"""
管理员 - 系统配置管理接口
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, bindparam, String
from pydantic import BaseModel

from app.api import deps
from app.database import AsyncSessionLocal


class DungeonOption(BaseModel):
    """副本选项"""
    name: str
    type: str  # primary 或 secondary
    order: int


class DungeonOptionsResponse(BaseModel):
    """副本选项响应"""
    options: List[DungeonOption]


class DungeonOptionsUpdate(BaseModel):
    """副本选项更新"""
    options: List[DungeonOption]


router = APIRouter()


@router.get("/dungeons", response_model=DungeonOptionsResponse)
async def get_dungeon_options(
    type: str | None = None,  # 可选：过滤类型（primary/secondary）
    db: AsyncSession = Depends(deps.get_db),
):
    """
    获取副本选项配置

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


@router.put("/dungeons", response_model=DungeonOptionsResponse)
async def update_dungeon_options(
    data: DungeonOptionsUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin = Depends(deps.get_current_admin)
):
    """
    更新副本选项配置（需要管理员权限）

    - **options**: 副本选项列表，每项包含 name、type、order
    """
    # 将数据转换为 JSON
    import json
    options_json = json.dumps([opt.model_dump() for opt in data.options], ensure_ascii=False)

    # 更新配置 - 直接使用参数化查询
    # 注意：因为 asyncpg 对 JSON 类型有特殊处理，直接传递字符串即可
    await db.execute(
        text("UPDATE system_configs SET value = :value, updated_at = NOW() WHERE key = 'dungeon_options'"),
        {"value": options_json}
    )
    await db.commit()

    return {"options": data.options}
