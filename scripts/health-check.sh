#!/bin/bash
# Yang Paibiao 健康检查脚本

set -e

echo "========================================="
echo "  Health Check"
echo "========================================="

# 检查后端容器是否运行
echo "🔍 Checking backend container..."
BACKEND_RUNNING=$(docker inspect -f '{{.State.Running}}' yangpaibiao-backend 2>/dev/null || echo "false")

if [ "$BACKEND_RUNNING" != "true" ]; then
    echo "❌ Backend container is not running"
    exit 1
fi
echo "✅ Backend container is running"

# 检查后端健康
echo "🔍 Checking backend health endpoint..."
BACKEND_STATUS=$(docker exec yangpaibiao-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" == "200" ]; then
    echo "✅ Backend is healthy (HTTP $BACKEND_STATUS)"
else
    echo "❌ Backend health check failed (HTTP $BACKEND_STATUS)"
    echo "   Checking backend logs..."
    docker logs yangpaibiao-backend --tail 20
    exit 1
fi

# 检查前端容器是否运行
echo "🔍 Checking frontend container..."
FRONTEND_RUNNING=$(docker inspect -f '{{.State.Running}}' yangpaibiao-frontend 2>/dev/null || echo "false")

if [ "$FRONTEND_RUNNING" != "true" ]; then
    echo "❌ Frontend container is not running"
    exit 1
fi
echo "✅ Frontend container is running"

# 检查前端健康
echo "🔍 Checking frontend health..."
FRONTEND_STATUS=$(docker exec yangpaibiao-frontend curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" == "200" ] || [ "$FRONTEND_STATUS" == "304" ]; then
    echo "✅ Frontend is healthy (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend health check failed (HTTP $FRONTEND_STATUS)"
    echo "   Checking frontend logs..."
    docker logs yangpaibiao-frontend --tail 20
    exit 1
fi

# 检查数据库连接
echo "🔍 Checking database connectivity..."
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
    echo "✅ Database connectivity OK"
else
    echo "❌ Database connectivity failed"
    echo "   $DB_CHECK"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ All health checks passed!"
echo "========================================="
echo ""
echo "Container details:"
docker ps --filter name=yangpaibiao --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
