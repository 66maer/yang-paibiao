# 小秧排坊项目重构计划

## 项目概述

这是一个剑网 3 游戏副本团队管理系统的完全重构项目。旧代码位于 `old/` 目录，仅供查阅参考。

## 重构目标

1. 现代化数据库设计
2. 使用 FastAPI 替代原有 Go 框架
3. 前端代码重新整理与优化
4. 引入系统级管理后台

## 架构设计

### 1. 数据库设计

- **PostgreSQL** 作为主数据库
- 采用双层架构设计：
  - **系统管理层**：管理所有群组的权限、群主分配等
  - **业务层**：群组内的用户、角色、开团、报名等业务逻辑

#### 系统管理层表

- `system_admins` - 系统管理员表
- `guild_subscriptions` - 群组订阅/权限表

#### 业务层表

- `users` - 用户表
- `characters` - 角色表
- `guilds` - 群组表
- `guild_members` - 群组成员表
- `teams` - 副本开团表
- `team_templates` - 开团模板表
- `signups` - 副本报名表

### 2. 后端架构（FastAPI）

#### 技术栈

- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0+
- **数据验证**: Pydantic v2
- **数据库迁移**: Alembic
- **异步**: asyncio + asyncpg
- **认证**: JWT + bcrypt
- **API 文档**: OpenAPI (Swagger UI)

#### 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI应用入口
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── dependencies.py        # 依赖注入
│   │
│   ├── models/                # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── user.py
│   │   ├── guild.py
│   │   ├── team.py
│   │   └── ...
│   │
│   ├── schemas/               # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── user.py
│   │   ├── guild.py
│   │   └── ...
│   │
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── deps.py           # 路由依赖
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py      # 系统管理接口
│   │   │   ├── auth.py       # 认证接口
│   │   │   ├── users.py      # 用户接口
│   │   │   ├── guilds.py     # 群组接口
│   │   │   ├── teams.py      # 开团接口
│   │   │   └── ...
│   │
│   ├── services/              # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── admin_service.py
│   │   ├── user_service.py
│   │   ├── guild_service.py
│   │   ├── team_service.py
│   │   └── ...
│   │
│   ├── core/                  # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py       # 安全相关（JWT、密码hash）
│   │   ├── permissions.py    # 权限管理
│   │   └── exceptions.py     # 自定义异常
│   │
│   └── utils/                 # 工具函数
│       ├── __init__.py
│       └── ...
│
├── alembic/                   # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── tests/                     # 测试
│   ├── __init__.py
│   └── ...
│
├── requirements.txt
└── alembic.ini
```

### 3. 前端架构

#### 技术栈

- 框架: React
- 状态管理: Zustand
- UI 库: HeroUI(原 NextUI) + Tailwind
- HTTP 客户端: SWR
- 构建工具: Vite

#### 功能模块

1. **系统管理后台**

   - 群组创建与管理
   - 权限分配

2. **群组业务前台**
   - 用户登录
   - 群组成员管理（群主和管理员）
   - 玩家角色管理
   - 开团系统（群主和管理员）
   - 报名系统
   - 团队记录功能
   - 数据统计与展示

### 4. 部署架构

- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **数据库**: PostgreSQL (单独的外部容器部署, 公共的 docker 网络)
- **缓存**: Redis

## 实施步骤

### Phase 1: 数据库设计 ✓

- [x] 设计新的数据库表结构
- [ ] 初始化数据库
- [ ] 创建超级用户（密码哈希与加盐）

### Phase 2: 后端开发

- [ ] FastAPI 项目初始化
- [ ] 数据库模型定义
- [ ] 系统管理接口开发
- [ ] 用户认证系统
- [ ] 业务接口开发
- [ ] 单元测试

### Phase 3: 前端开发

- [ ] 项目结构重整
- [ ] 系统管理后台
- [ ] 业务前台页面
- [ ] 接口对接
- [ ] UI 优化

### Phase 4: 集成与测试

- [ ] 前后端联调
- [ ] 集成测试
- [ ] 性能优化
- [ ] 安全加固

### Phase 5: 部署上线

- [ ] Docker 化
- [ ] CI/CD 配置
- [ ] 生产环境部署
- [ ] 监控告警

## 重要说明

- 旧代码位于 `old/` 目录，仅供参考，不再维护
- 新代码在根目录开发
- 数据库设计文件位于 `sql/` 目录
- 当做新项目开发，完全重构，旧项目仅做业务逻辑参考

## 系统管理员

- 用户名: `admin`
- 默认密码: `123456`（生产环境需修改）
