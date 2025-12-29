# Yang Paibiao 部署指南

## 📋 已完成的文件

所有 Docker 容器化和 CI/CD 配置文件已创建完成：

### 后端配置（3个文件）
- ✅ `backend/Dockerfile` - 后端多阶段构建配置
- ✅ `backend/.dockerignore` - Docker 构建排除文件
- ✅ `backend/.env.production` - 生产环境变量模板

### 前端配置（4个文件）
- ✅ `frontend/Dockerfile` - 前端多阶段构建（构建 + Nginx）
- ✅ `frontend/.dockerignore` - Docker 构建排除文件
- ✅ `frontend/nginx.conf` - Nginx 容器内配置
- ✅ `frontend/docker-entrypoint.sh` - 容器启动脚本

### Docker Compose配置（3个文件）
- ✅ `docker-compose.prod.yml` - 生产环境编排
- ✅ `docker-compose.dev.yml` - 开发环境编排（可选）
- ✅ `.env.docker` - Docker 环境变量模板

### CI/CD 配置（1个文件）
- ✅ `.github/workflows/deploy.yml` - GitHub Actions 自动部署

### 部署脚本（2个文件）
- ✅ `deploy.sh` - 服务器部署脚本
- ✅ `scripts/health-check.sh` - 健康检查脚本

### 共享基础设施（1个文件）
- ✅ `/home/maer/work/shared-infra/nginx/conf.d/yang-paibiao.conf` - Nginx 反向代理配置（含 HTTPS）

---

## 🚀 部署前准备清单

### 1. 配置环境变量

编辑 `.env.docker` 文件，设置实际的密码和密钥：

```bash
cd /home/maer/work/yang-paibiao

# 复制并编辑环境变量文件
vim .env.docker

# 需要设置的关键变量：
# - DB_PASSWORD: 数据库密码（建议使用 openssl rand -base64 32 生成）
# - SECRET_KEY: JWT 密钥（至少 32 字符，使用 openssl rand -base64 48）
```

### 2. 初始化数据库

在服务器上创建数据库用户和数据库：

```bash
# 生成安全的数据库密码
DB_PASSWORD=$(openssl rand -base64 32)
echo "数据库密码: $DB_PASSWORD"
# 请保存这个密码，稍后需要填入 .env.docker

# 创建数据库和用户
docker exec -i shared-postgres psql -U postgres <<EOF
CREATE USER yangpaibiao_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE yangpaibiao OWNER yangpaibiao_user ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';
GRANT ALL PRIVILEGES ON DATABASE yangpaibiao TO yangpaibiao_user;

-- 安全措施：撤销对其他数据库的访问
REVOKE CONNECT ON DATABASE postgres FROM yangpaibiao_user;
EOF
```

### 3. 申请 SSL 证书

#### 方法 1: 使用 Certbot（推荐）

```bash
# 临时停止 Nginx（为了让 Certbot 使用 80 端口）
docker exec shared-nginx nginx -s stop

# 申请证书
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d zyhm.fun -d www.zyhm.fun \
  --email your-email@example.com \
  --agree-tos --no-eff-email

# 重启 Nginx
docker start shared-nginx
```

#### 方法 2: 使用现有证书

如果你已有 SSL 证书，将证书文件复制到：
- `/etc/letsencrypt/live/zyhm.fun/fullchain.pem`
- `/etc/letsencrypt/live/zyhm.fun/privkey.pem`

#### 配置证书自动续期

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨检查并续期）
0 0 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew --quiet && docker exec shared-nginx nginx -s reload
```

### 4. 配置 GitHub Secrets

在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加以下 secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| SERVER_HOST | 服务器 IP 或域名 | `192.168.1.100` 或 `server.example.com` |
| SERVER_USER | SSH 用户名 | `maer` |
| SERVER_SSH_KEY | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| SERVER_PORT | SSH 端口（可选） | `22`（默认） |
| VITE_API_BASE_URL | 前端 API 地址 | `/api/v2` |
| DB_PASSWORD | 数据库密码 | 从步骤 2 获取的密码 |
| SECRET_KEY | JWT 密钥 | `openssl rand -base64 48` 生成的值 |

**获取 SSH 私钥**：

```bash
# 在本地机器上
cat ~/.ssh/id_rsa
# 复制整个输出（包括 BEGIN 和 END 行）到 SERVER_SSH_KEY
```

如果没有 SSH 密钥，先生成一个：

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
ssh-copy-id maer@your-server-ip
```

### 5. 重载 Nginx 配置

```bash
# 检查 Nginx 配置是否正确
docker exec shared-nginx nginx -t

# 如果配置正确，重载 Nginx
docker exec shared-nginx nginx -s reload
```

---

## 📦 首次部署步骤

### 步骤 1: 提交代码

