# Bot API 使用指南

## 概述

机器人API已成功实现，提供了完整的群聊机器人对接功能。

## 实现内容

### 1. 数据库模型
- ✅ `bots` 表：存储Bot信息和API Key哈希
- ✅ `bot_guilds` 表：控制Bot对群组的访问权限
- ✅ 唯一索引：防止重复授权

### 2. Bot API端点 (`/api/v2/bot/`)

#### 成员管理
- `POST /bot/guilds/{guild_id}/members/batch` - 批量添加成员
- `POST /bot/guilds/{guild_id}/members/batch-remove` - 批量移除成员
- `PUT /bot/guilds/{guild_id}/members/{qq_number}/nickname` - 修改群昵称

#### 团队查询
- `GET /bot/guilds/{guild_id}/teams` - 查看开放团队列表

#### 报名管理
- `POST /bot/guilds/{guild_id}/teams/{team_id}/signups` - 提交报名
- `DELETE /bot/guilds/{guild_id}/teams/{team_id}/signups` - 取消报名

#### 角色管理
- `POST /bot/guilds/{guild_id}/characters` - 创建角色
- `GET /bot/guilds/{guild_id}/characters/{qq_number}` - 查看角色列表

### 3. 管理员API端点 (`/api/v2/admin/bots/`)

- `POST /admin/bots` - 创建Bot（返回API Key）
- `GET /admin/bots` - 查询Bot列表
- `GET /admin/bots/{bot_id}` - 查询Bot详情
- `PUT /admin/bots/{bot_id}` - 更新Bot
- `DELETE /admin/bots/{bot_id}` - 删除Bot
- `POST /admin/bots/{bot_id}/authorize-guild` - 授权群组
- `DELETE /admin/bots/{bot_id}/guilds/{guild_id}` - 取消授权
- `POST /admin/bots/{bot_id}/regenerate-key` - 重新生成API Key

## 使用流程

### 步骤1：创建Bot（管理员操作）

```bash
curl -X POST http://localhost:8000/api/v2/admin/bots \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_name": "qqbot_001",
    "description": "QQ群聊机器人"
  }'
```

**响应示例：**
```json
{
  "code": 200,
  "message": "Bot创建成功，请妥善保管API Key",
  "data": {
    "id": 1,
    "bot_name": "qqbot_001",
    "api_key": "bot_qqbot_001_a1b2c3d4e5f6g7h8...",
    "description": "QQ群聊机器人",
    "is_active": true,
    "created_at": "2025-12-30T10:00:00"
  }
}
```

⚠️ **重要**：API Key只返回一次，请立即保存！

### 步骤2：授权Bot访问群组（管理员操作）

```bash
curl -X POST http://localhost:8000/api/v2/admin/bots/1/authorize-guild \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "guild_id": 123
  }'
```

### 步骤3：Bot调用API

所有Bot API请求都需要在请求头中携带API Key：

```
X-API-Key: bot_qqbot_001_a1b2c3d4e5f6g7h8...
```

#### 示例1：批量添加成员

```bash
curl -X POST http://localhost:8000/api/v2/bot/guilds/123/members/batch \
  -H "X-API-Key: bot_qqbot_001_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "members": [
      {
        "qq_number": "123456789",
        "nickname": "张三",
        "group_nickname": "小张"
      },
      {
        "qq_number": "987654321",
        "nickname": "李四"
      }
    ]
  }'
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success_count": 2,
    "failed_count": 0,
    "results": [
      {
        "qq_number": "123456789",
        "status": "created_and_added",
        "user_id": 10,
        "message": "成功添加"
      },
      {
        "qq_number": "987654321",
        "status": "added",
        "user_id": 11,
        "message": "成功添加"
      }
    ]
  }
}
```

#### 示例2：查看开放团队

```bash
curl -X GET http://localhost:8000/api/v2/bot/guilds/123/teams \
  -H "X-API-Key: bot_qqbot_001_a1b2c3d4..."
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "周五金团",
      "team_time": "2025-12-30T19:00:00",
      "dungeon": "25人英雄阿尔盖隆",
      "max_members": 25,
      "status": "open",
      "created_at": "2025-12-29T10:00:00"
    }
  ]
}
```

#### 示例3：提交报名

**使用角色ID报名：**
```bash
curl -X POST http://localhost:8000/api/v2/bot/guilds/123/teams/1/signups \
  -H "X-API-Key: bot_qqbot_001_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "qq_number": "123456789",
    "character_id": 5,
    "is_rich": false
  }'
```

**不使用角色ID报名：**
```bash
curl -X POST http://localhost:8000/api/v2/bot/guilds/123/teams/1/signups \
  -H "X-API-Key: bot_qqbot_001_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "qq_number": "123456789",
    "character_name": "剑侠客",
    "xinfa": "藏剑",
    "is_rich": false
  }'
```

#### 示例4：创建角色

```bash
curl -X POST http://localhost:8000/api/v2/bot/guilds/123/characters \
  -H "X-API-Key: bot_qqbot_001_a1b2c3d4..." \
  -H "Content-Type: application/json" \
  -d '{
    "qq_number": "123456789",
    "name": "剑侠客",
    "server": "长安城",
    "xinfa": "藏剑",
    "relation_type": "owner"
  }'
```

## 安全特性

1. **API Key安全**
   - 使用bcrypt哈希存储
   - 只在创建时返回一次明文
   - 支持重新生成（旧Key立即失效）

2. **访问控制**
   - Bot只能访问授权的群组
   - 停用的Bot无法调用API
   - 批量操作限制：单次最多100个

3. **数据保护**
   - 移除成员不删除历史报名数据
   - 不能移除群主（owner）
   - 唯一索引防止重复授权

## 错误处理

### 常见错误码

- `401 Unauthorized` - API Key无效或Bot未激活
- `403 Forbidden` - Bot未被授权访问该群组
- `404 Not Found` - 资源不存在（用户、团队、群组等）
- `400 Bad Request` - 请求参数错误

### 错误响应示例

```json
{
  "detail": "Bot未被授权访问群组 123"
}
```

## API文档

启动后端服务后，访问以下地址查看完整的API文档：

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

在文档中可以：
- 查看所有端点的详细说明
- 查看请求/响应Schema
- 在线测试API（需要先配置API Key）

## 注意事项

1. **批量操作**
   - 使用事务，部分失败不影响其他操作
   - 每个操作都会返回详细的成功/失败状态

2. **时间格式**
   - 所有时间使用UTC时间
   - 格式：ISO 8601（例：2025-12-30T19:00:00）

3. **响应格式**
   - 所有响应使用统一的ResponseModel格式
   - 成功：`code: 200`, `message: "success"`, `data: {...}`
   - 失败：抛出HTTPException

4. **密码限制**
   - 自动创建的用户密码为QQ号哈希
   - bcrypt限制密码不超过72字节

## 下一步

如需扩展功能，可以考虑：

1. **速率限制**：使用Redis + FastAPI-Limiter
2. **操作日志**：记录所有Bot操作
3. **Webhook通知**：Bot操作完成后通知QQ群
4. **批量查询**：支持批量查询用户信息

## 技术支持

如有问题，请查看：
- `/home/maer/.claude/plans/eventual-zooming-sifakis.md` - 完整实现计划
- 后端日志
- API文档
