"""
API v2 路由模块
"""
from fastapi import APIRouter
from app.api.v2.endpoints import auth
from app.api.v2.endpoints import guilds as guilds_user
from app.api.v2.endpoints import teams
from app.api.v2.endpoints import templates
from app.api.v2.endpoints import signups
from app.api.v2.endpoints import gold_records
from app.api.v2.endpoints import configs
from app.api.v2.endpoints import ranking
from app.api.v2.endpoints import my_records
from app.api.v2 import admin
from app.api.v2 import users
from app.api.v2 import characters
from app.api.v2 import bot

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

# 开团模板接口
api_router.include_router(
    templates.router,
    tags=["开团模板"]
)

# 报名管理接口
api_router.include_router(
    signups.router,
    tags=["报名管理"]
)

# 角色管理接口
api_router.include_router(
    characters.router,
    tags=["角色管理"]
)

# 金团记录接口
api_router.include_router(
    gold_records.router,
    tags=["金团记录"]
)

# 红黑榜接口
api_router.include_router(
    ranking.router,
    tags=["红黑榜"]
)

# 我的记录接口
api_router.include_router(
    my_records.router,
    tags=["我的记录"]
)

# 系统配置接口（公开）
api_router.include_router(
    configs.router,
    prefix="/configs",
    tags=["系统配置"]
)

# Bot API接口
api_router.include_router(
    bot.router,
    prefix="/bot",
    tags=["机器人API"]
)
