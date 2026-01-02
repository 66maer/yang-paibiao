#!/bin/sh
# 在运行时将环境变量注入到前端应用
# 这允许使用同一镜像部署到不同环境

set -e

echo "Starting Yang Paibiao Frontend..."
echo "API Base URL: ${VITE_API_BASE_URL:-/api/v2}"

# 生成环境变量配置文件（可选，如果前端需要运行时配置）
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-/api/v2}"
};
EOF

echo "Environment configuration generated:"
cat /usr/share/nginx/html/env-config.js

# 执行原始命令
exec "$@"
