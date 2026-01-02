# ===== Stage 1: Builder =====
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /build

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖到全局位置
RUN pip install --no-cache-dir -r requirements.txt

# ===== Stage 2: Runtime =====
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建应用目录
WORKDIR /app

# 从 builder 复制已安装的依赖（全局位置）
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码
COPY . .

# 设置启动脚本权限
RUN chmod +x /app/scripts/entrypoint.sh

# 创建非 root 用户（安全最佳实践）
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 暴露端口
EXPOSE 8000

# 使用 entrypoint 脚本启动
CMD ["/app/scripts/entrypoint.sh"]
