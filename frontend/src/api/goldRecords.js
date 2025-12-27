import apiClient from "./client";

/**
 * 创建金团记录
 * @param {number} guildId - 群组ID
 * @param {object} recordData - 记录数据
 * @returns {Promise}
 */
export const createGoldRecord = (guildId, recordData) => {
  return apiClient.post(`/guilds/${guildId}/gold-records`, recordData);
};

/**
 * 获取金团记录列表
 * @param {number} guildId - 群组ID
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
export const getGoldRecords = (guildId, params = {}) => {
  return apiClient.get(`/guilds/${guildId}/gold-records`, { params });
};

/**
 * 获取金团记录详情
 * @param {number} guildId - 群组ID
 * @param {number} recordId - 记录ID
 * @returns {Promise}
 */
export const getGoldRecord = (guildId, recordId) => {
  return apiClient.get(`/guilds/${guildId}/gold-records/${recordId}`);
};

/**
 * 通过开团ID获取金团记录
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 开团ID
 * @returns {Promise}
 */
export const getGoldRecordByTeam = (guildId, teamId) => {
  return apiClient.get(`/guilds/${guildId}/teams/${teamId}/gold-record`);
};

/**
 * 更新金团记录
 * @param {number} guildId - 群组ID
 * @param {number} recordId - 记录ID
 * @param {object} recordData - 更新数据
 * @returns {Promise}
 */
export const updateGoldRecord = (guildId, recordId, recordData) => {
  return apiClient.put(`/guilds/${guildId}/gold-records/${recordId}`, recordData);
};

/**
 * 删除金团记录
 * @param {number} guildId - 群组ID
 * @param {number} recordId - 记录ID
 * @returns {Promise}
 */
export const deleteGoldRecord = (guildId, recordId) => {
  return apiClient.delete(`/guilds/${guildId}/gold-records/${recordId}`);
};
