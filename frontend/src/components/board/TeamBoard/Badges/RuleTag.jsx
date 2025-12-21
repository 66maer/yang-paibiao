import { Chip } from "@heroui/react";
import { allXinfaList } from "../../../../config/xinfa";

/**
 * 规则标签组件
 * 根据规则显示不同的标签样式
 * - 老板坑：允许老板报名且无心法限制
 * - 未开放：不允许老板且无心法限制
 * - 不限心法：不允许老板但允许所有心法
 * - 允许 N 心法：显示允许的心法数量
 */
const RuleTag = ({ rule }) => {
  // 老板坑：允许老板且没有心法限制
  if (rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <Chip size="sm" color="secondary" variant="flat">
        老板坑
      </Chip>
    );
  }

  // 未开放：不允许老板且没有心法限制
  if (!rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <Chip size="sm" color="default" variant="flat">
        未开放
      </Chip>
    );
  }

  // 不限心法：允许所有心法
  if (!rule.allowRich && rule.allowXinfaList.length === allXinfaList.length) {
    return (
      <Chip size="sm" color="primary" variant="flat">
        不限心法
      </Chip>
    );
  }

  // 允许特定数量的心法
  return (
    <Chip size="sm" color="primary" variant="flat">
      允许 {rule.allowXinfaList.length} 心法
    </Chip>
  );
};

export default RuleTag;
