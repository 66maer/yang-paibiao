"""
日志配置模块
提供统一的日志管理，支持控制台和文件输出
"""
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from logging.handlers import RotatingFileHandler

from app.core.config import settings


# 日志格式
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# 简洁格式（用于控制台）
CONSOLE_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

# 日志目录
LOG_DIR = Path(__file__).parent.parent.parent / "logs"


class LoggerManager:
    """日志管理器"""

    _initialized = False
    _log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    @classmethod
    def setup(cls) -> None:
        """
        初始化日志系统
        应在应用启动时调用一次
        """
        if cls._initialized:
            return

        # 确保日志目录存在
        LOG_DIR.mkdir(parents=True, exist_ok=True)

        # 获取根日志器
        root_logger = logging.getLogger()
        root_logger.setLevel(cls._log_level)

        # 清除现有处理器（避免重复）
        root_logger.handlers.clear()

        # 添加控制台处理器
        console_handler = cls._create_console_handler()
        root_logger.addHandler(console_handler)

        # 添加文件处理器
        file_handler = cls._create_file_handler()
        root_logger.addHandler(file_handler)

        # 添加错误日志文件处理器
        error_handler = cls._create_error_file_handler()
        root_logger.addHandler(error_handler)

        # 配置第三方库的日志级别，避免过多噪音
        cls._configure_third_party_loggers()

        cls._initialized = True

        # 输出初始化信息
        logger = cls.get_logger("logging")
        logger.info("=" * 60)
        logger.info(f"日志系统初始化完成 | 级别: {logging.getLevelName(cls._log_level)}")
        logger.info(f"日志目录: {LOG_DIR}")
        logger.info(f"环境: {settings.ENVIRONMENT} | 调试模式: {settings.DEBUG}")
        logger.info("=" * 60)

    @classmethod
    def _create_console_handler(cls) -> logging.Handler:
        """创建控制台处理器"""
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(cls._log_level)
        handler.setFormatter(logging.Formatter(CONSOLE_FORMAT, LOG_DATE_FORMAT))

        # 强制刷新，确保立即输出
        handler.flush = sys.stdout.flush

        return handler

    @classmethod
    def _create_file_handler(cls) -> logging.Handler:
        """创建文件处理器（按大小轮转）"""
        log_file = LOG_DIR / "app.log"
        handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        handler.setLevel(cls._log_level)
        handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
        return handler

    @classmethod
    def _create_error_file_handler(cls) -> logging.Handler:
        """创建错误日志文件处理器"""
        log_file = LOG_DIR / "error.log"
        handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8"
        )
        handler.setLevel(logging.ERROR)
        handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
        return handler

    @classmethod
    def _configure_third_party_loggers(cls) -> None:
        """配置第三方库的日志级别"""
        # 减少第三方库的日志噪音
        third_party_loggers = [
            "uvicorn",
            "uvicorn.error",
            "uvicorn.access",
            "sqlalchemy.engine",
            "sqlalchemy.pool",
            "alembic",
            "httpx",
            "httpcore",
            "asyncio",
            "multipart",
        ]

        for logger_name in third_party_loggers:
            logger = logging.getLogger(logger_name)
            # 在 DEBUG 模式下显示更多，生产环境只显示 WARNING 以上
            if settings.DEBUG:
                logger.setLevel(logging.INFO)
            else:
                logger.setLevel(logging.WARNING)

        # SQLAlchemy 引擎日志特殊处理
        if settings.DEBUG:
            # DEBUG 模式下显示 SQL 语句
            logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        else:
            logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    @classmethod
    def get_logger(cls, name: Optional[str] = None) -> logging.Logger:
        """
        获取日志器

        Args:
            name: 日志器名称，通常使用模块名 __name__

        Returns:
            Logger 实例
        """
        # 确保日志系统已初始化
        if not cls._initialized:
            cls.setup()

        if name is None:
            return logging.getLogger("app")

        # 如果是应用内的模块，添加 app 前缀
        if not name.startswith("app."):
            name = f"app.{name}"

        return logging.getLogger(name)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    获取日志器的便捷函数

    使用示例:
        from app.core.logging import get_logger
        logger = get_logger(__name__)
        logger.info("这是一条日志")

    Args:
        name: 日志器名称，推荐使用 __name__

    Returns:
        Logger 实例
    """
    return LoggerManager.get_logger(name)


def setup_logging() -> None:
    """初始化日志系统"""
    LoggerManager.setup()


# 提供一个默认的 logger 实例，方便快速使用
logger = get_logger("app")
