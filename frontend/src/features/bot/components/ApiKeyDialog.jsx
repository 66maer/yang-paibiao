import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';
import { showSuccess } from '@/utils/toast.jsx';

export default function ApiKeyDialog({ isOpen, apiKey, onClose }) {
  const [copied, setCopied] = useState(false);

  // 复制API Key
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      showSuccess('API Key已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>API Key</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ 请妥善保管API Key，它只会显示一次！关闭此窗口后将无法再次查看。
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">API Key:</p>
              <Textarea
                value={apiKey}
                isReadOnly
                minRows={3}
                classNames={{
                  input: 'font-mono text-sm',
                }}
              />
            </div>

            <p className="text-xs text-gray-500">
              在机器人程序中使用此API Key，通过X-API-Key请求头发送。
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            variant="flat"
            onPress={handleCopy}
          >
            {copied ? '✓ 已复制' : '📋 复制'}
          </Button>
          <Button color="primary" onPress={onClose}>
            我已保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
