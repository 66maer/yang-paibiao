# 开团看板组件

## 概述

开团看板是一个响应式的多栏布局页面，用于管理和查看游戏团队的开团信息。支持查看模式和编辑模式切换。

## 文件结构

```
components/board/
├── README.md              # 本说明文档
├── TeamSidebar.jsx        # 左侧导航 - 开团列表（按日期分组）
├── TeamContent.jsx        # 中间内容 - 开团详情展示
├── TeamRightPanel.jsx     # 右侧面板 - 用户/管理员视图/编辑帮助
├── TeamEditForm.jsx       # 开团创建/编辑表单（全页面）
└── SignupModal.jsx        # 报名模态框（空实现）
```

## 布局模式

### 📋 查看模式（默认）

```
┌─────────┬──────────────────────┬─────────┐
│ 左侧    │      中间主体        │  右侧   │
│ 2列宽   │      8列宽          │  2列宽  │
│         │                      │         │
│ 开团    │   选中的开团详情      │ 我的    │
│ 列表    │   - 标题信息          │ 报名    │
│ (按日   │   - 团队面板          │ /      │
│  期分   │   - 候补列表          │ 候补    │
│  组)    │   - 我的报名          │ 列表    │
└─────────┴──────────────────────┴─────────┘
```

### ✏️ 编辑模式

```
┌────────────────────────────────┬─────────┐
│        中间主体（扩展）         │  右侧   │
│         9列宽                  │  3列宽  │
│                                │         │
│   开团编辑表单                  │ 编辑    │
│   - 标题设置                    │ 提示    │
│   - 时间选择                    │ 和     │
│   - 副本选择                    │ 帮助    │
│   - 铁标记                      │ 信息    │
│   - 高级设置                    │         │
│   - 团队告示                    │         │
└────────────────────────────────┴─────────┘
```

## 主要功能

### 🎯 对所有用户开放的功能

1. **查看开团列表**

   - 左侧导航按日期分组显示所有开团
   - 支持时间排序
   - 显示今天、明天等友好的日期标签

2. **查看开团详情**

   - 开团标题、时间、副本信息
   - 大小铁标记状态
   - 团队告示内容
   - 团队面板（留空，待实现）
   - 候补列表（留空，待实现）
   - 我的报名（留空，待实现）

3. **报名功能**

   - 点击"报名"按钮打开报名弹窗
   - 当前为空实现，待后续开发

4. **右侧面板（普通用户）**
   - Tab 1: 我的报名（留空）
   - Tab 2: 候补列表（留空）

### 👑 管理员专属功能

1. **创建开团**

   - 点击左侧「开团」按钮进入全页面编辑模式
   - 设置开团标题（支持自动生成）
   - 选择发车时间（支持「不指定时间」选项）
   - 选择副本
   - 设置大小铁标记
   - 设置可见性和锁定状态
   - 编写团队告示

2. **编辑开团**

   - 点击「编辑」按钮进入全页面编辑模式
   - 修改所有开团信息
   - 支持锁定/解锁报名
   - 支持隐藏/显示开团

3. **关闭开团**

   - 关闭开团，停止接受报名

4. **编辑模式特性**
   - 左侧列表隐藏，中间表单占据更大空间
   - 右侧显示编辑帮助和提示信息
   - 顶部操作栏：取消/保存按钮

## 技术实现

### 依赖项

- **React** - UI 框架
- **HeroUI** - UI 组件库
- **date-fns** - 日期格式化
- **react-hot-toast** - 提示消息
- **zustand** - 状态管理

### API 接口

所有 API 接口定义在 `src/api/teams.js` 中：

- `createTeam(guildId, teamData)` - 创建开团
- `getTeamList(guildId, params)` - 获取开团列表
- `getTeamDetail(guildId, teamId)` - 获取开团详情
- `updateTeam(guildId, teamId, teamData)` - 更新开团信息
- `closeTeam(guildId, teamId)` - 关闭开团
- `deleteTeam(guildId, teamId)` - 删除开团

