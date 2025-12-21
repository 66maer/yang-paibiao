import { Chip, Divider } from "@heroui/react";
import { allXinfaList, xinfaInfoTable } from "../../../../config/xinfa";
import { getRuleLabel } from "../../../../utils/slotAllocation";

/**
 * 规则提示组件
 * 显示坑位的报名规则详细信息
 */
const RuleTooltip = ({ rule }) => {
  if (!rule) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-default-500">报名规则</div>

      {/* 老板/打工标记 */}
      <div className="flex flex-wrap gap-2 items-center">
        {rule.allowRich && (
          <Chip size="sm" color="secondary" variant="flat">
            老板可报
          </Chip>
        )}
        {!rule.allowRich && <Chip size="sm">仅打工</Chip>}
        <Chip size="sm" variant="bordered">
          {getRuleLabel(rule)}
        </Chip>
      </div>

      <Divider className="my-1" />

      {/* 允许的心法列表 */}
      <div className="flex flex-wrap gap-1">
        {(rule.allowXinfaList || []).map((xinfa) => {
          const info = xinfaInfoTable[xinfa];
          if (!info) return null;
          return (
            <Chip
              key={xinfa}
              size="sm"
              startContent={<img src={`/xinfa/${info.icon}`} alt={info.name} className="w-4 h-4" />}
              variant="flat"
            >
              {info.name}
            </Chip>
          );
        })}
        {rule.allowXinfaList?.length === allXinfaList.length && (
          <span className="text-xs text-default-500">全部心法均可报名</span>
        )}
      </div>
    </div>
  );
};

export default RuleTooltip;
