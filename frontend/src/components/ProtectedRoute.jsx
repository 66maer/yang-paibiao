import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * 受保护的路由组件
 * @param {object} props
 * @param {React.ReactNode} props.children - 子组件
 * @param {string} props.requiredRole - 所需角色 ('admin' | 'user')
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  // 检查是否已登录
  if (!isAuthenticated) {
    // 未认证时，根据所需角色跳转到相应登录页
    return <Navigate to={requiredRole === 'admin' ? '/admin/login' : '/login'} replace />;
  }

  // 如果需要管理员权限
  if (requiredRole === 'admin') {
    if (user?.role !== 'admin') {
      // 非管理员重定向到用户页面
      return <Navigate to="/user/board" replace />;
    }
  }

  // 如果需要用户权限（普通用户）
  if (requiredRole === 'user') {
    if (user?.role === 'admin') {
      // 管理员重定向到管理后台
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
