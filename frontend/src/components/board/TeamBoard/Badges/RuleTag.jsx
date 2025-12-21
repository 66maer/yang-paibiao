import { Chip, Avatar } from "@heroui/react";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  tXinfaList,
  neigongXinfaList,
  waigongXinfaList,
  xinfaInfoTable,
} from "../../../../config/xinfa";

/**
 * 规则标签组件
 * 根据规则显示不同的标签样式
 * - 老板坑：允许老板报名且无心法限制
 * - 未开放：不允许老板且无心法限制
 * - 不限心法：不允许老板但允许所有心法
 * - 简略显示：符合特定心法组（输出、治疗、防御、内功、外功）
 * - 列表显示：其他情况显示所有允许的心法
 */
const RuleTag = ({ rule }) => {
  // 老板坑：允许老板且没有心法限制
  if (rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <div className="flex items-center gap-2">
        <img src="/rich.svg" alt="老板坑" className="w-10 h-10" />
        <span className="text-sm">老板坑</span>
      </div>
    );
  }

  // 未开放：不允许老板且没有心法限制
  if (!rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <Chip size="lg" color="default" variant="flat">
        未开放
      </Chip>
    );
  }

  // 不限心法：允许所有心法
  if (!rule.allowRich && rule.allowXinfaList.length === allXinfaList.length) {
    return (
      <div className="flex items-center gap-2">
        <img src="/jx3.png" alt="任意心法" className="w-10 h-10" />
        <span className="text-sm">不限心法</span>
      </div>
    );
  }

  // 检查是否符合特定心法组的简略显示
  const { allowXinfaList = [] } = rule;

  // 辅助函数：检查是否匹配特定心法组
  const matchXinfaGroup = (name, refList, iconUrl, label) => {
    if (
      allowXinfaList.length === refList.length &&
      allowXinfaList.every((xinfa) => xinfaInfoTable[xinfa].type.includes(name))
    ) {
      return (
        <div className="flex items-center gap-2">
          <img src={iconUrl} alt={name} className="w-10 h-10" />
          <span className="text-sm">{label}</span>
        </div>
      );
    }
    return null;
  };

  // 按优先级检查各种心法组
  let result = null;
  if ((result = matchXinfaGroup("dps", dpsXinfaList, "/dps.svg", "任意输出心法"))) {
    return result;
  }
  if ((result = matchXinfaGroup("奶妈", naiXinfaList, "/奶妈.svg", "任意治疗心法"))) {
    return result;
  }
  if ((result = matchXinfaGroup("T", tXinfaList, "/T.svg", "任意防御心法"))) {
    return result;
  }
  if ((result = matchXinfaGroup("内功", neigongXinfaList, "/内功.svg", "任意内功心法"))) {
    return result;
  }
  if ((result = matchXinfaGroup("外功", waigongXinfaList, "/外功.svg", "任意外功心法"))) {
    return result;
  }

  // 不符合简略情况，列出所有允许的心法
  // 根据心法数量动态调整头像大小
  const getAvatarSize = (count) => {
    if (count <= 3) return "w-10 h-10"; // 1-3个：大
    if (count <= 6) return "w-8 h-8"; // 4-6个：中
    if (count <= 9) return "w-6 h-6"; // 7-10个：小
    return "w-5 h-5"; // 11个以上：更小
  };

  const avatarSize = getAvatarSize(allowXinfaList.length);

  return (
    <div className="flex flex-wrap items-center">
      {allowXinfaList.map((xinfa) => {
        const info = xinfaInfoTable[xinfa];
        return (
          <Avatar
            key={xinfa}
            src={`/xinfa/${info.icon}`}
            alt={info.name}
            size="sm"
            isBordered
            className={avatarSize}
          />
        );
      })}
    </div>
  );
};

export default RuleTag;
