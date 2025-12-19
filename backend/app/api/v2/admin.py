"""
API v2 管理员路由模块
"""
from fastapi import APIRouter
from app.api.v2.endpoints import admin_auth

api_router = APIRouter()

# 注册管理员认证路由
api_router.include_router(
    admin_auth.router,
    prefix="/auth",
    tags=["管理员认证"]
)
