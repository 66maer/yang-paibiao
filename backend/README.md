# 小秧排表系统 - 后端服务

基于 FastAPI 构建的剑网 3 副本团队管理系统后端 API。

## 技术栈

- **框架**: FastAPI 0.109
- **数据库**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库迁移**: Alembic
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt (passlib)
- **Python 版本**: 3.10+

## 项目结构

```
backend/
├── app/                    # 应用主目录
│   ├── api/               # API路由
│   │   ├── deps.py        # 依赖项（认证等）
│   │   └── v1/            # API v1版本
│   │       ├── endpoints/ # 端点模块
│   │       │   └── auth.py
│   │       └── __init__.py
│   ├── core/              # 核心功能
│   │   ├── config.py      # 配置管理
│   │   └── security.py    # 安全工具（JWT、密码）
│   ├── models/            # 数据库模型
│   │   ├── admin.py       # 管理员模型
│   │   └── user.py        # 用户模型
│   ├── schemas/           # Pydantic模型
│   │   ├── auth.py        # 认证schemas
│   │   └── common.py      # 通用响应模型
│   ├── utils/             # 工具函数
│   ├── database.py        # 数据库连接
│   └── main.py            # 应用入口
├── alembic/               # 数据库迁移
│   ├── versions/          # 迁移版本
│   ├── env.py            # Alembic环境
│   └── script.py.mako    # 迁移模板
├── tests/                 # 测试
├── .env.example           # 环境变量示例
├── .gitignore
├── alembic.ini            # Alembic配置
├── requirements.txt       # 依赖列表
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

重要配置项：

- `DATABASE_URL`: PostgreSQL 数据库连接 URL
- `SECRET_KEY`: JWT 密钥（生产环境必须修改）
- `CORS_ORIGINS`: 允许的前端域名

### 3. 初始化数据库

使用共享 PostgreSQL 数据库初始化表结构：

```bash
# 导入数据库表结构（yangpaibiao 数据库已在共享PostgreSQL中创建）
docker exec -i shared-postgres psql -U yangpaibiao_user -d yangpaibiao < ../sql/schema.sql
```

### 4. 创建初始管理员

使用提供的脚本创建管理员账号（通常只需执行一次）：

```bash
# 创建管理员
python scripts/create_admin.py

# 脚本会提示选择：
# 1. 创建默认管理员（使用配置文件中的默认值）
# 2. 创建自定义管理员（交互式输入）
```

默认管理员信息（首次登录后请立即修改密码）：

- 用户名：`admin`（可在 `.env` 中修改 `ADMIN_USERNAME`）
- 密码：`123456.`（可在 `.env` 中修改 `ADMIN_PASSWORD`）

### 5. 运行开发服务器

```bash
# 方式1: 直接运行
python -m app.main

# 方式2: 使用uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/api/docs 查看 API 文档。

## API 文档

启动服务后，访问以下地址查看 API 文档：

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 认证流程

### 用户注册

```http
POST /api/v1/auth/user/register
Content-Type: application/json

{
  "qq_number": "123456789",
  "password": "password123",
  "nickname": "昵称"
}
```

### 用户登录

```http
POST /api/v1/auth/user/login
Content-Type: application/json

{
  "username": "123456789",
  "password": "password123"
}
```

响应：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer"
  }
}
```

### 使用令牌访问受保护接口

```http
GET /api/v1/auth/user/me
Authorization: Bearer <access_token>
```

## 数据库迁移

### 创建迁移

```bash
alembic revision --autogenerate -m "描述信息"
```

### 执行迁移

```bash
alembic upgrade head
```

### 回滚迁移

```bash
alembic downgrade -1  # 回滚一个版本
```

## 开发建议

1. **代码格式化**: 使用 black

   ```bash
   black app/
   ```

2. **代码检查**: 使用 flake8

   ```bash
   flake8 app/
   ```

3. **类型检查**: 使用 mypy

   ```bash
   mypy app/
   ```

4. **运行测试**:
   ```bash
   pytest
   ```

## 部署

### 使用 Gunicorn + Uvicorn Worker

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Docker 部署

TODO: 添加 Dockerfile 和 docker-compose.yml

## 待办事项

- [ ] 完善单元测试
- [ ] 添加 Docker 支持
- [ ] 实现业务功能接口（群组、角色、开团等）
- [ ] 添加日志系统
- [ ] 性能优化和缓存
- [ ] API 限流

## 许可证

MIT
