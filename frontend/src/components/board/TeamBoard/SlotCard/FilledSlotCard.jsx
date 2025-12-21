import { Chip } from "@heroui/react";
import { xinfaInfoTable } from "../../../../config/xinfa";
import { RuleTag, PresenceBadge } from "../Badges";
import { getPresenceStatus } from "../utils";

/**
 * 已报名卡片组件
 * 当坑位有报名者时显示
 * - 显示心法图标和背景渐变色
 * - 显示门派背景图案
 * - 显示报名者昵称和角色名
 * - 显示进组状态标记
 * - 显示客户端类型、老板、锁定等标签
 * - 显示代报标记
 * - 显示规则标签
 * - 拖动模式下显示拖动提示
 */
const FilledSlotCard = ({ signup, rule, draggable }) => {
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;
  const presence = getPresenceStatus(signup);

  return (
    <div
      className="relative h-full p-3 rounded-xl text-white shadow-md overflow-hidden"
      style={{
        background: xinfa ? `linear-gradient(135deg, ${xinfa.color}, #1f1f1f)` : "#1f1f1f",
      }}
    >
      {/* 门派背景图案 */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center"
        style={{
          backgroundImage: xinfa ? `url(/menpai/${xinfa.menpai}.svg)` : undefined,
        }}
      />

      {/* 内容区域 */}
      <div className="relative flex flex-col gap-2 h-full">
        {/* 顶部：基本信息 + 状态标签 */}
        <div className="flex items-start justify-between gap-2">
          {/* 左侧：心法图标 + 昵称/角色名 */}
          <div className="flex items-center gap-2">
            {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-9 h-9 rounded" />}
            <div>
              <div className="text-sm font-bold leading-tight">
                {signup.signupName || signup.characterName || "未知"}
              </div>
              <div className="text-xs opacity-80 leading-tight">
                {signup.characterName || "未填写角色"}
              </div>
            </div>
          </div>

          {/* 右侧：进组状态 + 其他标签 */}
          <div className="flex flex-col items-end gap-1">
            {presence && <PresenceBadge status={presence} />}
            <div className="flex gap-1">
              {signup.clientType && (
                <Chip size="sm" variant="flat" color="default">
                  {signup.clientType}
                </Chip>
              )}
              {signup.isRich && (
                <Chip size="sm" variant="flat" color="secondary">
                  老板
                </Chip>
              )}
              {signup.isLock && (
                <Chip size="sm" variant="flat" color="danger">
                  锁定
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* 底部：代报 + 规则标签 + 拖动提示 */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-2 text-xs opacity-80">
            {signup.isProxy && <Chip size="sm" variant="flat">代报</Chip>}
            <RuleTag rule={rule} />
          </div>
          {draggable && <div className="text-xs opacity-70">⇅ 拖动</div>}
        </div>
      </div>
    </div>
  );
};

export default FilledSlotCard;
