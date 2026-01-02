# 小秧排表 - 前端项目

基于 React + Vite + HeroUI 的前端应用

## 技术栈

- **框架**: React 18
- **构建工具**: Vite 7
- **UI 库**: HeroUI (NextUI v2) + Tailwind CSS
- **状态管理**: Zustand
- **数据请求**: SWR + Axios
- **路由**: React Router v6

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口封装
│   │   ├── client.js     # Axios 实例配置
│   │   └── auth.js       # 认证相关接口
│   ├── components/       # 公共组件
│   │   └── ProtectedRoute.jsx  # 路由守卫
│   ├── layouts/          # 布局组件
│   │   └── AdminLayout.jsx     # 管理后台布局
│   ├── pages/            # 页面组件
│   │   ├── LoginPage.jsx       # 登录页面
│   │   └── AdminDashboard.jsx  # 管理后台首页
│   ├── stores/           # Zustand 状态管理
│   │   └── authStore.js        # 认证状态
│   ├── utils/            # 工具函数
│   ├── App.jsx           # 应用入口
│   ├── main.jsx          # React 渲染入口
│   └── index.css         # 全局样式
├── .env                  # 环境变量 (开发)
├── .env.production       # 环境变量 (生产)
├── tailwind.config.js    # Tailwind 配置
├── vite.config.js        # Vite 配置
└── package.json
```

## 环境变量

### 开发环境 (`.env`)

```env
VITE_API_BASE_URL=http://localhost:9500/api/v2
```

### 生产环境 (`.env.production`)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v2
```

## 功能特性

### 已实现

- ✅ 用户登录
- ✅ 路由守卫
- ✅ Token 持久化
- ✅ 响应拦截器
- ✅ 管理后台布局
- ✅ 获取管理员信息

### 待开发

- [ ] 群组管理
- [ ] 角色管理
- [ ] 开团系统
- [ ] 报名功能
- [ ] 数据统计

## 默认账号

- **用户名**: admin
- **密码**: 123456.

## 开发指南

### API 接口调用

```javascript
import { adminLogin, getAdminInfo } from "@/api/auth";

// 登录
const response = await adminLogin("admin", "123456.");

// 获取用户信息
const userInfo = await getAdminInfo();
```

### 状态管理

```javascript
import useAuthStore from "@/stores/authStore";

function MyComponent() {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();

  // 使用状态...
}
```

### 路由守卫

```javascript
import ProtectedRoute from "@/components/ProtectedRoute";

<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  }
/>;
```

## 注意事项

1. 确保后端服务已启动 (默认端口 9500)
2. 开发时需要处理 CORS 跨域问题
3. Token 自动保存在 localStorage
4. 401 响应会自动跳转到登录页

## License

MIT
