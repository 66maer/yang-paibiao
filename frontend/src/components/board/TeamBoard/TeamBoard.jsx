import { useEffect, useMemo, useState, useRef } from "react";
import { allocateSlots, buildEmptyRules } from "../../../utils/slotAllocation";
import SlotCard from "./SlotCard";
import { buildSlots } from "./utils";

/**
 * 团队面板组件
 * 5x5 团队面板，展示 25 个坑位的报名情况
 *
 * Props:
 * @param {Array} rules - 坑位规则数组（长度为 25）
 * @param {Array} signupList - 报名列表
 * @param {Array<number>} view - 视觉映射（视觉索引 -> 数据坑位索引）。例如：[1,0,2] 表示 0↔1 交换
 * @param {string} mode - 模式（view/edit/drag/mark），由外部根据权限决定
 * @param {Function} onRuleChange - 规则变化回调 (slotIndex, newRule)
 * @param {Function} onAssign - 团长指定回调 (slotIndex, assignData)
 * @param {Function} onAssignDelete - 团长删除指定回调 (slotIndex)
 * @param {Function} onPresenceChange - 进组状态变化回调 (slotIndex, newStatus)
 * @param {Function} onReorder - 重排序回调 (view: number[]，视觉索引 -> 数据坑位索引)
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
  guildId, // 群组ID（用于AssignModal获取成员列表）
  onRuleChange,
  onAssign,
  onAssignDelete,
  onPresenceChange,
  onReorder,
  onSlotClick,
}) => {
  // 分配坑位
  const { slots } = useMemo(() => allocateSlots(rules, signupList), [rules, signupList]);

  // assign模式：只显示有slot_position的报名（固定坑位），自动分配的不显示
  const displaySlots = useMemo(() => {
    if (mode === 'assign') {
      return slots.map(slot =>
        slot?.isLock ? slot : null
      );
    }
    return slots;
  }, [slots, mode]);

  // 构建带索引的坑位数组
  const [orderedSlots, setOrderedSlots] = useState(() => buildSlots(displaySlots, rules));

  // 同步坑位变化
  useEffect(() => {
    setOrderedSlots(buildSlots(displaySlots, rules));
  }, [displaySlots, rules]);

  // 是否启用拖动
  const dragEnabled = mode === "drag";

  // 规范化视觉映射：返回一个长度等于坑位数量的数组，view[i] = 数据索引
  const buildVisualMapping = (count, raw = []) => {
    // 支持两种输入：
    // 1) 数组形式 [1,0,2,...] 视觉索引 -> 数据索引
    // 2) 键值对象形式 {0:1,1:0} 或 形如 [[0,1],[1,0]] 的数组对（向后兼容）
    const out = Array.from({ length: count }, (_, i) => i);
    if (Array.isArray(raw)) {
      for (let i = 0; i < Math.min(count, raw.length); i++) {
        const v = raw[i];
        if (Number.isInteger(v) && v >= 0 && v < count) out[i] = v;
      }
      return out;
    }
    if (raw && typeof raw === "object") {
      for (const k of Object.keys(raw)) {
        const i = Number(k);
        const v = raw[k];
        if (Number.isInteger(i) && i >= 0 && i < count && Number.isInteger(v) && v >= 0 && v < count) {
          out[i] = v;
        }
      }
      return out;
    }
    return out;
  };

  // 应用视觉映射，仅影响展示顺序与展示文案
  const visualMap = useMemo(() => buildVisualMapping(orderedSlots.length, view), [orderedSlots.length, view]);
  const displayItems = useMemo(
    () => visualMap.map((dataIdx, visualIdx) => ({ ...orderedSlots[dataIdx], visualIndex: visualIdx })),
    [orderedSlots, visualMap]
  );

  // 拖拽状态：被拖动的卡片索引 与 目标卡片索引
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const dragRef = useRef(null);

  /**
   * 处理拖动开始
   */
  const handleDragStart = (visualIdx) => {
    setDraggedIdx(visualIdx);
    dragRef.current = visualIdx;
  };

  /**
   * 处理鼠标进入（目标卡片）
   */
  const handleDragEnter = (visualIdx) => {
    if (draggedIdx !== null && visualIdx !== draggedIdx) {
      setHoverIdx(visualIdx);
    }
  };

  /**
   * 处理鼠标离开
   */
  const handleDragLeave = () => {
    setHoverIdx(null);
  };

  /**
   * 处理放开鼠标：交换两个卡片的 view 映射
   */
  const handleDragEnd = (targetIdx) => {
    if (draggedIdx !== null && targetIdx !== null && draggedIdx !== targetIdx) {
      // 交换 visualMap 中 draggedIdx 和 targetIdx 的值
      const newView = [...visualMap];
      [newView[draggedIdx], newView[targetIdx]] = [newView[targetIdx], newView[draggedIdx]];
      console.log("[Drag] swap", { draggedIdx, targetIdx, newView: newView.slice(0, 10) });
      onReorder?.(newView);
    }
    setDraggedIdx(null);
    setHoverIdx(null);
    dragRef.current = null;
  };

  /**
   * 渲染网格布局（非拖动模式）
   */
  const renderGrid = (items) => (
    <div className="grid grid-rows-5 grid-flow-col gap-y-[5px] gap-x-1">
      {items.map((slot) => (
        <SlotCard
          key={slot.slotIndex}
          slotIndex={slot.slotIndex}
          displayIndex={slot.visualIndex}
          rule={slot.rule}
          signup={slot.signup}
          mode={mode}
          guildId={guildId}
          draggable={dragEnabled}
          onRuleChange={onRuleChange}
          onAssign={onAssign}
          onAssignDelete={onAssignDelete}
          onPresenceChange={onPresenceChange}
          onSlotClick={onSlotClick}
        />
      ))}
    </div>
  );

  /**
   * 渲染拖动布局（拖动模式：两点交换）
   */
  const renderDragGrid = (items) => (
    <div
      className={`grid grid-rows-5 grid-flow-col gap-y-[5px] gap-x-1 relative user-select-none ${
        draggedIdx !== null ? "select-none" : ""
      }`}
      onSelectStart={(e) => e.preventDefault()}
      onMouseLeave={() => {
        // 松开鼠标时如果离开整个容器，重置拖拽状态
        if (draggedIdx !== null) {
          setDraggedIdx(null);
          setHoverIdx(null);
        }
      }}
      style={{
        WebkitUserSelect: draggedIdx !== null ? "none" : "auto",
        MozUserSelect: draggedIdx !== null ? "none" : "auto",
        msUserSelect: draggedIdx !== null ? "none" : "auto",
        userSelect: draggedIdx !== null ? "none" : "auto",
      }}
    >
      {items.map((slot, visualIdx) => (
        <div
          key={slot.slotIndex}
          className={`relative transition-all cursor-grab active:cursor-grabbing pointer-events-auto ${
            draggedIdx === visualIdx ? "opacity-50" : ""
          } ${hoverIdx === visualIdx ? "ring-2 ring-yellow-400" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            handleDragStart(visualIdx);
          }}
          onMouseEnter={() => handleDragEnter(visualIdx)}
          onMouseLeave={handleDragLeave}
          onMouseUp={() => handleDragEnd(visualIdx)}
          draggable={false}
        >
          <SlotCard
            slotIndex={slot.slotIndex}
            displayIndex={slot.visualIndex}
            rule={slot.rule}
            signup={slot.signup}
            mode={mode}
            guildId={guildId}
            draggable={dragEnabled}
            onRuleChange={onRuleChange}
            onAssign={onAssign}
            onAssignDelete={onAssignDelete}
            onPresenceChange={onPresenceChange}
            onSlotClick={onSlotClick}
          />
          {/* 即将被交换的图标 */}
          {hoverIdx === visualIdx && draggedIdx !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <div className="text-white text-2xl">⇄</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return <div className="w-[1140px]">{dragEnabled ? renderDragGrid(displayItems) : renderGrid(displayItems)}</div>;
};

export default TeamBoard;
