# 排坑逻辑重构设计文档

## 概述

将排坑逻辑从前端迁移到后端，每次报名/规则变更时自动计算并存储排坑结果。

## 核心变更

### 1. 数据结构设计

#### Team 表新增字段

```python
# slot_assignments: 25个坑位的分配情况
# 格式: [{"signup_id": 123, "locked": true}, {"signup_id": null, "locked": false}, ...]
slot_assignments = Column(JSON, nullable=False, default=list)

# waitlist: 候补列表（按报名顺序）
# 格式: [signup_id1, signup_id2, ...]
waitlist = Column(JSON, nullable=False, default=list)
```

#### 字段说明

- `slot_assignments`: 长度为 max_members（通常 25）的数组
  - `signup_id`: 该坑位分配的报名 ID（null 表示空位）
  - `locked`: 是否锁定（管理员手动分配时锁定，普通报名不锁定）
- `waitlist`: 候补报名 ID 列表，按报名时间顺序

### 2. 排坑算法

#### 约束优先级

1. **第一约束（报名顺序）**: 先报名者优先，不允许挤占式分配
2. **第二约束（坑位规则）**: 每个坑位有允许的心法列表和是否允许老板

#### 算法流程

```
输入：
- rules: 25个坑位的规则
- signups: 所有有效报名（按created_at排序）
- current_assignments: 当前分配情况

输出：
- new_assignments: 新的分配情况
- waitlist: 候补列表

步骤：
1. 保留所有 locked=true 的分配
2. 按报名顺序处理每个未分配的报名：
   a. 优先找空位（signup_id=null 且 locked=false）中符合规则的
   b. 如果没有符合规则的空位，尝试换位策略（让已分配者换到其他空位）
   c. 如果无法安排，加入候补列表
3. 返回结果
```

### 3. 并发处理

使用 asyncio.Queue 实现单线程处理队列，避免并发问题：

```python
class SlotAllocationQueue:
    def __init__(self):
        self._queue = asyncio.Queue()
        self._running = False

    async def enqueue(self, team_id: int, db: AsyncSession):
        await self._queue.put((team_id, db))
        if not self._running:
            asyncio.create_task(self._process())

    async def _process(self):
        self._running = True
        while not self._queue.empty():
            team_id, db = await self._queue.get()
            await self._reallocate(team_id, db)
        self._running = False
```

### 4. API 变更

#### 报名接口返回值增强

```python
class SignupOutWithAllocation(SignupOut):
    allocation_result: str  # "allocated" | "waitlist"
    slot_index: Optional[int] = None  # 如果分配成功，返回坑位索引
    waitlist_position: Optional[int] = None  # 如果进入候补，返回候补位置
```

#### 团队接口返回值增强

```python
class TeamOut:
    # ... 原有字段
    slot_assignments: List[SlotAssignment]  # 25个坑位分配情况
    waitlist: List[int]  # 候补报名ID列表
```

### 5. 前端变更

#### 移除

- `frontend/src/utils/slotAllocation.js` 的排坑算法
- `TeamBoard.jsx` 中的 `allocateSlots` 调用

#### 修改

- 直接使用 `team.slot_assignments` 展示坑位
- 使用 `team.waitlist` 展示候补列表
- 连连看模式：直接交换 `slot_assignments` 中的元素位置

### 6. 模式合并

#### 原有模式

- 浏览模式（view）
- 排表模式（assign）: 管理员代报名+锁定坑位
- 进组标记（mark）: 标记就绪/缺席
- 连连看（drag）: 拖动调整顺序

#### 合并后

- 排表模式：本质上是创建报名+设置 locked=true
- 连连看：直接修改 slot_assignments 数组顺序

### 7. 触发排坑的时机

1. 创建报名时
2. 取消报名时
3. 修改坑位规则时
4. 管理员锁定/解锁坑位时
5. 调整坑位顺序时（连连看）

## 实现计划

1. 创建数据库迁移（新增字段）
2. 实现 SlotAllocationService
3. 修改报名相关 API
4. 修改团队相关 API
5. 修改前端展示逻辑
6. 更新机器人回复

## 兼容性

- 新字段初始值为空数组，首次访问时触发重新计算
- 前端先检查是否有 slot_assignments，没有则使用旧逻辑（向后兼容）
