import apiClient from "./client";

/**
 * 用户注册
 * @param {string} qq_number - QQ号
 * @param {string} password - 密码
 * @param {string} nickname - 昵称
 * @returns {Promise} 用户信息
 */
export const userRegister = async (qq_number, password, nickname) => {
  return apiClient.post("/auth/register", {
    qq_number,
    password,
    nickname,
  });
};

/**
 * 用户登录
 * @param {string} qq_number - QQ号
 * @param {string} password - 密码
 * @returns {Promise} 包含 access_token 和用户信息的对象
 */
export const userLogin = async (qq_number, password) => {
  return apiClient.post("/auth/login", {
    username: qq_number, // 后端使用 username 字段
    password,
  });
};

/**
 * 管理员登录
 * @param {string} username - 管理员用户名
 * @param {string} password - 密码
 * @returns {Promise} 包含 access_token 的对象
 */
export const adminLogin = async (username, password) => {
  return apiClient.post("/admin/auth/login", {
    username,
    password,
  });
};

/**
 * 刷新令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise} 新的 access_token
 */
export const refreshToken = async (refreshToken) => {
  return apiClient.post("/auth/refresh", {
    refresh_token: refreshToken,
  });
};

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息对象
 */
export const getUserInfo = async () => {
  return apiClient.get("/auth/me");
};

/**
 * 获取当前管理员信息
 * @returns {Promise} 管理员信息对象
 */
export const getAdminInfo = async () => {
  return apiClient.get("/admin/auth/me");
};
