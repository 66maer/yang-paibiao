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
    set -a
    # shellcheck disable=SC1091
    source .env.docker
    set +a
    echo "✓ Loaded environment variables from .env.docker"
else
    echo "⚠ Warning: .env.docker not found, using defaults"
fi

# 设置默认值
CANONICAL_REGISTRY="${DOCKER_CANONICAL_REGISTRY:-ghcr.io}"
PREFERRED_REGISTRY="${DOCKER_REGISTRY:-}"
USERNAME="${DOCKER_USERNAME:-66maer}"
VERSION="${VERSION:-latest}"
REGISTRY_CANDIDATES_RAW="${DOCKER_REGISTRY_CANDIDATES:-}"

DEFAULT_REGISTRY_CANDIDATES=(
    "ghcr.nju.edu.cn"
    "ghcr.linkos.org"
    "ghcr.milu.moe"
    "ghcr.registry.cyou"
    "ghcr.chenby.cn"
    "docker.1ms.run/ghcr.io"
    "proxy.vvvv.ee/ghcr.io"
    "ghcr.io"
)

declare -a REGISTRY_CANDIDATES=()

append_registry_candidate() {
    local candidate="${1%/}"

    if [ -z "$candidate" ]; then
        return 0
    fi

    for existing in "${REGISTRY_CANDIDATES[@]}"; do
        if [ "$existing" = "$candidate" ]; then
            return 0
        fi
    done

    REGISTRY_CANDIDATES+=("$candidate")
}

append_registry_candidate "$PREFERRED_REGISTRY"

if [ -n "$REGISTRY_CANDIDATES_RAW" ]; then
    for candidate in $REGISTRY_CANDIDATES_RAW; do
        append_registry_candidate "$candidate"
    done
else
    for candidate in "${DEFAULT_REGISTRY_CANDIDATES[@]}"; do
        append_registry_candidate "$candidate"
    done
fi

append_registry_candidate "$CANONICAL_REGISTRY"

export DOCKER_CANONICAL_REGISTRY="$CANONICAL_REGISTRY"
export DOCKER_USERNAME="$USERNAME"
export VERSION="$VERSION"

get_service_image_name() {
    case "$1" in
        backend)
            echo "yangpaibiao-backend"
            ;;
        frontend)
            echo "yangpaibiao-frontend"
            ;;
        bot)
            echo "yangpaibiao-bot"
            ;;
        *)
            echo ""
            ;;
    esac
}

pull_service_image() {
    local service="$1"
    local image_name
    local target_image
    local source_image

    image_name="$(get_service_image_name "$service")"

    if [ -z "$image_name" ]; then
        echo "❌ Unknown service: $service"
        return 1
    fi

    target_image="${CANONICAL_REGISTRY}/${USERNAME}/${image_name}:${VERSION}"

    echo "📦 Pulling image for $service"

    for candidate in "${REGISTRY_CANDIDATES[@]}"; do
        source_image="${candidate}/${USERNAME}/${image_name}:${VERSION}"
        echo "  -> Trying $source_image"

        if docker pull "$source_image"; then
            if [ "$source_image" != "$target_image" ]; then
                docker tag "$source_image" "$target_image"
            fi

            echo "  ✓ Ready: $target_image"
            return 0
        fi
    done

    echo "❌ Failed to pull image for service: $service"
    return 1
}

# 解析要部署的服务
SERVICES_TO_DEPLOY="$@"

if [ -z "$SERVICES_TO_DEPLOY" ]; then
    echo "ℹ️  No specific services specified, deploying all services"
    SERVICES_TO_DEPLOY="backend frontend bot"
fi

echo ""
echo "Configuration:"
echo "  Canonical registry: $CANONICAL_REGISTRY"
echo "  Registry candidates: ${REGISTRY_CANDIDATES[*]}"
echo "  Username: $USERNAME"
echo "  Version: $VERSION"
echo "  Services to deploy: $SERVICES_TO_DEPLOY"
echo ""

# 先拉取镜像，避免停止服务后才发现镜像源不可用
for service in $SERVICES_TO_DEPLOY; do
    pull_service_image "$service"
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
