# Yang Paibiao 详细部署指南

本指南按照**时间顺序**和**执行位置**编排，确保你清楚地知道在什么时候、在哪里、做什么操作。

---

## 📋 部署流程总览

```
阶段 1: 推送代码前的准备
  ├─ 服务器：创建数据库
  ├─ 服务器：创建环境配置文件
  ├─ 服务器：生成密钥
  ├─ 服务器：确认 SSL 证书
  └─ GitHub：配置 Secrets

阶段 2: 推送代码
  └─ 本地：提交并推送到 GitHub

阶段 3: CI/CD 自动部署 (GitHub Actions 自动执行)
  ├─ 构建 3 个 Docker 镜像
  ├─ 推送镜像到 GitHub Container Registry
  ├─ SSH 到服务器
  ├─ 拉取最新镜像
  ├─ 运行 deploy.sh
  └─ 运行健康检查

阶段 4: 首次部署后的初始化
  ├─ 服务器：运行数据库迁移
  └─ 服务器：创建管理员账户
```

---

## 🚀 阶段 1: 推送代码前的准备

### 步骤 1.1: 在服务器上创建数据库（📍 服务器）

```bash
# 1. SSH 到服务器
ssh maer@your-server-ip

# 2. 生成安全的数据库密码（重要：保存这个密码！）
DB_PASSWORD=$(openssl rand -base64 32)
echo "数据库密码: $DB_PASSWORD"
# ⚠️ 复制并保存这个密码，稍后需要填入配置文件

# 3. 创建数据库和用户
docker exec -i shared-postgres psql -U postgres <<EOF
CREATE USER yangpaibiao_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE yangpaibiao OWNER yangpaibiao_user ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';
GRANT ALL PRIVILEGES ON DATABASE yangpaibiao TO yangpaibiao_user;

-- 安全措施：撤销对其他数据库的访问
REVOKE CONNECT ON DATABASE postgres FROM yangpaibiao_user;
EOF

# 4. 验证数据库创建成功
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao -c "SELECT version();"
```

**✅ 检查点：** 应该能成功连接到 yangpaibiao 数据库

---

### 步骤 1.2: 在服务器上创建环境配置文件（📍 服务器）

**重要：这些配置文件只存在于服务器上，不会提交到 GitHub！**

#### 1.2.1 创建 `.env.docker` 文件

```bash
# 进入项目目录
cd /home/ubuntu/xiaoyang

# 生成 SECRET_KEY（重要：保存这个密钥！）
SECRET_KEY=$(openssl rand -base64 48)
echo "SECRET_KEY: $SECRET_KEY"

# 创建 .env.docker 文件
cat > .env.docker <<EOF
# ============================================
# Docker 镜像配置
# ============================================
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=66maer
VERSION=latest

# ============================================
# 数据库配置
# ============================================
DB_PASSWORD=$DB_PASSWORD

# ============================================
# 后端配置
# ============================================
SECRET_KEY=$SECRET_KEY

# ============================================
# API 配置
# ============================================
API_BASE_URL=/api/v2

# ============================================
# Bot 配置
# ============================================
BOT_HOST=0.0.0.0
BOT_PORT=8080
BOT_EXTERNAL_PORT=8080

# ============================================
# 其他配置
# ============================================
ENVIRONMENT=production
EOF

echo "✅ .env.docker 文件已创建"
```

#### 1.2.2 创建 `backend/.env.production` 文件

```bash
# 创建后端环境配置（使用上面生成的密码和密钥）
cat > backend/.env.production <<EOF
# 应用配置
APP_NAME=小秧排表系统
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=production

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 数据库配置（注意：DATABASE_URL 由 docker-compose 设置，这里只配置连接池）
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# JWT 配置（注意：SECRET_KEY 由 docker-compose 设置）
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS 配置
CORS_ORIGINS=["http://zyhm.fun", "http://www.zyhm.fun", "https://zyhm.fun", "https://www.zyhm.fun"]

# 日志配置
LOG_LEVEL=INFO

# 管理员默认配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
ADMIN_EMAIL=admin@zyhm.fun
EOF

echo "✅ backend/.env.production 文件已创建"
```

#### 1.2.3 创建 `yang_bot/.env.prod` 文件

