# Bot API 使用指南

## 概述

机器人 API 已成功实现，提供了完整的群聊机器人对接功能。

## 实现内容

### 1. 数据库模型

- ✅ `bots` 表：存储 Bot 信息和 API Key 哈希
- ✅ `bot_guilds` 表：控制 Bot 对群组的访问权限
- ✅ 唯一索引：防止重复授权

### 2. Bot API 端点 (`/api/v2/bot/`)

#### 成员管理

- `POST /bot/guilds/{guild_id}/members/batch` - 批量添加成员
- `POST /bot/guilds/{guild_id}/members/batch-remove` - 批量移除成员
- `PUT /bot/guilds/{guild_id}/members/{qq_number}/nickname` - 修改群昵称
- `GET /bot/guilds/{guild_id}/members/search` - 通过昵称搜索成员 ✨ 新增

#### 团队查询

- `GET /bot/guilds/{guild_id}/teams` - 查看开放团队列表

#### 报名管理

- `POST /bot/guilds/{guild_id}/teams/{team_id}/signups` - 提交报名
- `DELETE /bot/guilds/{guild_id}/teams/{team_id}/signups` - 取消报名
- `GET /bot/guilds/{guild_id}/teams/{team_id}/signups/{qq_number}` - 查询用户报名列表 ✨ 新增

#### 角色管理

- `POST /bot/guilds/{guild_id}/characters` - 创建角色（server 参数已优化为可选 ✨）
- `GET /bot/guilds/{guild_id}/characters/{qq_number}` - 查看角色列表

### 3. 管理员 API 端点 (`/api/v2/admin/bots/`)

- `POST /admin/bots` - 创建 Bot（返回 API Key）
- `GET /admin/bots` - 查询 Bot 列表
- `GET /admin/bots/{bot_id}` - 查询 Bot 详情
- `PUT /admin/bots/{bot_id}` - 更新 Bot
- `DELETE /admin/bots/{bot_id}` - 删除 Bot
- `POST /admin/bots/{bot_id}/authorize-guild` - 授权群组
- `DELETE /admin/bots/{bot_id}/guilds/{guild_id}` - 取消授权
- `POST /admin/bots/{bot_id}/regenerate-key` - 重新生成 API Key

## 使用流程

### 步骤 1：创建 Bot（管理员操作）

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

⚠️ **重要**：API Key 只返回一次，请立即保存！

### 步骤 2：授权 Bot 访问群组（管理员操作）

```bash
curl -X POST http://localhost:8000/api/v2/admin/bots/1/authorize-guild \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "guild_id": 123
  }'
```

### 步骤 3：Bot 调用 API

所有 Bot API 请求都需要在请求头中携带 API Key：

```
X-API-Key: bot_qqbot_001_a1b2c3d4e5f6g7h8...
```

#### 示例 1：批量添加成员

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

#### 示例 2：查看开放团队

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

#### 示例 3：提交报名

**使用角色 ID 报名：**

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

**不使用角色 ID 报名：**

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

#### 示例 4：创建角色

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

1. **API Key 安全**

   - 使用 bcrypt 哈希存储
   - 只在创建时返回一次明文
   - 支持重新生成（旧 Key 立即失效）

2. **访问控制**

   - Bot 只能访问授权的群组
   - 停用的 Bot 无法调用 API
   - 批量操作限制：单次最多 100 个

3. **数据保护**
   - 移除成员不删除历史报名数据
   - 不能移除群主（owner）
   - 唯一索引防止重复授权

## 错误处理

### 常见错误码

- `401 Unauthorized` - API Key 无效或 Bot 未激活
- `403 Forbidden` - Bot 未被授权访问该群组
- `404 Not Found` - 资源不存在（用户、团队、群组等）
- `400 Bad Request` - 请求参数错误

### 错误响应示例

```json
{
  "detail": "Bot未被授权访问群组 123"
}
```

## API 文档

启动后端服务后，访问以下地址查看完整的 API 文档：

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

在文档中可以：

- 查看所有端点的详细说明
- 查看请求/响应 Schema
- 在线测试 API（需要先配置 API Key）

## 注意事项

1. **批量操作**

   - 使用事务，部分失败不影响其他操作
   - 每个操作都会返回详细的成功/失败状态

2. **时间格式**

   - 所有时间使用 UTC 时间
   - 格式：ISO 8601（例：2025-12-30T19:00:00）

3. **响应格式**

   - 所有响应使用统一的 ResponseModel 格式
   - 成功：`code: 200`, `message: "success"`, `data: {...}`
   - 失败：抛出 HTTPException

4. **密码限制**
   - 自动创建的用户密码为 QQ 号哈希
   - bcrypt 限制密码不超过 72 字节

## 下一步

如需扩展功能，可以考虑：

1. **速率限制**：使用 Redis + FastAPI-Limiter
2. **操作日志**：记录所有 Bot 操作
3. **Webhook 通知**：Bot 操作完成后通知 QQ 群
4. **批量查询**：支持批量查询用户信息

