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
    import os

    # 导入所有模型以确保它们被注册到元数据中
    import app.models  # noqa: F401 - 导入用于注册模型，不直接使用

    # 获取 alembic.ini 配置文件路径
    alembic_cfg_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "alembic.ini"
    )

    # 创建 Alembic 配置
    alembic_cfg = Config(alembic_cfg_path)

    # 运行迁移到最新版本
    logger.info("运行数据库迁移...")
    command.upgrade(alembic_cfg, "head")
    logger.info("数据库迁移完成")


async def close_db():
    """关闭数据库连接"""
    logger.info("关闭数据库连接池...")
    await engine.dispose()
    logger.info("数据库连接池已关闭")
