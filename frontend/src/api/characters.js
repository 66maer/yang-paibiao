// 角色管理 API
import apiClient from "./client";

/**
 * 创建角色
 */
export const createCharacter = (data) => {
  return apiClient.post("/characters", data);
};

/**
 * 获取我的角色列表
 */
export const getMyCharacters = async (params = {}) => {
  const response = await apiClient.get("/characters/my", { params });
  return response.data;
};

/**
 * 获取指定用户的角色列表
 */
export const getUserCharacters = async (userId, params = {}) => {
  const response = await apiClient.get(`/characters/user/${userId}`, { params });
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
 * 获取角色详情（用户接口）
 */
export const getCharacterDetail = (characterId) => {
  return apiClient.get(`/characters/${characterId}`);
};

/**
 * 更新角色信息（用户接口，所有关联用户都可以编辑）
 */
export const updateCharacter = (characterId, data) => {
  return apiClient.put(`/characters/${characterId}`, data);
};

/**
 * 删除角色关联（删除当前用户与角色的关联）
 */
export const removeCharacterRelation = (characterId) => {
  return apiClient.delete(`/characters/${characterId}`);
};

/**
 * 更新角色关系类型（owner/shared）
 */
export const updateCharacterRelation = (characterId, relationType) => {
  return apiClient.patch(`/characters/${characterId}/relation`, {
    relation_type: relationType,
  });
};

/**
 * 删除角色（管理员接口）
 * @deprecated 使用 removeCharacterRelation 代替
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
