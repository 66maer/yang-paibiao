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
  return await apiClient.get("/user/guilds");
};

/**
 * 切换当前群组
 * @param {number} guildId - 群组ID
 */
export const switchGuild = async (guildId) => {
  return await apiClient.post("/user/switch-guild", { guild_id: guildId });
};

/**
 * 修改用户昵称
 * @param {string} nickname - 新昵称
 */
export const updateUserNickname = async (nickname) => {
  return await apiClient.put("/user/profile", { nickname });
};

/**
 * 修改用户的其他昵称列表
 * @param {string[]} otherNicknames - 其他昵称数组
 */
export const updateOtherNicknames = async (otherNicknames) => {
  return await apiClient.put("/user/other-nicknames", {
    other_nicknames: otherNicknames,
  });
};

/**
 * 修改群昵称
 * @param {number} guildId - 群组ID
 * @param {string} guildNickname - 新的群昵称
 */
export const updateGuildNickname = async (guildId, guildNickname) => {
  return await apiClient.put(`/user/guilds/${guildId}/nickname`, {
    guild_nickname: guildNickname,
  });
};

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 */
export const changePassword = async (oldPassword, newPassword) => {
  return await apiClient.put("/user/change-password", {
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
