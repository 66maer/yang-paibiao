# 小秧排表 API 接口设计

## 概览

- **基础 URL**: `/api/v2`
- **认证方式**: JWT (Bearer Token)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 错误响应

```json
{
  "code": 1001,
  "message": "错误描述",
  "detail": "详细错误信息（可选）"
}
```

### 分页响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "pages": 5
  }
}
```

### 错误码定义

- `0`: 成功
- `1001`: 参数错误
- `1002`: 认证失败
- `1003`: 权限不足
- `1004`: 资源不存在
- `1005`: 资源已存在
- `1006`: 操作失败
- `1007`: 服务器内部错误

---

## 1. 用户认证接口 (`/api/v2/auth`)

### 1.1 用户注册

- **路径**: `POST /auth/register`
- **权限**: 公开
- **描述**: 普通用户注册

**请求体**:

```json
{
  "qq_number": "123456789",
  "password": "password123",
  "nickname": "玩家昵称"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "qq_number": "123456789",
    "nickname": "玩家昵称",
    "created_at": "2025-12-18T10:00:00"
  }
}
```

### 1.2 用户登录

- **路径**: `POST /auth/login`
- **权限**: 公开
- **描述**: 普通用户登录

**请求体**:

```json
{
  "qq_number": "123456789",
  "password": "password123"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "qq_number": "123456789",
      "nickname": "玩家昵称",
      "avatar": "https://...",
      "last_login_at": "2025-12-18T10:00:00"
    }
  }
}
```

### 1.3 刷新令牌

- **路径**: `POST /auth/refresh`
- **权限**: 需要认证
- **描述**: 刷新访问令牌

**请求头**:

```
Authorization: Bearer <token>
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 86400
  }
}
```

### 1.4 登出

- **路径**: `POST /auth/logout`
- **权限**: 需要认证
- **描述**: 用户登出（可选实现，主要在前端清除 token）

---

## 2. 系统管理接口 (`/api/v2/admin`)

### 2.0 管理员认证

#### 2.0.1 管理员登录

- **路径**: `POST /admin/auth/login`
- **权限**: 公开
- **描述**: 系统管理员登录

**请求体**:

```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 86400,
    "admin": {
      "id": 1,
      "username": "admin",
      "last_login_at": "2025-12-18T10:00:00"
    }
  }
}
```

**说明**: 管理员和普通用户的认证体系是分离的，使用不同的 token

#### 2.0.2 管理员登出

- **路径**: `POST /admin/auth/logout`
- **权限**: 系统管理员
- **描述**: 管理员登出

### 2.1 群组管理

#### 2.1.1 创建群组

- **路径**: `POST /admin/guilds`
- **权限**: 系统管理员
- **描述**: 创建新群组并分配给群主（同时创建订阅）

**请求体**:

```json
{
  "guild_qq_number": "987654321",
  "ukey": "guild001",
  "name": "群组名称",
  "server": "剑胆琴心",
  "avatar": "https://...",
  "description": "群组描述",
  "owner_qq_number": "123456789",
  "subscription": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "features": {...},
    "notes": "一年订阅"
  }
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "guild": {
      "id": 1,
      "guild_qq_number": "987654321",
      "ukey": "guild001",
      "name": "群组名称",
      "server": "剑胆琴心",
      "avatar": "https://...",
      "description": "群组描述",
      "owner_id": 1,
      "created_at": "2025-12-18T10:00:00"
    },
    "subscription": {
      "id": 1,
      "guild_id": 1,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "features": { ... },
      "notes": "一年订阅",
      "created_at": "2025-12-18T10:00:00"
    }
  }
}
```

#### 2.1.2 获取所有群组列表

- **路径**: `GET /admin/guilds`
- **权限**: 系统管理员
- **描述**: 获取系统中所有群组列表（支持分页和过滤）

**查询参数**:

- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20）
- `ukey`: 过滤群组 ukey
- `guild_qq_number`: 过滤群号
- `server`: 过滤服务器
- `status`: 状态（active/deleted/all，默认 active）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "guild_qq_number": "987654321",
        "ukey": "guild001",
        "name": "群组名称",
        "server": "剑胆琴心",
        "owner": {
          "id": 1,
          "qq_number": "123456789",
          "nickname": "群主昵称"
        },
        "subscription": {
          "is_active": true,
          "end_date": "2025-12-31"
        },
        "member_count": 50,
        "created_at": "2025-12-18T10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20,
    "pages": 3
  }
}
```

#### 2.1.3 获取群组详情

