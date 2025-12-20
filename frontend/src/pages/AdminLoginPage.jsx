import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardBody, CardHeader, Input, Button } from '@heroui/react';
import { adminLogin, getAdminInfo } from '../api/auth';
import useAuthStore from '../stores/authStore';
import HoverEffectCard from '../components/HoverEffectCard';
import ThemeSwitch from '../components/ThemeSwitch';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  // 进入管理员登录页时，主动清理可能残留的普通用户会话，避免被路由守卫误判
  useEffect(() => {
    try {
      clearAuth();
      // 兼容历史代码中用到的本地存储键
      localStorage.removeItem('access_token');
      // 若需要彻底重置持久化存储，可开启下面这行（通常不必）：
      // localStorage.removeItem('auth-storage');
    } catch (e) {
      // ignore
    }
  }, []);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(formData.username, formData.password);
      
      // 检查响应数据结构
      const tokenData = response.data || response;
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      
      if (!accessToken) {
        throw new Error('登录失败：未获取到访问令牌');
      }
      
      // 先保存token并即时设置角色为 admin，避免路由守卫误跳用户页
      setAuth(accessToken, refreshToken, { role: 'admin' }, null);
      
      // 获取管理员信息
      const adminInfo = await getAdminInfo();

      // 手动添加 role 字段（后端返回的管理员信息中没有 role）
      const adminUserData = {
        ...adminInfo.data,
        role: 'admin'
      };

      // 更新用户信息到全局状态
      setAuth(accessToken, refreshToken, adminUserData);

      // 跳转到后台首页
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('登录错误:', err);
      setError(typeof err === 'string' ? err : err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <HoverEffectCard
          className="items-center gap-4 pt-0 pb-6 bg-default-50"
          maxXRotation={3}
          maxYRotation={3}
          lightClassName="dark:bg-[#0072F5] bg-[#0072F5]"
        >
          <CardHeader className="flex flex-col gap-2 pb-6 pt-10 relative">
            <ThemeSwitch className="absolute right-4 top-4" />
            <h1 className="text-3xl font-bold text-center bg-gradient-to-b from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              管理员后台
            </h1>
            <p className="text-sm text-default-500 text-center">请使用管理员账号登录</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-5 py-5 px-5 md:px-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="用户名"
                placeholder="请输入管理员用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                isRequired
                autoFocus
                classNames={{
                  inputWrapper: [
                    'shadow-xl',
                    'bg-default-100/70',
                    'dark:bg-default/60',
                    'backdrop-blur-xl',
                    'backdrop-saturate-200',
                    'hover:bg-default-200/70',
                    'dark:hover:bg-default/70',
                    'group-data-[focus=true]:bg-default-100/50',
                    'dark:group-data-[focus=true]:bg-default/60',
                    '!cursor-text',
                  ],
                }}
              />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                isRequired
                classNames={{
                  inputWrapper: [
                    'shadow-xl',
                    'bg-default-100/70',
                    'dark:bg-default/60',
                    'backdrop-blur-xl',
                    'backdrop-saturate-200',
                    'hover:bg-default-200/70',
                    'dark:hover:bg-default/70',
                    'group-data-[focus=true]:bg-default-100/50',
                    'dark:group-data-[focus=true]:bg-default/60',
                    '!cursor-text',
                  ],
                }}
              />
              
              {error && (
                <div className="text-sm text-danger bg-danger-50 dark:bg-danger-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                color="primary" 
                isLoading={loading}
                className="w-full mt-2"
                size="lg"
                variant="shadow"
              >
                登录
              </Button>
            </form>
          </CardBody>
        </HoverEffectCard>
      </div>
    </div>
  );
}
