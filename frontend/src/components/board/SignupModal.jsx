import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

/**
 * 报名模态框（空实现）
 */
export default function SignupModal({ isOpen, onClose, team }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800",
        header: "border-b border-pink-200 dark:border-pink-900",
        footer: "border-t border-pink-200 dark:border-pink-900",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                📝 报名开团
              </h2>
              {team && (
                <p className="text-sm text-default-500 font-normal">
                  {team.title || "未命名开团"}
                </p>
              )}
            </ModalHeader>
            <ModalBody>
              <div className="p-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 border-2 border-dashed border-pink-300 dark:border-pink-700">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🚧</div>
                  <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400">
                    功能开发中
                  </h3>
                  <p className="text-default-600">
                    报名功能正在开发中，敬请期待...
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                关闭
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
