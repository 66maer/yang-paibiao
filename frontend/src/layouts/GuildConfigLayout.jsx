import { Outlet, Link, useLocation } from "react-router-dom";
import { Card } from "@heroui/react";

/**
 * 群组配置布局 - 带左侧导航栏
 * 用于群组级别的配置，如副本配置、赛季修正等
 */
export default function GuildConfigLayout() {
  const location = useLocation();

  const configMenuItems = [
    { path: "/guild-settings/dungeons", label: "副本配置", icon: "🏔️" },
    { path: "/guild-settings/seasons", label: "赛季修正", icon: "📅" },
    // 未来可以在这里添加更多群组配置项
    // { path: "/guild-settings/notifications", label: "通知设置", icon: "🔔" },
    // { path: "/guild-settings/permissions", label: "权限设置", icon: "🔐" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          群组预设
        </h1>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* 左侧导航栏 */}
          <div className="col-span-12 md:col-span-3">
            <Card className="p-4">
              <nav className="space-y-1">
                {configMenuItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer
                        ${
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </Card>
          </div>

          {/* 右侧内容区 */}
          <div className="col-span-12 md:col-span-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
