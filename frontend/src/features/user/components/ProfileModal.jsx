import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import useAuthStore from "@/stores/authStore";
import EditNicknameModal from "./EditNicknameModal";
import ChangePasswordModal from "./ChangePasswordModal";
import NicknameManager from "./NicknameManager";
import { updateUserInfo } from "@/api/user";

/**
 * 信息项组件 - 参考 napcat-webui-frontend 的 SystemInfoItem
 */
const InfoItem = ({ title, icon, value = "--", endContent }) => {
  return (
    <div className="flex text-sm gap-2 p-3 items-center shadow-sm shadow-pink-100 dark:shadow-pink-900/50 rounded-lg bg-white/50 dark:bg-gray-800/50">
      {icon && <div className="text-pink-500">{icon}</div>}
      <div className="w-20 text-default-600 font-medium">{title}</div>
      <div className="text-pink-600 dark:text-pink-400 font-semibold flex-1">
        {value}
      </div>
      {endContent && <div className="ml-auto">{endContent}</div>}
    </div>
  );
};

/**
 * 个人信息弹窗
 */
export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateOtherNicknames: updateStoreNicknames } = useAuthStore();
  const [editNicknameOpen, setEditNicknameOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // 更新其他昵称
  const handleUpdateNicknames = async (nicknames) => {
    await updateUserInfo({ other_nicknames: nicknames });
    updateStoreNicknames(nicknames);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              个人信息
            </span>
          </ModalHeader>
          <ModalBody>
            <Tabs
              aria-label="个人信息选项卡"
              variant="underlined"
              color="primary"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0",
                cursor: "w-full bg-gradient-to-r from-pink-500 to-purple-500",
                tab: "max-w-fit px-4 h-12",
                tabContent:
                  "group-data-[selected=true]:text-pink-600 dark:group-data-[selected=true]:text-pink-400",
              }}
            >
              {/* Tab 1: 基本信息 */}
              <Tab key="basic" title="基本信息">
                <div className="flex flex-col gap-4 py-4">
                  {/* 头像区域 */}
                  <div className="flex flex-col items-center gap-3">
                    <Avatar
                      src={user?.avatar}
                      name={user?.nickname?.charAt(0)}
                      className="w-24 h-24 text-large bg-gradient-to-br from-pink-500 to-purple-500"
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      isDisabled
                      color="primary"
                      className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30"
                    >
                      📸 上传头像（敬请期待）
                    </Button>
                  </div>

                  <Divider />

                  {/* 基本信息展示 - 使用 InfoItem */}
                  <div className="space-y-2">
                    <InfoItem
                      title="QQ号"
                      icon="🔢"
                      value={user?.qq_number || "未绑定"}
                    />

                    <InfoItem
                      title="昵称"
                      icon="✨"
                      value={user?.nickname || "--"}
                      endContent={
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => setEditNicknameOpen(true)}
                          className="text-xs"
                        >
                          ✏️ 修改
                        </Button>
                      }
                    />
                  </div>

                  <Divider />

                  {/* 其他昵称管理 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                      其他昵称
                    </h4>
                    <NicknameManager
                      nicknames={user?.other_nicknames || []}
                      onUpdate={handleUpdateNicknames}
                      maxNicknames={5}
                    />
                  </div>
                </div>
              </Tab>

              {/* Tab 2: 账户安全 */}
              <Tab key="security" title="账户安全">
                <div className="flex flex-col gap-4 py-4">
                  <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                    <CardBody className="gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-pink-600 dark:text-pink-400">
                            🔒 修改密码
                          </p>
                          <p className="text-sm text-default-600 mt-1">
                            定期修改密码可以提高账号安全性
                          </p>
                        </div>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => setChangePasswordOpen(true)}
                          className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30"
                        >
                          修改
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ 修改密码后将自动退出登录，需要重新登录
                    </p>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              className="text-pink-600 dark:text-pink-400"
            >
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 子弹窗 */}
      <EditNicknameModal
        isOpen={editNicknameOpen}
        onClose={() => setEditNicknameOpen(false)}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}
