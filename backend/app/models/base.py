"""
SQLAlchemy 基类定义
用于所有数据库模型的基类
"""
from sqlalchemy.orm import declarative_base

# 声明基类
Base = declarative_base()
