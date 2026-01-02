import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from '@heroui/react';
import { createBot } from '@/api/bots';
import { showSuccess, showError } from '@/utils/toast.jsx';

export default function CreateBotDialog({ isOpen, onClose, onSuccess, onApiKeyGenerated }) {
  const [formData, setFormData] = useState({
    bot_name: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 重置表单
  const resetForm = () => {
    setFormData({
      bot_name: '',
      description: '',
    });
    setErrors({});
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    if (!formData.bot_name.trim()) {
      newErrors.bot_name = 'Bot名称不能为空';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.bot_name)) {
      newErrors.bot_name = 'Bot名称只能包含字母、数字和下划线';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createBot(formData);
      showSuccess(response.message || 'Bot创建成功');

      // 传递API Key给父组件
      if (onApiKeyGenerated && response.data?.api_key) {
        onApiKeyGenerated(response.data.api_key);
      }

      resetForm();
      onSuccess();
    } catch (error) {
      console.error('创建Bot失败:', error);
      showError(error || '创建Bot失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>创建Bot</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="Bot名称"
              placeholder="例如: qqbot_001"
              value={formData.bot_name}
              onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
              isInvalid={!!errors.bot_name}
              errorMessage={errors.bot_name}
              description="只能包含字母、数字和下划线"
              isRequired
              isDisabled={isSubmitting}
            />

            <Textarea
              label="描述"
              placeholder="Bot的用途说明"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              minRows={3}
              isDisabled={isSubmitting}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={isSubmitting}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
