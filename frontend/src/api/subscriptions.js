import apiClient from "./client";

/**
 * 获取订阅列表
 */
export const getSubscriptionList = async (params = {}) => {
  const response = await apiClient.get("/admin/guilds/subscriptions", { params });
  return response;
};

/**
 * 获取指定群组的订阅历史
 */
export const getGuildSubscriptions = async (guildId) => {
  const response = await apiClient.get(`/admin/guilds/${guildId}/subscriptions`);
  return response;
};

/**
 * 创建订阅
 */
export const createSubscription = async (data) => {
  const response = await apiClient.post("/admin/guilds/subscriptions", data);
  return response;
};

/**
 * 更新订阅
 */
export const updateSubscription = async (subscriptionId, data) => {
  const response = await apiClient.put(`/admin/guilds/subscriptions/${subscriptionId}`, data);
  return response;
};

/**
 * 删除订阅
 */
export const deleteSubscription = async (subscriptionId) => {
  const response = await apiClient.delete(`/admin/guilds/subscriptions/${subscriptionId}`);
  return response;
};
