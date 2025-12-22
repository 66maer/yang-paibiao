"""
API v2 路由模块
"""
from fastapi import APIRouter
from app.api.v2.endpoints import auth
from app.api.v2.endpoints import guilds as guilds_user
from app.api.v2.endpoints import teams
from app.api.v2 import admin
from app.api.v2 import users

api_router = APIRouter()

# 注册用户认证路由
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["用户认证"]
)

# 注册用户管理路由
api_router.include_router(
    users.router,
    tags=["用户管理"]
)

# 注册管理员路由（群组管理、订阅管理等）
api_router.include_router(
    admin.api_router,
    prefix="/admin",
    tags=["管理后台"]
)

# 群组成员相关用户接口
api_router.include_router(
    guilds_user.router,
    tags=["群组用户接口"]
)

# 开团相关用户接口
api_router.include_router(
    teams.router,
    tags=["团队/开团"]
)
