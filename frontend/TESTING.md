# 前后端联调测试指南

## 当前服务状态

- ✅ 后端服务: http://localhost:9500
- ✅ 前端服务: http://localhost:5173
- ✅ API 文档: http://localhost:9500/api/docs

## 测试步骤

### 1. 测试登录功能

1. 打开浏览器访问 http://localhost:5173
2. 应该会自动跳转到登录页面 `/login`
3. 输入测试账号:
   - 用户名: `admin`
   - 密码: `123456.`
4. 点击"登录"按钮
5. 登录成功后应该跳转到 `/admin` 管理后台

### 2. 测试管理后台

1. 登录成功后,查看管理后台首页
2. 应该能看到:
   - 顶部导航栏显示"小秧排表管理后台"
   - 右上角显示用户名和"退出登录"按钮
   - 管理员信息卡片显示:
     - 用户名: admin
     - ID: 管理员 ID
     - 状态: 活跃
3. 点击"退出登录",应该返回登录页

### 3. 测试路由守卫

1. 在未登录状态下,直接访问 http://localhost:5173/admin
2. 应该自动重定向到登录页
3. 登录后,再次访问 `/admin` 应该能正常显示

### 4. 测试 Token 持久化

1. 登录成功后
2. 刷新页面
3. 应该保持登录状态,不需要重新登录
4. 打开浏览器开发者工具 → Application → Local Storage
5. 应该能看到:
   - `access_token`: JWT token
   - `auth-storage`: Zustand 状态

### 5. 测试 API 调用

打开浏览器开发者工具 → Network,观察网络请求:

1. **登录请求**:

   - URL: `http://localhost:9500/api/v2/admin/login`
   - Method: POST
   - Content-Type: application/x-www-form-urlencoded
   - 响应: `{ "access_token": "...", "token_type": "bearer" }`

2. **获取管理员信息**:
   - URL: `http://localhost:9500/api/v2/admin/me`
   - Method: GET
   - Headers: `Authorization: Bearer <token>`
   - 响应: 管理员信息对象

## 可能遇到的问题

### 1. CORS 跨域错误

**现象**: 浏览器控制台显示 CORS 错误

**解决**: 后端已配置允许所有来源,应该不会有问题。如果出现,检查后端 `main.py` 的 CORS 配置。

### 2. 连接拒绝

**现象**: Network Error 或 ERR_CONNECTION_REFUSED

**解决**: 确保后端服务正在运行在 9500 端口

```bash
# 检查后端服务
curl http://localhost:9500/api/docs
```

### 3. 401 未授权

**现象**: 请求返回 401 状态码

**解决**:

- 清除浏览器 localStorage
- 重新登录获取新 token

### 4. 界面样式异常

**现象**: Tailwind 样式未生效或 HeroUI 组件显示异常

**解决**:

- 检查浏览器控制台是否有 CSS 加载错误
- 确保 Tailwind 配置正确
- 刷新页面清除缓存

## 开发工具

### 浏览器开发者工具

- **Console**: 查看错误日志
- **Network**: 监控 API 请求
- **Application**: 查看 localStorage
- **Elements**: 检查 DOM 和样式

### API 测试工具

- Swagger UI: http://localhost:9500/api/docs
- 可以直接在 Swagger UI 测试后端接口

## 下一步开发建议

1. **优化错误处理**:

   - 添加全局错误提示组件 (Toast)
   - 完善表单验证
   - 添加加载状态优化

2. **开发新功能**:

   - 群组管理 CRUD
   - 角色管理 CRUD
   - 开团系统
   - 报名功能

3. **优化用户体验**:

   - 添加骨架屏 (Skeleton)
   - 优化移动端适配
   - 添加深色模式切换
   - 添加国际化支持

4. **代码质量**:
   - 添加 ESLint 规则
   - 添加单元测试
   - 添加 E2E 测试

## 测试清单

- [ ] 登录功能正常
- [ ] 路由守卫生效
- [ ] Token 持久化工作
- [ ] 管理后台显示正常
- [ ] 退出登录功能正常
- [ ] API 请求成功
- [ ] 错误处理正确
- [ ] 响应式布局正常