```bash
# 创建 Bot 环境配置（需要你提供实际的 QQ 号和群号）
read -p "请输入超级管理员 QQ 号: " SUPERUSER_QQ
read -p "请输入 QQ 群号: " GUILD_ID

cat > yang_bot/.env.prod <<EOF
# ============================================
# Yang Bot 生产环境配置
# ============================================

# 运行环境
ENVIRONMENT=production
DRIVER=~fastapi

# ============================================
# NoneBot 配置
# ============================================
# 超级管理员QQ号
SUPERUSERS=["$SUPERUSER_QQ"]

# ============================================
# 小杨机器人配置
# ============================================
# 后端 API 地址（Docker 内部网络）
XIAOYANG__BACKEND_API_URL=http://backend:8000

# 后端 API 密钥（如果需要）
XIAOYANG__BACKEND_API_KEY=

# 群组 ID
XIAOYANG__GUILD_ID=$GUILD_ID

# 是否自动同步群成员
XIAOYANG__ENABLE_AUTO_SYNC_MEMBERS=true

# API 超时时间（秒）
XIAOYANG__API_TIMEOUT=30

# 会话超时时间（秒）
XIAOYANG__SESSION_TIMEOUT=60
EOF

echo "✅ yang_bot/.env.prod 文件已创建"
```

#### 1.2.4 设置文件权限（保护敏感信息）

```bash
chmod 600 .env.docker
chmod 600 backend/.env.production
chmod 600 yang_bot/.env.prod

echo "✅ 文件权限已设置"
```

**✅ 检查点：** 三个配置文件都已创建并设置权限

---

### 步骤 1.3: 确认 SSL 证书（📍 服务器）

```bash
# 检查 SSL 证书是否存在
ls -la /etc/letsencrypt/live/zyhm.fun/

# 如果证书不存在，需要申请
# 方法 1: 使用 Certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d zyhm.fun -d www.zyhm.fun \
  --email your-email@example.com \
  --agree-tos --no-eff-email

# 配置证书自动续期
crontab -e
# 添加以下行：
# 0 0 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet && docker exec shared-nginx nginx -s reload
```

**✅ 检查点：** SSL 证书文件存在于 `/etc/letsencrypt/live/zyhm.fun/`

---

### 步骤 1.4: 重载 Nginx 配置（📍 服务器）

```bash
# 检查 Nginx 配置是否正确
docker exec shared-nginx nginx -t

# 如果配置正确，重载 Nginx
docker exec shared-nginx nginx -s reload

echo "✅ Nginx 配置已重载"
```

**✅ 检查点：** Nginx 配置测试通过并重载成功

---

### 步骤 1.5: 在 GitHub 上配置 Secrets（📍 GitHub）

在浏览器中打开你的 GitHub 仓库，进入 `Settings > Secrets and variables > Actions`，添加以下 secrets：

| Secret 名称         | 说明                  | 获取方式                |
| ------------------- | --------------------- | ----------------------- |
| `SERVER_HOST`       | 服务器 IP 或域名      | 你的服务器地址          |
| `SERVER_USER`       | SSH 用户名            | `maer`                  |
| `SERVER_SSH_KEY`    | SSH 私钥              | 见下方说明              |
| `SERVER_PORT`       | SSH 端口（可选）      | `22`（默认可不填）      |
| `VITE_API_BASE_URL` | 前端 API 地址（可选） | `/api/v2`（默认可不填） |

**获取 SSH 私钥：**

```bash
# 在本地机器上运行
cat ~/.ssh/id_rsa

# 复制整个输出（包括 -----BEGIN OPENSSH PRIVATE KEY----- 和 -----END OPENSSH PRIVATE KEY-----）
# 粘贴到 GitHub Secrets 的 SERVER_SSH_KEY 中
```

**如果没有 SSH 密钥，先生成一个：**

```bash
# 在本地机器上运行
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 将公钥复制到服务器
ssh-copy-id maer@your-server-ip

# 然后复制私钥到 GitHub Secrets
cat ~/.ssh/id_rsa
```

**✅ 检查点：** 5 个 GitHub Secrets 已配置（或 3 个必需 + 2 个可选）

---

## 🎯 阶段 2: 推送代码

### 步骤 2.1: 检查本地代码（📍 本地）

```bash
cd /home/maer/work/yang-paibiao

# 查看当前状态
git status

# 确认所有新文件都已准备好
# 应该看到：
# - backend/Dockerfile
# - frontend/Dockerfile
# - yang_bot/Dockerfile
# - docker-compose.prod.yml
# - .github/workflows/deploy.yml
# - deploy.sh
# - scripts/health-check.sh
# 等文件
```

