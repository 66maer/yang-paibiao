# Bot API 快速参考 - 新增接口

## 🔍 1. 昵称搜索

```bash
GET /api/v2/bot/guilds/{guild_id}/members/search?nickname={nickname}
```

**用途**: 代报名、登记老板  
**返回**: 匹配的成员列表（user_id, qq_number, nickname, group_nickname）

---

## 📋 2. 查询报名列表

```bash
GET /api/v2/bot/guilds/{guild_id}/teams/{team_id}/signups/{qq_number}
```

**用途**: 取消报名（多报名场景）  
**返回**: 用户在该团队的所有有效报名

---

## 👤 3. 创建角色（优化）

```bash
POST /api/v2/bot/guilds/{guild_id}/characters
```

**优化**: server 参数现在是可选的  
**逻辑**: 不提供 server 时自动使用群组服务器

---

## 📝 快速示例

### 代报名流程

```bash
# 1. 搜索成员
curl "http://localhost:8000/api/v2/bot/guilds/1/members/search?nickname=张三" \
  -H "X-Bot-API-Key: YOUR_KEY"

# 2. 使用找到的qq_number报名
curl -X POST "http://localhost:8000/api/v2/bot/guilds/1/teams/1/signups" \
  -H "X-Bot-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"qq_number": "123456789", "xinfa": "问水诀"}'
```

### 取消报名流程

```bash
# 1. 查询报名列表
curl "http://localhost:8000/api/v2/bot/guilds/1/teams/1/signups/123456789" \
  -H "X-Bot-API-Key: YOUR_KEY"

# 2. 取消报名
curl -X DELETE "http://localhost:8000/api/v2/bot/guilds/1/teams/1/signups" \
  -H "X-Bot-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"qq_number": "123456789"}'
```

---

## 📚 相关文档

- 详细说明: `BOT_API_使用指南.md`
- 测试指南: `test_new_bot_endpoints.md`
- 开发总结: `BOT_API_开发总结_2025-12-31.md`
