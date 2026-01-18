import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import GuildManagementPage from "@/pages/admin/GuildManagementPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import CharacterManagementPage from "@/pages/admin/CharacterManagementPage";
import BotsPage from "@/pages/admin/BotsPage";
import ConfigLayout from "@/layouts/ConfigLayout";
import DungeonConfigPage from "@/pages/admin/DungeonConfigPage";
import SeasonCorrectionPage from "@/pages/admin/SeasonCorrectionPage";
import UserLayout from "@/layouts/UserLayout";
import BoardPage from "@/pages/board/BoardPage";
import GuildHubPage from "@/pages/guild/GuildHubPage";
import MembersPage from "@/pages/guild/MembersPage";
import TeamEditPage from "@/pages/board/TeamEditPage";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import RootRedirect from "@/components/common/RootRedirect";
import NotFoundPage from "@/pages/NotFoundPage";
import DebugTeamBoardPage from "@/pages/DebugTeamBoardPage";
import TemplatesPage from "@/pages/template/TemplatesPage";
import TemplateEditPage from "@/pages/template/TemplateEditPage";
import CharactersPage from "@/pages/CharactersPage";
import MyRecordsPage from "@/pages/gold/MyRecordsPage";
import GoldRecordsPage from "@/pages/gold/GoldRecordsPage";
import RankingPage from "@/pages/RankingPage";
import HistoryPage from "@/pages/board/HistoryPage";
import ToolsPage from "@/pages/ToolsPage";
import TeamImagePage from "@/pages/bot/TeamImagePage";
import GuildConfigLayout from "@/layouts/GuildConfigLayout";
import GuildDungeonConfigPage from "@/pages/guild/GuildDungeonConfigPage";
import GuildSeasonCorrectionPage from "@/pages/guild/GuildSeasonCorrectionPage";
import GuildQuickTeamConfigPage from "@/pages/guild/GuildQuickTeamConfigPage";

function AppContent() {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} locale="zh-CN">
      <ToastProvider placement="top-center" toastOffset={80} />
      <Routes>
        {/* 用户登录和注册 */}
        <Route path="/login" element={<LoginPage />} />
        {/* 临时关闭注册功能 */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}

        {/* 组件调试页面（无需登录） */}
        <Route path="/debug/team-board" element={<DebugTeamBoardPage />} />

        {/* Bot专用页面（无需登录） */}
        <Route path="/bot/guilds/:guild_qq_number/teams/:team_id" element={<TeamImagePage />} />

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
          <Route path="bots" element={<BotsPage />} />
          <Route path="configs" element={<ConfigLayout />}>
            <Route path="dungeons" element={<DungeonConfigPage />} />
            <Route path="seasons" element={<SeasonCorrectionPage />} />
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
          {/* 群组预设配置 */}
          <Route path="/guild-settings" element={<GuildConfigLayout />}>
            <Route index element={<GuildDungeonConfigPage />} />
            <Route path="dungeons" element={<GuildDungeonConfigPage />} />
            <Route path="seasons" element={<GuildSeasonCorrectionPage />} />
            <Route path="quick-team" element={<GuildQuickTeamConfigPage />} />
          </Route>
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
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