```bash
cd /home/maer/work/yang-paibiao

# 查看创建的文件
git status

# 添加所有新文件
git add backend/Dockerfile \
        backend/.dockerignore \
        backend/.env.production \
        frontend/Dockerfile \
        frontend/.dockerignore \
        frontend/nginx.conf \
        frontend/docker-entrypoint.sh \
        docker-compose.prod.yml \
        docker-compose.dev.yml \
        .env.docker \
        .github/workflows/deploy.yml \
        deploy.sh \
        scripts/health-check.sh \
        DEPLOYMENT.md

# 提交
git commit -m "feat: 添加 Docker 容器化和 CI/CD 自动部署配置

- 添加前后端 Dockerfile（多阶段构建）
- 添加 docker-compose 生产和开发配置
- 添加 GitHub Actions 自动部署 workflow
- 添加部署和健康检查脚本
- 更新 Nginx 配置支持 HTTPS
- 添加部署指南文档"
```

### 步骤 2: 合并到主分支并推送

```bash
# 查看当前分支
git branch

# 如果在 new 分支，切换到 main 或合并
git checkout main
git merge new

# 推送到 GitHub（这将自动触发 CI/CD）
git push origin main
```

### 步骤 3: 监控部署

1. 访问 GitHub 仓库的 Actions 页面
2. 查看 "Build and Deploy" 工作流执行状态
3. 如果构建失败，查看日志并修复问题

### 步骤 4: 首次部署后的初始化

```bash
# SSH 到服务器
ssh maer@your-server-ip

# 进入项目目录
cd /home/maer/work/yang-paibiao

# 运行数据库迁移
docker exec yangpaibiao-backend alembic upgrade head

# 创建默认管理员
docker exec -it yangpaibiao-backend python scripts/create_admin.py

# 运行健康检查
bash scripts/health-check.sh
```

### 步骤 5: 验证部署

1. 访问 `https://zyhm.fun` 查看前端
2. 访问 `https://zyhm.fun/api/docs` 查看 API 文档
3. 尝试登录管理后台

---

## 🔄 后续更新部署

配置完成后，每次推送到 main 分支都会自动触发部署：

```bash
# 开发完成后
git add .
git commit -m "feat: 新功能描述"
git push origin main

# GitHub Actions 会自动：
# 1. 构建 Docker 镜像
# 2. 推送到 GitHub Container Registry
# 3. SSH 到服务器
# 4. 拉取最新镜像
# 5. 运行部署脚本
# 6. 执行健康检查
```

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
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启后端
docker restart yangpaibiao-backend

# 重启前端
docker restart yangpaibiao-frontend
```

### 查看容器状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看资源使用
docker stats yangpaibiao-backend yangpaibiao-frontend
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it yangpaibiao-backend bash

# 进入前端容器
docker exec -it yangpaibiao-frontend sh

# 查看数据库
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao
```

### 手动部署（绕过 CI/CD）

```bash
cd /home/maer/work/yang-paibiao

# 拉取最新代码
git pull origin main

# 拉取最新镜像
docker pull ghcr.io/66maer/yangpaibiao-backend:latest
docker pull ghcr.io/66maer/yangpaibiao-frontend:latest

# 运行部署脚本
bash deploy.sh
```

---

## 🔧 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs yangpaibiao-backend
docker logs yangpaibiao-frontend

# 检查容器状态
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
curl http://localhost:8000/health  # 在容器内
docker exec yangpaibiao-backend curl http://localhost:8000/health

# 查看 Nginx 日志
docker logs shared-nginx

# 检查 Nginx 配置
docker exec shared-nginx nginx -t
```

### SSL 证书问题

```bash
# 检查证书文件
ls -la /etc/letsencrypt/live/zyhm.fun/

# 测试证书
openssl s_client -connect zyhm.fun:443 -servername zyhm.fun

# 手动续期证书
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew
docker exec shared-nginx nginx -s reload
```

---

## 📊 监控和备份建议

### 数据库备份

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
# 0 2 * * * /home/maer/work/yang-paibiao/scripts/backup-db.sh
```

### 监控设置

考虑集成以下监控工具：
- **Prometheus + Grafana**: 应用和容器监控
- **Loki**: 日志聚合
- **Uptime Kuma**: 可用性监控
- **AlertManager**: 告警通知

---

## ✅ 部署前检查清单

在推送到 main 分支之前，确保：

- [ ] `.env.docker` 文件已配置（数据库密码、JWT 密钥）
- [ ] 数据库已创建（用户和数据库）
- [ ] SSL 证书已申请并配置
- [ ] GitHub Secrets 已全部设置（7个 secrets）
- [ ] Nginx 配置已更新并重载
- [ ] shared-network 网络已创建（`docker network ls`）
- [ ] SSH 密钥已添加到服务器

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**: 使用上面的日志命令查看详细错误
2. **检查健康**: 运行 `bash scripts/health-check.sh`
3. **查看 GitHub Actions**: 检查 CI/CD 执行日志
4. **回滚**: 如果需要，使用之前的镜像版本

---

祝部署顺利！🎉
