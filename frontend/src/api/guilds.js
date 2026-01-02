// 群组管理 API（管理员）
import apiClient from "./client";

/**
 * 获取群组列表（管理员）
 */
export const getGuildList = async (params = {}) => {
  const response = await apiClient.get("/admin/guilds", { params });
  return response;
};

/**
 * 创建群组（管理员）
 */
export const createGuild = (data) => {
  return apiClient.post("/admin/guilds", data);
};

/**
 * 获取群组详情（管理员）
 */
export const getGuildDetail = (guildId) => {
  return apiClient.get(`/admin/guilds/${guildId}`);
};

/**
 * 更新群组信息（管理员）
 */
export const updateGuild = (guildId, data) => {
  return apiClient.put(`/admin/guilds/${guildId}`, data);
};

/**
 * 删除群组（管理员）
 */
export const deleteGuild = (guildId) => {
  return apiClient.delete(`/admin/guilds/${guildId}`);
};

/**
 * 转让群主（管理员）
 */
export const transferGuildOwner = (guildId, data) => {
  return apiClient.post(`/admin/guilds/${guildId}/transfer`, data);
};
/**
 * 获取群组成员列表（用户）
 * 仅需要当前用户是该群组的成员
 */
export const getGuildMembers = async (guildId, params = {}) => {
  const response = await apiClient.get(`/guilds/${guildId}/members`, { params });
  return response;
};