- **路径**: `GET /admin/guilds/{guild_id}`
- **权限**: 系统管理员
- **描述**: 获取群组的详细信息，包含订阅历史

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_qq_number": "987654321",
    "ukey": "guild001",
    "name": "群组名称",
    "server": "剑胆琴心",
    "avatar": "https://...",
    "description": "群组描述",
    "owner": {
      "id": 1,
      "qq_number": "123456789",
      "nickname": "群主昵称"
    },
    "preferences": { ... },
    "current_subscription": {
      "id": 1,
      "is_active": true,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "features": { ... }
    },
    "subscription_history": [
      {
        "id": 1,
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "notes": "一年订阅"
      }
    ],
    "stats": {
      "member_count": 50,
      "team_count": 120
    },
    "created_at": "2025-12-18T10:00:00"
  }
}
```

#### 2.1.4 更新群组信息

- **路径**: `PUT /admin/guilds/{guild_id}`
- **权限**: 系统管理员
- **描述**: 更新群组基本信息

**请求体**:

```json
{
  "name": "新群组名称",
  "server": "剑胆琴心",
  "avatar": "https://...",
  "description": "新描述"
}
```

#### 2.1.5 转让群主

- **路径**: `POST /admin/guilds/{guild_id}/transfer`
- **权限**: 系统管理员
- **描述**: 转让群主权限给其他用户

**请求体**:

```json
{
  "new_owner_qq_number": "987654321"
}
```

#### 2.1.6 删除群组

- **路径**: `DELETE /admin/guilds/{guild_id}`
- **权限**: 系统管理员
- **描述**: 软删除群组

### 2.2 群组订阅管理

#### 2.2.1 为群组新增订阅（续费）

- **路径**: `POST /admin/subscriptions`
- **权限**: 系统管理员
- **描述**: 为已有群组新增订阅或续费

**请求体**:

```json
{
  "guild_id": 1,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "features": {
    "max_teams": 100,
    "max_members": 200,
    "advanced_stats": true
  },
  "notes": "续费一年"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 2,
    "guild_id": 1,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "features": { ... },
    "notes": "续费一年",
    "created_by": 1,
    "created_at": "2025-12-18T10:00:00"
  }
}
```

#### 2.2.2 获取订阅列表

- **路径**: `GET /admin/subscriptions`
- **权限**: 系统管理员
- **描述**: 获取所有群组订阅列表（支持分页和过滤）

**查询参数**:

- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20）
- `guild_id`: 过滤群组 ID
- `status`: 订阅状态（active/expired/all，默认 active）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "guild_id": 1,
        "guild_name": "群组名称",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "features": { ... },
        "is_active": true,
        "created_at": "2025-12-18T10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20,
    "pages": 3
  }
}
```

#### 2.2.3 获取群组订阅历史

- **路径**: `GET /admin/guilds/{guild_id}/subscriptions`
- **权限**: 系统管理员
- **描述**: 获取特定群组的所有订阅记录

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "features": { ... },
      "notes": "首次开通",
      "created_by": 1,
      "created_at": "2025-01-01T10:00:00"
    },
    {
      "id": 2,
      "start_date": "2026-01-01",
      "end_date": "2026-12-31",
      "features": { ... },
      "notes": "续费一年",
      "created_by": 1,
      "created_at": "2025-12-18T10:00:00"
    }
  ]
}
```

#### 2.2.4 更新订阅

- **路径**: `PUT /admin/subscriptions/{subscription_id}`
- **权限**: 系统管理员
- **描述**: 更新订阅信息（延期、修改权限等）

**请求体**:

```json
{
  "end_date": "2026-12-31",
  "features": {
    "max_teams": 200,
    "max_members": 300,
    "advanced_stats": true
  },
  "notes": "延期并升级权限"
}
```

#### 2.2.5 删除订阅

- **路径**: `DELETE /admin/subscriptions/{subscription_id}`
- **权限**: 系统管理员
- **描述**: 删除订阅记录（慎用）

### 2.3 系统管理员管理

#### 2.3.1 创建管理员

- **路径**: `POST /admin/admins`
- **权限**: 系统管理员
- **描述**: 创建新的系统管理员

**请求体**:

```json
{
  "username": "admin2",
  "password": "password123"
}
```

#### 2.3.2 获取管理员列表

- **路径**: `GET /admin/admins`
- **权限**: 系统管理员
- **描述**: 获取所有系统管理员列表

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "last_login_at": "2025-12-18T10:00:00",
      "created_at": "2025-01-01T00:00:00"
    }
  ]
}
```

#### 2.3.3 修改管理员密码

- **路径**: `PUT /admin/admins/{admin_id}/password`
- **权限**: 系统管理员
- **描述**: 修改系统管理员密码

**请求体**:

```json
{
  "new_password": "newpassword123"
}
```

#### 2.3.4 删除管理员

- **路径**: `DELETE /admin/admins/{admin_id}`
- **权限**: 系统管理员
- **描述**: 删除系统管理员

---

## 3. 用户管理接口 (`/api/v2/users`)

### 3.1 获取当前用户信息

- **路径**: `GET /users/me`
- **权限**: 需要认证
- **描述**: 获取当前登录用户的详细信息

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "qq_number": "123456789",
    "nickname": "玩家昵称",
    "other_nicknames": ["小张", "张三丰", "战神"],
    "avatar": "https://...",
    "last_login_at": "2025-12-18T10:00:00",
    "created_at": "2025-01-01T10:00:00"
  }
}
```

### 3.2 更新用户信息

- **路径**: `PUT /users/me`
- **权限**: 需要认证
- **描述**: 更新当前用户信息

**请求体**:

```json
{
  "nickname": "新昵称",
  "other_nicknames": ["小张", "张三丰"],
  "avatar": "https://..."
}
```

**说明**：

- `other_nicknames`: 其他昵称列表，用于搜索功能，可以添加多个常用昵称

### 3.3 修改密码

- **路径**: `PUT /users/me/password`
- **权限**: 需要认证
- **描述**: 修改当前用户密码

**请求体**:

```json
{
  "old_password": "old123",
  "new_password": "new123"
}
```

### 3.4 获取用户的群组列表

- **路径**: `GET /users/me/guilds`
- **权限**: 需要认证
- **描述**: 获取当前用户加入的所有群组

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "guild_id": 1,
      "guild_name": "群组名称",
      "guild_qq_number": "123456789",
      "ukey": "guild001",
      "server": "剑胆琴心",
      "role": "member",
      "group_nickname": "群内昵称",
      "joined_at": "2025-01-01T10:00:00"
    }
  ]
}
```

---

## 4. 角色管理接口 (`/api/v2/characters`)

**业务说明**：

- 角色是独立存在的实体（按服务器+角色名唯一）
- 用户可以将角色添加到自己账号（创建关联）
- 第一个添加角色的用户自动标记为 owner，后续用户标记为 shared
- relation_type 只是用户自己的分类标签，不影响权限，用户可自由修改

### 4.1 添加角色到我的账号

