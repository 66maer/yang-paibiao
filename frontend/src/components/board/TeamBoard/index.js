/**
 * TeamBoard 团队面板组件
 * 统一导出入口
 */

// 主组件
export { default } from "./TeamBoard";
export { default as TeamBoard } from "./TeamBoard";

// 坑位卡片组件
export { default as SlotCard, EmptySlotCard, FilledSlotCard, EditableOverlay } from "./SlotCard";

// 弹窗组件
export { RuleEditorModal, AssignModal } from "./Modals";

// 悬浮提示组件
export { RuleTooltip, SignupTooltip } from "./Tooltips";

// 标签组件
export { RuleTag, PresenceBadge } from "./Badges";

// 工具函数
export * from "./utils";

// 常量
export * from "./constants";
