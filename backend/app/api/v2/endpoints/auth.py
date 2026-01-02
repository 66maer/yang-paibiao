"""
用户认证相关API端点
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token
)
from app.models.user import User
from app.models.admin import SystemAdmin
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    Token,
    UserInfo,
)
from app.schemas.common import Response
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=Response[UserInfo])
async def register_user(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户注册

    - **qq_number**: QQ号（唯一）
    - **password**: 密码（至少6位）
    - **nickname**: 昵称
    """
    # 临时关闭注册功能
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="注册功能暂时关闭"
    )

    # 检查QQ号是否已存在
    result = await db.execute(
        select(User).where(
            User.qq_number == data.qq_number,
            User.deleted_at.is_(None)
        )
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该QQ号已被注册"
        )

    # 创建新用户
    new_user = User(
        qq_number=data.qq_number,
        password_hash=get_password_hash(data.password),
        nickname=data.nickname
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return Response(
        code=0,
        message="注册成功",
        data=UserInfo.model_validate(new_user)
    )


@router.post("/login", response_model=Response[Token])
async def login_user(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录

    - **username**: QQ号
    - **password**: 密码
    """
    # 查找用户
    result = await db.execute(
        select(User).where(
            User.qq_number == data.username,
            User.deleted_at.is_(None)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="QQ号或密码错误"
        )

    # 更新最后登录时间
    user.last_login_at = datetime.utcnow()
    await db.commit()

    # 生成令牌
    token_data = {
        "sub": str(user.id),
        "type": "user"  # 统一使用 type 字段
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Response(
        code=0,
        message="登录成功",
        data=Token(
            access_token=access_token,
            refresh_token=refresh_token
        )
    )


@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user)
):
    """
    用户登出
    需要用户认证
    """
    return Response(
        code=0,
        message="登出成功"
    )


@router.post("/refresh", response_model=Response[Token])
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    刷新访问令牌

    - **refresh_token**: 刷新令牌
    """
    # 验证刷新令牌
    payload = verify_token(data.refresh_token, token_type="refresh")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )

    user_type = payload.get("type")  # 统一使用 type 字段
    user_id = payload.get("sub")

    if not user_type or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌数据"
        )

    # 验证用户/管理员是否仍然存在
    if user_type == "user":
        result = await db.execute(
            select(User).where(User.id == int(user_id), User.deleted_at.is_(None))
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
    elif user_type == "admin":
        result = await db.execute(
            select(SystemAdmin).where(SystemAdmin.id == int(user_id))
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="管理员不存在"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户类型"
        )

    # 生成新令牌
    token_data = {
        "sub": user_id,
        "type": user_type  # 统一使用 type 字段
    }

    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return Response(
        code=0,
        message="令牌刷新成功",
        data=Token(
            access_token=access_token,
            refresh_token=new_refresh_token
        )
    )


@router.get("/me", response_model=Response[UserInfo])
async def get_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户信息
    需要用户认证
    """
    return Response(
        code=0,
        message="获取成功",
        data=UserInfo.model_validate(current_user)
    )
