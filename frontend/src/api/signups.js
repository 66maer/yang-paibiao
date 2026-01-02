import apiClient from "./client";

// 提交报名
export const createSignup = (guildId, teamId, payload) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/signups`, payload);
};

// 获取报名列表（含历史）
export const getSignups = (guildId, teamId) => {
  return apiClient.get(`/guilds/${guildId}/teams/${teamId}/signups`);
};

// 更新报名信息
export const updateSignup = (guildId, teamId, signupId, payload) => {
  return apiClient.put(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}`, payload);
};

// 锁定报名位置
export const lockSignup = (guildId, teamId, signupId, payload) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}/lock`, payload);
};

// 标记缺席
export const markSignupAbsent = (guildId, teamId, signupId, payload) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}/absent`, payload);
};

// 取消报名
export const cancelSignup = (guildId, teamId, signupId) => {
  return apiClient.delete(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}`);
};

// 更新到场状态（进组标记模式）
export const updatePresenceStatus = (guildId, teamId, signupId, payload) => {
  return apiClient.post(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}/presence`, payload);
};

// 删除坑位分配（排表模式）
export const removeSlotAssignment = (guildId, teamId, signupId) => {
  return apiClient.delete(`/guilds/${guildId}/teams/${teamId}/signups/${signupId}/slot`);
};
