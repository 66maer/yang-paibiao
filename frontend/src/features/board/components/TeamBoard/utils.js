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
 * 构建坑位数组（旧版本，使用前端分配结果）
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
 * 从后端 slot_assignments 构建坑位数组（新版本）
 * @param {Array} slotAssignments - 后端返回的坑位分配 [{signup_id, locked}, ...]
 * @param {Array} signupList - 报名列表
 * @param {Array} rules - 规则数组
 * @returns {Array} 带有索引、规则和报名信息的坑位数组
 */
export const buildSlotsFromAssignments = (slotAssignments, signupList, rules) => {
  const maxSlots = rules?.length || 25;
  const signupMap = new Map();

  // 构建报名ID到报名对象的映射
  if (Array.isArray(signupList)) {
    signupList.forEach((signup) => {
      const id = signup?.id ?? signup?.signupId;
      if (id != null) {
        signupMap.set(id, signup);
      }
    });
  }

  return Array.from({ length: maxSlots }, (_, idx) => {
    const assignment = slotAssignments?.[idx];
    const signupId = assignment?.signup_id ?? assignment?.signupId;
    const locked = assignment?.locked ?? false;

    let signup = null;
    if (signupId != null) {
      signup = signupMap.get(signupId) ?? null;
      if (signup) {
        // 添加锁定信息
        signup = { ...signup, isLock: locked, lockSlot: idx };
      }
    }

    return {
      slotIndex: idx,
      rule: rules?.[idx] ?? fallbackRule,
      signup,
      locked,
    };
  });
};

/**
 * 从后端 waitlist 获取候补列表
 * @param {Array} waitlistIds - 候补报名ID列表
 * @param {Array} signupList - 报名列表
 * @returns {Array} 候补报名对象数组
 */
export const buildWaitlistFromIds = (waitlistIds, signupList) => {
  if (!Array.isArray(waitlistIds) || !Array.isArray(signupList)) {
    return [];
  }

  const signupMap = new Map();
  signupList.forEach((signup) => {
    const id = signup?.id ?? signup?.signupId;
    if (id != null) {
      signupMap.set(id, signup);
    }
  });

  return waitlistIds
    .map((id, index) => {
      const signup = signupMap.get(id);
      if (signup) {
        return { ...signup, waitlist_order: index + 1 };
      }
      return null;
    })
    .filter(Boolean);
};
