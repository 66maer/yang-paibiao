import { fallbackRule } from "./constants";

/**
 * 获取报名记录的唯一标识
 * @param {Object} signup - 报名记录对象
 * @returns {string|number|null} 报名记录的唯一ID
 */
export const getSignupKey = (signup) =>
  signup?.id ?? signup?.signupId ?? signup?.signup_id ?? signup?.userId ?? signup?.user_id ?? null;

/**
 * 构建坑位数组
 * @param {Array} slots - 坑位分配结果
 * @param {Array} rules - 规则数组
 * @returns {Array} 带有索引、规则和报名信息的坑位数组
 */
export const buildSlots = (slots, rules) =>
  Array.from({ length: rules.length }, (_, idx) => ({
    slotIndex: idx,
    rule: rules[idx] ?? fallbackRule,
    signup: slots[idx] ?? null,
  }));

/**
 * 获取报名者的心法信息
 * @param {Object} signup - 报名记录
 * @param {Object} xinfaInfoTable - 心法信息表
 * @returns {Object|null} 心法信息对象
 */
export const getSignupXinfa = (signup, xinfaInfoTable) => {
  const xinfaKey = signup?.characterXinfa;
  return xinfaKey ? xinfaInfoTable[xinfaKey] : null;
};

/**
 * 获取报名者的进组状态
 * @param {Object} signup - 报名记录
 * @returns {string} 进组状态（present/pending/absent）
 */
export const getPresenceStatus = (signup) => signup?.presence || signup?.status || "pending";

/**
 * 获取下一个进组状态（用于循环切换）
 * @param {string} currentStatus - 当前状态
 * @param {Array} order - 状态循环顺序
 * @returns {string} 下一个状态
 */
export const getNextPresenceStatus = (currentStatus, order) => {
  const idx = order.indexOf(currentStatus);
  return order[(idx + 1) % order.length];
};
