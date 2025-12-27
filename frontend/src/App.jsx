import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import GuildManagementPage from "./pages/admin/GuildManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import CharacterManagementPage from "./pages/admin/CharacterManagementPage";
import ConfigLayout from "./layouts/ConfigLayout";
import DungeonConfigPage from "./pages/admin/DungeonConfigPage";
import UserLayout from "./layouts/UserLayout";
import BoardPage from "./pages/user/BoardPage";
import GuildHubPage from "./pages/user/GuildHubPage";
import MembersPage from "./pages/user/MembersPage";
import TeamEditPage from "./pages/user/TeamEditPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";
import NotFoundPage from "./pages/NotFoundPage";
import DebugTeamBoardPage from "./pages/DebugTeamBoardPage";
import TemplatesPage from "./pages/user/TemplatesPage";
import TemplateEditPage from "./pages/user/TemplateEditPage";
import CharactersPage from "./pages/user/CharactersPage";
import MyRecordsPage from "./pages/user/MyRecordsPage";
import GoldRecordsPage from "./pages/user/GoldRecordsPage";
import RankingPage from "./pages/user/RankingPage";
import HistoryPage from "./pages/user/HistoryPage";
import ToolsPage from "./pages/user/ToolsPage";

function AppContent() {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} locale="zh-CN">
      <ToastProvider placement="top-center" toastOffset={80} />
      <Routes>
        {/* 用户登录和注册 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 组件调试页面（无需登录） */}
        <Route path="/debug/team-board" element={<DebugTeamBoardPage />} />

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
          <Route path="configs" element={<ConfigLayout />}>
            <Route path="dungeons" element={<DungeonConfigPage />} />
          </Route>
        </Route>

        {/* 用户业务页面 */}
        <Route
          element={
            <ProtectedRoute requiredRole="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/guilds" element={<GuildHubPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/team/new" element={<TeamEditPage />} />
          <Route path="/team/:teamId/edit" element={<TeamEditPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/my-records" element={<MyRecordsPage />} />
          <Route path="/gold-records" element={<GoldRecordsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateEditPage />} />
          <Route path="/templates/:templateId/edit" element={<TemplateEditPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* 根据用户角色智能重定向 */}
        <Route path="/" element={<RootRedirect />} />

        {/* 404 页面 - 必须放在最后 */}
        <Route path="*" element={<NotFoundPage />} />
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