- **路径**: `POST /characters`
- **权限**: 需要认证
- **描述**: 添加角色到当前用户账号。如果角色不存在则创建，如果已存在则创建关联

**请求体**:

```json
{
  "name": "角色名",
  "server": "剑胆琴心",
  "xinfa": "花间游",
  "character_remark": "角色备注（如装分、特点等）",
  "relation_notes": "关联备注（如代清安排等）"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "character": {
      "id": 1,
      "name": "角色名",
      "server": "剑胆琴心",
      "xinfa": "花间游",
      "remark": "角色备注（如装分、特点等）",
      "created_at": "2025-12-18T10:00:00"
    },
    "relation": {
      "relation_type": "owner",
      "priority": 0,
      "notes": "关联备注（如代清安排等）",
      "is_new_character": true
    }
  }
}
```

**字段说明**：

- `character.remark`: 角色本身的备注，如"装分 12000"、"T 装"、"主 T"等角色属性相关信息
- `relation.notes`: 当前用户与角色关联的备注，如"周三代清"、"帮朋友打"等个人标记
- `is_new_character`: true 表示角色是新创建的，false 表示关联了已存在的角色
- 如果是新创建，relation_type 为 "owner"
- 如果是关联已有角色，relation_type 为 "shared"

### 4.2 获取我的角色列表

- **路径**: `GET /characters/my`
- **权限**: 需要认证
- **描述**: 获取当前用户的所有角色

**查询参数**:

- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20，最大 100）
- `keyword`: 搜索关键词（角色名或心法，可选）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "角色名",
        "server": "剑胆琴心",
        "xinfa": "花间游",
        "remark": "装分12000，主T",
        "relation": {
          "relation_type": "owner",
          "priority": 0,
          "notes": null
        },
        "created_at": "2025-12-18T10:00:00"
      },
      {
        "id": 2,
        "name": "另一个角色",
        "server": "剑胆琴心",
        "xinfa": "凌雪藏锋",
        "remark": "装分11500，副T",
        "relation": {
          "relation_type": "shared",
          "priority": 1,
          "notes": "帮朋友代清，周三有空"
        },
        "created_at": "2025-12-15T10:00:00"
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 20,
    "pages": 1
  }
}
```

### 4.2.5 获取指定用户的角色列表

- **路径**: `GET /characters/user/{user_id}`
- **权限**: 需要认证
- **描述**: 获取指定用户的所有角色列表（用于在其他组件中快速选择用户的角色）

**查询参数**:

- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20，最大 100）
- `keyword`: 搜索关键词（角色名或心法，可选）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "角色名",
        "server": "剑胆琴心",
        "xinfa": "花间游",
        "remark": "装分12000，主T",
        "created_at": "2025-12-18T10:00:00"
      },
      {
        "id": 2,
        "name": "另一个角色",
        "server": "剑胆琴心",
        "xinfa": "凌雪藏锋",
        "remark": "装分11500，副T",
        "created_at": "2025-12-15T10:00:00"
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 20,
    "pages": 1
  }
}
```

**说明**：

- 此接口返回用户的所有角色（不区分 relation_type）
- 仅返回角色基本信息，不返回关联信息
- 用于前端组件快速选择用户的角色

### 4.3 更新角色基本信息

- **路径**: `PUT /characters/{character_id}`
- **权限**: 需要认证，且已关联此角色
- **描述**: 更新角色的基本信息（心法、角色备注等）

**请求体**:

```json
{
  "xinfa": "凌雪藏锋",
  "remark": "装分提升到12500，可以打T了"
}
```

**说明**：任何关联了此角色的用户都可以更新基本信息，因为这是角色本身的属性（所有关联此角色的用户都会看到这些更新）

### 4.4 更新我与角色的关系

- **路径**: `PUT /characters/{character_id}/relation`
- **权限**: 需要认证，且已关联此角色
- **描述**: 更新当前用户与角色的关系标签和关联备注（仅影响当前用户）

**请求体**:

```json
{
  "relation_type": "shared",
  "priority": 1,
  "notes": "改为周五代清"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "relation_type": "shared",
    "priority": 1,
    "notes": "改为周五代清",
    "updated_at": "2025-12-18T11:00:00"
  }
}
```

### 4.5 移除角色关联

- **路径**: `DELETE /characters/{character_id}`
- **权限**: 需要认证，且已关联此角色
- **描述**: 移除当前用户与角色的关联（不删除角色本身，只删除关联关系）

**说明**：

- 只移除当前用户与角色的关联
- 角色本身不会被删除，其他用户的关联也不受影响
- 如果所有用户都移除了关联，角色会被软删除（系统清理）

---

## 5. 群组管理接口 (`/api/v2/guilds`)

**说明**: 群组的创建、删除、转让群主等操作由系统管理员在后台管理接口完成。普通用户和群主只能进行日常管理操作。

### 5.1 获取群组详情

- **路径**: `GET /guilds/{guild_id}`
- **权限**: 需要认证，且是群组成员
- **描述**: 获取群组详细信息

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_qq_number": "987654321",
    "ukey": "guild001",
    "name": "群组名称",
    "server": "剑胆琴心",
    "avatar": "https://...",
    "description": "群组描述",
    "owner": {
      "id": 1,
      "nickname": "群主昵称"
    },
    "preferences": { ... },
    "subscription": {
      "is_active": true,
      "end_date": "2025-12-31",
      "features": { ... }
    },
    "stats": {
      "member_count": 50,
      "team_count": 120
    },
    "created_at": "2025-12-18T10:00:00"
  }
}
```

### 5.2 通过 ukey 获取群组

- **路径**: `GET /guilds/by-ukey/{ukey}`
- **权限**: 公开
- **描述**: 通过 ukey 获取群组基本信息（用于加入前预览）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "ukey": "guild001",
    "name": "群组名称",
    "server": "剑胆琴心",
    "avatar": "https://...",
    "description": "群组描述",
    "member_count": 50
  }
}
```

