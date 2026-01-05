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

/**
 * 召唤成员（发送QQ群消息@成员）
 * 仅管理员可用
 * @param {number} guildId - 群组ID
 * @param {object} data - 召唤数据
 * @param {string[]} data.qq_numbers - 要召唤的QQ号列表
 * @param {string} [data.message] - 召唤消息内容（可选，默认"请进组"）
 */
export const callMembers = (guildId, data) => {
  return apiClient.post(`/guilds/${guildId}/call-members`, data);
};
