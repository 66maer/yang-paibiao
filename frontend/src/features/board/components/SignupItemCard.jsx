import { useState } from "react";
import { Chip, Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import useAuthStore from "@/stores/authStore";
import { xinfaInfoTable } from "@/config/xinfa";

/**
 * 统一的报名/候补卡片组件
 *
 * Props:
 * @param {Object} signup - 报名信息对象
 * @param {string} type - 卡片类型："signup" | "waitlist"
 * @param {number} waitlistOrder - 候补顺序（仅当type为waitlist时）
 * @param {boolean} isAdmin - 是否是管理员
 * @param {Object} currentUser - 当前登录用户
 * @param {Function} onDelete - 取消报名回调
 */
export default function SignupItemCard({ signup, type = "signup", waitlistOrder, isAdmin, currentUser, onDelete }) {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState("");

  // 获取心法信息
  const xinfa = signup?.characterXinfa
    ? xinfaInfoTable[signup.characterXinfa]
    : signup?.xinfa
    ? Object.values(xinfaInfoTable).find((x) => x.name === signup.xinfa)
    : null;

  // 判断是否是本人的报名
  const isSelfSignup = user?.id && signup?.userId && user.id === signup.userId;

  // 判断是否是代报名
  const isProxy = !!signup?.isProxy;

  // 获取代报名人信息
  const submitterName = signup?.submitterName || "他人";

  // 检查是否有权限取消报名
  // 管理员可以取消所有报名，或者报名人自己（submitterId 或 userId 是当前用户）可以取消
  const canDelete =
    isAdmin || (currentUser?.id && (currentUser.id === signup?.submitterId || currentUser.id === signup?.userId));

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return "时间未知";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "时间未知";
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "时间未知";
    }
  };

  // 复制QQ号
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 渲染QQ号（带复制功能）
  const renderQqNumber = (qqNumber, label) => {
    if (!qqNumber) return null;
    return (
      <span
        className="text-primary-500 cursor-pointer hover:underline ml-1"
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(qqNumber, label);
        }}
        title="点击复制"
      >
        ({qqNumber}
        {copied === label && " ✓"})
      </span>
    );
  };

  // Popover详细信息内容
  const detailContent = (
    <div className="p-3 space-y-3 min-w-[280px]">
      {/* 第一行：心法图标 + 角色名 */}
      <div className="flex items-center gap-2">
        {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-8 h-8 rounded" />}
        <span className="font-bold text-lg">{signup?.characterName || "[未填写角色]"}</span>
      </div>

      {/* 第二行：玩家昵称 + QQ号 */}
      <div className="text-sm">
        <span className="text-default-600">玩家昵称：</span>
        <span className="font-medium">{signup?.signupName || "[未知]"}</span>
        {renderQqNumber(signup?.playerQqNumber, "玩家QQ")}
      </div>

      {/* 第三行：报名人昵称 + QQ号 */}
      <div className="text-sm">
        <span className="text-default-600">报名人：</span>
        <span className="font-medium">{submitterName}</span>
        {renderQqNumber(signup?.submitterQqNumber, "报名人QQ")}
      </div>

      {/* 第四行：标记 Chip */}
      <div className="flex gap-2 flex-wrap">
        {signup?.isRich && (
          <Chip size="sm" color="secondary" variant="flat">
            老板
          </Chip>
        )}
        {isProxy && (
          <Chip size="sm" color="primary" variant="flat">
            代报名
          </Chip>
        )}
        {type === "waitlist" && (
          <Chip size="sm" color="warning" variant="flat">
            候补 #{waitlistOrder}
          </Chip>
        )}
      </div>

      {/* 第五行：报名时间 */}
      <div className="text-xs text-default-500">报名时间：{formatTime(signup?.createdAt)}</div>

      {/* 操作按钮 */}
      {onDelete && canDelete && (
        <div className="pt-2 border-t border-default-200">
          <Button size="sm" color="danger" variant="flat" onPress={onDelete} fullWidth>
            取消报名
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover placement="bottom" showArrow>
      <PopoverTrigger>
        <div
          className="cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border-2"
          style={{
            height: "100px",
            background: xinfa
              ? `linear-gradient(135deg, ${xinfa.color}55, ${xinfa.color}15)`
              : "linear-gradient(135deg, rgba(100,100,100,0.1), rgba(100,100,100,0.05))",
            borderColor: xinfa ? xinfa.color : "rgba(100,100,100,0.3)",
          }}
        >
          <div className="relative flex flex-col h-full p-2">
            {/* 第一层：心法图标 + 标签 (25%高度) */}
            <div className="flex items-start justify-between" style={{ height: "25%" }}>
              {/* 左侧：心法图标 */}
              <div className="relative z-10">
                {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-8 h-8 rounded shadow-lg" />}
              </div>

              {/* 右侧：标签 */}
              <div className="flex gap-1 flex-wrap justify-end">
                {type === "waitlist" && (
                  <Chip size="sm" color="warning" variant="flat">
                    候补 #{waitlistOrder}
                  </Chip>
                )}
                {signup?.isRich && (
                  <Chip size="sm" variant="faded" color="secondary">
                    老板
                  </Chip>
                )}
                {isProxy && (
                  <Chip size="sm" color="primary" variant="flat">
                    代
                  </Chip>
                )}
              </div>
            </div>

            {/* 第二层：主要内容 (50%高度) */}
            <div className="flex flex-col justify-center items-center text-center" style={{ height: "50%" }}>
              {isSelfSignup ? (
                // 本人报名：只显示角色名（加粗）
                <div className="text-2xl font-bold leading-tight">{signup?.characterName || "[未填写角色]"}</div>
              ) : (
                // 他人报名：两行显示
                <>
                  {/* 第一行：玩家名（加粗） */}
                  <div className="text-xl font-bold leading-tight mb-1">{signup?.signupName || "[未知]"}</div>
                  {/* 第二行：角色名 心法名（小字） */}
                  <div className="text-sm opacity-80 leading-tight">{signup?.characterName || "[未填写角色]"}</div>
                </>
              )}
            </div>

            {/* 第三层：代报名信息 (25%高度) */}
            <div className="flex items-end justify-end" style={{ height: "25%" }}>
              {isProxy && <div className="text-xs opacity-70">{submitterName}（代报）</div>}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent>{detailContent}</PopoverContent>
    </Popover>
  );
}
