/**
 * 获取成员昵称工具函数
 * 优先级：群昵称 > 主要昵称 > 其他昵称 > QQ号
 *
 * @param {Object} member - 成员对象（包含 user 和 group_nickname）
 * @returns {string} - 昵称
 */
export function getMemberNickname(member) {
  if (!member) return "";

  const user = member.user || {};

  // 优先级1: 群昵称
  if (member.group_nickname) {
    return member.group_nickname;
  }

  // 优先级2: 主要昵称
  if (user.nickname) {
    return user.nickname;
  }

  // 优先级3: 其他昵称（取第一个）
  const otherNicknames = user.other_nicknames || [];
  if (otherNicknames.length > 0 && otherNicknames[0]) {
    return otherNicknames[0];
  }

  // 优先级4: QQ号
  if (user.qq_number) {
    return String(user.qq_number);
  }

  return "";
}

/**
 * 获取用户昵称（当传入的是 user 对象而非 member 对象时）
 * 优先级：主要昵称 > 其他昵称 > QQ号
 *
 * @param {Object} user - 用户对象
 * @returns {string} - 昵称
 */
export function getUserNickname(user) {
  if (!user) return "";

  // 优先级1: 主要昵称
  if (user.nickname) {
    return user.nickname;
  }

  // 优先级2: 其他昵称（取第一个）
  const otherNicknames = user.other_nicknames || [];
  if (otherNicknames.length > 0 && otherNicknames[0]) {
    return otherNicknames[0];
  }

  // 优先级3: QQ号
  if (user.qq_number) {
    return String(user.qq_number);
  }

  return "";
}
