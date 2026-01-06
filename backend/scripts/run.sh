#!/bin/bash
# 启动开发服务器

# 进入项目目录
cd "$(dirname "$0")/.." || exit

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "错误: .env 文件不存在！"
    echo "请复制 .env.example 为 .env 并配置相关参数"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 设置 Python 无缓冲输出
export PYTHONUNBUFFERED=1

# 启动服务
echo "正在启动开发服务器..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 9500 --log-level info
