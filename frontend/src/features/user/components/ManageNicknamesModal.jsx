import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Chip } from "@heroui/react";
import { showToast } from "@/utils/toast";
import useAuthStore from "@/stores/authStore";
import { updateOtherNicknames } from "@/api/user";

/**
 * 管理多个昵称弹窗
 */
export default function ManageNicknamesModal({ isOpen, onClose }) {
  const { user, updateOtherNicknames: updateStoreNicknames } = useAuthStore();
  const [nicknames, setNicknames] = useState([]);
  const [newNickname, setNewNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    setNicknames(user?.other_nicknames || []);
    setNewNickname("");
  };

  const handleAddNickname = () => {
    const trimmedNickname = newNickname.trim();

    if (!trimmedNickname) {
      showToast.error("昵称不能为空");
      return;
    }

    if (trimmedNickname.length > 20) {
      showToast.error("昵称最长20个字符");
      return;
    }

    if (nicknames.includes(trimmedNickname)) {
      showToast.error("昵称已存在");
      return;
    }

    if (nicknames.length >= 10) {
      showToast.error("最多只能添加10个昵称");
      return;
    }

    setNicknames([...nicknames, trimmedNickname]);
    setNewNickname("");
    showToast.success("昵称已添加");
  };

  const handleRemoveNickname = (nickname) => {
    setNicknames(nicknames.filter((n) => n !== nickname));
    showToast.success("昵称已移除");
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await updateOtherNicknames(nicknames);
      updateStoreNicknames(nicknames);
      showToast.success("昵称列表更新成功");
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || "昵称列表更新失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) handleOpen();
      }}
      placement="center"
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">管理多个昵称</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
              <p className="text-sm text-default-600 mb-2">💡 添加多个昵称可以方便其他人通过不同的名字搜索到你</p>
              <p className="text-xs text-default-500">
                • 最多可添加 10 个昵称
                <br />• 每个昵称最长 20 个字符
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="输入新昵称"
                value={newNickname}
                onValueChange={setNewNickname}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddNickname();
                  }
                }}
                maxLength={20}
                classNames={{
                  input: "text-pink-900 dark:text-pink-100",
                }}
              />
              <Button
                color="primary"
                onPress={handleAddNickname}
                className="bg-gradient-to-r from-pink-500 to-purple-500"
              >
                添加
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                已添加的昵称 ({nicknames.length}/10)
              </p>
              {nicknames.length === 0 ? (
                <div className="p-6 text-center text-default-400 border-2 border-dashed border-default-200 rounded-lg">
                  暂无其他昵称
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nicknames.map((nickname, index) => (
                    <Chip
                      key={index}
                      onClose={() => handleRemoveNickname(nickname)}
                      variant="flat"
                      color="primary"
                      className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30"
                    >
                      {nickname}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
