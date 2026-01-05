// 每周记录 API
import apiClient from "./client";

/**
 * 获取每周记录矩阵数据
 * @param {string} weekStart - 周起始日期 (YYYY-MM-DD)
 */
export const getWeeklyMatrix = async (weekStart = null) => {
  const params = weekStart ? { week_start: weekStart } : {};
  const response = await apiClient.get("/users/me/weekly-records/matrix", { params });
  return response.data;
};

/**
 * 获取可选周列表
 * @param {number} limit - 返回周数
 */
export const getWeekList = async (limit = 12) => {
  const response = await apiClient.get("/users/me/weekly-records/weeks", { params: { limit } });
  return response.data;
};

/**
 * 获取周列配置
 * @param {string} weekStart - 周起始日期
 */
export const getWeeklyColumns = async (weekStart = null) => {
  const params = weekStart ? { week_start: weekStart } : {};
  const response = await apiClient.get("/users/me/weekly-records/columns", { params });
  return response.data;
};

/**
 * 更新周列配置（仅当前周可用）
 * @param {Array} columns - 列配置列表
 */
export const updateWeeklyColumns = async (columns) => {
  const response = await apiClient.put("/users/me/weekly-records/columns", { columns });
  return response.data;
};

/**
 * 创建每周记录
 * @param {Object} data - { character_id, dungeon_name, is_cleared, gold_amount }
 * @param {string} weekStart - 周起始日期
 */
export const createWeeklyRecord = async (data, weekStart = null) => {
  const params = weekStart ? { week_start: weekStart } : {};
  const response = await apiClient.post("/users/me/weekly-records", data, { params });
  return response.data;
};

/**
 * 更新每周记录单元格
 * @param {number} recordId - 记录ID
 * @param {Object} data - { is_cleared, gold_amount }
 */
export const updateWeeklyRecord = async (recordId, data) => {
  const response = await apiClient.put(`/users/me/weekly-records/${recordId}`, data);
  return response.data;
};

/**
 * 删除每周记录
 * @param {number} recordId - 记录ID
 */
export const deleteWeeklyRecord = async (recordId) => {
  const response = await apiClient.delete(`/users/me/weekly-records/${recordId}`);
  return response.data;
};

/**
 * 获取指定用户所有角色的本周CD状态
 * @param {number} userId - 用户ID
 * @param {string} dungeon - 可选，筛选副本名称
 * @returns {Object} {character_id: {dungeon_name: is_cleared}}
 */
export const getUserCdStatus = async (userId, dungeon = null) => {
  const params = dungeon ? { dungeon } : {};
  const response = await apiClient.get(`/users/me/weekly-records/cd-status/${userId}`, { params });
  return response.data;
};
