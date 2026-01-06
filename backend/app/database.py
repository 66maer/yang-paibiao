"""
数据库连接配置
使用 SQLAlchemy 2.0 异步引擎
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.logging import get_logger
from app.models.base import Base

logger = get_logger(__name__)

# 创建异步引擎
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # 开发环境显示SQL语句
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # 连接前测试可用性
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """
    获取数据库会话的依赖注入函数
    用于 FastAPI 的 Depends
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    初始化数据库
    使用 Alembic 自动迁移到最新版本
    """
    from alembic.config import Config
    from alembic import command
    from alembic.script import ScriptDirectory
    from alembic.runtime.migration import MigrationContext
    from sqlalchemy import create_engine
    import os
    import asyncio

    # 导入所有模型以确保它们被注册到元数据中
    import app.models  # noqa: F401 - 导入用于注册模型，不直接使用

    logger.info("开始数据库初始化流程...")

    # 获取 alembic.ini 配置文件路径
    alembic_cfg_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "alembic.ini"
    )
    logger.info(f"Alembic 配置文件: {alembic_cfg_path}")

    # 创建 Alembic 配置
    alembic_cfg = Config(alembic_cfg_path)

    # 将 asyncpg 转换为 psycopg2 用于迁移
    db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2") if "+asyncpg" in settings.DATABASE_URL else settings.DATABASE_URL
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    logger.info("已设置数据库 URL")

    # 在单独的线程中运行迁移检查和执行
    def run_migration():
        logger.info("创建同步引擎用于迁移...")
        sync_engine = create_engine(db_url, poolclass=None)

        try:
            with sync_engine.connect() as connection:
                logger.info("检查当前数据库版本...")
                context = MigrationContext.configure(connection)
                current_rev = context.get_current_revision()
                logger.info(f"当前数据库版本: {current_rev}")

                # 检查是否需要迁移
                script = ScriptDirectory.from_config(alembic_cfg)
                head_rev = script.get_current_head()
                logger.info(f"目标数据库版本: {head_rev}")

                if current_rev == head_rev:
                    logger.info("数据库已是最新版本，无需迁移")
                else:
                    logger.info(f"需要迁移: {current_rev} -> {head_rev}")
                    logger.info("开始执行迁移...")
                    command.upgrade(alembic_cfg, "head")
                    logger.info("迁移完成")
        finally:
            sync_engine.dispose()
            logger.info("已释放同步引擎资源")

    # 使用 to_thread 在单独的线程中运行迁移
    logger.info("在独立线程中运行数据库迁移...")
    await asyncio.to_thread(run_migration)
    logger.info("数据库初始化完成")


async def close_db():
    """关闭数据库连接"""
    logger.info("关闭数据库连接池...")
    await engine.dispose()
    logger.info("数据库连接池已关闭")
