"""
FastAPI主应用入口
"""
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.database import init_db, close_db
from app.api.v2 import api_router

# 确保 stdout 不被缓冲（解决 print 不显示的问题）
sys.stdout.reconfigure(line_buffering=True)

# 初始化日志系统（必须在应用创建前）
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库，关闭时清理资源
    """
    # 启动时执行
    logger.info("正在初始化数据库...")
    await init_db()
    logger.info("数据库初始化完成")

    yield

    # 关闭时执行
    logger.info("正在关闭数据库连接...")
    await close_db()
    logger.info("数据库连接已关闭")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="剑网3副本团队管理系统后端API",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    import time
    start_time = time.time()

    # 记录请求
    logger.debug(f">>> {request.method} {request.url.path}")

    response = await call_next(request)

    # 计算处理时间
    process_time = (time.time() - start_time) * 1000

    # 根据状态码选择日志级别
    if response.status_code >= 500:
        logger.error(
            f"<<< {request.method} {request.url.path} | "
            f"状态: {response.status_code} | 耗时: {process_time:.2f}ms"
        )
    elif response.status_code >= 400:
        logger.warning(
            f"<<< {request.method} {request.url.path} | "
            f"状态: {response.status_code} | 耗时: {process_time:.2f}ms"
        )
    else:
        logger.info(
            f"<<< {request.method} {request.url.path} | "
            f"状态: {response.status_code} | 耗时: {process_time:.2f}ms"
        )

    return response


# 注册API路由
app.include_router(api_router, prefix="/api/v2")


@app.get("/")
async def root():
    """根路径"""
    logger.debug("访问根路径")
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}


@app.get("/test-log")
async def test_logging():
    """测试日志系统"""
    logger.debug("这是一条 DEBUG 日志")
    logger.info("这是一条 INFO 日志")
    logger.warning("这是一条 WARNING 日志")
    logger.error("这是一条 ERROR 日志")
    return {
        "status": "ok",
        "message": "日志已输出，请检查控制台和 logs/ 目录"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
