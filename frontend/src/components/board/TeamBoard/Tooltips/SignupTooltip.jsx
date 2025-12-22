import { Chip, Divider } from "@heroui/react";
import toast from "react-hot-toast";
import { xinfaInfoTable } from "../../../../config/xinfa";
import { CopyIcon } from "../../../icons";
import RuleTooltip from "./RuleTooltip";

/**
 * 报名信息提示组件
 * 显示报名者的详细信息和坑位规则
 */
const SignupTooltip = ({ signup, rule }) => {
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;

  // 调试：查看signup数据
  console.log("SignupTooltip - signup数据:", signup);

  const handleCopyQQ = async (qqNumber) => {
    try {
      await navigator.clipboard.writeText(qqNumber);
      toast.success("QQ号已复制", { duration: 1500 });
    } catch (err) {
      toast.error("复制失败，请手动复制");
    }
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
          {signup?.qqNumber && (
            <div className="flex items-center gap-1 text-xs text-default-400 mt-0.5">
              <span>QQ: {signup.qqNumber}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyQQ(signup.qqNumber);
                }}
                className="inline-flex items-center justify-center hover:text-primary transition-colors cursor-pointer"
                aria-label="复制QQ号"
              >
                <CopyIcon size={14} />
              </button>
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
      {signup?.isProxy && (signup?.proxyUserName || signup?.proxyUserQQ) && (
        <div className="text-xs text-default-500 bg-warning-50 dark:bg-warning-900/20 p-2 rounded space-y-1">
          {signup.proxyUserName && (
            <div>
              <span className="text-warning-600 dark:text-warning-400 font-medium">代报人：</span>
              <span className="ml-1">{signup.proxyUserName}</span>
            </div>
          )}
          {signup.proxyUserQQ && (
            <div className="flex items-center gap-1 text-default-400">
              <span>QQ: {signup.proxyUserQQ}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyQQ(signup.proxyUserQQ);
                }}
                className="inline-flex items-center justify-center hover:text-warning-600 dark:hover:text-warning-400 transition-colors cursor-pointer"
                aria-label="复制代报人QQ号"
              >
                <CopyIcon size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <Divider className="my-1" />

      {/* 坑位规则信息 */}
      <RuleTooltip rule={rule} />
    </div>
  );
};

export default SignupTooltip;
