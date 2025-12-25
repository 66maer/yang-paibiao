import { Button } from "@heroui/react";
import { TrashIcon } from "../../../icons";

/**
 * 编辑层覆盖组件
 * 根据模式显示不同的按钮组
 * - assign: 指定报名模式（右上角删除按钮）
 * - mark: 进组标记模式（进组/鸽子/召唤/清除按钮）
 */
const EditableOverlay = ({
  mode,
  signup,
  onAssignDelete,
  onPresenceChange,
  onSummon,
}) => {
  // 指定报名模式
  if (mode === "assign") {
    return (
      <>
        {/* 删除按钮 - 仅在有报名信息时在右上角显示，带浅色背景衬底 */}
        {signup && (
          <div className="absolute top-2 right-2 z-10 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
                onAssignDelete();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white/95 backdrop-blur-sm transition-all hover:scale-110 shadow-sm"
              aria-label="删除报名"
            >
              <TrashIcon size={16} className="text-danger" />
            </button>
          </div>
        )}
      </>
    );
  }

  // 进组标记模式
  if (mode === "mark") {
    return (
      <div className="absolute inset-0 rounded-xl flex items-end justify-center p-2 pointer-events-none">
        <div className="flex pointer-events-auto gap-1" style={{ maxWidth: "90%" }}>
          {/* 就绪按钮 */}
          <Button
            size="sm"
            color="success"
            variant="solid"
            onPress={() => onPresenceChange?.("ready")}
            className="min-w-0 px-3"
          >
            就绪
          </Button>

          {/* 鸽子按钮 */}
          <Button
            size="sm"
            color="danger"
            variant="solid"
            onPress={() => onPresenceChange?.("absent")}
            className="min-w-0 px-3"
          >
            鸽子
          </Button>

          {/* 清除按钮 */}
          <Button
            size="sm"
            color="default"
            variant="flat"
            onPress={() => onPresenceChange?.(null)}
            className="min-w-0 px-3"
          >
            清除
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default EditableOverlay;
