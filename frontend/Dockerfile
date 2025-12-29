# ===== Stage 1: Build =====
FROM node:20-alpine as builder

# 设置工作目录
WORKDIR /build

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm ci 以获得更可靠的安装）
RUN npm ci

# 复制源代码
COPY . .

# 构建参数（在构建时传入）
ARG VITE_API_BASE_URL=/api/v2
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 构建应用
RUN npm run build

# ===== Stage 2: Runtime =====
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 builder 阶段复制构建产物
COPY --from=builder /build/dist /usr/share/nginx/html

# 添加启动脚本（用于环境变量注入）
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 启动
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
