import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

/**
 * 确认对话框组件
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title = "确认",
  content,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  confirmColor = "primary",
  isLoading = false,
}) {
  const handleConfirm = () => {
    onConfirm?.();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        <ModalBody>
          {typeof content === "string" ? (
            <p className="text-default-700">{content}</p>
          ) : (
            content
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            color={confirmColor}
            onPress={handleConfirm}
            isLoading={isLoading}
            className={
              confirmColor === "primary"
                ? "bg-gradient-to-r from-pink-500 to-purple-500"
                : ""
            }
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
