"""
API v2 管理员路由模块
"""
from fastapi import APIRouter
from app.api.v2.endpoints import admin_auth, admin_guilds, admin_users, admin_characters, admin_configs

api_router = APIRouter()

# 注册管理员认证路由
api_router.include_router(
    admin_auth.router,
    prefix="/auth",
    tags=["管理员认证"]
)

# 注册群组管理路由
api_router.include_router(
    admin_guilds.router,
    prefix="/guilds",
    tags=["群组管理"]
)

# 注册管理员的用户管理路由
api_router.include_router(
    admin_users.router,
    prefix="/users",
    tags=["管理员-用户管理"]
)

# 注册管理员的角色管理路由
api_router.include_router(
    admin_characters.router,
    prefix="/characters",
    tags=["管理员-角色管理"]
)

# 注册系统配置管理路由
api_router.include_router(
    admin_configs.router,
    prefix="/configs",
    tags=["系统配置管理"]
)
