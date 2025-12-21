import { Button } from "@heroui/react";

/**
 * 编辑层覆盖组件
 * 在编辑模式下，鼠标悬停时显示编辑按钮
 * - 规则按钮：编辑坑位规则
 * - 指定按钮：团长指定成员
 * - 切换进组状态按钮（仅在 mark 模式下且有报名者时显示）
 */
const EditableOverlay = ({ mode, signup, onRuleClick, onAssignClick, onPresenceClick }) => {
  return (
    <div className="absolute inset-0 rounded-xl bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2 gap-2">
      {/* 规则按钮 */}
      <Button size="sm" color="primary" variant="solid" onPress={onRuleClick}>
        规则
      </Button>

      {/* 指定按钮 */}
      <Button size="sm" color="secondary" variant="flat" onPress={onAssignClick}>
        指定
      </Button>

      {/* 切换进组状态按钮（仅在 mark 模式下且有报名者时显示） */}
      {mode === "mark" && signup && (
        <Button size="sm" color="success" variant="ghost" onPress={onPresenceClick}>
          切换进组状态
        </Button>
      )}
    </div>
  );
};

export default EditableOverlay;
