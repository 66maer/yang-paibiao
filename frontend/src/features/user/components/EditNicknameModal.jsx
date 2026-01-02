import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { showToast } from "@/utils/toast";
import useAuthStore from "@/stores/authStore";
import { updateUserInfo } from "@/api/user";
import { validateNickname } from "@/utils/nicknameValidator";

/**
 * 修改用户昵称弹窗
 */
export default function EditNicknameModal({ isOpen, onClose }) {
  const { user, updateUserNickname: updateStoreNickname } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedNickname = nickname.trim();

    // 使用验证器
    const { isValid, errorMessage } = validateNickname(trimmedNickname);
    if (!isValid) {
      showToast.error(errorMessage);
      return;
    }

    if (trimmedNickname === user?.nickname) {
      showToast.error("昵称未修改");
      return;
    }

    try {
      setIsLoading(true);
      await updateUserInfo({ nickname: trimmedNickname });
      updateStoreNickname(trimmedNickname);
      showToast.success("昵称修改成功");
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || "昵称修改失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setNickname(user?.nickname || "");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) handleOpen();
      }}
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">修改昵称</ModalHeader>
        <ModalBody>
          <Input
            label="昵称"
            placeholder="请输入新昵称（最多6个字符）"
            value={nickname}
            onValueChange={setNickname}
            maxLength={6}
            description="昵称将在所有群组通用，只允许中文、英文和数字"
            classNames={{
              label: "text-pink-600 dark:text-pink-400",
              input: "text-pink-900 dark:text-pink-100",
            }}
          />
          <p className="text-xs text-default-500">当前昵称：{user?.nickname || "未设置"}</p>
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
            确认修改
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
