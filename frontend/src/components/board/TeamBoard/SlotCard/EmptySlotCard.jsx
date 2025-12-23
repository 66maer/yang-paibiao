import RuleTag from "./RuleTag";

/**
 * 空坑位卡片组件
 * 当坑位没有报名者时显示
 * - 显示坑位编号
 * - 显示"等待报名"提示
 * - 显示规则标签
 * - 提示点击查看规则
 */
const EmptySlotCard = ({ slotIndex, displayIndex, rule }) => {
  const shownIndex = Number.isInteger(displayIndex) ? displayIndex : slotIndex;
  return (
    <div className="h-full p-3 rounded-xl border border-dashed border-default-300 bg-default-50 dark:bg-default-100 text-default-600">
      <div className="flex flex-col h-full">
        <div className="text-xs font-semibold text-default-500">
          {Math.floor(shownIndex / 5) + 1} 队 {(shownIndex % 5) + 1}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <RuleTag rule={rule} />
        </div>
      </div>
    </div>
  );
};

export default EmptySlotCard;
