import { Chip, Divider } from "@heroui/react";
import { xinfaInfoTable } from "../../../../config/xinfa";
import RuleTooltip from "./RuleTooltip";

/**
 * 报名信息提示组件
 * 显示报名者的详细信息和坑位规则
 */
const SignupTooltip = ({ signup, rule }) => {
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-default-500">报名信息</div>

      {/* 报名者基本信息 */}
      <div className="flex items-center gap-2">
        {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-6 h-6 rounded" />}
        <div>
          <div className="text-sm font-semibold">{signup?.signupName || signup?.characterName || "未命名"}</div>
          <div className="text-xs text-default-500">{signup?.characterName || "未填写角色"}</div>
        </div>
      </div>

      {/* 报名者标签（客户端、老板、代报、锁定） */}
      <div className="flex gap-2 flex-wrap text-xs text-default-500">
        {signup?.clientType && <Chip size="sm">{signup.clientType}</Chip>}
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

      <Divider className="my-1" />

      {/* 坑位规则信息 */}
      <RuleTooltip rule={rule} />
    </div>
  );
};

export default SignupTooltip;
