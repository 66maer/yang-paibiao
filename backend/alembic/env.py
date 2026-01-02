"""
Alembic环境配置
使用同步方式进行数据库迁移
"""
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection

from alembic import context

# 导入应用配置
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.models.base import Base

# 导入所有模型以确保它们被注册到 Base.metadata
# 导入 app.models 会自动执行 __init__.py 中的所有导入，将所有模型注册到 Base.metadata
import app.models  # noqa: F401 - 导入用于注册模型，不直接使用

# Alembic Config对象
config = context.config

# 设置数据库URL（从环境变量读取）
# 将 asyncpg 转换为 psycopg2 用于迁移
db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2") if "+asyncpg" in settings.DATABASE_URL else settings.DATABASE_URL
config.set_main_option("sqlalchemy.url", db_url)

# 解析日志配置
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 目标元数据
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    离线模式运行迁移
    只生成SQL脚本，不连接数据库
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """执行迁移"""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    在线模式运行迁移
    使用同步引擎连接数据库
    """
    from sqlalchemy import engine_from_config

    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = db_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
