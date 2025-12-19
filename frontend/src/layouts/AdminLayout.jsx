import { Outlet } from 'react-router-dom';
import { Button } from '@heroui/react';
import useAuthStore from '../stores/authStore';

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                小秧排表管理后台
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.username || '管理员'}
              </span>
              <Button 
                size="sm" 
                color="danger" 
                variant="flat"
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
