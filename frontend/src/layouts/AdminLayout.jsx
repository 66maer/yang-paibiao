import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button, Chip } from '@heroui/react';
import useAuthStore from '../stores/authStore';
import ThemeSwitch from '../components/ThemeSwitch';

export default function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('access_token');
    window.location.href = '/admin/login';
  };

  const navItems = [
    { path: '/admin', label: '控制台', icon: '🏠' },
    { path: '/admin/guilds', label: '群组管理', icon: '🏰' },
    { path: '/admin/users', label: '用户管理', icon: '👥' },
    { path: '/admin/characters', label: '角色管理', icon: '⚔️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                小秧排表
              </h1>
              <Chip color="primary" variant="flat" size="sm">
                管理后台
              </Chip>
            </div>
            
            {/* 导航菜单 */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    size="sm"
                    variant={location.pathname === item.path ? 'flat' : 'light'}
                    color={location.pathname === item.path ? 'primary' : 'default'}
                    className="transition-all"
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <ThemeSwitch />
              
              {/* 用户信息 */}
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-sm">
                  <div className="font-medium">{user?.username || '管理员'}</div>
                  <div className="text-xs text-gray-500">管理员</div>
                </div>
              </div>
              
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onClick={handleLogout}
                className="rounded-full"
              >
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="mt-16 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© 2025 小秧排表. All rights reserved. Made with 💖</p>
      </footer>
    </div>
  );
}
