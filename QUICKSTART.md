# 快速开始 - 成员角色选择组件

## 🚀 部署步骤

### 1. 后端部署

```bash
# 后端已包含新的 API 路由
# 启动后端服务
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9500
```

### 2. 前端部署

```bash
# 前端无需额外安装依赖（已有 swr, fuse.js, pinyin-pro）
# 启动前端开发服务器
cd frontend
npm run dev
```

## 📝 使用说明

### 在其他地方使用 MemberRoleSelector

```jsx
import MemberRoleSelector from "../components/MemberRoleSelector";

export default function MyComponent() {
  const [characterName, setCharacterName] = useState("");
  const [memberId, setMemberId] = useState(null);

  return (
    <>
      <input type="number" placeholder="输入成员ID" onChange={(e) => setMemberId(parseInt(e.target.value) || null)} />

      <MemberRoleSelector
        memberId={memberId}
        value={characterName}
        onChange={setCharacterName}
        label="选择角色"
        isRequired
      />
    </>
  );
}
```

### 在 UserSelector 中获取用户 ID

```jsx
import UserSelector from "../components/UserSelector";

export default function MyComponent() {
  const [userId, setUserId] = useState(null);

  return (
    <UserSelector
      value={userId}
      onChange={setUserId}
      returnField="id" // 返回用户ID而不是QQ号
      label="选择用户"
    />
  );
}
```

## 🔍 测试方式

### 测试 AssignModal

1. 进入团队管理页面
2. 打开指定团员的弹窗 (AssignModal)
3. 在团员选择器中搜索并选择一个团员
4. 自动显示该团员的角色列表
5. 点击快速选择或手动输入角色名
6. 选择心法和其他选项
7. 点击保存，验证数据是否正确

### 测试 API 接口

```bash
# 获取用户ID为1的角色列表
curl -X GET "http://localhost:9500/api/v2/characters/user/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 响应示例
{
  "data": {
    "items": [
      {
        "id": 1,
        "name": "角色名",
        "server": "大区",
        "xinfa": "心法",
        "players": [...]
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "pages": 1
  }
}
```

## 🐛 常见问题

### Q: 选择了团员但没有显示角色列表

**A**:

- 检查该团员是否有角色
- 检查后端 API 是否返回数据
- 检查浏览器控制台是否有错误信息

### Q: 心法图标不显示

**A**:

- 检查 `/public/xinfa/` 目录中是否存在心法图标文件
- 检查 `src/config/xinfa.js` 中的 `xinfaInfoTable` 配置是否正确

### Q: UserSelector 返回的还是 QQ 号而不是 ID

**A**:

- 确保在 UserSelector 中设置了 `returnField="id"`
- 或在父组件中查找用户的 ID 字段来转换

### Q: 加载速度慢

**A**:

- 这是正常的，首次加载会调用 API 获取全量用户列表（可能数千条）
- 之后会缓存 5 分钟，相同搜索条件不会重复请求
- 可以在 UserSelector 中调整 `page_size` 参数来减少一次加载的数据量

## 📚 相关文件

- [实现总结文档](./IMPLEMENTATION.md)
- [后端 API 文档](./docs/API-实现状态.md)
- [前端 components](./frontend/src/components/)

## 🔧 开发注意事项

1. **路由优先级**: 确保后端 API 路由顺序正确

   ```python
   @router.get("/my")              # 优先级最高
   @router.get("/user/{user_id}")  # 优先级次之
   @router.get("/{character_id}")  # 优先级最低
   @router.get("")                 # 优先级最低（管理员接口）
   ```

2. **缓存键名**: 确保 SWR 缓存键唯一

   ```javascript
   // MemberRoleSelector
   `user-characters-${memberId}`// UserSelector
   `all-users-selector``users-backend-search-${keyword}`;
   ```

3. **API 响应格式**: 前端假设响应为以下格式
   ```javascript
   {
     data: {
       items: [],
       total: 0,
       page: 1,
       page_size: 20,
       pages: 0
     }
   }
   ```

## 📞 需要帮助？

查看浏览器控制台的错误信息，通常会显示：

- API 请求失败的具体原因
- React 组件的错误堆栈
- 缺失的依赖或配置
