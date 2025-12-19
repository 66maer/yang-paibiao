import apiClient from "./client";

/**
 * 管理员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise} 包含 access_token 和 token_type 的对象
 */
export const adminLogin = async (username, password) => {
  return apiClient.post("/auth/admin/login", {
    username,
    password,
  });
};

/**
 * 获取当前管理员信息
 * @returns {Promise} 管理员信息对象
 */
export const getAdminInfo = async () => {
  return apiClient.get("/auth/admin/me");
};
