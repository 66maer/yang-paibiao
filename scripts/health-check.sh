#!/bin/bash
# Yang Paibiao 健康检查脚本

set -e

echo "========================================="
echo "  健康检查"
echo "========================================="

# 检查后端容器是否运行
echo "🔍 检查后端容器..."
BACKEND_RUNNING=$(docker inspect -f '{{.State.Running}}' yangpaibiao-backend 2>/dev/null || echo "false")

if [ "$BACKEND_RUNNING" != "true" ]; then
    echo "❌ 后端容器未运行"
    exit 1
fi
echo "✅ 后端容器正在运行"

# 检查后端健康
echo "🔍 检查后端健康接口..."
BACKEND_STATUS=$(docker exec yangpaibiao-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" == "200" ]; then
    echo "✅ 后端健康 (HTTP $BACKEND_STATUS)"
else
    echo "❌ 后端健康检查失败 (HTTP $BACKEND_STATUS)"
    echo "   查看后端日志..."
    docker logs yangpaibiao-backend --tail 20
    exit 1
fi

# 检查前端容器是否运行
echo "🔍 检查前端容器..."
FRONTEND_RUNNING=$(docker inspect -f '{{.State.Running}}' yangpaibiao-frontend 2>/dev/null || echo "false")

if [ "$FRONTEND_RUNNING" != "true" ]; then
    echo "❌ 前端容器未运行"
    exit 1
fi
echo "✅ 前端容器正在运行"

# 检查前端健康
echo "🔍 检查前端健康..."
FRONTEND_STATUS=$(docker exec yangpaibiao-frontend curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" == "200" ] || [ "$FRONTEND_STATUS" == "304" ]; then
    echo "✅ 前端健康 (HTTP $FRONTEND_STATUS)"
else
    echo "❌ 前端健康检查失败 (HTTP $FRONTEND_STATUS)"
    echo "   查看前端日志..."
    docker logs yangpaibiao-frontend --tail 20
    exit 1
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
DB_CHECK=$(docker exec yangpaibiao-backend python -c "
import asyncio
from app.database import engine

async def check():
    try:
        async with engine.begin() as conn:
            await conn.execute('SELECT 1')
        return True
    except Exception as e:
        print(f'Error: {e}')
        return False

result = asyncio.run(check())
exit(0 if result else 1)
" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    echo "   $DB_CHECK"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ 所有健康检查通过!"
echo "========================================="
echo ""
echo "容器详情:"
docker ps --filter name=yangpaibiao --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
