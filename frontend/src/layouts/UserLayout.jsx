import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import useAuthStore from "../stores/authStore";
import ThemeSwitch from "../components/ThemeSwitch";
import GuildSwitcher from "../components/user/GuildSwitcher";
import UserMenu from "../components/user/UserMenu";
import { getFilteredMenu } from "../config/userMenuConfig";

/**
 * 用户页面布局组件
 */
export default function UserLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  // 获取当前群组
  const currentGuild = user?.guilds?.find(
    (g) => g.id === user?.current_guild_id
  );
  const currentRole = currentGuild?.role || "member";
  const hasCurrentGuild = !!currentGuild;

  // 根据权限过滤菜单
  const menuItems = getFilteredMenu(currentRole);

  // 判断菜单是否激活
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border-b border-pink-200 dark:border-pink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + 品牌名 */}
            <Link
              to="/board"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                小
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                小秧排表
              </span>
            </Link>

            {/* 功能菜单：仅在已选择当前群组时展示 */}
            {hasCurrentGuild && (
              <nav className="hidden md:flex items-center gap-1">
                {menuItems.map((item) => (
                  <Link key={item.key} to={item.path}>
                    <Button
                      size="sm"
                      variant={isActive(item.path) ? "flat" : "light"}
                      color={isActive(item.path) ? "primary" : "default"}
                      className={`font-medium transition-all ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-600 dark:text-pink-400"
                          : ""
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}

            {/* 右侧区域：主题 -> 群组切换 -> 用户 */}
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              <GuildSwitcher />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-pink-200 dark:border-pink-900 py-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-default-500">
            小秧排表 © 2025 - 剑网三排标系统
          </p>
        </div>
      </footer>
    </div>
  );
}
