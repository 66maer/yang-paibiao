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
} from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import EditNicknameModal from "./EditNicknameModal";
import ManageNicknamesModal from "./ManageNicknamesModal";
import ChangePasswordModal from "./ChangePasswordModal";

/**
 * 个人信息弹窗
 */
export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [editNicknameOpen, setEditNicknameOpen] = useState(false);
  const [manageNicknamesOpen, setManageNicknamesOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "未知";
    return new Date(dateString).toLocaleDateString("zh-CN");
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

                  {/* 基本信息展示 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30">
                      <span className="text-sm text-default-600">用户名</span>
                      <span className="font-medium text-pink-600 dark:text-pink-400">
                        {user?.username}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                      <span className="text-sm text-default-600">昵称</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {user?.nickname}
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => setEditNicknameOpen(true)}
                        >
                          ✏️ 修改
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30">
                      <span className="text-sm text-default-600">加入时间</span>
                      <span className="font-medium">
                        {formatDate(user?.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Tab>

              {/* Tab 2: 昵称管理 */}
              <Tab key="nicknames" title="昵称管理">
                <div className="flex flex-col gap-4 py-4">
                  <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                    <CardBody className="gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-pink-600 dark:text-pink-400">
                            管理多个昵称
                          </p>
                          <p className="text-sm text-default-600 mt-1">
                            添加多个昵称可以方便其他人通过不同的名字搜索到你
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {user?.other_nicknames &&
                            user.other_nicknames.length > 0 ? (
                              user.other_nicknames.map((nickname, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800"
                                >
                                  {nickname}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-default-400">
                                暂无其他昵称
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={() => setManageNicknamesOpen(true)}
                          className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30"
                        >
                          管理
                        </Button>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      💡 提示：其他用户可以通过你的昵称和其他昵称来搜索并找到你
                    </p>
                  </div>
                </div>
              </Tab>

              {/* Tab 3: 账号安全 */}
              <Tab key="security" title="账号安全">
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

      <ManageNicknamesModal
        isOpen={manageNicknamesOpen}
        onClose={() => setManageNicknamesOpen(false)}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}