---

### 步骤 2.2: 提交代码（📍 本地）

```bash
# 添加所有部署相关文件
git add backend/Dockerfile \
        backend/.dockerignore \
        frontend/Dockerfile \
        frontend/.dockerignore \
        frontend/nginx.conf \
        frontend/docker-entrypoint.sh \
        yang_bot/Dockerfile \
        yang_bot/.dockerignore \
        docker-compose.prod.yml \
        docker-compose.dev.yml \
        .env.docker \
        .github/workflows/deploy.yml \
        deploy.sh \
        scripts/health-check.sh \
        DEPLOYMENT.md \
        CONFIG_GUIDE.md \
        SECRETS_EXPLAINED.md

# 查看将要提交的文件
git status

# ⚠️ 确认 .env.docker、backend/.env.production、yang_bot/.env.prod 没有被添加
# 这些文件应该在 .gitignore 中被排除

# 提交
git commit -m "feat: 添加 Docker 容器化和 CI/CD 自动部署配置

- 添加前后端和 Bot 的 Dockerfile（多阶段构建）
- 添加 docker-compose 生产和开发配置
- 添加 GitHub Actions 自动部署 workflow
- 添加部署和健康检查脚本
- 添加完整的部署指南文档"
```

---

### 步骤 2.3: 推送到 GitHub（📍 本地）

**重要：由于 CI/CD 配置为任意分支推送都触发，你可以先推送到 new 分支测试。**

```bash
# 查看当前分支
git branch

# 如果当前在 new 分支，直接推送
git push origin new

# 观察 GitHub Actions 执行情况
# 访问：https://github.com/你的用户名/yang-paibiao/actions
```

**✅ 检查点：** 代码已推送到 GitHub，GitHub Actions 开始执行

---

## ⚙️ 阶段 3: CI/CD 自动部署（GitHub Actions 自动执行）

**你不需要做任何操作，只需要监控！**

### 监控部署进度（📍 GitHub 网页）

1. 访问 GitHub 仓库的 Actions 页面
2. 查看 "Build and Deploy" 工作流执行状态
3. 点击正在运行的 workflow 查看详细日志

**部署过程：**

```
Job 1: build-and-push
  ├─ ✓ Checkout code
  ├─ ✓ Set up Docker Buildx
  ├─ ✓ Log in to GitHub Container Registry
  ├─ ✓ Extract metadata
  ├─ ✓ Build and push backend image (约 5-10 分钟)
  ├─ ✓ Build and push frontend image (约 3-5 分钟)
  └─ ✓ Build and push bot image (约 3-5 分钟)

Job 2: deploy (depends on Job 1)
  ├─ ✓ Checkout code
  ├─ ✓ Deploy to server
  │   ├─ SSH 到服务器
  │   ├─ cd /home/maer/work/yang-paibiao
  │   ├─ git pull origin new
  │   ├─ 登录 GitHub Container Registry
  │   ├─ 拉取最新镜像
  │   └─ 运行 deploy.sh
  ├─ ✓ Health check
  │   └─ 运行 scripts/health-check.sh
  └─ ✓ Deployment notification
```

**⚠️ 注意：首次部署可能会失败！**

原因：数据库表还没有创建（需要运行 alembic 迁移）。这是正常的，我们会在阶段 4 中解决。

---

## 🔧 阶段 4: 首次部署后的初始化

### 步骤 4.1: 检查容器状态（📍 服务器）

```bash
# SSH 到服务器
ssh maer@your-server-ip

# 进入项目目录
cd /home/maer/work/yang-paibiao

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该看到 3 个容器：
# - yangpaibiao-backend
# - yangpaibiao-frontend
# - yangpaibiao-bot

# 查看容器日志
docker logs yangpaibiao-backend --tail 50
docker logs yangpaibiao-frontend --tail 50
docker logs yangpaibiao-bot --tail 50
```

**如果后端容器显示错误（例如数据库表不存在），这是正常的，继续下一步。**

---

### 步骤 4.2: 运行数据库迁移（📍 服务器）

```bash
# 方法 1: 如果容器正在运行
docker exec yangpaibiao-backend alembic upgrade head

# 方法 2: 如果容器因数据库错误无法启动，先启动容器（允许失败）
docker-compose -f docker-compose.prod.yml up -d backend

# 等待几秒让容器启动
sleep 5

# 然后进入容器手动运行迁移
docker exec -it yangpaibiao-backend bash
cd /app
alembic upgrade head
exit

# 重启后端容器
docker restart yangpaibiao-backend
```

