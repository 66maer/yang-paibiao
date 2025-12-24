import useAuthStore from "../stores/authStore";

/**
 * 获取当前选中的群组信息
 * - 从全局 authStore 读取 `user.current_guild_id`
 * - 计算 `currentGuild` 和 `currentRole`
 */
export default function useCurrentGuild() {
  const { user } = useAuthStore();
  const currentGuildId = user?.current_guild_id ?? null;
  const currentGuild = currentGuildId ? user?.guilds?.find((g) => g.id === currentGuildId) ?? null : null;
  const currentRole = currentGuild?.role || null;
  return { currentGuildId, currentGuild, currentRole };
}
