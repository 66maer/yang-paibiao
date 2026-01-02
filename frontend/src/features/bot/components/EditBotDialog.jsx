import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Switch,
} from '@heroui/react';
import { updateBot } from '@/api/bots';
import { showSuccess, showError } from '@/utils/toast.jsx';

export default function EditBotDialog({ isOpen, bot, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当bot改变时更新表单
  useEffect(() => {
    if (bot) {
      setFormData({
        description: bot.description || '',
        is_active: bot.is_active,
      });
    }
  }, [bot]);

  // 处理提交
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateBot(bot.id, formData);
      showSuccess('Bot更新成功');
      onSuccess();
    } catch (error) {
      console.error('更新Bot失败:', error);
      showError(error || '更新Bot失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>编辑Bot: {bot?.bot_name}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Textarea
              label="描述"
              placeholder="Bot的用途说明"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              minRows={3}
              isDisabled={isSubmitting}
            />

            <div className="flex items-center gap-2">
              <Switch
                isSelected={formData.is_active}
                onValueChange={(checked) => setFormData({ ...formData, is_active: checked })}
                isDisabled={isSubmitting}
              >
                激活状态
              </Switch>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
