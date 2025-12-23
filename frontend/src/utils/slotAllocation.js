import { allXinfaList } from "../config/xinfa";

// Default rule used when a slot is not configured
const defaultRule = { allowRich: false, allowXinfaList: [] };

// Extract a stable signup identifier for mapping and view persistence
const getSignupId = (signup = {}) =>
  signup.id ?? signup.signupId ?? signup.signup_id ?? signup.userId ?? signup.user_id ?? null;

// Normalize incoming rules to a fixed-length array
const buildRuleList = (rules = [], slotCount = 25) => {
  if (!Array.isArray(rules)) return Array.from({ length: slotCount }, () => ({ ...defaultRule }));
  const count = Math.max(slotCount, rules.length || slotCount);
  return Array.from({ length: count }, (_, idx) => ({ ...defaultRule, ...(rules[idx] || {}) }));
};

// Normalize optional view mapping: [{ signupId, slotIndex }]
const normalizeView = (view = []) => {
  if (!Array.isArray(view)) return [];
  return view
    .map((item) => ({
      signupId: item.signupId ?? item.signup_id ?? item.id ?? null,
      slotIndex: item.slotIndex ?? item.slot ?? item.position ?? null,
    }))
    .filter((item) => item.signupId != null && Number.isInteger(item.slotIndex) && item.slotIndex >= 0);
};

// Apply persisted view mapping on top of computed allocation so that UI ordering matches the saved layout
const applyViewMapping = (slots, viewMap) => {
  if (!viewMap.length) return slots;

  const arranged = Array.from({ length: slots.length }, () => null);
  const used = new Set();

  for (const { signupId, slotIndex } of viewMap) {
    const target = slots.find((item, idx) => !used.has(idx) && getSignupId(item) === signupId);
    if (!target || slotIndex >= arranged.length) continue;
    const targetIdx = slots.indexOf(target);
    arranged[slotIndex] = target;
    used.add(targetIdx);
  }

  // Fill remaining empty spots in order
  let cursor = 0;
  for (let i = 0; i < arranged.length; i++) {
    if (arranged[i]) continue;
    while (cursor < slots.length && used.has(cursor)) cursor += 1;
    arranged[i] = cursor < slots.length ? slots[cursor] : null;
    cursor += 1;
  }

  return arranged;
};

// Determine whether a signup fits a rule
const fitsRule = (rule, signup) => {
  if (!signup) return false;
  if (signup.isRich) return !!rule.allowRich;
  const allowList = rule.allowXinfaList || [];
  return allowList.length ? allowList.includes(signup.characterXinfa) : false;
};

// Hungarian-style bipartite matching for optimal slot allocation
export function allocateSlots(ruleList = [], signupList = []) {
  const rules = buildRuleList(ruleList);
  const slotsCount = rules.length;
  const cleansedSignups = Array.isArray(signupList) ? signupList.filter((m) => !m.cancelTime && !m.cancel_time) : [];

  // Pre-place locked signups
  const result = Array.from({ length: slotsCount }, () => null);
  const occupied = Array.from({ length: slotsCount }, () => false);

  for (const signup of cleansedSignups) {
    if (!signup.isLock) continue;
    const slot = Number(signup.lockSlot ?? signup.lock_slot);
    if (Number.isInteger(slot) && slot >= 0 && slot < slotsCount) {
      result[slot] = signup;
      occupied[slot] = true;
    }
  }

  // Build unlocked members and free slots
  const unlockedMembers = cleansedSignups.filter((m) => !m.isLock);
  const freeSlots = rules.map((_, idx) => idx).filter((idx) => !occupied[idx]);

  // Adjacency list: unlocked member -> compatible free slots
  const adj = unlockedMembers.map((member) => {
    return freeSlots.filter((slotIdx) => fitsRule(rules[slotIdx], member));
  });

  const matchToSlot = new Map();
  const slotMatchedTo = new Map();

  // DFS for augmenting path search
  const dfs = (memberIdx, visited) => {
    if (visited[memberIdx]) return false;
    visited[memberIdx] = true;
    for (const slot of adj[memberIdx]) {
      const matchedMember = slotMatchedTo.get(slot);
      if (matchedMember == null || dfs(matchedMember, visited)) {
        matchToSlot.set(memberIdx, slot);
        slotMatchedTo.set(slot, memberIdx);
        return true;
      }
    }
    return false;
  };

  // Perform matching in signup order
  for (let i = 0; i < unlockedMembers.length; i += 1) {
    const visited = Array.from({ length: unlockedMembers.length }, () => false);
    dfs(i, visited);
  }

  // Apply matches to result
  for (const [memberIdx, slot] of matchToSlot.entries()) {
    result[slot] = unlockedMembers[memberIdx];
  }

  // Build waitlist (unmatched unlocked members)
  const matchedMembers = new Set(matchToSlot.keys());
  const waitlist = unlockedMembers.filter((_, idx) => !matchedMembers.has(idx));

  // 仅返回按规则分配的结果，不在此阶段应用任何视觉映射
  return { slots: result, waitlist };
}

// Lightweight helper to build a blank rule list for UI scaffolding
export const buildEmptyRules = (count = 25) => Array.from({ length: count }, () => ({ ...defaultRule }));

export const rulePresetLabels = {
  any: "不限心法",
  richOnly: "仅老板",
  dps: "任意输出",
  heal: "任意治疗",
  tank: "任意防御",
};

// Helper to derive a concise rule summary for chip display
export const getRuleLabel = (rule = {}) => {
  if (rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) return rulePresetLabels.richOnly;
  if (!rule.allowRich && rule.allowXinfaList?.length === allXinfaList.length) return rulePresetLabels.any;
  if (!rule.allowRich && rule.allowXinfaList?.length === 0) return "未开放";
  return `${rule.allowXinfaList?.length || 0} 个心法`;
};
