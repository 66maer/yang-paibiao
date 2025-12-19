import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { adminLogin } from '../api/auth';
import useAuthStore from '../stores/authStore';

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
      
      // 保存 token 到 localStorage
      localStorage.setItem('admin_token', response.access_token);
      
      // 更新全局状态
      setAuth(response.access_token, 'admin');
      
      // 跳转到后台首页
      navigate('/admin');
    } catch (err) {
      setError(err || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-2 pb-6">
          <h1 className="text-2xl font-bold text-center">管理员后台</h1>
          <p className="text-sm text-default-500 text-center">请使用管理员账号登录</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="用户名"
              placeholder="请输入管理员用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              isRequired
              autoFocus
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              登录
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
