import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { userRegister } from '../api/auth';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2 pb-6">
          <h1 className="text-2xl font-bold text-center">注册新账号</h1>
          <p className="text-sm text-default-500 text-center">加入小秧排表</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="QQ号"
              placeholder="请输入QQ号"
              value={formData.qq_number}
              onChange={(e) => setFormData({ ...formData, qq_number: e.target.value })}
              isRequired
              autoFocus
            />
            <Input
              label="昵称"
              placeholder="请输入昵称"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              isRequired
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码（至少6位）"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              isRequired
            />
            <Input
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              isRequired
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
              className="w-full"
            >
              注册
            </Button>

            <div className="text-center text-sm text-default-500">
              已有账号？{' '}
              <Link to="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
