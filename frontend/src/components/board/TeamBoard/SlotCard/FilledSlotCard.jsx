import { Chip, Avatar } from "@heroui/react";
import { xinfaInfoTable } from "../../../../config/xinfa";
import { LockIcon } from "../../../icons";

/**
 * 已报名卡片组件
 * 当坑位有报名者时显示
 * - 三层布局结构：
 *   第一层（25%高度）：左侧心法图标 + 右侧标签（老板、锁定、代报名）
 *   第二层（55%高度）：用户昵称 + 角色昵称
 *   第三层（20%高度）：代报名用户昵称（如有）
 * - 支持进组状态遮罩层显示
 */
const FilledSlotCard = ({ signup, presenceStatus }) => {
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;

  return (
    <div
      className="group relative h-full rounded-xl text-white shadow-md overflow-hidden transition-all duration-300"
      style={{
        background: xinfa ? `linear-gradient(135deg, ${xinfa.color}, #1f1f1f)` : "#1f1f1f",
      }}
    >
      {/* 悬停时的渐变背景层 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: xinfa
            ? `linear-gradient(180deg, ${xinfa.color.replace("rgb(", "rgba(").replace(")", ", 0.8)")}, #0a0a0a)`
            : "#0a0a0a",
        }}
      />

      {/* 门派背景图案 */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center transition-transform duration-300 group-hover:scale-120"
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

      {/* 进组状态遮罩层 */}
      {presenceStatus && presenceStatus !== "pending" && (
        <>
          {/* 亮色蒙版 */}
          <div className="absolute inset-0 bg-white/50 pointer-events-none rounded-xl" />

          {/* 状态图片 - 左下角 */}
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <img
              src={
                presenceStatus === "present"
                  ? "/status/已进组.png"
                  : presenceStatus === "absent"
                  ? "/status/标记鸽子.png"
                  : null
              }
              alt={presenceStatus === "present" ? "已进组" : "标记鸽子"}
              className="w-20 h-auto opacity-90"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FilledSlotCard;
