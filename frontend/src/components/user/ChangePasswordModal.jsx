import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { changePassword } from "../../api/user";

/**
 * 修改密码弹窗
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const { oldPassword, newPassword, confirmPassword } = formData;

    // 验证
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("请填写完整信息");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("新密码长度至少6位");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次密码输入不一致");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("新密码不能与旧密码相同");
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(oldPassword, newPassword);
      toast.success("密码修改成功，请重新登录");

      // 清除认证信息
      clearAuth();

      // 延迟跳转到登录页
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "密码修改失败");
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        <ModalHeader className="flex flex-col gap-1">修改密码</ModalHeader>
        <ModalBody>
          <Input
            label="当前密码"
            type="password"
            placeholder="请输入当前密码"
            value={formData.oldPassword}
            onValueChange={(value) => handleChange("oldPassword", value)}
            classNames={{
              label: "text-pink-600 dark:text-pink-400",
              input: "text-pink-900 dark:text-pink-100",
            }}
          />
          <Input
            label="新密码"
            type="password"
            placeholder="请输入新密码（至少6位）"
            value={formData.newPassword}
            onValueChange={(value) => handleChange("newPassword", value)}
            classNames={{
              label: "text-pink-600 dark:text-pink-400",
              input: "text-pink-900 dark:text-pink-100",
            }}
          />
          <Input
            label="确认新密码"
            type="password"
            placeholder="请再次输入新密码"
            value={formData.confirmPassword}
            onValueChange={(value) => handleChange("confirmPassword", value)}
            classNames={{
              label: "text-pink-600 dark:text-pink-400",
              input: "text-pink-900 dark:text-pink-100",
            }}
          />
          <p className="text-xs text-warning">
            ⚠️ 修改密码后将自动退出登录，需要重新登录
          </p>
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
