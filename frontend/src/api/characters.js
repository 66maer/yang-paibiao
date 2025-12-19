// 角色管理 API
import apiClient from "./client";

/**
 * 创建角色
 */
export const createCharacter = (data) => {
  return apiClient.post("/api/v2/characters", data);
};

/**
 * 获取我的角色列表
 */
export const getMyCharacters = async (params = {}) => {
  const response = await apiClient.get("/api/v2/characters/my", { params });
  return response.data;
};

/**
 * 获取所有角色列表（管理员）
 */
export const getAllCharacters = async (params = {}) => {
  const response = await apiClient.get("/admin/characters", { params });
  return response.data;
};

/**
 * 获取角色详情
 */
export const getCharacterDetail = (characterId) => {
  return apiClient.get(`/admin/characters/${characterId}`);
};

/**
 * 更新角色信息
 */
export const updateCharacter = (characterId, data) => {
  return apiClient.put(`/admin/characters/${characterId}`, data);
};

/**
 * 删除角色
 */
export const deleteCharacter = (characterId) => {
  return apiClient.delete(`/admin/characters/${characterId}`);
};

/**
 * 添加角色玩家关联（管理员）
 */
export const addCharacterPlayer = (characterId, data) => {
  return apiClient.post(`/admin/characters/${characterId}/players`, data);
};

/**
 * 移除角色玩家关联（管理员）
 */
export const removeCharacterPlayer = (characterId, userId) => {
  return apiClient.delete(`/admin/characters/${characterId}/players/${userId}`);
};
