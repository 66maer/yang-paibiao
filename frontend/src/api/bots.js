/**
 * Bot管理相关API
 */
import client from './client';

/**
 * 获取Bot列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} search - 搜索关键词
 * @returns {Promise}
 */
export const getBots = (page = 1, pageSize = 20, search = '') => {
  const params = { page, page_size: pageSize };
  if (search) {
    params.search = search;
  }
  return client.get('/admin/bots', { params });
};

/**
 * 获取Bot详情
 * @param {number} botId - Bot ID
 * @returns {Promise}
 */
export const getBotDetail = (botId) => {
  return client.get(`/admin/bots/${botId}`);
};

/**
 * 创建Bot
 * @param {object} data - Bot数据
 * @param {string} data.bot_name - Bot名称
 * @param {string} data.description - 描述
 * @returns {Promise}
 */
export const createBot = (data) => {
  return client.post('/admin/bots', data);
};

/**
 * 更新Bot
 * @param {number} botId - Bot ID
 * @param {object} data - 更新数据
 * @param {string} data.description - 描述
 * @param {boolean} data.is_active - 是否激活
 * @returns {Promise}
 */
export const updateBot = (botId, data) => {
  return client.put(`/admin/bots/${botId}`, data);
};

/**
 * 删除Bot
 * @param {number} botId - Bot ID
 * @returns {Promise}
 */
export const deleteBot = (botId) => {
  return client.delete(`/admin/bots/${botId}`);
};

/**
 * 授权Bot访问群组
 * @param {number} botId - Bot ID
 * @param {number} guildId - 群组ID
 * @returns {Promise}
 */
export const authorizeGuild = (botId, guildId) => {
  return client.post(`/admin/bots/${botId}/authorize-guild`, { guild_id: guildId });
};

/**
 * 取消Bot对群组的授权
 * @param {number} botId - Bot ID
 * @param {number} guildId - 群组ID
 * @returns {Promise}
 */
export const revokeGuildAuthorization = (botId, guildId) => {
  return client.delete(`/admin/bots/${botId}/guilds/${guildId}`);
};

/**
 * 重新生成API Key
 * @param {number} botId - Bot ID
 * @returns {Promise}
 */
export const regenerateApiKey = (botId) => {
  return client.post(`/admin/bots/${botId}/regenerate-key`);
};
