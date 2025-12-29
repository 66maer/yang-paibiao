#!/bin/bash
# Yang Paibiao 部署脚本

set -e  # 遇到错误立即退出

echo "========================================="
echo "  Yang Paibiao Deployment Script"
echo "========================================="

# 加载环境变量
if [ -f .env.docker ]; then
    export $(cat .env.docker | grep -v '^#' | xargs)
    echo "✓ Loaded environment variables from .env.docker"
else
    echo "⚠ Warning: .env.docker not found, using defaults"
fi

# 设置默认值
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
USERNAME="${DOCKER_USERNAME:-66maer}"
VERSION="${VERSION:-latest}"

echo ""
echo "Configuration:"
echo "  Registry: $REGISTRY"
echo "  Username: $USERNAME"
echo "  Version: $VERSION"
echo ""

# 停止旧容器
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down || true

# 清理未使用的镜像（可选，节省磁盘空间）
echo "🧹 Cleaning up unused images..."
docker image prune -f

# 启动新容器
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ Waiting for services to be ready..."
sleep 10

# 检查容器状态
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

# 显示最近的日志
echo ""
echo "📝 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "========================================="
echo "✅ Deployment completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  - Run health checks: bash scripts/health-check.sh"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Check status: docker-compose -f docker-compose.prod.yml ps"
