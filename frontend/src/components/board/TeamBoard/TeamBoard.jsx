import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { Reorder } from "framer-motion";
import { allocateSlots, buildEmptyRules } from "../../../utils/slotAllocation";
import SlotCard from "./SlotCard";
import { buildSlots, getSignupKey } from "./utils";

/**
 * 团队面板组件
 * 5x5 团队面板，展示 25 个坑位的报名情况
 *
 * Props:
 * @param {Array} rules - 坑位规则数组（长度为 25）
 * @param {Array} signupList - 报名列表
 * @param {Array} view - 视图排序信息（报名 ID 与坑位的对应关系）
 * @param {string} mode - 模式（view/edit/drag/mark）
 * @param {boolean} isAdmin - 是否管理员
 * @param {Function} onRuleChange - 规则变化回调 (slotIndex, newRule)
 * @param {Function} onAssign - 团长指定回调 (slotIndex, assignData)
 * @param {Function} onPresenceChange - 进组状态变化回调 (slotIndex, newStatus)
 * @param {Function} onReorder - 重排序回调 (mapping: [{ slotIndex, signupId }])
 * @param {Function} onSlotClick - 坑位点击回调 (slotIndex, signup)
 *
 * 模式说明：
 * - view: 查看模式（默认）
 * - edit: 编辑模式（可编辑规则、指定成员）
 * - drag: 拖动模式（可拖动排序）
 * - mark: 标记模式（可标记进组/缺席）
 */
const TeamBoard = ({
  rules = buildEmptyRules(),
  signupList = [],
  view = [],
  mode = "view",
  isAdmin = false,
  onRuleChange,
  onAssign,
  onPresenceChange,
  onReorder,
  onSlotClick,
}) => {
  // 分配坑位
  const { slots } = useMemo(
    () => allocateSlots(rules, signupList, view),
    [rules, signupList, view]
  );

  // 构建带索引的坑位数组
  const [orderedSlots, setOrderedSlots] = useState(() => buildSlots(slots, rules));

  // 同步坑位变化
  useEffect(() => {
    setOrderedSlots(buildSlots(slots, rules));
  }, [slots, rules]);

  // 是否启用拖动
  const dragEnabled = isAdmin && mode === "drag";

  /**
   * 处理拖动重排序
   */
  const handleReorder = (items) => {
    setOrderedSlots(items);
    if (onReorder) {
      const mapping = items
        .map((item, idx) => ({
          slotIndex: idx,
          signupId: getSignupKey(item.signup),
        }))
        .filter((row) => row.signupId != null);
      onReorder(mapping);
    }
  };

  /**
   * 渲染网格布局（非拖动模式）
   */
  const renderGrid = (items) => (
    <div className="grid grid-cols-5 gap-3">
      {items.map((slot) => (
        <SlotCard
          key={slot.slotIndex}
          slotIndex={slot.slotIndex}
          rule={slot.rule}
          signup={slot.signup}
          mode={mode}
          isAdmin={isAdmin}
          draggable={dragEnabled}
          onRuleChange={onRuleChange}
          onAssign={onAssign}
          onPresenceChange={onPresenceChange}
          onSlotClick={onSlotClick}
        />
      ))}
    </div>
  );

  /**
   * 渲染拖动布局（拖动模式）
   */
  const renderDragGrid = (items) => (
    <Reorder.Group axis="xy" values={items} onReorder={handleReorder} className="grid grid-cols-5 gap-3">
      {items.map((slot) => (
        <Reorder.Item
          key={slot.slotIndex}
          value={slot}
          className="h-full"
          dragListener={dragEnabled}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <SlotCard
            slotIndex={slot.slotIndex}
            rule={slot.rule}
            signup={slot.signup}
            mode={mode}
            isAdmin={isAdmin}
            draggable={dragEnabled}
            onRuleChange={onRuleChange}
            onAssign={onAssign}
            onPresenceChange={onPresenceChange}
            onSlotClick={onSlotClick}
          />
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );

  return (
    <Card className="w-full">
      {/* 头部 */}
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-pink-600 dark:text-pink-400">团队面板</span>
          <Chip size="sm" variant="flat" color="secondary">
            5 x 5
          </Chip>
          {dragEnabled && (
            <Chip size="sm" color="warning" variant="flat">
              拖动以重排坑位
            </Chip>
          )}
          {mode === "mark" && (
            <Chip size="sm" color="success" variant="flat">
              标记进组 / 缺席
            </Chip>
          )}
        </div>
        <div className="flex gap-1 text-xs text-default-500">
          <Chip size="sm" variant="bordered">
            左键点击查看详情
          </Chip>
          {isAdmin && <Chip size="sm" variant="bordered">悬停显示编辑</Chip>}
        </div>
      </CardHeader>

      <Divider />

      {/* 主体 */}
      <CardBody>{dragEnabled ? renderDragGrid(orderedSlots) : renderGrid(orderedSlots)}</CardBody>
    </Card>
  );
};

export default TeamBoard;
