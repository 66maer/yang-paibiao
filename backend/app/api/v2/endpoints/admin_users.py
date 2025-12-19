"""
管理员用户管理接口
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_, any_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.models.admin import SystemAdmin
from app.schemas.user import (
    UserUpdate,
    UserResponse,
    UserListResponse,
)
from app.schemas.common import ResponseModel
from app.core.security import get_password_hash
from datetime import datetime

router = APIRouter()


@router.get("", response_model=ResponseModel[UserListResponse])
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=10000, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词（QQ号或昵称）"),
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户列表（管理员）
    
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认20，最大10000）
    - **keyword**: 搜索关键词（可选）
    """
    # 构建查询
    query = select(User).where(User.deleted_at.is_(None))
    
    # 关键词搜索
    if keyword:
        query = query.where(
            or_(
                User.qq_number.ilike(f"%{keyword}%"),
                User.nickname.ilike(f"%{keyword}%"),
                User.other_nicknames.any(keyword)  # 搜索other_nicknames数组
            )
        )
    
    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 分页查询
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    # 计算总页数
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return ResponseModel(data=UserListResponse(
        items=[UserResponse.model_validate(user) for user in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    ))


@router.get("/{user_id}", response_model=ResponseModel[UserResponse])
async def get_user(
    user_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取用户详情（管理员）"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return ResponseModel(data=UserResponse.model_validate(user))


@router.put("/{user_id}", response_model=ResponseModel[UserResponse])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """更新用户信息（管理员）"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新字段
    if user_data.nickname is not None:
        user.nickname = user_data.nickname
    if user_data.other_nicknames is not None:
        user.other_nicknames = user_data.other_nicknames
    if user_data.avatar is not None:
        user.avatar = user_data.avatar
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    return ResponseModel(data=UserResponse.model_validate(user))


@router.delete("/{user_id}", response_model=ResponseModel)
async def delete_user(
    user_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """删除用户（软删除）（管理员）"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 软删除
    user.deleted_at = datetime.utcnow()
    await db.commit()
    
    return ResponseModel(message="用户删除成功")


@router.post("/{user_id}/reset-password", response_model=ResponseModel)
async def reset_user_password(
    user_id: int,
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """重置用户密码（管理员）"""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 重置密码为 123456
    user.password_hash = get_password_hash("123456")
    user.updated_at = datetime.utcnow()
    await db.commit()
    
    return ResponseModel(message=f"用户 {user.nickname} 的密码已重置为 123456")
