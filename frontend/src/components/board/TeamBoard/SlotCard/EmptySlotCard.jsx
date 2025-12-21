import { RuleTag } from "../Badges";

/**
 * 空坑位卡片组件
 * 当坑位没有报名者时显示
 * - 显示坑位编号
 * - 显示"等待报名"提示
 * - 显示规则标签
 * - 提示点击查看规则
 */
const EmptySlotCard = ({ slotIndex, rule }) => {
  return (
    <div className="h-full p-3 rounded-xl border border-dashed border-default-300 bg-default-50 dark:bg-default-100 text-default-600">
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-default-500">坑位 {slotIndex + 1}</div>
          <div className="text-sm font-semibold">等待报名</div>
          <RuleTag rule={rule} />
        </div>
        <div className="text-xs text-default-400">点击查看规则</div>
      </div>
    </div>
  );
};

export default EmptySlotCard;
