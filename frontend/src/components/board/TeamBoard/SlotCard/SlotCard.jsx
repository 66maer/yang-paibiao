import { useState } from "react";
import { Tooltip } from "@heroui/react";
import { motion } from "framer-motion";
import EmptySlotCard from "./EmptySlotCard";
import FilledSlotCard from "./FilledSlotCard";
import EditableOverlay from "./EditableOverlay";
import { RuleEditorModal, AssignModal } from "../Modals";
import { RuleTooltip, SignupTooltip } from "../Tooltips";
import { getNextPresenceStatus } from "../utils";
import { presenceOrder } from "../constants";

/**
 * 坑位卡片组件
 * 根据是否有报名者显示不同的卡片样式
 * - 无报名者：显示 EmptySlotCard
 * - 有报名者：显示 FilledSlotCard
 *
 * 支持多种模式：
 * - view: 查看模式（仅展示）
 * - edit: 编辑模式（可编辑规则、指定成员）
 * - drag: 拖动模式（可拖动排序）
 * - mark: 标记模式（可标记进组状态）
 *
 * 功能：
 * - 鼠标悬停显示详细信息悬浮提示
 * - 点击卡片触发 onSlotClick 回调
 * - edit/mark 模式下悬停显示编辑按钮
 * - 支持规则编辑弹窗
 * - 支持团长指定弹窗
 * - 支持切换进组状态
 */
const SlotCard = ({
  slotIndex,
  rule,
  signup,
  mode,
  draggable,
  onRuleChange,
  onAssign,
  onPresenceChange,
  onSlotClick,
}) => {
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // 是否可编辑（编辑或标记模式）
  const isEditable = mode === "edit" || mode === "mark";

  /**
   * 循环切换进组状态
   */
  const cyclePresence = () => {
    if (!onPresenceChange) return;
    const currentStatus = signup?.presence || signup?.status || "pending";
    const nextStatus = getNextPresenceStatus(currentStatus, presenceOrder);
    onPresenceChange(slotIndex, nextStatus);
  };

  /**
   * 保存规则
   */
  const handleRuleSave = (nextRule) => {
    onRuleChange?.(slotIndex, nextRule);
  };

  /**
   * 保存指定
   */
  const handleAssignSave = (assignData) => {
    onAssign?.(slotIndex, assignData);
  };

  // 渲染卡片内容
  const cardBody = signup ? (
    <FilledSlotCard signup={signup} rule={rule} draggable={draggable} />
  ) : (
    <EmptySlotCard slotIndex={slotIndex} rule={rule} />
  );

  // 渲染悬浮提示内容
  const tooltipContent = signup ? (
    <SignupTooltip signup={signup} rule={rule} />
  ) : (
    <RuleTooltip rule={rule} />
  );

  return (
    <div className="relative">
      {/* 卡片主体 */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative h-full"
        onClick={() => onSlotClick?.(slotIndex, signup)}
      >
        <Tooltip content={tooltipContent} delay={150} placement="top">
          {cardBody}
        </Tooltip>

        {/* 编辑层覆盖 */}
        {isEditable && (
          <EditableOverlay
            mode={mode}
            signup={signup}
            onRuleClick={() => setRuleModalOpen(true)}
            onAssignClick={() => setAssignModalOpen(true)}
            onPresenceClick={cyclePresence}
          />
        )}
      </motion.div>

      {/* 规则编辑弹窗 */}
      <RuleEditorModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        rule={rule}
        onSave={handleRuleSave}
      />

      {/* 团长指定弹窗 */}
      <AssignModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultXinfa={signup?.characterXinfa}
        onSave={handleAssignSave}
      />
    </div>
  );
};

export default SlotCard;