**✅ 检查点：** 数据库迁移成功，表已创建

---

### 步骤 4.3: 验证数据库（📍 服务器）

```bash
# 查看数据库表
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao -c "\dt"

# 应该看到以下表（或类似的表）：
# - system_admin
# - users
# - characters
# - guilds
# - teams
# - signups
# - gold_records
# 等等
```

**✅ 检查点：** 数据库表已创建

---

### 步骤 4.4: 创建管理员账户（📍 服务器）

```bash
# 方法 1: 使用默认配置创建管理员
docker exec -it yangpaibiao-backend python scripts/create_admin.py

# 在交互式界面中：
# 选择 1（创建默认管理员）

# 默认管理员信息：
# 用户名: admin
# 密码: admin123456
# （可以在 backend/.env.production 中修改这些默认值）

# 方法 2: 创建自定义管理员
docker exec -it yangpaibiao-backend python scripts/create_admin.py

# 在交互式界面中：
# 选择 2（创建自定义管理员）
# 输入用户名和密码
```

**✅ 检查点：** 管理员账户创建成功

---

### 步骤 4.5: 重启所有服务（📍 服务器）

```bash
# 重启所有容器
docker-compose -f docker-compose.prod.yml restart

# 等待服务启动
sleep 10

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 所有容器应该显示 "Up" 状态
```

**✅ 检查点：** 所有容器正常运行

---

### 步骤 4.6: 运行健康检查（📍 服务器）

```bash
bash scripts/health-check.sh

# 应该看到：
# ✅ Backend container is running
# ✅ Backend is healthy (HTTP 200)
# ✅ Frontend container is running
# ✅ Frontend is healthy (HTTP 200)
# ✅ Database connectivity OK
# ✅ All health checks passed!
```

**✅ 检查点：** 所有健康检查通过

---

### 步骤 4.7: 验证部署（📍 浏览器）

1. **访问前端：** `https://zyhm.fun`

   - 应该能看到登录页面

2. **访问 API 文档：** `https://zyhm.fun/api/docs`

   - 应该能看到 Swagger UI

3. **测试登录：**

   - 使用创建的管理员账户登录
   - 用户名: `admin`
   - 密码: `admin123456`（或你设置的自定义密码）

4. **检查 Bot 日志：** （📍 服务器）

   ```bash
   docker logs yangpaibiao-bot -f

   # 应该看到 Bot 启动日志
   # 如果看到 WebSocket 连接错误，是正常的（需要配置 OneBot 客户端）
   ```

**✅ 检查点：** 前端可访问，API 可用，管理员可登录

---

## 🤖 Bot 配置（可选，如果需要 QQ Bot 功能）

### 配置 OneBot 客户端（📍 OneBot 客户端所在位置）

Bot 需要与 OneBot 客户端（如 go-cqhttp、LLOneBot 等）建立连接。

**方式 1：反向 WebSocket（推荐）**

在 OneBot 客户端配置文件中添加：

```yaml
# go-cqhttp config.yml 示例
servers:
  - ws-reverse:
      universal: ws://your-server-ip:8080/onebot/v11/ws
      reconnect-interval: 3000
```

**方式 2：正向 WebSocket**

需要在 `yang_bot/.env.prod` 中配置 OneBot 连接地址。

**验证 Bot 连接：**

```bash
# 在服务器上查看 Bot 日志
docker logs yangpaibiao-bot -f

# 应该看到 WebSocket 连接成功的日志
```

**在 QQ 群中测试 Bot：**

发送消息测试 Bot 是否响应。

---

## 🔄 后续更新部署

配置完成后，每次推送代码都会自动触发部署：

```bash
# 本地开发完成后
git add .
git commit -m "feat: 新功能描述"
git push origin new  # 或 main

# GitHub Actions 会自动：
# 1. 构建 Docker 镜像
# 2. 推送到 GitHub Container Registry
# 3. SSH 到服务器
# 4. 拉取最新镜像
# 5. 运行 deploy.sh
# 6. 执行健康检查
```

**不需要再次运行数据库迁移或创建管理员（除非有新的迁移）。**

---

## 🛠️ 常用运维命令