### 数据结构

#### Team 对象

```javascript
{
  id: number,                    // 开团 ID
  guild_id: number,              // 群组 ID
  title: string,                 // 开团标题
  team_time: string | null,      // 发车时间（ISO 8601 格式，null 表示不指定时间）
  dungeon: string,               // 副本名称
  is_xuanjing_booked: boolean,   // 大铁是否已包
  is_yuntie_booked: boolean,     // 小铁是否已包
  is_hidden: boolean,            // 是否仅管理员可见
  is_locked: boolean,            // 是否锁定报名
  status: string,                // 状态：open/completed/cancelled
  notice: string,                // 团队告示
  signup_count: number,          // 报名人数
  creator: {                     // 创建者信息
    id: number,
    nickname: string
  },
  created_at: string            // 创建时间
}
```

## 待实现功能

以下功能已预留接口，需要后续开发：

1. ✅ **团队面板** - 显示已报名成员的职业、心法等信息
2. ✅ **候补列表** - 显示候补队列
3. ✅ **我的报名** - 显示当前用户的报名信息
4. ✅ **报名功能** - 完整的报名表单和逻辑
5. ✅ **报名日志** - 管理员查看所有报名操作历史
6. ⏳ **使用模板** - 从模板创建开团
7. ⏳ **副本数据** - 从后端动态获取副本列表

## 使用示例

```jsx
import BoardPage from "./pages/user/BoardPage";

// 在路由中使用
<Route path="/user/board" element={<BoardPage />} />;
```

## 权限说明

- **普通成员（member）**: 只能查看开团和报名
- **协管（helper）**: 具有管理员权限，可以创建和编辑开团
- **群主（owner）**: 具有管理员权限，可以创建和编辑开团

## 样式说明

组件使用了渐变色主题：

- 主色调：粉色到紫色的渐变（from-pink-_ to-purple-_）
- 深色模式支持
- 响应式布局（基于 Tailwind CSS Grid）

## 注意事项

1. 当前实现假定后端 API 尚未完全实现，错误处理已就位
2. 日期格式使用中文本地化（zhCN）
3. 所有表单验证在前端进行
4. Toast 提示使用统一的 `showToast` 工具

---

# 团队面板 (TeamBoard) 组件文档

## 新增核心组件

### TeamBoard.jsx

5×5 团队面板组件，支持查看、编辑、拖动、标记等多种模式。

#### 主要功能

1. **坑位显示**

   - 未报名：灰白卡片 + 规则信息
   - 已报名：成员卡片 + 心法图标 + 标记徽章
   - Hover 悬浮显示详细信息

2. **管理员编辑**

   - `edit` 模式：编辑报名规则（允许心法/老板）
   - `mark` 模式：标记进组状态（待确认/已进组/缺席）
   - `drag` 模式：拖动重排坑位顺序

3. **坑位分配算法**
   - 优先锁定成员
   - 匈牙利算法最优匹配
   - 视图映射恢复顺序

#### Props

```jsx
<TeamBoard
  rules={[...]}              // 25个坑位规则
  signupList={[...]}         // 报名列表
  view={[...]}               // 视图映射（可选）
  mode="view"                // view|edit|mark|drag
  isAdmin={false}            // 管理员权限
  onRuleChange={fn}          // 规则变更
  onAssign={fn}              // 团长指定
  onPresenceChange={fn}      // 进组标记
  onReorder={fn}             // 坑位重排
  onSlotClick={fn}           // 坑位点击
/>
```

### slotAllocation.js (utils)

坑位分配工具函数：

- `allocateSlots(rules, signupList, view)` - 计算最优坑位分配
- `buildEmptyRules(count)` - 生成空规则列表
- `getRuleLabel(rule)` - 规则描述文本

#### 匹配规则

