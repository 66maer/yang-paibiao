"""
管理员认证相关API端点
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
)
from app.models.admin import SystemAdmin
from app.schemas.auth import (
    LoginRequest,
    Token,
    AdminInfo
)
from app.schemas.common import Response
from app.api.deps import get_current_admin

router = APIRouter()


@router.post("/login", response_model=Response[Token])
async def login_admin(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    管理员登录

    - **username**: 管理员用户名
    - **password**: 密码
    """
    # 查找管理员
    result = await db.execute(
        select(SystemAdmin).where(SystemAdmin.username == data.username)
    )
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 更新最后登录时间
    admin.last_login_at = datetime.utcnow()
    await db.commit()

    # 生成令牌
    token_data = {
        "sub": str(admin.id),
        "user_type": "admin"
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
async def logout_admin(
    current_admin: SystemAdmin = Depends(get_current_admin)
):
    """
    管理员登出
    需要管理员认证
    """
    return Response(
        code=0,
        message="登出成功"
    )


@router.get("/me", response_model=Response[AdminInfo])
async def get_admin_info(
    current_admin: SystemAdmin = Depends(get_current_admin)
):
    """
    获取当前管理员信息
    需要管理员认证
    """
    return Response(
        code=0,
        message="获取成功",
        data=AdminInfo.model_validate(current_admin)
    )
