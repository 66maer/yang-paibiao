import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardBody, CardHeader, Input, Button } from '@heroui/react';
import { adminLogin } from '../api/auth';
import useAuthStore from '../stores/authStore';
import HoverEffectCard from '../components/HoverEffectCard';
import ThemeSwitch from '../components/ThemeSwitch';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
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
      
      if (!accessToken) {
        throw new Error('登录失败：未获取到访问令牌');
      }
      
      // 保存 token 到 localStorage
      localStorage.setItem('access_token', accessToken);
      
      // 更新全局状态
      setAuth(accessToken, 'admin');
      
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
