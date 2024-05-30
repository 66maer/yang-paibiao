# 使用官方 Node 镜像作为基础镜像
FROM node:lts-alpine3.20
# 设置工作目录
WORKDIR /app
# 复制 package.json 和 package-lock.json
COPY package*.json ./
# 安装依赖
RUN npm install
# 复制项目文件
COPY . .
# 暴露端口
EXPOSE 5000
# 启动后端服务
CMD ["npm", "start"]


