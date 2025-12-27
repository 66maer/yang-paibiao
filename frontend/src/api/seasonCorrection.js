// 赛季修正系数 API
import apiClient from "./client";

/**
 * 获取指定副本的赛季修正系数列表
 */
export const getSeasonCorrections = (dungeon) => {
  return apiClient.get(`/admin/season-corrections/seasons/${dungeon}`);
};

/**
 * 创建赛季修正系数
 */
export const createSeasonCorrection = (data) => {
  return apiClient.post("/admin/season-corrections/seasons", data);
};

/**
 * 更新赛季修正系数
 */
export const updateSeasonCorrection = (factorId, data) => {
  return apiClient.put(`/admin/season-corrections/seasons/${factorId}`, data);
};

/**
 * 删除赛季修正系数
 */
export const deleteSeasonCorrection = (factorId) => {
  return apiClient.delete(`/admin/season-corrections/seasons/${factorId}`);
};
