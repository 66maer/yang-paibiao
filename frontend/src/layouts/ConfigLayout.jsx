import { Outlet, Link, useLocation } from "react-router-dom";
import { Card } from "@heroui/react";

/**
 * 全局配置布局 - 带左侧导航栏
 */
export default function ConfigLayout() {
  const location = useLocation();

  const configMenuItems = [
    { path: "/admin/configs/dungeons", label: "副本配置", icon: "🏔️" },
    { path: "/admin/configs/seasons", label: "赛季修正", icon: "📅" },
    // 未来可以在这里添加更多配置项
    // { path: "/admin/configs/system", label: "系统配置", icon: "⚙️" },
    // { path: "/admin/configs/notifications", label: "通知配置", icon: "🔔" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          全局配置
        </h1>

        <div className="grid grid-cols-12 gap-6">
          {/* 左侧导航栏 */}
          <div className="col-span-3">
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
          <div className="col-span-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
