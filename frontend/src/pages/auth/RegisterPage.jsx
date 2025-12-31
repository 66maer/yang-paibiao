import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardBody, CardHeader, Input, Button } from '@heroui/react';
import { userRegister } from '@/api/auth';
import HoverEffectCard from '@/components/common/HoverEffectCard';
import ThemeSwitch from '@/components/common/ThemeSwitch';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    qq_number: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      await userRegister(formData.qq_number, formData.password, formData.nickname);
      
      // 注册成功，跳转到登录页
      navigate('/login', { 
        state: { message: '注册成功，请登录' } 
      });
    } catch (err) {
      setError(err || '注册失败，请稍后重试');
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
              注册新账号
            </h1>
            <p className="text-sm text-default-500 text-center">加入小秧排表</p>
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
                label="昵称"
                placeholder="请输入昵称"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
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
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码（至少6位）"
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
              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                注册
              </Button>

              <div className="text-center text-sm text-default-500">
                已有账号？{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  立即登录
                </Link>
              </div>
            </form>
          </CardBody>
        </HoverEffectCard>
      </div>
    </div>
  );
}
