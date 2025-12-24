# 成员角色选择组件 - 实现总结

## 概述

创建了一个成员角色选择组件 `MemberRoleSelector`，并将其集成到 `AssignModal` 弹窗中，替换了原来的 `characterName` 输入框。同时改进了 `AssignModal` 的团员选择，使用 `UserSelector` 组件支持用户 ID 返回。

## 实现完成清单 ✅

### 1. 后端 API 变更

**文件**: `backend/app/api/v2/characters.py`

- ✅ **新增接口**: `GET /characters/user/{user_id}`
  - 获取指定用户的角色列表
  - 支持分页（page, page_size）
  - 支持搜索关键词（keyword）
  - 响应格式与 `GET /characters/my` 相同
  - 位置：在 `/my` 和 `/{character_id}` 之间以避免路由冲突

**语法验证**: ✅ 通过

### 2. 前端 API 函数

**文件**: `frontend/src/api/characters.js`

- ✅ **新增函数**: `getUserCharacters(userId, params)`
  - 调用 `GET /characters/user/{userId}`
  - 参数支持分页和搜索
  - 返回 API 响应的 data 部分（由 apiClient 自动提取）

### 3. 新组件：MemberRoleSelector

**文件**: `frontend/src/components/MemberRoleSelector.jsx`

**功能**:

- ✅ 根据 `memberId` prop 自动获取该成员的所有角色
- ✅ 显示角色卡片列表（仅在有角色且未禁用时显示）
  - 每张卡片显示角色名和心法图标
  - 可点击快速选择
  - 选中状态有视觉反馈（ring + 背景变色）
  - 鼠标悬停效果
- ✅ 保留自由输入框（始终显示）
  - 用户可以直接输入角色名
  - 或点击卡片自动填充
  - 支持外部 value 同步

**Props**:

```jsx
<MemberRoleSelector
  memberId={123} // 成员ID
  value={characterName} // 当前选中的角色名
  onChange={handleChange} // 角色名变化回调
  label="角色名" // 输入框标签
  placeholder="选择或输入..." // 占位符
  isRequired={true} // 是否必填
  isDisabled={false} // 是否禁用
/>
```

**特点**:

- 当 `memberId` 为空或没有角色时，仅显示输入框
- 使用 SWR 缓存角色列表（5 分钟内去重避免重复请求）
- 支持深色主题（dark mode）
- 加载状态显示 Spinner

### 4. 改进：UserSelector

**文件**: `frontend/src/components/UserSelector.jsx`

- ✅ 新增 `returnField` 参数（默认 'qq_number'）
  - 支持返回 'qq_number' 或 'id'
  - 向后兼容，默认行为不变
  - 在 AutocompleteItem 的 value 中使用 `user[returnField]`

**新 Props**:

```jsx
<UserSelector
  value={memberId}
  onChange={handleChange}
  label="团员"
  placeholder="选择团员..."
  returnField="id" // 新增：返回用户ID而不是QQ号
  isRequired={true}
/>
```

### 5. 改进：AssignModal

**文件**: `frontend/src/components/board/TeamBoard/Modals/AssignModal.jsx`

**变更**:

- ✅ 将 "团员昵称" 输入框 → `UserSelector` 组件

  - 设置 `returnField="id"` 获取用户 ID
  - 可搜索选择用户，显示昵称和 QQ 号
  - 返回用户 ID（存储为 `memberId`）

- ✅ 将 "角色名" 输入框 → `MemberRoleSelector` 组件
  - 传入 `memberId` 自动加载该成员的角色
  - 可快速选择或自由输入

**表单字段更新**:

```javascript
{
  memberId: "",           // 用户ID（UserSelector 返回）
  memberName: "",         // 用户昵称（可选）
  characterName: "",      // 角色名称（MemberRoleSelector 管理）
  characterXinfa: "",     // 心法选择
  isRich: false,          // 是否老板坑
  isProxy: false          // 是否代报
}
```

## 使用示例

```jsx
// 在调用 onSave 时获得的数据
{
  memberId: 123,              // 用户ID
  characterName: "逍遥一梦",  // 角色名称
  characterXinfa: "逍遥",      // 心法
  isRich: false,              // 是否老板坑
  isProxy: false              // 是否代报
}
```

## 数据流图

```
打开 AssignModal
      ↓
UserSelector (已缓存用户列表)
      ↓ (选择用户)
memberId 更新
      ↓
MemberRoleSelector 接收 memberId
      ↓
调用 getUserCharacters(memberId)
      ↓
显示角色卡片列表 (如果有角色)
      ↓
用户点击卡片或手输
      ↓ (点击保存)
提交表单数据
```

## API 调用流程

1. **页面挂载**: UserSelector 首次加载时调用 `getUserList` (全量缓存，只一次)
2. **选择团员**: 触发 UserSelector 的 onChange，memberId 更新
3. **MemberRoleSelector 初始化**: SWR 监听 memberId 变化，调用 `getUserCharacters(memberId)`
4. **显示角色列表**: 获取成功后，在卡片区域显示该成员的所有角色
5. **用户交互**: 点击卡片或输入角色名，更新 characterName
6. **提交表单**: onSave 被调用，将表单数据回传给父组件

## 性能优化

- **SWR 缓存**:
  - UserSelector: 全量用户列表缓存 5 分钟
  - MemberRoleSelector: 每个 memberId 的角色列表缓存 5 分钟
- **防抖搜索**: UserSelector 搜索防抖 500ms
- **渲染优化**:
  - useMemo 缓存 characters 数组
  - useCallback 缓存事件处理函数
- **后端分页**: 角色列表请求支持分页，每页最多 100 条

## 兼容性和注意事项

1. ✅ **路由优先级**: `/user/{user_id}` 在 `/{character_id}` 之前，避免 URL 冲突
2. ✅ **API 响应解析**: 后端返回的响应被 apiClient 的拦截器自动提取 `data` 字段
3. ✅ **用户 ID vs QQ 号**:

   - 后端 API 需要 user_id（整数）
   - UserSelector 现在支持通过 returnField 返回 id
   - AssignModal 设置 returnField="id"

4. ⚠️ **xinfaInfoTable 配置**: 需要包含所有心法的图标路径，否则图标不显示

5. ⚠️ **VITE_API_BASE_URL**: 需要正确配置前端 API 基础 URL

## 文件修改总结

| 文件                                                           | 变更类型 | 描述                                    |
| -------------------------------------------------------------- | -------- | --------------------------------------- |
| backend/app/api/v2/characters.py                               | 新增 API | GET /characters/user/{user_id}          |
| frontend/src/api/characters.js                                 | 新增函数 | getUserCharacters(userId, params)       |
| frontend/src/components/MemberRoleSelector.jsx                 | 新文件   | 成员角色选择组件                        |
| frontend/src/components/UserSelector.jsx                       | 修改     | 添加 returnField 参数                   |
| frontend/src/components/board/TeamBoard/Modals/AssignModal.jsx | 重构     | 集成 UserSelector 和 MemberRoleSelector |
