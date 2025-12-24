import { Avatar, Chip, Button } from "@heroui/react";
import { xinfaInfoTable } from "../../config/xinfa";

/**
 * 候补列表卡片组件
 * 用于展示候补成员信息
 *
 * Props:
 * @param {Object} waitlistItem - 候补信息对象
 *   - game_name: 游戏名
 *   - avatar: 头像 URL
 *   - role: 角色（tank/healer/dps）
 *   - xinfa: 心法名称
 *   - waitlist_order: 候补顺序
 *   - characterXinfa: 心法数据库字段
 * @param {boolean} isAdmin - 是否是管理员
 * @param {Function} onRemove - 取消候补回调
 */
export default function WaitlistCard({ waitlistItem, isAdmin, onRemove }) {
  const roleColor = {
    tank: "from-blue-600 to-blue-900",
    healer: "from-green-600 to-green-900",
    dps: "from-red-600 to-red-900",
  };

  const roleBgColor = {
    tank: "bg-blue-500",
    healer: "bg-green-500",
    dps: "bg-red-500",
  };

  const roleText = {
    tank: "坦克",
    healer: "治疗",
    dps: "输出",
  };

  // 获取心法信息
  const xinfa = waitlistItem?.characterXinfa
    ? xinfaInfoTable[waitlistItem.characterXinfa]
    : waitlistItem?.xinfa
    ? Object.values(xinfaInfoTable).find((x) => x.name === waitlistItem.xinfa)
    : null;

  return (
    <div className="p-3 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50">
      <div className="flex items-center gap-3">
        {/* 左侧：候补顺序 + 头像 + 心法图标 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 候补顺序徽章 */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 dark:bg-yellow-500 text-white font-bold text-sm flex-shrink-0">
            {waitlistItem.waitlist_order}
          </div>

          {/* 头像 */}
          <div className="relative flex-shrink-0">
            <Avatar src={waitlistItem.avatar} name={waitlistItem.game_name} size="md" />
            {/* 心法图标 */}
            {xinfa && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-yellow-950 rounded-full p-1 shadow-md border border-yellow-300">
                <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* 中间：用户信息 */}
        <div className="flex-1 min-w-0">
          {/* 用户名 + 候补标签 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{waitlistItem.game_name}</span>
            <Chip size="sm" color="warning" variant="flat" className="flex-shrink-0">
              候补
            </Chip>
          </div>

          {/* 角色 + 心法 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 角色标签 */}
            <span
              className={`text-xs px-2 py-0.5 rounded text-white font-medium ${
                roleBgColor[waitlistItem.role] || "bg-default-400"
              }`}
            >
              {roleText[waitlistItem.role] || waitlistItem.role}
            </span>

            {/* 心法名称 */}
            {xinfa && (
              <span
                className="text-xs px-2 py-0.5 rounded text-white font-medium"
                style={{
                  backgroundColor: xinfa.color,
                }}
              >
                {xinfa.name}
              </span>
            )}
          </div>
        </div>

        {/* 右侧：取消按钮（仅管理员可见） */}
        {isAdmin && (
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={() => onRemove?.(waitlistItem)}
            className="flex-shrink-0"
          >
            取消
          </Button>
        )}
      </div>
    </div>
  );
}