## 技术支持

如有问题，请查看：

- `/home/maer/.claude/plans/eventual-zooming-sifakis.md` - 完整实现计划
- 后端日志

---

## 🆕 2025-12-31 新增接口详解

### 1. 通过昵称搜索成员

**端点**: `GET /api/v2/bot/guilds/{guild_id}/members/search`

**描述**: 支持通过昵称模糊搜索群成员，用于代报名、登记老板等功能

**查询参数**:

- `nickname` (必需): 要搜索的昵称（支持模糊匹配）

**搜索范围**:

- 用户昵称 (nickname)
- 群内昵称 (group_nickname)
- 其他昵称 (other_nickname)

**请求示例**:

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/1/members/search?nickname=张三" \
  -H "X-Bot-API-Key: your_bot_api_key"
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "members": [
      {
        "user_id": 1,
        "qq_number": "123456789",
        "nickname": "张三",
        "group_nickname": "小张",
        "other_nickname": "阿张"
      },
      {
        "user_id": 5,
        "qq_number": "987654321",
        "nickname": "李四",
        "group_nickname": "张三的朋友",
        "other_nickname": null
      }
    ]
  }
}
```

**使用场景**:

- 代报名功能：根据昵称找到用户的 QQ 号
- 登记老板：根据昵称找到老板的 QQ 号
- 查询成员：快速定位群成员

---

### 2. 查询用户在团队的报名列表

**端点**: `GET /api/v2/bot/guilds/{guild_id}/teams/{team_id}/signups/{qq_number}`

**描述**: 查询指定用户在某个团队的所有有效报名，用于取消报名功能的多报名场景

**路径参数**:

- `guild_id`: 群组 ID
- `team_id`: 团队 ID
- `qq_number`: 用户 QQ 号

**请求示例**:

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/1/teams/5/signups/123456789" \
  -H "X-Bot-API-Key: your_bot_api_key"
```

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "signups": [
      {
        "id": 10,
        "signup_character_id": 3,
        "signup_info": {
          "xinfa": "问水诀",
          "character_name": "黄鸡角色",
          "submitter_name": "张三",
          "submitter_qq_number": "123456789",
          "player_name": "张三",
          "player_qq_number": "123456789"
        },
        "is_rich": false,
        "created_at": "2025-12-31T10:30:00"
      },
      {
        "id": 15,
        "signup_character_id": null,
        "signup_info": {
          "xinfa": "藏剑",
          "character_name": "模糊报名",
          "submitter_name": "张三",
          "submitter_qq_number": "123456789",
          "player_name": "张三",
          "player_qq_number": "123456789"
        },
        "is_rich": true,
        "created_at": "2025-12-31T11:00:00"
      }
    ]
  }
}
```

**使用场景**:

- 取消报名时展示用户的所有报名供选择
- 检查用户是否已经报名某个团队
- 查看用户的多个报名记录

**特点**:

- 只返回有效报名（`cancelled_at` 为 NULL）
- 按创建时间倒序排列（最新的在前）
- 包含完整的报名信息和角色 ID

---

### 3. 创建角色接口优化

**端点**: `POST /api/v2/bot/guilds/{guild_id}/characters`

**优化内容**: `server` 参数现在是**可选的**

**逻辑**:

- 如果请求中提供 `server`，使用请求中的值
- 如果未提供 `server`，自动使用群组(guild)的服务器

**请求体（无 server）**:

```json
{
  "qq_number": "123456789",
  "name": "黄鸡角色",
  "xinfa": "问水诀",
  "relation_type": "owner"
}
```

**请求体（有 server）**:

```json
{
  "qq_number": "123456789",
  "name": "黄鸡角色",
  "server": "蝶恋花",
  "xinfa": "问水诀",
  "relation_type": "owner"
}
```

**请求示例**:

```bash
# 不提供server，使用群组服务器
curl -X POST "http://localhost:8000/api/v2/bot/guilds/1/characters" \
  -H "X-Bot-API-Key: your_bot_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "qq_number": "123456789",
    "name": "黄鸡角色",
    "xinfa": "问水诀"
  }'
```

**响应示例**:

```json
{
  "code": 200,
  "message": "角色创建成功",
  "data": {
    "id": 10,
    "name": "黄鸡角色",
    "server": "绝代天骄",
    "xinfa": "问水诀",
    "remark": null,
    "created_at": "2025-12-31T12:00:00",
    "updated_at": "2025-12-31T12:00:00"
  }
}
```

**优势**:

- 简化机器人逻辑，不需要每次都查询群组服务器
- 保持灵活性，跨服角色仍可指定 server
- 向后兼容，原有带 server 的请求仍然有效

---

## 更新日志

### 2025-12-31

- ✨ 新增：通过昵称搜索成员接口
- ✨ 新增：查询用户在团队的报名列表接口
- ✨ 优化：创建角色接口的 server 参数改为可选
- 📝 更新：BOT API 使用指南文档
- API 文档
