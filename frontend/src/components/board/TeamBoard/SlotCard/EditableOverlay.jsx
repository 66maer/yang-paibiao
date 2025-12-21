import { Button } from "@heroui/react";
import { TrashIcon } from "../../../icons";

/**
 * 编辑层覆盖组件
 * 根据模式显示不同的按钮组
 * - assign: 指定报名模式（指定/修改 + 删除按钮）
 * - mark: 进组标记模式（进组/鸽子/召唤/清除按钮）
 */
const EditableOverlay = ({
  mode,
  signup,
  onAssignClick,
  onAssignDelete,
  onPresenceChange,
  onSummon,
}) => {
  // 指定报名模式
  if (mode === "assign") {
    return (
      <div className="absolute inset-0 rounded-xl bg-black/10 flex items-end justify-center p-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 指定/修改按钮 - 始终居中 */}
          <Button
            size="sm"
            color="primary"
            variant="solid"
            onPress={onAssignClick}
          >
            {signup ? "修改" : "指定"}
          </Button>

          {/* 删除按钮 - 仅在有报名信息时显示 */}
          {signup && (
            <Button
              size="sm"
              color="danger"
              variant="light"
              isIconOnly
              onPress={onAssignDelete}
            >
              <TrashIcon size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 进组标记模式
  if (mode === "mark") {
    return (
      <div className="absolute inset-0 rounded-xl flex items-end justify-center p-2 pointer-events-none">
        <div className="flex pointer-events-auto" style={{ maxWidth: "90%" }}>
          {/* 进组按钮 */}
          <Button
            size="sm"
            color="success"
            variant="solid"
            onPress={() => onPresenceChange?.("present")}
            className="rounded-r-none min-w-0 px-2"
          >
            进组
          </Button>

          {/* 鸽子按钮 */}
          <Button
            size="sm"
            color="danger"
            variant="solid"
            onPress={() => onPresenceChange?.("absent")}
            className="rounded-none min-w-0 px-2"
          >
            鸽子
          </Button>

          {/* 召唤按钮 */}
          <Button
            size="sm"
            color="primary"
            variant="solid"
            onPress={onSummon}
            className="rounded-none min-w-0 px-2"
          >
            召唤
          </Button>

          {/* 清除按钮 */}
          <Button
            size="sm"
            color="default"
            variant="flat"
            onPress={() => onPresenceChange?.("pending")}
            className="rounded-l-none min-w-0 px-2"
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
