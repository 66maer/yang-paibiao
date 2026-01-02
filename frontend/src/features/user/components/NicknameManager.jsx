import { useState } from "react";
import { Input, Button, Chip } from "@heroui/react";
import { showToast } from "@/utils/toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";

/**
 * 昵称管理组件
 * 用于添加和删除其他昵称
 * 在用户个人信息和管理员用户管理中使用
 */
export default function NicknameManager({
  nicknames = [],
  onUpdate,
  maxNicknames = 5,
  placeholder = "输入新昵称后回车或点击添加",
}) {
  const [newNickname, setNewNickname] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nicknameToDelete, setNicknameToDelete] = useState(null);

  // 添加昵称
  const handleAdd = async () => {
    // 验证
    if (!newNickname || newNickname.trim() === "") {
      showToast.error("昵称不能为空");
      return;
    }

    if (newNickname.length > 20) {
      showToast.error("昵称最长20个字符");
      return;
    }

    if (nicknames.includes(newNickname.trim())) {
      showToast.error("该昵称已存在");
      return;
    }

    if (nicknames.length >= maxNicknames) {
      showToast.error(`最多添加${maxNicknames}个昵称`);
      return;
    }

    try {
      setIsAdding(true);
      const updatedNicknames = [...nicknames, newNickname.trim()];
      await onUpdate(updatedNicknames);
      setNewNickname("");
      showToast.success("添加成功");
    } catch (error) {
      showToast.error(error.response?.data?.message || "添加失败");
    } finally {
      setIsAdding(false);
    }
  };

  // 打开删除确认对话框
  const handleDeleteClick = (nickname) => {
    setNicknameToDelete(nickname);
    setConfirmOpen(true);
  };

  // 确认删除昵称
  const handleConfirmDelete = async () => {
    try {
      const updatedNicknames = nicknames.filter((n) => n !== nicknameToDelete);
      await onUpdate(updatedNicknames);
      showToast.success("删除成功");
      setConfirmOpen(false);
      setNicknameToDelete(null);
    } catch (error) {
      showToast.error(error.response?.data?.message || "删除失败");
    }
  };

  // 处理回车键
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* 添加昵称输入框 */}
      <div className="flex gap-2">
        <Input
          size="sm"
          placeholder={placeholder}
          value={newNickname}
          onValueChange={setNewNickname}
          onKeyPress={handleKeyPress}
          maxLength={20}
          classNames={{
            input: "text-sm",
          }}
        />
        <Button
          size="sm"
          color="primary"
          variant="flat"
          onPress={handleAdd}
          isLoading={isAdding}
          isDisabled={!newNickname.trim()}
          className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 min-w-[60px]"
        >
          添加
        </Button>
      </div>

      {/* 昵称列表 */}
      {nicknames.length > 0 ? (
        <div className="space-y-1">
          {nicknames.map((nickname, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 group hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-purple-500">•</span>
                <span className="text-sm text-purple-600 dark:text-purple-400">{nickname}</span>
              </div>
              <Button
                size="sm"
                isIconOnly
                variant="light"
                color="danger"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => handleDeleteClick(nickname)}
              >
                ❌
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-default-100 dark:bg-default-50/5 text-center">
          <span className="text-sm text-default-400">暂无其他昵称</span>
        </div>
      )}

      {/* 提示信息 */}
      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          💡 提示：其他用户可以通过这些昵称搜索到你（最多{maxNicknames}个）
        </p>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="删除昵称"
        content={`确定要删除昵称"${nicknameToDelete}"吗？`}
        confirmText="删除"
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