### 5.3 更新群组配置

- **路径**: `PUT /guilds/{guild_id}`
- **权限**: 群主或管理员
- **描述**: 更新群组偏好配置（不包括基本信息，基本信息由系统管理员修改）

**请求体**:

```json
{
  "preferences": {
    "auto_approve_join": false,
    "default_team_max_members": 25,
    "notification_settings": { ... }
  }
}
```

---

## 6. 群组成员管理接口 (`/api/v2/guilds/{guild_id}/members`)

### 6.1 加入群组

- **路径**: `POST /guilds/{guild_id}/members`
- **权限**: 需要认证
- **描述**: 申请加入群组

**请求体**:

```json
{
  "group_nickname": "群内昵称（可选）"
}
```

### 6.2 获取成员列表

- **路径**: `GET /guilds/{guild_id}/members`
- **权限**: 需要认证，且是群组成员
- **描述**: 获取群组成员列表

**查询参数**:

- `page`: 页码
- `page_size`: 每页数量
- `role`: 过滤角色（owner/admin/member）
- `status`: 状态（active/left）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 1,
        "user": {
          "id": 1,
          "nickname": "玩家昵称",
          "avatar": "https://..."
        },
        "role": "owner",
        "group_nickname": "群内昵称",
        "joined_at": "2025-01-01T10:00:00",
        "character_count": 3
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20,
    "pages": 3
  }
}
```

### 6.3 更新成员角色

- **路径**: `PUT /guilds/{guild_id}/members/{user_id}/role`
- **权限**: 群主或管理员
- **描述**: 修改成员角色

**请求体**:

```json
{
  "role": "admin"
}
```

### 6.4 更新群内昵称

- **路径**: `PUT /guilds/{guild_id}/members/me/nickname`
- **权限**: 需要认证，且是群组成员
- **描述**: 修改自己的群内昵称

**请求体**:

```json
{
  "group_nickname": "新昵称"
}
```

### 6.5 移除成员

- **路径**: `DELETE /guilds/{guild_id}/members/{user_id}`
- **权限**: 群主或管理员
- **描述**: 移除群组成员

### 6.6 退出群组

- **路径**: `DELETE /guilds/{guild_id}/members/me`
- **权限**: 需要认证，且是群组成员
- **描述**: 主动退出群组

---

## 7. 开团管理接口 (`/api/v2/guilds/{guild_id}/teams`)

### 7.1 创建开团

- **路径**: `POST /guilds/{guild_id}/teams`
- **权限**: 群主或管理员
- **描述**: 创建新的开团活动

**请求体**:

```json
{
  "title": "周五 25H 红",
  "team_time": "2025-12-20T20:00:00",
  "dungeon": "英雄太极宫",
  "max_members": 25,
  "is_xuanjing_booked": true,
  "is_yuntie_booked": false,
  "is_hidden": false,
  "rule": { ... },
  "notice": "准时集合，不要迟到"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_id": 1,
    "creator_id": 1,
    "title": "周五 25H 红",
    "team_time": "2025-12-20T20:00:00",
    "dungeon": "绝地天通",
    "max_members": 25,
    "is_xuanjing_booked": true,
    "is_yuntie_booked": false,
    "is_hidden": false,
    "is_locked": false,
    "status": "open",
    "rule": { ... },
    "notice": "准时集合，不要迟到",
    "signup_count": 0,
    "created_at": "2025-12-18T10:00:00"
  }
}
```

### 7.2 获取开团列表

- **路径**: `GET /guilds/{guild_id}/teams`
- **权限**: 需要认证，且是群组成员
- **描述**: 获取群组的开团列表

**查询参数**:

- `page`: 页码
- `page_size`: 每页数量
- `status`: 过滤状态（open/completed/cancelled）
- `start_date`: 开始日期
- `end_date`: 结束日期
- `dungeon`: 副本名称

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "周五 25H 红",
        "team_time": "2025-12-20T20:00:00",
        "dungeon": "绝地天通",
        "max_members": 25,
        "status": "open",
        "is_locked": false,
        "signup_count": 15,
        "creator": {
          "id": 1,
          "nickname": "团长"
        },
        "created_at": "2025-12-18T10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "pages": 5
  }
}
```

### 7.3 获取开团详情

