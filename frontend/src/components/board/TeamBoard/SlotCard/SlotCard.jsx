import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { motion } from "framer-motion";
import EmptySlotCard from "./EmptySlotCard";
import FilledSlotCard from "./FilledSlotCard";
import EditableOverlay from "./EditableOverlay";
import { RuleEditorModal, AssignModal } from "../Modals";
import { RuleTooltip, SignupTooltip } from "../Tooltips";

/**
 * 坑位卡片组件
 * 根据是否有报名者显示不同的卡片样式
 * - 无报名者：显示 EmptySlotCard（规则卡片）
 * - 有报名者：显示 FilledSlotCard（报名卡片）
 *
 * 支持五种模式：
 * 1. view: 浏览模式（根据报名情况展示，点击显示popover，无按钮）
 * 2. edit-rule: 规则编辑模式（全部展示规则卡片，点击打开编辑弹窗，禁用popover）
 * 3. assign: 指定报名模式（浏览模式+指定/修改/删除按钮）
 * 4. drag: 拖动模式（浏览模式+可拖动，禁用popover）
 * 5. mark: 进组标记模式（浏览模式+进组/鸽子/召唤/清除按钮）
 */
const SlotCard = ({
  slotIndex, // 逻辑数据索引（不受视觉映射影响）
  displayIndex, // 视觉展示索引（受视觉映射影响，用于 n队n 文案）
  rule,
  signup,
  mode = "view",
  guildId, // 群组ID（用于AssignModal获取成员列表）
  onRuleChange,
  onAssign,
  onAssignDelete,
  onPresenceChange,
  onSlotClick,
}) => {
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [presenceStatus, setPresenceStatus] = useState(signup?.presence || "pending");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  /**
   * 处理点击卡片
   */
  const handleCardClick = () => {
    // 规则编辑模式：直接打开规则编辑弹窗
    if (mode === "edit-rule") {
      setRuleModalOpen(true);
      return;
    }

    // 指定报名模式：直接打开指定弹窗
    if (mode === "assign") {
      setAssignModalOpen(true);
      return;
    }

    // 拖动模式：不做任何处理
    if (mode === "drag") {
      return;
    }

    // 其他模式：切换 popover 并触发回调
    setIsPopoverOpen(!isPopoverOpen);
    onSlotClick?.(slotIndex, signup);
  };

  /**
   * 保存规则
   */
  const handleRuleSave = (nextRule) => {
    onRuleChange?.(slotIndex, nextRule);
    setRuleModalOpen(false);
  };

  /**
   * 保存指定
   */
  const handleAssignSave = (assignData) => {
    onAssign?.(slotIndex, assignData);
    setAssignModalOpen(false);
  };

  /**
   * 删除指定
   */
  const handleAssignDelete = () => {
    onAssignDelete?.(slotIndex);
  };

  /**
   * 设置进组状态
   */
  const handlePresenceChange = (status) => {
    setPresenceStatus(status);
    // 传递 signup.id 而不是 slotIndex，因为进组标记针对的是报名而非坑位
    onPresenceChange?.(signup?.id, status);
  };

  /**
   * 召唤功能
   */
  const handleSummon = () => {
    console.log("召唤功能待开发");
  };

  // 渲染卡片内容
  // 规则编辑模式：全部展示规则卡片
  // 其他模式：根据报名情况展示
  const cardBody =
    mode === "edit-rule" ? (
      <EmptySlotCard slotIndex={slotIndex} displayIndex={displayIndex} rule={rule} />
    ) : signup ? (
      <FilledSlotCard signup={signup} presenceStatus={presenceStatus} />
    ) : (
      <EmptySlotCard slotIndex={slotIndex} displayIndex={displayIndex} rule={rule} />
    );

  // 渲染悬浮提示内容
  const popoverContent = signup ? <SignupTooltip signup={signup} rule={rule} /> : <RuleTooltip rule={rule} />;

  // 是否显示 popover（规则编辑模式和拖动模式禁用）
  const showPopover = mode !== "drag" && mode !== "edit-rule";

  // 是否显示编辑层
  // assign模式：总是显示（空白卡片显示"指定"按钮）
  // mark模式：仅在有报名信息时显示
  const showOverlay = mode === "assign" || (mode === "mark" && signup);

  return (
    <div className="relative w-[220px] h-[130px] group">
      {/* 卡片主体 */}
      {showPopover ? (
        <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen} placement="top" showArrow>
          <PopoverTrigger>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative h-full cursor-pointer"
              onClick={handleCardClick}
            >
              {cardBody}

              {/* 编辑层覆盖 */}
              {showOverlay && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <EditableOverlay
                    mode={mode}
                    signup={signup}
                    onAssignDelete={handleAssignDelete}
                    onPresenceChange={handlePresenceChange}
                    onSummon={handleSummon}
                  />
                </div>
              )}
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="min-w-[150px] max-w-[320px]">
            <div className="w-full">{popoverContent}</div>
          </PopoverContent>
        </Popover>
      ) : (
        <motion.div whileHover={{ scale: 1.05 }} className="relative h-full cursor-pointer" onClick={handleCardClick}>
          {cardBody}

          {/* 编辑层覆盖 */}
          {showOverlay && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <EditableOverlay
                mode={mode}
                signup={signup}
                onAssignDelete={handleAssignDelete}
                onPresenceChange={handlePresenceChange}
                onSummon={handleSummon}
              />
            </div>
          )}
        </motion.div>
      )}

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
        guildId={guildId}
      />
    </div>
  );
};

export default SlotCard;
