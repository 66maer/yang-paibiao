import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * 根路径智能重定向组件
 * - 未登录：重定向到登录页
 * - 管理员：重定向到管理后台
 * - 普通用户：重定向到用户主页
 */
export default function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  // 未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 已登录，根据角色跳转到不同主页
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // 普通用户：根据是否有有效选择的群组进行跳转
  const guilds = Array.isArray(user?.guilds) ? user.guilds : [];
  const localSelectedRaw = localStorage.getItem('selectedGuildId');
  const localSelectedId = localSelectedRaw ? parseInt(localSelectedRaw, 10) : null;
  const hasLocalValid = !!(localSelectedId && guilds.some(g => g.id === localSelectedId));

  if (hasLocalValid || guilds.length === 1) {
    return <Navigate to="/board" replace />;
  }

  return <Navigate to="/guilds" replace />;
}
