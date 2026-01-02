import apiClient from "./client";

// 创建模板
export const createTemplate = (guildId, data) => {
  return apiClient.post(`/guilds/${guildId}/templates`, data);
};

// 获取模板列表
export const getTemplateList = (guildId) => {
  return apiClient.get(`/guilds/${guildId}/templates`);
};

// 获取模板详情（可选，后端已提供）
export const getTemplateDetail = (guildId, templateId) => {
  return apiClient.get(`/guilds/${guildId}/templates/${templateId}`);
};

// 更新模板
export const updateTemplate = (guildId, templateId, data) => {
  return apiClient.put(`/guilds/${guildId}/templates/${templateId}`, data);
};

// 删除模板
export const deleteTemplate = (guildId, templateId) => {
  return apiClient.delete(`/guilds/${guildId}/templates/${templateId}`);
};
