# ============================================
# Stage 1: 依赖安装和代码生成
# ============================================
FROM python:3.10 as builder

WORKDIR /build

# 安装 pipx 用于运行 nb-cli
RUN python -m pip install --user pipx && \
    python -m pipx ensurepath

# 复制项目配置文件
COPY ./pyproject.toml /build/

# 使用 nb-cli 生成 bot.py
RUN python -m pipx run --no-cache nb-cli generate -f /tmp/bot.py

# ============================================
# Stage 2: 运行环境
# ============================================
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 设置时区和环境变量
ENV TZ=Asia/Shanghai \
    PYTHONPATH=/app \
    APP_MODULE=_main:app \
    MAX_WORKERS=1 \
    ENVIRONMENT=production

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 复制启动脚本和配置
COPY ./docker/gunicorn_conf.py ./docker/start.sh /
RUN chmod +x /start.sh

# 从构建阶段复制生成的 bot.py
COPY --from=builder /tmp/bot.py /app/

# 复制应用代码
COPY ./docker/_main.py /app/
COPY ./src /app/src/
COPY ./pyproject.toml /app/

# 安装 Python 依赖
RUN pip install --no-cache-dir gunicorn uvicorn[standard] nonebot2 && \
    pip install --no-cache-dir -e .

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# 启动命令
CMD ["/start.sh"]