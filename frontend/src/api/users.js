// 用户管理 API
import apiClient from "./client";

/**
 * 获取用户列表（管理员）
 */
export const getUserList = async (params = {}) => {
  const response = await apiClient.get("/admin/users", { params });
  return response;
};

/**
 * 获取用户详情（管理员）
 */
export const getUserDetail = (userId) => {
  return apiClient.get(`/admin/users/${userId}`);
};

/**
 * 更新用户信息（管理员）
 */
export const updateUser = (userId, data) => {
  return apiClient.put(`/admin/users/${userId}`, data);
};

/**
 * 删除用户（管理员）
 */
export const deleteUser = (userId) => {
  return apiClient.delete(`/admin/users/${userId}`);
};

/**
 * 重置用户密码（管理员）
 */
export const resetUserPassword = (userId) => {
  return apiClient.post(`/admin/users/${userId}/reset-password`);
};

/**
 * 用户注册
 */
export const registerUser = (data) => {
  return apiClient.post("/api/v2/users/register", data);
};

/**
 * 用户登录
 */
export const userLogin = (data) => {
  return apiClient.post("/api/v2/users/login", data);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return apiClient.get("/api/v2/users/me");
};

/**
 * 更新当前用户信息
 */
export const updateCurrentUser = (data) => {
  return apiClient.put("/api/v2/users/me", data);
};

/**
 * 修改密码
 */
export const changePassword = (data) => {
  return apiClient.post("/api/v2/users/me/change-password", data);
};
