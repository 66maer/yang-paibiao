"""
数据库模型模块
导出所有数据模型
"""
from app.models.admin import SystemAdmin
from app.models.user import User

__all__ = ["SystemAdmin", "User"]
