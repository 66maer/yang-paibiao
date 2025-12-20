import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Avatar,
} from "@heroui/react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import ProfileModal from "./ProfileModal";

/**
 * 用户菜单组件
 */
export default function UserMenu() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      clearAuth();
      toast.success("已退出登录");
      navigate("/login");
    }
  };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            variant="light"
            className="gap-2 px-2"
            size="sm"
          >
            <Avatar
              src={user?.avatar}
              name={user?.nickname?.charAt(0)}
              size="sm"
              className="bg-gradient-to-br from-pink-500 to-purple-500"
            />
            <span className="hidden md:inline text-pink-600 dark:text-pink-400 font-medium">
              {user?.nickname}
            </span>
          </Button>
        </DropdownTrigger>

        <DropdownMenu aria-label="用户操作" className="min-w-[200px]">
          <DropdownSection
            showDivider
            classNames={{
              heading:
                "text-pink-600 dark:text-pink-400 text-xs font-semibold",
            }}
          >
            <DropdownItem
              key="profile"
              onPress={() => setProfileModalOpen(true)}
              className="text-pink-600 dark:text-pink-400"
            >
              👤 个人信息
            </DropdownItem>
          </DropdownSection>

          <DropdownSection>
            <DropdownItem
              key="logout"
              color="danger"
              onPress={handleLogout}
              className="text-danger"
            >
              🚪 退出登录
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      {/* 个人信息弹窗 */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
