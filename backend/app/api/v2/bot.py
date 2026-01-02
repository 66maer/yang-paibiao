"""
Bot API路由聚合器
"""
from fastapi import APIRouter
from app.api.v2.endpoints import (
    bot_members,
    bot_teams,
    bot_signups,
    bot_characters
)

router = APIRouter()

# 成员管理
router.include_router(bot_members.router, tags=["Bot-成员管理"])

# 团队查询
router.include_router(bot_teams.router, tags=["Bot-团队查询"])

# 报名管理
router.include_router(bot_signups.router, tags=["Bot-报名管理"])

# 角色管理
router.include_router(bot_characters.router, tags=["Bot-角色管理"])
