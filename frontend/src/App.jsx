import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import GuildManagementPage from './pages/admin/GuildManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CharacterManagementPage from './pages/admin/CharacterManagementPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const navigate = useNavigate();
  
  return (
    <HeroUIProvider navigate={navigate}>
      <Routes>
        {/* 用户登录和注册 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 管理员登录页面 */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* 管理后台 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="guilds" element={<GuildManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="characters" element={<CharacterManagementPage />} />
        </Route>
        
        {/* 默认重定向到用户登录 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </HeroUIProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;