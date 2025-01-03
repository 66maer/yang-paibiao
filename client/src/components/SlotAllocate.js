const SampleAllocate = (rules, slots, signupInfo, last = -1) => {
  for (let idx = last + 1; idx < rules.length; idx++) {
    const rule = rules[idx];
    if (slots[idx] != null) {
      continue; // 这个位置已经有人了
    }
    const { allowRich, allowXinfaList } = rule;
    if (allowRich && signupInfo.isRich && allowRich == signupInfo.isRich) {
      slots[idx] = signupInfo;
      return idx;
    }
    if (allowXinfaList.includes(signupInfo.xinfa)) {
      slots[idx] = signupInfo;
      return idx;
    }
  }
  return -1;
};

const DFS = (resSlots, rules, slots, signupList, candidateList) => {
  if (signupList.length == 0) {
    resSlots.splice(0, resSlots.length, ...slots);
    return true;
  }
  for (const [idx, signupInfo] of signupList.entries()) {
    if (signupInfo.cancelTime != null) {
      continue; // 已经取消报名的不处理
    }
    if (candidateList.includes(signupInfo)) {
      continue; // 已经在候补列表了, 不再处理
    }
    if (signupInfo.isLock && signupInfo.lockSlotId != null) {
      slots[signupInfo.lockSlotId] = signupInfo;
      continue; // 钦定的位置直接插入
    }
    let last = -1;
    while (true) {
      const newSlots = slots.slice();
      last = SampleAllocate(rules, newSlots, signupInfo, last);
      if (last == -1) {
        return false;
      }
      if (DFS(resSlots, rules, newSlots, signupList.slice(idx + 1), candidateList)) {
        return true;
      }
    }
  }
  return false;
};

const SlotAllocate = (teamRules, signupList) => {
  const slotMemberList = Array(teamRules.length).fill(null);
  const candidateList = [];
  for (const [idx, signupInfo] of signupList.entries()) {
    if (signupInfo.cancelTime != null) {
      continue; // 已经取消报名的不处理
    }
    if (candidateList.includes(signupInfo)) {
      continue; // 已经在候补列表了, 不再处理
    }
    if (signupInfo.isLock && signupInfo.lockSlotId != null) {
      slotMemberList[signupInfo.lockSlotId] = signupInfo;
      continue; // 钦定的位置直接插入
    }

    // 先进行简单插入
    const resIdx = SampleAllocate(teamRules, slotMemberList, signupInfo);
    if (resIdx != -1) {
      continue;
    }

    // 无法简单插入，尝试回朔重排
    const newSlotMemberList = Array(teamRules.length).fill(null);
    const tmpSlotMemberList = newSlotMemberList.slice();

    const res = DFS(newSlotMemberList, teamRules, tmpSlotMemberList, signupList.slice(0, idx + 1), candidateList);
    if (res) {
      slotMemberList.splice(0, slotMemberList.length, ...newSlotMemberList);
    } else {
      candidateList.push(signupInfo);
    }
  }

  const teamSlots = slotMemberList.map((signupInfo, idx) => {
    return {
      rule: teamRules[idx],
      member: signupInfo,
    };
  });

  return [teamSlots, candidateList];
};

export default SlotAllocate;