```javascript
// 老板坑规则
if (member.isRich) return rule.allowRich;

// 心法匹配规则
return rule.allowXinfaList.includes(member.characterXinfa);
```

---

## 数据结构

### Rule（坑位规则）

```javascript
{
  allowRich: boolean,         // 允许老板
  allowXinfaList: string[]    // 允许的心法列表
}
```

### Signup（报名信息）

```javascript
{
  id: "unique_id",
  signupName: "昵称",
  characterName: "角色名",
  characterXinfa: "huajian",  // 心法key
  isRich: false,              // 老板
  isProxy: false,             // 代报
  isLock: false,              // 锁定坑位
  presence: "pending",        // 进组状态（新增）
  cancelTime: ""
}
```

### SlotView（视图映射）

```javascript
[
  { signupId: "xxx", slotIndex: 0 },
  { signupId: "yyy", slotIndex: 3 },
];
```

---

## 集成示例

见 [TeamContent.jsx](./TeamContent.jsx) 实现。

核心流程：

1. 从 `team` 对象读取 `slot_rules`, `signup_list`, `slot_view`
2. 使用 `allocateSlots()` 计算分配结果
3. 渲染 `<TeamBoard>` 组件
4. 回调事件触发后端更新

---

## 后端字段需求

### Team 模型需添加

- `slot_rules: Rule[]` - 坑位规则（25 个）
- `slot_view: SlotView[]` - 视图映射
- `signup_list: Signup[]` 或 `signups: Signup[]` - 报名列表

### Signup 模型需添加

- `presence: string` - 进组状态：`"pending"` | `"present"` | `"absent"`

---

## 待接入 API

1. **更新坑位规则**

   ```
   PATCH /teams/{teamId}/slot_rules
   Body: Rule[]
   ```

2. **团长指定成员**

   ```
   POST /teams/{teamId}/assign
   Body: { slotIndex, signupData }
   ```

3. **保存坑位视图**

   ```
   PATCH /teams/{teamId}/slot_view
   Body: SlotView[]
   ```

4. **更新进组状态**
   ```
   PATCH /teams/{teamId}/signups/{signupId}/presence
   Body: { presence: "present" }
   ```

---

## 使用说明

### 管理员操作

1. **编辑规则**

   - 点击模式切换按钮 → 「🛠️ 编辑规则」
   - Hover 卡片显示「规则」按钮
   - 弹窗编辑允许心法/老板

2. **团长指定**

   - 编辑模式下点击「指定」按钮
   - 填写团员信息、选择心法
   - 保存后该坑位被锁定

3. **进组标记**

   - 切换到「✅ 进组标记」模式
   - 点击成员卡片循环状态：待确认 → 已进组 → 缺席

4. **拖动排序**
   - 切换到「🧲 拖动排序」模式
   - 鼠标拖动卡片重新排列
   - 保存后生成 `slot_view` 映射

### 普通用户操作

- 浏览模式下点击卡片查看详细信息
- 点击「📝 报名」按钮填写报名表单（待实现）

---

## 注意事项

1. **React Hooks 规则**

   - 所有 Hooks 必须在组件顶层调用
   - `useMemo` 依赖数组需准确，避免引用不稳定对象

2. **Lint 兼容**

   - 已修复所有 lint 错误
   - 使用 Promise.resolve().then() 延迟 setState 避免 effect 警告

3. **性能优化**
   - 使用 `useMemo` 缓存分配结果
   - 大列表使用虚拟滚动（待优化）

---

## 技术栈

- **UI 组件**: HeroUI (NextUI 风格)
- **动画**: Framer Motion (拖拽排序)
- **样式**: Tailwind CSS + inline styles
- **状态管理**: React useState + useMemo
- **图标/资源**: /public/xinfa/_.png, /public/menpai/_.svg

---

## 相关文档

- [心法配置](../../config/xinfa.js)
- [坑位分配算法](../../utils/slotAllocation.js)
- [旧版实现参考](/old/client/src/components/SlotPanel.js)
