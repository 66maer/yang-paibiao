import { Chip, Divider, Avatar } from "@heroui/react";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  tXinfaList,
  neigongXinfaList,
  waigongXinfaList,
  xinfaInfoTable,
} from "../../../../config/xinfa";

// 获取规则标签文本
// 显示允许

const getRuleLabel = (rule) => {
  const { allowXinfaList = [] } = rule;

  // 检查是否匹配特定心法组
  const checkGroup = (name, refList, iconUrl, label) => {
    if (
      allowXinfaList.length === refList.length &&
      allowXinfaList.every((xinfa) => xinfaInfoTable[xinfa].type.includes(name))
    ) {
      return (
        <div className="flex items-center gap-2">
          <img src={iconUrl} alt={label} className="w-4 h-4" />
          <span className="text-sm">{label}</span>
        </div>
      );
    }
    return null;
  };

  // 按优先级检查各种心法组
  let result = null;
  if ((result = checkGroup("dps", dpsXinfaList, "/dps.svg", `输出心法(${dpsXinfaList.length} 种)`))) return result;
  if ((result = checkGroup("奶妈", naiXinfaList, "/奶妈.svg", `治疗心法(${naiXinfaList.length} 种)`))) return result;
  if ((result = checkGroup("T", tXinfaList, "/T.svg", `任意防御心法(${tXinfaList.length} 种)`))) return result;
  if ((result = checkGroup("内功", neigongXinfaList, "/内功.svg", `内功心法(${neigongXinfaList.length} 种)`)))
    return result;
  if ((result = checkGroup("外功", waigongXinfaList, "/外功.svg", `外功心法(${waigongXinfaList.length} 种)`)))
    return result;
  if (allowXinfaList.length === allXinfaList.length) {
    return (
      <div className="flex items-center gap-2">
        <img src="/jx3.png" alt={`不限心法(${allXinfaList.length} 种)`} className="w-4 h-4" />
        <span className="text-sm">{`不限心法(${allXinfaList.length} 种)`}</span>
      </div>
    );
  }
  return `允许以下 ${allowXinfaList.length} 种心法`;
};

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
          <Chip size="sm" variant="bordered" className="border-[#FF9EC5] text-[#FF9EC5]">
            老板坑
          </Chip>
        )}
        {!rule.allowXinfaList || rule.allowXinfaList.length === 0 ? (
          <Chip size="sm" variant="bordered" className="bg-[#A7F3D0]/20 text-[#377370]">
            未开放，联系管理员排坑
          </Chip>
        ) : null}
        {rule.allowXinfaList && rule.allowXinfaList.length > 0 && (
          <Chip size="sm" variant="bordered" className="border-[#A8D8FF] text-[#7098CC]">
            打工坑
          </Chip>
        )}
        {rule.allowXinfaList && rule.allowXinfaList.length > 0 && (
          <Chip size="sm" variant="bordered" className="border-[#D8B4FE] text-[#A074CC]">
            {getRuleLabel(rule)}
          </Chip>
        )}
      </div>

      {rule.allowXinfaList && rule.allowXinfaList.length > 0 && <Divider className="my-1" />}

      {/* 允许的心法列表 */}
      <div className="flex flex-wrap gap-1">
        {(rule.allowXinfaList || []).map((xinfa) => {
          const info = xinfaInfoTable[xinfa];
          if (!info) return null;
          return (
            <Avatar key={xinfa} src={`/xinfa/${info.icon}`} alt={info.name} size="sm" isBordered className="w-5 h-5" />
          );
        })}
      </div>
    </div>
  );
};

export default RuleTooltip;
