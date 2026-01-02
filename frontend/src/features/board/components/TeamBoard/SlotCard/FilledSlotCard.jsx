import { useState } from "react";
import { Chip, Avatar } from "@heroui/react";
import { xinfaInfoTable } from "@/config/xinfa";
import { LockIcon } from "@/components/common/icons";
import { useTheme } from "@/hooks/useTheme";

/**
 * 已报名卡片组件
 * 当坑位有报名者时显示
 * - 三层布局结构：
 *   第一层（25%高度）：左侧心法图标 + 右侧标签（老板、锁定、代报名）
 *   第二层（55%高度）：用户昵称 + 角色昵称
 *   第三层（20%高度）：代报名用户昵称（如有）
 * - 支持进组状态遮罩层显示（仅在 mark 模式）
 * - 支持鼠标跟随高亮效果
 */
const FilledSlotCard = ({ signup, presenceStatus, mode = "view" }) => {
  const { isDark } = useTheme();
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // 根据主题获取背景色
  const getBackground = () => {
    if (xinfa) {
      if (isDark) {
        return `linear-gradient(135deg, ${xinfa.color}, #1f1f1f)`;
      } else {
        // 亮主题：心法色 -> 白色渐变
        return `linear-gradient(135deg, ${xinfa.color}, #ffffff)`;
      }
    }
    return isDark ? "#1f1f1f" : "#f5f5f5";
  };

  // 根据主题获取鼠标跟随效果背景
  const getHoverBackground = () => {
    if (xinfa) {
      const xinfaColorRgba = xinfa.color
        .replace("rgb(", "rgba(")
        .replace(")", ", 0.9)");

      if (isDark) {
        return `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, ${xinfaColorRgba}, #0a0a0a 70%)`;
      } else {
        // 亮主题：使用更柔和的径向渐变
        const xinfaColorLight = xinfa.color
          .replace("rgb(", "rgba(")
          .replace(")", ", 0.6)");
        return `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, ${xinfaColorLight}, #fafafa 70%)`;
      }
    }
    return isDark ? "#0a0a0a" : "#fafafa";
  };

  // 根据标记状态添加边框阴影（不占用内部空间）
  const getBorderShadow = () => {
    if (mode === "mark" && presenceStatus) {
      if (presenceStatus === "ready") {
        return "0 0 4px 4px rgb(34, 197, 94)"; // green-500
      } else if (presenceStatus === "absent") {
        return "0 0 4px 4px rgb(239, 68, 68)"; // red-500
      }
    }
    return undefined;
  };

  return (
    <div
      className={`group relative h-full rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
        isDark ? "text-white" : "text-gray-900"
      }`}
      style={{
        background: getBackground(),
        boxShadow: getBorderShadow(),
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 鼠标跟随的径向渐变层 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: getHoverBackground(),
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* 门派背景图案 */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-120 ${
          isDark ? "opacity-15" : "opacity-10"
        }`}
        style={{
          backgroundImage: xinfa ? `url(/menpai/${xinfa.menpai}.svg)` : undefined,
        }}
      />

      {/* 内容区域 - 三层布局 */}
      <div className="relative flex flex-col h-full p-2">
        {/* 第一层：心法图标 + 标签 (25%高度) */}
        <div className="flex items-start justify-between" style={{ height: "25%" }}>
          {/* 左侧：心法图标（占用中间层空间，超出显示） */}
          <div className="relative z-10">
            {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-10 h-10 rounded shadow-lg" />}
          </div>

          {/* 右侧：标签 */}
          <div className="flex gap-1 flex-wrap justify-end">
            {signup.isRich && (
              <Chip size="sm" variant="faded" color="secondary" avatar={<img src="/rich.svg" alt="老板坑" />}>
                老板
              </Chip>
            )}
            {signup.isLock && <LockIcon />}
          </div>
        </div>

        {/* 第二层：用户昵称 + 角色昵称 (55%高度) */}
        <div className="flex flex-col justify-center items-center text-center" style={{ height: "55%" }}>
          {/* 用户昵称 - 主要，加粗，字号大 */}
          <div className="text-2xl font-bold leading-tight mb-1">
            {signup.signupName || signup.characterName || "未知"}
          </div>
          {/* 角色昵称 - 次要，字号小 */}
          <div className="text-sm opacity-80 leading-tight">{signup.characterName || "未填写角色"}</div>
        </div>

        {/* 第三层：代报名用户昵称 (20%高度) */}
        <div className="flex items-end justify-end" style={{ height: "20%" }}>
          {signup.isProxy && signup.proxyUserName && (
            <div className="text-xs opacity-70">{signup.proxyUserName}（代报）</div>
          )}
        </div>
      </div>

      {/* 进组状态遮罩层 - 仅在 mark 模式显示 */}
      {mode === "mark" && presenceStatus && (presenceStatus === "ready" || presenceStatus === "absent") && (
        <>
          {/* 亮色蒙版 */}
          <div className="absolute inset-0 bg-white/50 pointer-events-none rounded-xl" />

          {/* 状态图片 - 左下角 */}
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <img
              src={
                presenceStatus === "ready"
                  ? "/status/已进组.png"
                  : presenceStatus === "absent"
                  ? "/status/标记鸽子.png"
                  : null
              }
              alt={presenceStatus === "ready" ? "已进组" : "标记鸽子"}
              className="w-20 h-auto opacity-90"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FilledSlotCard;
