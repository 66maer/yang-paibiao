/**
 * 用户相关 API（当前登录用户）
 * 区别于 users.js（管理员的用户管理接口）
 */
import apiClient from "./client";

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  return await apiClient.get("/auth/me");
};

/**
 * 获取用户所属的所有群组
 */
export const getUserGuilds = async () => {
  return await apiClient.get("/users/me/guilds");
};

/**
 * 切换当前群组
 * @param {number} guildId - 群组ID
 */
export const switchGuild = async (guildId) => {
  return await apiClient.post("/user/switch-guild", { guild_id: guildId });
};

/**
 * 更新用户信息（昵称、其他昵称、头像等）
 * @param {Object} userData - 用户数据
 * @param {string} userData.nickname - 昵称（可选）
 * @param {string[]} userData.other_nicknames - 其他昵称数组（可选）
 * @param {string} userData.avatar - 头像URL（可选）
 */
export const updateUserInfo = async (userData) => {
  return await apiClient.put("/users/me", userData);
};

/**
 * 修改群内昵称
 * @param {number} guildId - 群组ID
 * @param {string} nickname - 新的群内昵称
 */
export const updateGuildNickname = async (guildId, nickname) => {
  return await apiClient.put(`/guilds/${guildId}/members/me/nickname`, {
    group_nickname: nickname,
  });
};

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 */
export const changePassword = async (oldPassword, newPassword) => {
  return await apiClient.put("/users/me/password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
};

/**
 * 上传头像
 * @param {File} file - 头像文件
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return await apiClient.post("/user/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
