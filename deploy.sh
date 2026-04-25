#!/bin/bash
# Yang Paibiao 部署脚本
# 支持选择性部署：bash deploy.sh [backend] [frontend] [bot]
# 不传参数则部署所有服务

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
DEFAULT_REGISTRY_CANDIDATES="ghcr.m.daocloud.io,m.daocloud.io/ghcr.io,dockerproxy.net/ghcr.io,dockerproxy.com/ghcr.io,docker.1ms.run/ghcr.io,docker.nju.edu.cn/ghcr.io,docker.mirrors.sjtug.sjtu.edu.cn/ghcr.io,dockerhub.azk8s.cn/ghcr.io,ghcr.io"
REGISTRY_CANDIDATES="${DOCKER_REGISTRY_CANDIDATES:-$DEFAULT_REGISTRY_CANDIDATES}"

# 解析要部署的服务
SERVICES_TO_DEPLOY="$@"

if [ -z "$SERVICES_TO_DEPLOY" ]; then
    echo "ℹ️  No specific services specified, deploying all services"
    SERVICES_TO_DEPLOY="backend frontend bot"
fi

pull_image_with_fallback() {
    local service="$1"
    local image_name="yangpaibiao-${service}"
    local canonical_image="${REGISTRY}/${USERNAME}/${image_name}:${VERSION}"
    local registry_prefixes=()
    local registry_prefix=""
    local candidate_image=""
    local IFS=','

    read -r -a registry_prefixes <<< "$REGISTRY_CANDIDATES"

    echo "📦 Pulling ${image_name}:${VERSION}"
    for registry_prefix in "${registry_prefixes[@]}"; do
        registry_prefix="${registry_prefix//[[:space:]]/}"

        if [ -z "$registry_prefix" ]; then
            continue
        fi

        candidate_image="${registry_prefix}/${USERNAME}/${image_name}:${VERSION}"
        echo "  -> trying $candidate_image"

        if docker pull "$candidate_image"; then
            if [ "$candidate_image" != "$canonical_image" ]; then
                docker tag "$candidate_image" "$canonical_image"
            fi

            echo "  ✓ using $candidate_image"
            return 0
        fi
    done

    echo "✗ Failed to pull ${image_name}:${VERSION} from all configured registries"
    return 1
}

echo ""
echo "Configuration:"
echo "  Registry: $REGISTRY"
echo "  Username: $USERNAME"
echo "  Version: $VERSION"
echo "  Registry candidates: $REGISTRY_CANDIDATES"
echo "  Services to deploy: $SERVICES_TO_DEPLOY"
echo ""

# 优先拉取镜像，拉取成功后再重启服务，避免无谓停机
echo "📥 Pulling images with fallback registries..."
for service in $SERVICES_TO_DEPLOY; do
    pull_image_with_fallback "$service"
done

# 停止要更新的服务
echo "🛑 Stopping services: $SERVICES_TO_DEPLOY"
for service in $SERVICES_TO_DEPLOY; do
    docker-compose -f docker-compose.prod.yml stop $service || true
    docker-compose -f docker-compose.prod.yml rm -f $service || true
done

# 清理未使用的镜像（可选，节省磁盘空间）
echo "🧹 Cleaning up unused images..."
docker image prune -f

# 启动服务
echo "🚀 Starting services: $SERVICES_TO_DEPLOY"
docker-compose -f docker-compose.prod.yml up -d $SERVICES_TO_DEPLOY

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
for service in $SERVICES_TO_DEPLOY; do
    echo "--- $service ---"
    docker-compose -f docker-compose.prod.yml logs --tail=10 $service
done

echo ""
echo "========================================="
echo "✅ Deployment completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  - Run health checks: bash scripts/health-check.sh"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Check status: docker-compose -f docker-compose.prod.yml ps"