- **路径**: `GET /guilds/{guild_id}/teams/{team_id}`
- **权限**: 需要认证，且是群组成员
- **描述**: 获取开团的详细信息和有效报名列表（不包括已取消的报名）

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_id": 1,
    "title": "周五 25H 红",
    "team_time": "2025-12-20T20:00:00",
    "dungeon": "绝地天通",
    "max_members": 25,
    "is_xuanjing_booked": true,
    "is_yuntie_booked": false,
    "is_hidden": false,
    "is_locked": false,
    "status": "open",
    "rule": { ... },
    "notice": "准时集合，不要迟到",
    "creator": {
      "id": 1,
      "nickname": "团长"
    },
    "signups": [
      {
        "id": 1,
        "submitter_id": 1,
        "signup_user_id": 1,
        "signup_character_id": 5,
        "signup_info": {
          "submitter_name": "张三",
          "submitter_qq_number": "123456789",
          "player_name": "张三",
          "player_qq_number": "123456789",
          "character_name": "角色名",
          "xinfa": "花间游"
        },
        "is_rich": false,
        "is_proxy": false,
        "slot_position": 1,
        "is_absent": false,
        "created_at": "2025-12-18T11:00:00"
      },
      {
        "id": 2,
        "submitter_id": 2,
        "signup_user_id": null,
        "signup_character_id": null,
        "signup_info": {
          "submitter_name": "李四",
          "submitter_qq_number": "987654321",
          "player_name": "外服朋友",
          "player_qq_number": null,
          "character_name": "朋友的角色",
          "xinfa": "凌雪藏锋"
        },
        "is_rich": false,
        "is_proxy": true,
        "slot_position": null,
        "is_absent": false,
        "created_at": "2025-12-18T11:30:00"
      }
    ],
    "signup_stats": {
      "total_count": 18,
      "locked_count": 15,
      "rich_count": 2,
      "by_xinfa": {
        "花间游": 5,
        "凌雪藏锋": 3,
        "傲血战意": 2
      }
    },
    "created_at": "2025-12-18T10:00:00",
    "updated_at": "2025-12-18T10:00:00"
  }
}
```

**说明**：

- `signups` 数组只包含有效报名（`cancelled_at` 为 null）
- `signup_stats` 提供报名统计信息，方便前端展示
- 此接口适合普通用户查看开团和报名情况

### 7.4 更新开团信息

- **路径**: `PUT /guilds/{guild_id}/teams/{team_id}`
- **权限**: 群主或管理员或创建者
- **描述**: 更新开团信息

**请求体**:

```json
{
  "title": "新标题",
  "team_time": "2025-12-20T21:00:00",
  "notice": "更新通知",
  "is_locked": true
}
```

### 7.5 关闭开团

- **路径**: `POST /guilds/{guild_id}/teams/{team_id}/close`
- **权限**: 群主或管理员或创建者
- **描述**: 关闭开团（完成或取消）

**请求体**:

```json
{
  "status": "completed"
}
```

**说明**：金团记录（掉落、工资等）请使用独立的金团记录接口管理（见第 10 节）

### 7.6 删除开团

- **路径**: `DELETE /guilds/{guild_id}/teams/{team_id}`
- **权限**: 群主或管理员或创建者
- **描述**: 删除开团

---

## 8. 开团模板接口 (`/api/v2/guilds/{guild_id}/templates`)

### 8.1 创建模板

- **路径**: `POST /guilds/{guild_id}/templates`
- **权限**: 群主或管理员
- **描述**: 创建开团模板

**请求体**:

```json
{
  "name": "25H 红模板",
  "rule": { ... },
  "notice": "默认通知"
}
```

### 8.2 获取模板列表

- **路径**: `GET /guilds/{guild_id}/templates`
- **权限**: 群主或管理员
- **描述**: 获取群组的所有开团模板

### 8.3 更新模板

- **路径**: `PUT /guilds/{guild_id}/templates/{template_id}`
- **权限**: 群主或管理员

### 8.4 删除模板

- **路径**: `DELETE /guilds/{guild_id}/templates/{template_id}`
- **权限**: 群主或管理员

---

## 9. 报名管理接口 (`/api/v2/guilds/{guild_id}/teams/{team_id}/signups`)

**业务说明**：

- 统一的报名格式，ID 有就填，没有就填 null 或 -1
- `signup_info` 包含固定字段：提交者名称、报名者名称、角色名称、角色心法
- **报名时处理逻辑**：
  - 只检查 `signup_character_id`，不检查 `signup_user_id`
  - 如果 `signup_character_id` 存在，从数据库获取角色信息（`character_name` 和 `xinfa`）存入 `signup_info`
  - 如果 `signup_character_id` 为空，使用 `signup_info` 中用户填写的值
- **获取报名数据时处理逻辑**（不修改数据库，仅覆盖返回数据）：
  - 如果 `signup_user_id` 存在，覆盖 `player_name` 为报名者昵称，并添加 `player_qq_number`
    - 昵称获取优先级：群昵称 > 用户主昵称 > 用户其他昵称
  - 根据 `submitter_id` 覆盖 `submitter_name` 为提交者昵称，并添加 `submitter_qq_number`
    - 昵称获取优先级：群昵称 > 用户主昵称 > 用户其他昵称
- 提交者必须是已登录用户

### 9.1 提交报名

- **路径**: `POST /guilds/{guild_id}/teams/{team_id}/signups`
- **权限**: 需要认证，且是群组成员
- **描述**: 提交报名（自己报名或代报名统一接口）

**请求体**:

```json
{
  "signup_user_id": 1, // 可选，报名用户ID，null/-1 表示系统外的人
  "signup_character_id": 1, // 可选，报名角色ID，null/-1 表示未录入系统的角色
  "signup_info": {
    "submitter_name": "提交者名称", // 提交者显示名称（通常从登录信息自动填充）
    "player_name": "报名者名称", // 报名者显示名称
    "character_name": "角色名称", // 角色显示名称
    "xinfa": "huajian" // 心法（必填）
  },
  "is_rich": false // 可选，是否老板，默认 false
}
```

**字段处理逻辑（报名时）**：

- `submitter_name`: 使用 `signup_info` 中前端提供的值（通常从登录信息填充）
- `player_name`: 使用 `signup_info` 中前端提供的值（报名时不检查 `signup_user_id`）
- `character_name`: 如果 `signup_character_id` 有效，从数据库取角色名覆盖；否则使用用户填写的值
- `xinfa`: 如果 `signup_character_id` 有效，从数据库取心法覆盖；否则使用用户填写的值

**示例 1：自己报名已有角色**

```json
{
  "signup_user_id": 1,
  "signup_character_id": 5,
  "signup_info": {
    "submitter_name": "张三",
    "player_name": "张三",
    "character_name": "随便填",
    "xinfa": "随便填"
  },
  "is_rich": false
}
```

→ 后端会从角色 ID=5 获取角色名和心法，从当前登录用户获取名称

**示例 2：自己只报心法**

```json
{
  "signup_user_id": 1,
  "signup_character_id": null,
  "signup_info": {
    "submitter_name": "张三",
    "player_name": "张三",
    "character_name": "",
    "xinfa": "huajian"
  },
  "is_rich": false
}
```

→ 后端使用填写的心法，角色名为空

**示例 3：代报系统外的人**

```json
{
  "signup_user_id": null,
  "signup_character_id": null,
  "signup_info": {
    "submitter_name": "张三",
    "player_name": "外服朋友",
    "character_name": "朋友的角色",
    "xinfa": "huajian"
  },
  "is_rich": false
}
```

→ 后端使用全部填写的值

**示例 4：代报系统内用户的角色**

```json
{
  "signup_user_id": 3,
  "signup_character_id": 8,
  "signup_info": {
    "submitter_name": "张三",
    "player_name": "随便填",
    "character_name": "随便填",
    "xinfa": "随便填"
  },
  "is_rich": false
}
```

→ 后端从用户 ID=3 和角色 ID=8 获取所有信息

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "team_id": 1,
    "submitter_id": 1,
    "signup_user_id": 1,
    "signup_character_id": 5,
    "signup_info": {
      "submitter_name": "张三",
      "submitter_qq_number": "123456789",
      "player_name": "李四",
      "player_qq_number": "987654321",
      "character_name": "角色名",
      "xinfa": "花间游"
    },
    "priority": 0,
    "is_rich": false,
    "is_proxy": false,
    "slot_position": null,
    "is_absent": false,
    "created_at": "2025-12-18T11:00:00"
  }
}
```

