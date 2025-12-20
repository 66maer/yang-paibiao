import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardBody, CardHeader, Input, Button } from '@heroui/react';
import { userLogin, getUserInfo } from '../api/auth';
import useAuthStore from '../stores/authStore';
import HoverEffectCard from '../components/HoverEffectCard';
import ThemeSwitch from '../components/ThemeSwitch';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setCurrentGuild } = useAuthStore();
  
  const [formData, setFormData] = useState({
    qq_number: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await userLogin(formData.qq_number, formData.password);
      
      // 检查响应数据结构
      const tokenData = response.data || response;
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      
      if (!accessToken) {
        throw new Error('登录失败：未获取到访问令牌');
      }

      // 先保存token到store，这样后续请求才能携带token
      setAuth(accessToken, refreshToken, null);

      // 获取用户信息和群组列表
      const [userInfo, guildsInfo] = await Promise.all([
        getUserInfo(),
        import('../api/user').then(m => m.getUserGuilds())
      ]);

      const userData = userInfo.data;
      // 将群组数据添加到用户信息中
      userData.guilds = guildsInfo.data || [];

      // 更新用户信息到全局状态
      setAuth(accessToken, refreshToken, userData);

      // 登录后优化跳转逻辑
      const guilds = Array.isArray(userData?.guilds) ? userData.guilds : [];
      const localSelectedRaw = localStorage.getItem('selectedGuildId');
      const localSelectedId = localSelectedRaw ? parseInt(localSelectedRaw, 10) : null;
      const hasLocalValid = !!(localSelectedId && guilds.some(g => g.id === localSelectedId));

      if (hasLocalValid) {
        // 本地存在合法选择：直接设置并跳转
        setCurrentGuild(localSelectedId);
        navigate('/board', { replace: true });
        return;
      }

      if (guilds.length === 1) {
        // 只有一个群组：自动选择并跳转
        const onlyId = guilds[0].id;
        setCurrentGuild(onlyId);
        localStorage.setItem('selectedGuildId', String(onlyId));
        navigate('/board', { replace: true });
        return;
      }

      // 多个群组且本地无有效选择：进入中转页
      navigate('/guilds', { replace: true });
    } catch (err) {
      console.error('登录错误:', err);
      setError(typeof err === 'string' ? err : err.message || '登录失败，请检查QQ号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <HoverEffectCard
          className="items-center gap-4 pt-0 pb-6 bg-default-50"
          maxXRotation={3}
          maxYRotation={3}
        >
          <CardHeader className="flex flex-col gap-2 pb-6 pt-10 relative">
            <ThemeSwitch className="absolute right-4 top-4" />
            <h1 className="text-3xl font-bold text-center bg-gradient-to-b from-pink-500 to-purple-600 bg-clip-text text-transparent">
              小秧排表
            </h1>
            <p className="text-sm text-default-500 text-center">请使用QQ号登录</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-5 py-5 px-5 md:px-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="QQ号"
                placeholder="请输入QQ号"
                value={formData.qq_number}
                onChange={(e) => setFormData({ ...formData, qq_number: e.target.value })}
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

              <div className="text-center text-sm text-default-500">
                还没有账号？{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  立即注册
                </Link>
              </div>
            </form>
          </CardBody>
        </HoverEffectCard>
      </div>
    </div>
  );
}
