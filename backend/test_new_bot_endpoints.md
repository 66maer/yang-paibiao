# 新增 Bot 接口测试指南

## 测试准备

1. 确保后端服务运行：`cd backend && scripts/run.sh`
2. 获取 Bot API Key（从数据库或管理员接口）
3. 确保测试群组已授权给 Bot

## 测试环境变量

```bash
export BOT_API_KEY="your_bot_api_key_here"
export GUILD_ID="1"  # 测试群组ID
export TEST_QQ="123456789"  # 测试QQ号
```

## 1. 测试昵称搜索接口

### 测试场景 1：精确搜索

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=张三" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回所有昵称包含"张三"的成员

### 测试场景 2：模糊搜索

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=张" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回所有昵称包含"张"的成员

### 测试场景 3：搜索不存在的昵称

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=不存在的昵称12345" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回空列表 `{"members": []}`

---

## 2. 测试查询用户报名列表接口

### 测试场景 1：查询有报名的用户

首先报名一个团队：

```bash
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"character_name\": \"测试角色\",
    \"xinfa\": \"问水诀\",
    \"is_rich\": false
  }"
```

然后查询：

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups/${TEST_QQ}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回该用户在团队 1 的所有报名记录

### 测试场景 2：查询没有报名的用户

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/999/signups/${TEST_QQ}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回空列表或 404 错误（如果团队不存在）

### 测试场景 3：多报名场景

报名两次：

```bash
# 第一次报名
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"character_name\": \"角色1\",
    \"xinfa\": \"问水诀\"
  }"

# 第二次报名
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"character_name\": \"角色2\",
    \"xinfa\": \"藏剑\",
    \"is_rich\": true
  }"

# 查询报名
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups/${TEST_QQ}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：返回 2 条报名记录

---

## 3. 测试创建角色接口（server 可选）

### 测试场景 1：不提供 server 参数

```bash
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/characters" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"name\": \"自动服务器角色\",
    \"xinfa\": \"问水诀\"
  }"
```

**预期结果**：成功创建角色，server 字段自动使用群组的服务器

### 测试场景 2：提供 server 参数

```bash
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/characters" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"name\": \"指定服务器角色\",
    \"server\": \"蝶恋花\",
    \"xinfa\": \"藏剑\"
  }"
```

**预期结果**：成功创建角色，使用指定的服务器"蝶恋花"

### 测试场景 3：验证 server 默认值

查询群组信息：

```bash
curl -X GET "http://localhost:8000/api/v2/guilds/${GUILD_ID}" \
  -H "Authorization: Bearer <your_token>"
```

创建角色（不带 server）：

```bash
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/characters" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"name\": \"测试默认服务器\",
    \"xinfa\": \"问水诀\"
  }"
```

**预期结果**：创建的角色 server 应该与群组的 server 一致

---

## 集成测试：完整的代报名流程

### 1. 搜索用户

```bash
NICKNAME="张三"
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=${NICKNAME}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

### 2. 从结果中获取 qq_number

假设获取到 `FOUND_QQ="987654321"`

### 3. 为该用户创建角色（如果需要）

```bash
FOUND_QQ="987654321"
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/characters" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${FOUND_QQ}\",
    \"name\": \"代报名角色\",
    \"xinfa\": \"问水诀\"
  }"
```

### 4. 提交代报名

```bash
curl -X POST "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${FOUND_QQ}\",
    \"character_name\": \"代报名角色\",
    \"xinfa\": \"问水诀\"
  }"
```

---

## 集成测试：完整的取消报名流程

### 1. 查询用户的报名列表

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups/${TEST_QQ}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

### 2. 取消报名

如果只有一个报名，直接取消：

```bash
curl -X DELETE "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\"
  }"
```

如果有多个报名，机器人端可以提示用户选择，然后使用特定的取消逻辑。

---

## 错误场景测试

### 1. 无效的 Bot API Key

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=test" \
  -H "X-Bot-API-Key: invalid_key"
```

**预期结果**：401 Unauthorized

### 2. Bot 未授权访问该群组

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/999999/members/search?nickname=test" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：403 Forbidden

### 3. 用户不存在

```bash
curl -X GET "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/teams/1/signups/99999999999" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}"
```

**预期结果**：404 Not Found

---

## 性能测试（可选）

使用 `ab` (Apache Bench) 测试并发性能：

```bash
# 测试搜索接口
ab -n 100 -c 10 \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  "http://localhost:8000/api/v2/bot/guilds/${GUILD_ID}/members/search?nickname=test"
```

---

## 测试清单

- [ ] 昵称搜索 - 精确匹配
- [ ] 昵称搜索 - 模糊匹配
- [ ] 昵称搜索 - 空结果
- [ ] 查询报名列表 - 有报名
- [ ] 查询报名列表 - 无报名
- [ ] 查询报名列表 - 多报名
- [ ] 创建角色 - 不带 server
- [ ] 创建角色 - 带 server
- [ ] 创建角色 - 验证默认 server
- [ ] 代报名完整流程
- [ ] 取消报名完整流程
- [ ] 错误处理 - 无效 API Key
- [ ] 错误处理 - 未授权群组
- [ ] 错误处理 - 用户不存在

---

## 注意事项

1. **数据库状态**：某些测试会修改数据库，建议在测试环境进行
2. **API 限流**：如有限流机制，注意测试间隔
3. **日志监控**：测试时关注后端日志输出
4. **清理数据**：测试完成后清理测试数据

## 自动化测试脚本

可以创建一个完整的测试脚本 `test_bot_api.sh`：

```bash
#!/bin/bash

# 配置
export BOT_API_KEY="your_api_key"
export GUILD_ID="1"
export TEST_QQ="123456789"
export BASE_URL="http://localhost:8000/api/v2/bot"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "开始测试新增Bot接口..."

# 测试1：昵称搜索
echo -e "\n${GREEN}测试1：昵称搜索${NC}"
curl -s -X GET "${BASE_URL}/guilds/${GUILD_ID}/members/search?nickname=test" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" | jq

# 测试2：查询报名列表
echo -e "\n${GREEN}测试2：查询报名列表${NC}"
curl -s -X GET "${BASE_URL}/guilds/${GUILD_ID}/teams/1/signups/${TEST_QQ}" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" | jq

# 测试3：创建角色（无server）
echo -e "\n${GREEN}测试3：创建角色（无server）${NC}"
curl -s -X POST "${BASE_URL}/guilds/${GUILD_ID}/characters" \
  -H "X-Bot-API-Key: ${BOT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"qq_number\": \"${TEST_QQ}\",
    \"name\": \"测试角色_$(date +%s)\",
    \"xinfa\": \"问水诀\"
  }" | jq

echo -e "\n${GREEN}所有测试完成${NC}"
```

运行：

```bash
chmod +x test_bot_api.sh
./test_bot_api.sh
```
