import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Spinner,
} from '@heroui/react';
import { getGuildList } from '@/api/guilds';
import { authorizeGuild } from '@/api/bots';
import { showSuccess, showError } from '@/utils/toast.jsx';

export default function AuthorizeGuildDialog({ isOpen, botId, onClose, onSuccess }) {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载群组列表
  const loadGuilds = async () => {
    setIsLoading(true);
    try {
      const response = await getGuildList({ page: 1, page_size: 100 }); // 获取前100个群组
      setGuilds(response.items || []);
    } catch (error) {
      console.error('加载群组列表失败:', error);
      showError('加载群组列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGuilds();
      setSelectedGuildId('');
    }
  }, [isOpen]);

  // 处理提交
  const handleSubmit = async () => {
    if (!selectedGuildId) {
      showError('请选择群组');
      return;
    }

    setIsSubmitting(true);
    try {
      await authorizeGuild(botId, parseInt(selectedGuildId));
      showSuccess('授权成功');
      onSuccess();
    } catch (error) {
      console.error('授权失败:', error);
      showError(error || '授权失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>授权群组</ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <Select
              label="选择群组"
              placeholder="请选择要授权的群组"
              selectedKeys={selectedGuildId ? [selectedGuildId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedGuildId(selected || '');
              }}
              isDisabled={isSubmitting}
            >
              {guilds.map((guild) => (
                <SelectItem
                  key={guild.id.toString()}
                  textValue={`${guild.name} (ID: ${guild.id})`}
                >
                  {guild.name} (ID: {guild.id})
                </SelectItem>
              ))}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!selectedGuildId}
          >
            授权
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
