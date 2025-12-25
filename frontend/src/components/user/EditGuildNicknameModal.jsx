import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { showToast } from "../../utils/toast";
import useAuthStore from "../../stores/authStore";
import { updateGuildNickname } from "../../api/user";

/**
 * 修改群昵称弹窗
 */
export default function EditGuildNicknameModal({ isOpen, onClose, guild }) {
  const { updateGuildNickname: updateStoreGuildNickname } = useAuthStore();
  const [guildNickname, setGuildNickname] = useState(guild?.guild_nickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // 验证
    if (!guildNickname || guildNickname.trim() === "") {
      showToast.error("群昵称不能为空");
      return;
    }

    if (guildNickname.length > 20) {
      showToast.error("群昵称最长20个字符");
      return;
    }

    if (guildNickname === guild?.guild_nickname) {
      showToast.error("群昵称未修改");
      return;
    }

    try {
      setIsLoading(true);
      await updateGuildNickname(guild.id, guildNickname.trim());
      updateStoreGuildNickname(guild.id, guildNickname.trim());
      showToast.success("群昵称修改成功");
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || "群昵称修改失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setGuildNickname(guild?.guild_nickname || "");
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
        <ModalHeader className="flex flex-col gap-1">修改群昵称</ModalHeader>
        <ModalBody>
          <div className="mb-2">
            <p className="text-sm text-default-600">
              群组：
              <span className="font-semibold text-pink-600 dark:text-pink-400">{guild?.name}</span>
            </p>
          </div>
          <Input
            label="群昵称"
            placeholder="请输入新的群昵称"
            value={guildNickname}
            onValueChange={setGuildNickname}
            maxLength={20}
            description="此昵称仅在当前群组内显示"
            classNames={{
              label: "text-pink-600 dark:text-pink-400",
              input: "text-pink-900 dark:text-pink-100",
            }}
          />
          <p className="text-xs text-default-500">当前群昵称：{guild?.guild_nickname || "未设置"}</p>
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
