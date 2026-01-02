/**
 * 默认规则配置
 */
export const fallbackRule = {
  allowRich: false,
  allowXinfaList: [],
};

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
