// 红黑榜 API
import apiClient from "./client";

/**
 * 获取群组红黑榜
 */
export const getGuildRanking = (guildId) => {
  return apiClient.get(`/guilds/${guildId}/ranking`);
};
