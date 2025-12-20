import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Chip,
} from "@heroui/react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/authStore";
import { switchGuild } from "../../api/user";
import EditGuildNicknameModal from "./EditGuildNicknameModal";
import GuildInfoModal from "./GuildInfoModal";

/**
 * 群组切换器组件
 */
export default function GuildSwitcher() {
  const { user, setCurrentGuild } = useAuthStore();
  const navigate = useNavigate();
  const [editGuildNicknameOpen, setEditGuildNicknameOpen] = useState(false);
  const [guildInfoOpen, setGuildInfoOpen] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前群组
  const currentGuild = user?.guilds?.find(
    (g) => g.id === user?.current_guild_id
  );

  // 获取角色标签颜色
  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "warning"; // 金色
      case "helper":
        return "primary"; // 蓝色
      case "member":
        return "success"; // 绿色
      default:
        return "default";
    }
  };

  // 获取角色标签文字
  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "群主";
      case "helper":
        return "管理员";
      case "member":
        return "群员";
      default:
        return "未知";
    }
  };

  // 切换群组
  const handleSwitchGuild = async (guildId) => {
    if (guildId === user?.current_guild_id) {
      toast.error("已经在当前群组了");
      return;
    }

    try {
      setIsLoading(true);
      await switchGuild(guildId);
      setCurrentGuild(guildId);
      localStorage.setItem("selectedGuildId", String(guildId));

      const newGuild = user?.guilds?.find((g) => g.id === guildId);
      toast.success(`已切换到 ${newGuild?.name}`);

      // 刷新页面以更新权限相关的内容
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "切换群组失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 打开群组信息弹窗
  const handleViewGuildInfo = () => {
    setSelectedGuild(currentGuild);
    setGuildInfoOpen(true);
  };

  // 打开修改群昵称弹窗
  const handleEditGuildNickname = () => {
    setSelectedGuild(currentGuild);
    setEditGuildNicknameOpen(true);
  };

  if (!currentGuild) {
    return (
      <Button variant="bordered" size="sm" isDisabled>
        未加入群组
      </Button>
    );
  }

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            variant="bordered"
            size="sm"
            className="gap-2 min-w-[160px] border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/30"
            isLoading={isLoading}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                {currentGuild.name}
              </span>
              <span className="text-xs text-default-500">
                {currentGuild.guild_nickname}
              </span>
            </div>
            <span className="text-pink-400">▼</span>
          </Button>
        </DropdownTrigger>

        <DropdownMenu aria-label="群组操作" className="min-w-[250px]">
          {/* 当前群组信息 */}
          <DropdownSection
            title="当前群组"
            showDivider
            classNames={{
              heading:
                "text-pink-600 dark:text-pink-400 text-xs font-semibold",
            }}
          >
            <DropdownItem
              key="current-guild-info"
              isReadOnly
              className="cursor-default opacity-100 hover:bg-transparent"
            >
              <div className="flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-default-500">群组：</span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {currentGuild.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-default-500">群昵称：</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {currentGuild.guild_nickname}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-default-500">权限：</span>
                  <Chip
                    size="sm"
                    color={getRoleColor(currentGuild.role)}
                    variant="flat"
                  >
                    {getRoleLabel(currentGuild.role)}
                  </Chip>
                </div>
              </div>
            </DropdownItem>
            <DropdownItem
              key="view-guild-info"
              onPress={handleViewGuildInfo}
              className="text-pink-600 dark:text-pink-400"
            >
              ℹ️ 查看群组信息
            </DropdownItem>
            <DropdownItem
              key="edit-guild-nickname"
              onPress={handleEditGuildNickname}
              className="text-purple-600 dark:text-purple-400"
            >
              ✏️ 修改群昵称
            </DropdownItem>
          </DropdownSection>

          {/* 切换群组列表 */}
          {user?.guilds && user.guilds.length > 1 && (
            <DropdownSection
              title="切换群组"
              classNames={{
                heading:
                  "text-purple-600 dark:text-purple-400 text-xs font-semibold",
              }}
            >
              <DropdownItem
                key="open-guild-hub"
                className="text-pink-600 dark:text-pink-400"
                onPress={() => navigate('/user/guilds')}
              >
                🗂️ 打开群组选择页
              </DropdownItem>
              {user.guilds
                .filter((guild) => guild.id !== currentGuild.id)
                .map((guild) => (
                  <DropdownItem
                    key={guild.id}
                    onPress={() => handleSwitchGuild(guild.id)}
                  >
                    <div className="flex items-center justify-between py-1">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {guild.name}
                        </span>
                        <span className="text-xs text-default-500">
                          {guild.guild_nickname}
                        </span>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getRoleColor(guild.role)}
                      >
                        {getRoleLabel(guild.role)}
                      </Chip>
                    </div>
                  </DropdownItem>
                ))}
            </DropdownSection>
          )}
        </DropdownMenu>
      </Dropdown>

      {/* 群组信息弹窗 */}
      <GuildInfoModal
        isOpen={guildInfoOpen}
        onClose={() => setGuildInfoOpen(false)}
        guild={selectedGuild}
      />

      {/* 修改群昵称弹窗 */}
      <EditGuildNicknameModal
        isOpen={editGuildNicknameOpen}
        onClose={() => setEditGuildNicknameOpen(false)}
        guild={selectedGuild}
      />
    </>
  );
}
