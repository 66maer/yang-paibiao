# 阶段1: 构建前端
# 使用官方 Node 镜像作为构建环境
FROM node:lts-alpine as build
# 设置工作目录
WORKDIR /app
# 复制 package.json 和 package-lock.json
COPY package*.json ./
# 安装依赖
RUN npm install
# 复制项目文件
COPY . .
# 构建前端
RUN npm run build

# 阶段2: 部署Nginx
# 使用官方 Nginx 镜像作为运行环境
FROM nginx:alpine
# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf
# 复制自定义 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d
# 复制构建的前端文件到 Nginx 静态资源目录
COPY --from=build /app/build /usr/share/nginx/html
# 暴露端口
EXPOSE 80
# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