### 查看日志

```bash
# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看后端日志
docker logs yangpaibiao-backend -f

# 查看前端日志
docker logs yangpaibiao-frontend -f

# 查看 Bot 日志
docker logs yangpaibiao-bot -f
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker restart yangpaibiao-backend
docker restart yangpaibiao-frontend
docker restart yangpaibiao-bot
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it yangpaibiao-backend bash

# 进入前端容器
docker exec -it yangpaibiao-frontend sh

# 进入 Bot 容器
docker exec -it yangpaibiao-bot bash

# 查看数据库
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao
```

### 手动运行数据库迁移

```bash
# 如果有新的迁移需要应用
docker exec yangpaibiao-backend alembic upgrade head

# 查看迁移历史
docker exec yangpaibiao-backend alembic history

# 查看当前版本
docker exec yangpaibiao-backend alembic current
```

---

## 🔧 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs yangpaibiao-backend --tail 100
docker logs yangpaibiao-frontend --tail 100
docker logs yangpaibiao-bot --tail 100

# 查看容器状态
docker ps -a | grep yangpaibiao

# 查看 docker-compose 状态
docker-compose -f docker-compose.prod.yml ps
```

### 数据库连接失败

```bash
# 检查数据库是否运行
docker ps | grep shared-postgres

# 测试数据库连接
docker exec -it shared-postgres psql -U yangpaibiao_user -d yangpaibiao -c "SELECT 1"

# 检查后端环境变量
docker exec yangpaibiao-backend env | grep DATABASE_URL
```

### Nginx 502 错误

```bash
# 检查后端是否运行
docker ps | grep yangpaibiao-backend

# 检查后端健康
docker exec yangpaibiao-backend curl http://localhost:8000/health

# 查看 Nginx 日志
docker logs shared-nginx --tail 100

# 检查 Nginx 配置
docker exec shared-nginx nginx -t
```

### Bot 连接问题

```bash
# 查看 Bot 日志
docker logs yangpaibiao-bot --tail 100

# 检查 Bot 端口
netstat -tulpn | grep 8080

# 测试 Bot 与后端连接
docker exec yangpaibiao-bot curl http://backend:8000/health

# 重启 Bot
docker restart yangpaibiao-bot
```

---

## ✅ 部署完成检查清单

### 推送代码前

- [ ] 服务器上数据库已创建（yangpaibiao）
- [ ] 服务器上数据库用户已创建（yangpaibiao_user）
- [ ] 服务器上 `.env.docker` 已创建并配置
- [ ] 服务器上 `backend/.env.production` 已创建并配置
- [ ] 服务器上 `yang_bot/.env.prod` 已创建并配置
- [ ] SSL 证书已配置
- [ ] Nginx 配置已重载
- [ ] GitHub Secrets 已全部配置

### 推送代码后

- [ ] GitHub Actions 构建成功
- [ ] 镜像推送到 GHCR 成功
- [ ] SSH 部署成功
- [ ] 容器启动成功

### 首次部署后

- [ ] 数据库迁移已执行
- [ ] 数据库表已创建
- [ ] 管理员账户已创建
- [ ] 所有容器正常运行
- [ ] 健康检查全部通过
- [ ] 前端可访问
- [ ] API 可用
- [ ] 管理员可登录

### Bot 配置（可选）

- [ ] OneBot 客户端已配置
- [ ] Bot WebSocket 连接成功
- [ ] Bot 在 QQ 群中可响应

---

## 📊 数据库备份（建议）

```bash
# 创建备份脚本
cat > /home/maer/work/yang-paibiao/scripts/backup-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/home/maer/backups/yangpaibiao"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec shared-postgres pg_dump -U yangpaibiao_user yangpaibiao | gzip > $BACKUP_DIR/yangpaibiao_$DATE.sql.gz

# 保留最近 30 天的备份
find $BACKUP_DIR -name "yangpaibiao_*.sql.gz" -mtime +30 -delete

echo "Backup completed: yangpaibiao_$DATE.sql.gz"
EOF

chmod +x /home/maer/work/yang-paibiao/scripts/backup-db.sh

# 添加到 crontab（每天凌晨 2 点备份）
crontab -e
# 添加：0 2 * * * /home/maer/work/yang-paibiao/scripts/backup-db.sh
```

---

## 🎉 祝部署顺利！

如果遇到问题，按照故障排查部分的命令检查日志和状态。
