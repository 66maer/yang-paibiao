// 群组配置 API
import apiClient from "./client";

/**
 * 获取当前群组的副本选项配置
 * @param {string} type - 可选，过滤副本类型（primary/secondary）
 */
export const getGuildDungeonOptions = async (type = null) => {
  const params = type ? { type } : {};
  const response = await apiClient.get("/guild-configs/dungeons", { params });
  return response;
};

/**
 * 更新当前群组的副本选项配置
 * @param {Array} options - 副本选项列表
 */
export const updateGuildDungeonOptions = async (options) => {
  const response = await apiClient.put("/guild-configs/dungeons", {
    dungeon_options: options,
  });
  return response;
};

/**
 * 获取当前群组指定副本的赛季修正系数列表
 */
export const getGuildSeasonCorrections = (dungeon) => {
  return apiClient.get(`/guild-configs/seasons/${dungeon}`);
};

/**
 * 创建当前群组的赛季修正系数
 */
export const createGuildSeasonCorrection = (data) => {
  return apiClient.post("/guild-configs/seasons", data);
};

/**
 * 更新当前群组的赛季修正系数
 */
export const updateGuildSeasonCorrection = (factorId, data) => {
  return apiClient.put(`/guild-configs/seasons/${factorId}`, data);
};

/**
 * 删除当前群组的赛季修正系数
 */
export const deleteGuildSeasonCorrection = (factorId) => {
  return apiClient.delete(`/guild-configs/seasons/${factorId}`);
};

/**
 * 获取当前群组的快捷开团选项配置
 */
export const getGuildQuickTeamOptions = async () => {
  const response = await apiClient.get("/guild-configs/quick-team");
  return response;
};

/**
 * 更新当前群组的快捷开团选项配置
 * @param {Array} options - 快捷开团选项列表
 */
export const updateGuildQuickTeamOptions = async (options) => {
  const response = await apiClient.put("/guild-configs/quick-team", {
    quick_team_options: options,
  });
  return response;
};
