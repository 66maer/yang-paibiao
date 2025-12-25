import { useState } from "react";
import { Chip, Divider } from "@heroui/react";
import { xinfaInfoTable } from "../../../../config/xinfa";
import RuleTooltip from "./RuleTooltip";

/**
 * 报名信息提示组件
 * 显示报名者的详细信息和坑位规则
 */
const SignupTooltip = ({ signup, rule }) => {
  const [copied, setCopied] = useState("");
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;

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
        ({qqNumber}{copied === label && " ✓"})
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-default-500">报名信息</div>

      {/* 报名者基本信息 */}
      <div className="flex items-center gap-2">
        {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-6 h-6 rounded" />}
        <div className="flex-1">
          <div className="text-sm font-semibold">{signup?.signupName || "[未知成员]"}</div>
          <div className="text-xs text-default-500">{signup?.characterName || "未填写角色"}</div>
          {signup?.playerQqNumber && (
            <div className="text-xs text-default-400 mt-0.5">
              <span>QQ:</span>
              {renderQqNumber(signup.playerQqNumber, "玩家QQ")}
            </div>
          )}
        </div>
      </div>

      {/* 报名者标签（老板、代报、锁定） */}
      <div className="flex gap-2 flex-wrap text-xs text-default-500">
        {signup?.isRich && (
          <Chip size="sm" color="secondary" variant="flat">
            老板
          </Chip>
        )}
        {signup?.isProxy && (
          <Chip size="sm" variant="flat" color="warning">
            代报
          </Chip>
        )}
        {signup?.isLock && (
          <Chip size="sm" variant="flat" color="danger">
            锁定
          </Chip>
        )}
      </div>

      {/* 代报名人信息 */}
      {signup?.isProxy && (signup?.submitterName || signup?.submitterQqNumber) && (
        <div className="text-xs bg-warning-50 dark:bg-warning-900/20 p-2 rounded space-y-1">
          <div>
            <span className="text-warning-600 dark:text-warning-400 font-medium">代报人：</span>
            <span className="ml-1 text-default-700 dark:text-default-300">
              {signup.submitterName || "未知"}
            </span>
            {signup.submitterQqNumber && renderQqNumber(signup.submitterQqNumber, "代报人QQ")}
          </div>
        </div>
      )}

      <Divider className="my-1" />

      {/* 坑位规则信息 */}
      <RuleTooltip rule={rule} />
    </div>
  );
};

export default SignupTooltip;
