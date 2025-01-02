// 帮我写一个算法, 实现一个函数 SlotAllocate(teamRules, teamLogs)
// 函数接收两个参数, teamRules 是一个长度25的数组表示团队报名的规则(我们成为25个坑), 每个元素是一个对象, 对象包含两个属性, allow_xinfa_list
// teamLogs 也是一个数组表示报名的操作, 每个元素是一个对象, 包含一条操作日志的json logJson, 一个操作类型 type(报名，取消报名，代报名，取消代报名，管理员指定，管理员取消)
// 函数需要返回两个数据, 一个长度25的数组表示每个坑位的报名情况teamSlots, 每个元素是一个对象, 表示具体的报名情况(称为填坑),
// 包含的字段有: 报名日志的id, 报名人id, 姓名username, 游戏角色名characterName, xinfa角色心法，用于匹配规则， 提交者id submit_user_id(存在代报名的情况), 取消人的id cancel_user_id(存在别人代我报名，我自己取消，或者管理员取消的情况)，报名类型sign(常规，代报名，管理员指定)
// 还有需要返回一个处理后的报名日志描述，每个元素是一个字符串, 因为teamLogs是按照时间记录的对象，而这个数组需要对其处理，比如将报名又取消的情况合并，输出一条"xxx报名(被xxx取消)"的描述

import { xinfaInfoTable } from "@/utils/xinfa";

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

const dfs = (resSlots, rules, slots, signupList, candidateList) => {
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
      if (
        dfs(resSlots, rules, newSlots, signupList.slice(idx + 1), candidateList)
      ) {
        return true;
      }
    }
  }
  return false;
};

const SlotAllocate = (teamRules, signupList) => {
  // const teamSlots = teamRules.map((rule) => ({
  //   rule: rule,
  //   member: null,
  // }));

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

    const res = dfs(
      newSlotMemberList,
      teamRules,
      tmpSlotMemberList,
      signupList.slice(0, idx + 1),
      candidateList
    );
    if (res) {
      slotMemberList.splice(0, slotMemberList.length, ...newSlotMemberList);
    } else {
      candidateList.push(signupInfo);
    }
  }

  console.log(slotMemberList, candidateList);
};

export default SlotAllocate;
