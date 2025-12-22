/**
 * TeamBoard 组件常量定义
 */

// 默认规则配置
export const fallbackRule = {
  allowRich: false,
  allowXinfaList: [],
};

// 进组状态标签映射
export const presenceLabels = {
  present: "已进组",
  pending: "待确认",
  absent: "缺席",
};

// 进组状态颜色映射
export const presenceColors = {
  present: "success",
  pending: "warning",
  absent: "danger",
};

// 进组状态循环顺序
export const presenceOrder = ["pending", "present", "absent"];
