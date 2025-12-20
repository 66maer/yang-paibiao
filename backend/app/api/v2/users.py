"""
用户管理接口
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_user, get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.admin import SystemAdmin
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserUpdate,
    UserChangePassword,
    UserResponse,
    UserLoginResponse,
    UserListResponse,
)
from app.schemas.common import ResponseModel

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.post("/register", response_model=ResponseModel[UserResponse], status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    用户注册
    
    - **qq_number**: QQ号（5-20位数字）
    - **password**: 密码（6-50位字符）
    - **nickname**: 昵称（1-50位字符）
    """
    # 检查QQ号是否已存在
    result = await db.execute(
        select(User).where(User.qq_number == user_data.qq_number, User.deleted_at.is_(None))
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该QQ号已被注册"
        )
    
    # 创建新用户
    new_user = User(
        qq_number=user_data.qq_number,
        password_hash=get_password_hash(user_data.password),
        nickname=user_data.nickname,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return ResponseModel(data=UserResponse.model_validate(new_user))


@router.post("/login", response_model=ResponseModel[UserLoginResponse])
async def login_user(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录
    
    - **qq_number**: QQ号
    - **password**: 密码
    """
    # 查找用户
    result = await db.execute(
        select(User).where(User.qq_number == login_data.qq_number, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="QQ号或密码错误"
        )
    
    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    # 生成访问令牌
    access_token = create_access_token(
        data={"sub": str(user.id), "type": "user"}
    )
    
    return ResponseModel(data=UserLoginResponse(
        access_token=access_token,
        expires_in=86400,  # 24小时
        user=UserResponse.model_validate(user)
    ))


@router.get("/me", response_model=ResponseModel[UserResponse])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """获取当前登录用户信息"""
    return ResponseModel(data=UserResponse.model_validate(current_user))


@router.put("/me", response_model=ResponseModel[UserResponse])
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新当前用户信息
    
    - **nickname**: 昵称（可选）
    - **other_nicknames**: 其他昵称（可选）
    - **avatar**: 头像URL（可选）
    """
    # 更新字段
    if user_data.nickname is not None:
        current_user.nickname = user_data.nickname
    if user_data.other_nicknames is not None:
        current_user.other_nicknames = user_data.other_nicknames
    if user_data.avatar is not None:
        current_user.avatar = user_data.avatar
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return ResponseModel(data=UserResponse.model_validate(current_user))


@router.put("/me/password", response_model=ResponseModel)
async def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    修改密码
    
    - **old_password**: 旧密码
    - **new_password**: 新密码
    """
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )
    
    # 更新密码
    current_user.password_hash = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    
    return ResponseModel(message="密码修改成功")


# ==================== 管理员接口 ====================

@router.get("", response_model=ResponseModel[UserListResponse])
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词（QQ号或昵称）"),
    current_admin: SystemAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户列表（管理员）
    
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认20，最大100）
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