**响应字段说明**（适用于所有返回 signup 对象的接口）：

- `submitter_id`: 总是有值（当前登录用户）
- `signup_user_id`: 可能为 null（代报系统外的人）
- `signup_character_id`: 可能为 null（未录入系统的角色）
- `signup_info`: 返回处理后的名称和 QQ 号（数据库存储原始值，响应时动态覆盖）
  - `submitter_name`: 根据 `submitter_id` 从数据库获取（优先级：群昵称 > 用户主昵称 > 用户其他昵称）
  - `submitter_qq_number`: 提交者的 QQ 号（从 `submitter_id` 获取）
  - `player_name`: 如果 `signup_user_id` 存在，从数据库获取（优先级：群昵称 > 用户主昵称 > 用户其他昵称）；否则使用原始值
  - `player_qq_number`: 报名者的 QQ 号（仅当 `signup_user_id` 存在时填充，否则为 null）
  - `character_name` 和 `xinfa`: 使用存储的原始值（在报名时已根据 `signup_character_id` 处理）
- `is_proxy`: 自动判断，`submitter_id != signup_user_id` 或 `signup_user_id` 为 null 时为 true

### 9.2 获取报名列表（含历史）

- **路径**: `GET /guilds/{guild_id}/teams/{team_id}/signups`
- **权限**: 群主或管理员
- **描述**: 获取开团的所有报名记录（包括已取消的），用于管理和查看历史

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "submitter_id": 1,
      "signup_user_id": 1,
      "signup_character_id": 5,
      "signup_info": {
        "submitter_name": "张三",
        "submitter_qq_number": "123456789",
        "player_name": "张三",
        "player_qq_number": "123456789",
        "character_name": "角色名",
        "xinfa": "花间游"
      },
      "is_rich": false,
      "is_proxy": false,
      "slot_position": 1,
      "is_absent": false,
      "cancelled_at": null,
      "cancelled_by": null,
      "created_at": "2025-12-18T11:00:00"
    },
    {
      "id": 2,
      "submitter_id": 2,
      "signup_user_id": null,
      "signup_character_id": null,
      "signup_info": {
        "submitter_name": "李四",
        "submitter_qq_number": "987654321",
        "player_name": "外服朋友",
        "player_qq_number": null,
        "character_name": "朋友的角色",
        "xinfa": "凌雪藏锋"
      },
      "is_rich": false,
      "is_proxy": true,
      "slot_position": null,
      "is_absent": false,
      "cancelled_at": null,
      "cancelled_by": null,
      "created_at": "2025-12-18T11:30:00"
    },
    {
      "id": 3,
      "submitter_id": 3,
      "signup_user_id": 3,
      "signup_character_id": 8,
      "signup_info": {
        "submitter_name": "王五",
        "submitter_qq_number": "456789123",
        "player_name": "王五",
        "player_qq_number": "456789123",
        "character_name": "某角色",
        "xinfa": "傲血战意"
      },
      "is_rich": false,
      "is_proxy": false,
      "slot_position": null,
      "is_absent": false,
      "cancelled_at": "2025-12-18T15:00:00",
      "cancelled_by": 3,
      "created_at": "2025-12-18T12:00:00"
    }
  ]
}
```

**说明**：

- `cancelled_at` 不为 null 表示已取消的报名
- `cancelled_by` 记录是谁取消的（可能是自己或管理员）
- 此接口返回所有报名，包括已取消的，用于管理员查看完整历史

### 9.3 更新报名信息

- **路径**: `PUT /guilds/{guild_id}/teams/{team_id}/signups/{signup_id}`
- **权限**: 报名提交者或群主/管理员
- **描述**: 更新报名信息（支持切换角色、修改心法等）

**请求体**:

```json
{
  "signup_user_id": 2, // 可选，修改报名用户ID
  "signup_character_id": 3, // 可选，修改报名角色ID
  "signup_info": {
    "submitter_name": "提交者名称",
    "player_name": "新报名者名称",
    "character_name": "新角色名",
    "xinfa": "凌雪藏锋"
  },
  "is_rich": false
}
```

**说明**：

- 字段处理逻辑与提交报名接口完全相同
- 仅检查 `signup_character_id`，如果有值则从数据库获取 `character_name` 和 `xinfa` 覆盖 `signup_info` 对应字段
- 不检查 `signup_user_id`，保持前端提供的 `player_name`

### 9.4 锁定报名位置

- **路径**: `POST /guilds/{guild_id}/teams/{team_id}/signups/{signup_id}/lock`
- **权限**: 群主或管理员
- **描述**: 锁定报名到特定位置

**请求体**:

```json
{
  "slot_position": 1
}
```

### 9.5 标记缺席

- **路径**: `POST /guilds/{guild_id}/teams/{team_id}/signups/{signup_id}/absent`
- **权限**: 群主或管理员
- **描述**: 标记报名者缺席

**请求体**:

```json
{
  "is_absent": true
}
```

### 9.6 取消报名

- **路径**: `DELETE /guilds/{guild_id}/teams/{team_id}/signups/{signup_id}`
- **权限**: 报名提交者或群主/管理员
- **描述**: 取消报名

---

## 10. 金团记录接口 (`/api/v2/guilds/{guild_id}/gold-records`)

**业务说明**：

- 金团记录独立于开团，专门用于记录金团的财务和掉落情况
- 可以关联开团（team_id），也可以手动独立创建
- 记录内容包括：总金团、打工人数、特殊掉落、黑本人等信息

### 10.1 创建金团记录

- **路径**: `POST /guilds/{guild_id}/gold-records`
- **权限**: 群主或管理员
- **描述**: 创建新的金团记录

**请求体**:

```json
{
  "team_id": 1, // 可选，关联的开团ID
  "dungeon": "英雄太极宫",
  "run_date": "2025-12-20",
  "total_gold": 150000, // 总金团
  "worker_count": 20, // 打工人数
  "special_drops": [
    // 特殊掉落（字符串数组）
    "无尽剑·破",
    "太极无极腰坠"
  ],
  "heibenren_user_id": 123, // 可选，黑本人用户ID
  "heibenren_character_id": 456, // 可选，黑本人角色ID
  "heibenren_info": {
    // 黑本人显示信息
    "user_name": "张三",
    "character_name": "角色名"
  },
  "notes": "本次金团顺利，老三掉了两件好东西"
}
```

**字段处理逻辑（与报名表相同）**：

- 如果 `heibenren_user_id` 有效，后端从数据库取用户昵称覆盖 `user_name` 读取是时覆盖（优先级：群昵称 > 用户主昵称 > 用户其他昵称） 不修改数据库
- 如果 `heibenren_character_id` 有效，后端从数据库取角色名覆盖 `character_name` 记录时覆盖
- 否则使用 `heibenren_info` 中用户填写的值
- 黑本人：第一个进副本的人，游戏中认为掉落和这个人有关

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_id": 1,
    "team_id": 1,
    "dungeon": "英雄太极宫",
    "run_date": "2025-12-20",
    "total_gold": 150000,
    "worker_count": 20,
    "special_drops": ["无尽剑·破", "太极无极腰坠"],
    "heibenren_user_id": 123,
    "heibenren_character_id": 456,
    "heibenren_info": {
      "user_name": "张三",
      "character_name": "角色名"
    },
    "notes": "本次金团顺利，老三掉了两件好东西",
    "creator_id": 1,
    "created_at": "2025-12-20T22:30:00",
    "updated_at": "2025-12-20T22:30:00"
  }
}
```

