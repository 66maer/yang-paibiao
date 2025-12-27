import apiClient from "./client";

/**
 * 开团管理 API
 */

/**
 * 创建开团
 * @param {number} guildId - 群组ID
 * @param {object} teamData - 开团数据
 * @returns {Promise}
 */
export const createTeam = (guildId, teamData) => {
  return apiClient.post(`/guilds/${guildId}/teams`, teamData);
};

/**
 * 获取开团列表
 * @param {number} guildId - 群组ID
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
export const getTeamList = (guildId, params = {}) => {
  return apiClient.get(`/guilds/${guildId}/teams`, { params });
};

/**
 * 获取开团详情
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @returns {Promise}
 */
export const getTeamDetail = (guildId, teamId) => {
  return apiClient.get(`/guilds/${guildId}/teams/${teamId}`);
};

/**
 * 更新开团信息
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @param {object} teamData - 开团数据
 * @returns {Promise}
 */
export const updateTeam = (guildId, teamId, teamData) => {
  return apiClient.put(`/guilds/${guildId}/teams/${teamId}`, teamData);
};

/**
 * 关闭开团
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @param {string} status - 关闭状态: 'completed' 或 'cancelled'
 * @returns {Promise}
 */
export const closeTeam = (guildId, teamId, status = 'completed') => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/close`, { status });
};

/**
 * 重新开启已关闭的开团
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @returns {Promise}
 */
export const reopenTeam = (guildId, teamId) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/reopen`);
};

/**
 * 删除开团
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @returns {Promise}
 */
export const deleteTeam = (guildId, teamId) => {
  return apiClient.delete(`/guilds/${guildId}/teams/${teamId}`);
};

/**
 * 获取黑本推荐列表
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @param {number[]} memberUserIds - 团队成员用户ID列表
 * @returns {Promise}
 */
export const getHeibenRecommendations = (guildId, teamId, memberUserIds) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/heibenren-recommendations`, {
    member_user_ids: memberUserIds,
  });
};
