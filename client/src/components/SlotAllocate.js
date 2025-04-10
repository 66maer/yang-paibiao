function SlotAllocate(ruleList, signupList) {
  const result = new Array(ruleList.length).fill(null);
  const occupied = new Array(ruleList.length).fill(false);

  // 移除取消报名的成员
  signupList = signupList.filter((m) => !m.cancelTime || m.cancelTime === "");

  // 处理锁定成员
  for (const signup of signupList) {
    if (signup.isLock) {
      const slot = signup.lockSlot;
      result[slot] = signup;
      occupied[slot] = true;
    }
  }

  // 收集未被锁定的成员和坑位
  const unlockedMembers = signupList.filter((m) => !m.isLock);
  const unlockedSlots = [];
  for (let i = 0; i < ruleList.length; i++) {
    if (!occupied[i]) {
      unlockedSlots.push(i);
    }
  }

  // 构建邻接表：每个未被锁定的成员可以匹配的坑位
  const adj = [];
  for (const member of unlockedMembers) {
    const possibleSlots = [];
    for (const slot of unlockedSlots) {
      const rule = ruleList[slot];
      if (member.isRich) {
        if (!rule.allowRich) continue;
      } else {
        if (!rule.allowXinfaList || !rule.allowXinfaList.includes(member.characterXinfa)) continue;
      }
      possibleSlots.push(slot);
    }
    adj.push(possibleSlots);
  }

  // 匈牙利算法数据结构
  const matchToSlot = new Map(); // 成员索引 => 坑位索引（原数组）
  const slotMatchedTo = new Map(); // 坑位索引 => 成员索引

  function dfs(memberIdx, visited) {
    if (visited[memberIdx]) return false;
    visited[memberIdx] = true;

    const possibleSlots = adj[memberIdx];
    for (const slot of possibleSlots) {
      if (!slotMatchedTo.has(slot)) {
        // 坑位未被占用，直接匹配
        matchToSlot.set(memberIdx, slot);
        slotMatchedTo.set(slot, memberIdx);
        return true;
      } else {
        const prevMemberIdx = slotMatchedTo.get(slot);
        if (dfs(prevMemberIdx, visited)) {
          // 原占用的成员找到了新的坑位，当前成员占据此坑位
          matchToSlot.set(memberIdx, slot);
          slotMatchedTo.set(slot, memberIdx);
          return true;
        }
      }
    }
    return false;
  }

  // 按报名顺序处理每个未被锁定的成员
  for (let i = 0; i < unlockedMembers.length; i++) {
    const visited = new Array(unlockedMembers.length).fill(false);
    dfs(i, visited);
  }

  // 填充匹配结果到最终数组
  for (const [memberIdx, slot] of matchToSlot) {
    result[slot] = unlockedMembers[memberIdx];
  }

  // 构建候补列表（按原报名顺序中未被匹配的成员）
  const alternate = [];
  const matchedMembers = new Set(matchToSlot.keys());
  for (let i = 0; i < unlockedMembers.length; i++) {
    if (!matchedMembers.has(i)) {
      alternate.push(unlockedMembers[i]);
    }
  }

  return [result, alternate];
}

export default SlotAllocate;
