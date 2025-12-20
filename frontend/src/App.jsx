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
import UserLayout from './layouts/UserLayout';
import BoardPage from './pages/user/BoardPage';
import GuildHubPage from './pages/user/GuildHubPage';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';

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

        {/* 用户业务页面 */}
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/user/board" replace />} />
          <Route path="guilds" element={<GuildHubPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="members" element={<BoardPage />} />
          <Route path="characters" element={<BoardPage />} />
          <Route path="team-template" element={<BoardPage />} />
          <Route path="history" element={<BoardPage />} />
          <Route path="tools" element={<BoardPage />} />
        </Route>

        {/* 根据用户角色智能重定向 */}
        <Route path="/" element={<RootRedirect />} />
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