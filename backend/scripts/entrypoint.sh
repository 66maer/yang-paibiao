#!/bin/bash
set -e

echo "=== 应用启动初始化 ==="

# 等待数据库准备就绪（可选）
# 如果数据库在另一个容器中，可能需要等待
if [ -n "$WAIT_FOR_DB" ]; then
    echo "等待数据库就绪..."
    sleep 5
fi

# 初始化管理员账号（幂等操作）
echo "检查并初始化管理员账号..."
python /app/scripts/init_admin.py

echo "=== 初始化完成，启动应用 ==="

# 启动应用（使用 exec 确保信号正确传递）
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