### 10.2 获取金团记录列表

- **路径**: `GET /guilds/{guild_id}/gold-records`
- **权限**: 群主或管理员
- **描述**: 获取群组的金团记录列表

**查询参数**:

- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20）
- `start_date`: 开始日期（过滤 run_date）
- `end_date`: 结束日期（过滤 run_date）
- `dungeon`: 副本名称
- `team_id`: 关联的开团 ID

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "guild_id": 1,
        "team_id": 1,
        "dungeon": "英雄太极宫",
        "run_date": "2025-12-20",
        "total_gold": 150000,
        "worker_count": 20,
        "special_drops": ["无尽剑·破", "太极无极腰坠"],
        "heibenren_info": {
          "user_name": "张三",
          "character_name": "角色名"
        },
        "notes": "本次金团顺利",
        "creator": {
          "id": 1,
          "nickname": "团长"
        },
        "created_at": "2025-12-20T22:30:00"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20,
    "pages": 3
  }
}
```

### 10.3 获取金团记录详情

- **路径**: `GET /guilds/{guild_id}/gold-records/{record_id}`
- **权限**: 群主或管理员
- **描述**: 获取金团记录的详细信息

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "guild_id": 1,
    "team_id": 1,
    "team": {
      "id": 1,
      "title": "周五 25H 红",
      "team_time": "2025-12-20T20:00:00"
    },
    "dungeon": "英雄太极宫",
    "run_date": "2025-12-20",
    "total_gold": 150000,
    "worker_count": 20,
    "special_drops": ["无尽剑·破", "太极无极腰坠"],
    "heibenren_user_id": 123,
    "heibenren_character_id": 456,
    "heibenren_info": {
      "user_name": "张三",
      "character_name": "角色名"
    },
    "notes": "本次金团顺利，老三掉了两件好东西",
    "creator": {
      "id": 1,
      "nickname": "团长"
    },
    "created_at": "2025-12-20T22:30:00",
    "updated_at": "2025-12-20T22:30:00"
  }
}
```

### 10.4 更新金团记录

- **路径**: `PUT /guilds/{guild_id}/gold-records/{record_id}`
- **权限**: 群主或管理员或创建者
- **描述**: 更新金团记录信息

**请求体**:

```json
{
  "total_gold": 160000,
  "worker_count": 22,
  "special_drops": ["无尽剑·破", "太极无极腰坠", "英雄太极徽章"],
  "heibenren_user_id": 456,
  "heibenren_character_id": 789,
  "heibenren_info": {
    "user_name": "李四",
    "character_name": "新角色"
  },
  "notes": "补充了新的掉落信息"
}
```

### 10.5 删除金团记录

