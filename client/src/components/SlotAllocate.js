// 帮我写一个算法, 实现一个函数 SlotAllocate(teamRules, teamLogs)
// 函数接收两个参数, teamRules 是一个长度25的数组表示团队报名的规则(我们成为25个坑), 每个元素是一个对象, 对象包含两个属性, allow_xinfa_list
// teamLogs 也是一个数组表示报名的操作, 每个元素是一个对象, 包含一条操作日志的json logJson, 一个操作类型 type(报名，取消报名，代报名，取消代报名，管理员指定，管理员取消)
// 函数需要返回两个数据, 一个长度25的数组表示每个坑位的报名情况teamSlots, 每个元素是一个对象, 表示具体的报名情况(称为填坑),
// 包含的字段有: 报名日志的id, 报名人id, 姓名username, 游戏角色名characterName, xinfa角色心法，用于匹配规则， 提交者id submit_user_id(存在代报名的情况), 取消人的id cancel_user_id(存在别人代我报名，我自己取消，或者管理员取消的情况)，报名类型sign(常规，代报名，管理员指定)
// 还有需要返回一个处理后的报名日志描述，每个元素是一个字符串, 因为teamLogs是按照时间记录的对象，而这个数组需要对其处理，比如将报名又取消的情况合并，输出一条"xxx报名(被xxx取消)"的描述

import { xinfaInfoTable } from "../../../old/server/utils/xinfa";

// 简单插入，遍历所有的slot，找到第一个符合条件的slot，插入
const SampleAllocateMember = (teamSlots, signupInfo) => {
  for (const { rule, member } of teamSlots) {
    if (member !== null) {
      continue; // 这个位置已经有人了
    }
    const { allowRich, allowXinfaList } = rule;
    if (allowRich === signupInfo.isRich) {
      member = signupInfo;
      return true;
    }
    if (allowXinfaList.includes(signupInfo.xinfa)) {
      member = signupInfo;
      return true;
    }
  }
  return false;
};

// 报名重排，按照坑位的规则，尽可能容纳更多的人
const SlotReallocate = (teamSlots, signupListSlice, candidateList) => {
  // 统计规则中的心法数量，并将对应的坑位id记录下来
  const xinfaSlotMap = {};
  let richSlotList = [];
  Object.keys(xinfaInfoTable).forEach((xinfa) => {
    xinfaSlotMap[xinfa] = [];
  });
  for (const [idx, slot] of teamSlots.entries()) {
    if (slot.member?.isLock) {
      continue; // 这个位置是被钦定的，不参与重排
    }
    slot.member = null;
    const { allowRich, allowXinfaList } = slot.rule;
    if (allowRich) {
      richSlotList.push(idx);
    }
    allowXinfaList.forEach((xinfa) => {
      xinfaSlotMap[xinfa].push(idx);
    });
  }

  // 一个坑位可能允许多个心法，此方法消耗坑位，所有相关心法都要删除对应坑位id
  const ConsumeSlot = (slotId) => {
    const slot = teamSlots[slotId];
    const { allowRich, allowXinfaList } = slot.rule;
    if (allowRich) {
      richSlotList = richSlotList.filter((id) => id !== slotId);
    }
    allowXinfaList.forEach((xinfa) => {
      xinfaSlotMap[xinfa] = xinfaSlotMap[xinfa].filter((id) => id !== slotId);
    });
  };
  // 按照每个心法可用的坑位数量，进行分配
  const teamSlotsCopy = JSON.parse(JSON.stringify(teamSlots));

  let succ = true;
  while (signupListSlice.length > 0) {
    signupListSlice.sort((a, b) => {
      if (a.isRich) return 1;
      if (b.isRich) return -1;
      return xinfaSlotMap[a.xinfa].length - xinfaSlotMap[b.xinfa].length;
    });
    const first = signupListSlice.shift();
    if (first.isRich && richSlotList.length > 0) {
      const slotId = richSlotList.shift();
      teamSlotsCopy[slotId].member = first;
      ConsumeSlot(slotId);
      continue;
    }
    if (!first.isRich && xinfaSlotMap[first.xinfa].length > 0) {
      const slotId = xinfaSlotMap[first.xinfa].shift();
      teamSlotsCopy[slotId].member = first;
      ConsumeSlot(slotId);
      continue;
    }
    if (candidateList.find((item) => item.id === first.id)) {
      continue; // 已经在候补列表了, 说明在之前的重排中就没有通过, 不再重排
    }
    succ = false;
    break;
  }

  // 如果成功，将teamSlotsCopy的值赋给teamSlots
  if (succ) {
    teamSlots = teamSlotsCopy;
  }
};

const SlotAllocate = (teamRules, signupList) => {
  const teamSlots = teamRules.map((rule) => ({
    rule: rule,
    member: null,
  }));
  const candidateList = [];

  for (const [idx, signupInfo] of signupList.entries()) {
    if (signupInfo.cancelTime !== null) {
      continue; // 已经取消报名的不处理
    }
    if (candidateList.includes(signupInfo)) {
      continue; // 已经在候补列表了, 不再处理
    }
    if (signupInfo.isLock && signupInfo.lockSlotId !== null) {
      teamSlots[signupInfo.lockSlotId].member = signupInfo;
      continue; // 钦定的位置直接插入
    }

    // 先进行简单插入
    if (SampleAllocateMember(teamSlots, signupInfo)) {
      continue;
    }

    // 如果简单插入失败，将当前与此之前的报名记录进行重排
    SlotReallocate(
      teamSlots,
      signupList.slice(0, idx + 1),
      candidateList.slice()
    );
  }
};
