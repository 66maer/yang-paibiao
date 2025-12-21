import { Chip } from "@heroui/react";
import { presenceLabels, presenceColors } from "../constants";

/**
 * 进组状态标记组件
 * 显示团员的进组状态（已进组/待确认/缺席）
 */
const PresenceBadge = ({ status }) => {
  if (!status) return null;

  const label = presenceLabels[status] || "待确认";
  const color = presenceColors[status] || "warning";

  return (
    <Chip size="sm" color={color} variant="flat">
      {label}
    </Chip>
  );
};

export default PresenceBadge;
