import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
} from "@heroui/react";

/**
 * 信息项组件 - 与 ProfileModal 保持一致的设计
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
 * 群组信息弹窗
 */
export default function GuildInfoModal({ isOpen, onClose, guild }) {
  if (!guild) return null;

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

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return "未知";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            群组信息
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4 py-2">
            {/* 群组名称 */}
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
              <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400">
                {guild.name}
              </h3>
            </div>

            <Divider />

            {/* 群组信息 */}
            <div className="space-y-2">
              <InfoItem
                title="我的权限"
                icon="👑"
                value={
                  <Chip
                    size="sm"
                    color={getRoleColor(guild.role)}
                    variant="flat"
                  >
                    {getRoleLabel(guild.role)}
                  </Chip>
                }
              />

              <InfoItem
                title="群昵称"
                icon="✨"
                value={guild.guild_nickname || "--"}
              />

              <InfoItem
                title="QQ群号"
                icon="🔢"
                value={guild.qq_group_id || "未绑定"}
              />

              <InfoItem
                title="服务器"
                icon="🖥️"
                value={guild.server_name || "未设置"}
              />

            </div>

            <Divider />

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 text-center">
                <p className="text-xs text-default-600 mb-1">成员数量</p>
                <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                  {guild.member_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-center">
                <p className="text-xs text-default-600 mb-1">角色数量</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {guild.character_count || 0}
                </p>
              </div>
            </div>

            {/* 群组描述 */}
            {guild.description && (
              <>
                <Divider />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                    群组简介
                  </h4>
                  <div className="p-3 rounded-lg bg-default-100 dark:bg-default-50/5">
                    <p className="text-sm text-default-700 whitespace-pre-wrap">
                      {guild.description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 创建时间 */}
            {guild.created_at && (
              <div className="text-center text-xs text-default-400 mt-2">
                创建于 {formatDate(guild.created_at)}
              </div>
            )}
          </div>
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
  );
}