- **路径**: `DELETE /guilds/{guild_id}/gold-records/{record_id}`
- **权限**: 群主或管理员或创建者
- **描述**: 删除金团记录（软删除）

### 10.6 通过开团 ID 获取金团记录

- **路径**: `GET /guilds/{guild_id}/teams/{team_id}/gold-record`
- **权限**: 群主或管理员
- **描述**: 获取与特定开团关联的金团记录

**响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "dungeon": "英雄太极宫",
    "run_date": "2025-12-20",
    "total_gold": 150000,
    "worker_count": 20,
    "special_drops": ["无尽剑·破", "太极无极腰坠"],
    "heibenren_user_id": 123,
    "heibenren_character_id": 456,
    "heibenren_info": {
      "user_name": "张三",
      "character_name": "角色名"
    },
    "notes": "本次金团顺利",
    "created_at": "2025-12-20T22:30:00"
  }
}
```

**说明**：

- 每个开团只对应一条金团记录
- 如果该开团尚未创建金团记录，返回 `data: null`

---

## 权限说明

### 角色定义

- **系统管理员**: 系统层级的管理员，管理所有群组
- **群主**: 群组的所有者，拥有群组的最高权限
- **管理员**: 群组管理员，由群主指定，拥有部分管理权限
- **成员**: 普通群组成员

### 权限矩阵

| 功能             | 系统管理员 | 群主 | 管理员 | 成员   |
| ---------------- | ---------- | ---- | ------ | ------ |
| 创建群组         | ✓          | ✗    | ✗      | ✗      |
| 删除群组         | ✓          | ✗    | ✗      | ✗      |
| 转让群主         | ✓          | ✗    | ✗      | ✗      |
| 管理订阅         | ✓          | ✗    | ✗      | ✗      |
| 更新群组基本信息 | ✓          | ✗    | ✗      | ✗      |
| 更新群组配置     | ✗          | ✓    | ✓      | ✗      |
| 管理成员角色     | ✗          | ✓    | ✓      | ✗      |
| 创建开团         | ✗          | ✓    | ✓      | ✗      |
| 更新开团         | ✗          | ✓    | ✓      | 创建者 |
| 删除开团         | ✗          | ✓    | ✓      | 创建者 |
| 报名             | ✗          | ✓    | ✓      | ✓      |
| 代报名           | ✗          | ✓    | ✓      | ✗      |
| 查看统计         | ✗          | ✓    | ✓      | 仅自己 |

---

## 数据校验规则

### 用户相关

- QQ 号: 5-11 位数字
- 密码: 最短 6 位，最长 64 位
- 昵称: 1-50 字符

### 群组相关

- 群号: 5-11 位数字
- ukey: 3-20 字符，字母数字下划线，唯一
- 群组名: 1-50 字符

### 角色相关

- 角色名: 1-50 字符
- 服务器: 1-30 字符
- 心法: 从预定义列表选择
- **角色备注** (`character.remark`): 角色本身的备注，如装分、特点等，所有关联此角色的用户都能看到
- **关联备注** (`relation.notes`): 用户与角色关联的个人备注，如代清安排等，仅自己可见

### 开团相关

- 标题: 1-100 字符
- 最大人数: 1-100
- 开团时间: 不能早于当前时间（创建时）
- rule: JSONB 格式，必需字段

### 报名相关

- **统一格式**：ID 有就填，没有就填 null 或 -1
- **signup_info 字段**：
  - `submitter_name`: 提交者名称
  - `submitter_qq_number`: 提交者 QQ 号
  - `player_name`: 报名者名称
  - `player_qq_number`: 报名者 QQ 号（可能为 null）
  - `character_name`: 角色名称
  - `xinfa`: 心法（必填）
- **报名时处理逻辑**：
  - 只检查 `signup_character_id`，不检查 `signup_user_id`
  - 如果 `signup_character_id` 有效，后端从数据库获取角色名和心法覆盖 `character_name` 和 `xinfa`
  - 否则使用 `signup_info` 中用户填写的值
- **获取报名时处理逻辑**（不修改数据库，仅覆盖返回数据）：
  - 根据 `submitter_id` 从数据库获取提交者昵称和 QQ 号覆盖 `submitter_name` 和 `submitter_qq_number`
  - 如果 `signup_user_id` 有效，从数据库获取报名者昵称和 QQ 号覆盖 `player_name` 和 `player_qq_number`
  - 昵称获取优先级：群昵称 > 用户主昵称 > 用户其他昵称
- **报名灵活性**：
  - 可以只报心法，不指定角色（character_name 为空）
  - 可以手动输入角色名，无需提前录入系统
  - 任何群组成员都可以代报名
  - 代报的人可以是系统内或系统外的玩家

---

## 分页参数

所有列表接口支持以下分页参数：

- `page`: 页码，从 1 开始，默认 1
- `page_size`: 每页数量，默认 20，最大 100

---

## 排序参数

部分列表接口支持排序：

- `order_by`: 排序字段
- `order`: 排序方向（asc/desc）

示例：

```
GET /api/v2/guilds/1/teams?order_by=team_time&order=desc
```

---

## WebSocket 接口（待定）

用于实时推送报名变化、团队状态更新等：

- `/ws/guilds/{guild_id}/teams/{team_id}`: 订阅特定开团的实时更新

---

## 注意事项

1. 所有需要认证的接口都需要在请求头中包含 JWT token：

   ```
   Authorization: Bearer <token>
   ```

2. 所有时间字段使用 ISO 8601 格式（UTC 时区）：

   ```
   2025-12-18T10:00:00Z
   ```

3. 软删除的资源不会在列表中显示，但可以通过特定参数查询：

   ```
   GET /api/v2/characters?include_deleted=true
   ```

4. JSONB 字段的具体结构会在后续详细设计中定义

5. 所有接口都应该实现适当的错误处理和日志记录
