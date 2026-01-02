/**
 * 昵称验证工具
 */

/**
 * 验证昵称是否符合规则
 *
 * 规则：
 * 1. 最多6个字符（汉字、英文都算一个字符）
 * 2. 只允许中文汉字、英文字母（大小写）、数字
 * 3. 不允许特殊符号、表情等
 *
 * @param {string} nickname - 要验证的昵称
 * @returns {{isValid: boolean, errorMessage: string|null}} - 验证结果
 */
export function validateNickname(nickname) {
  if (!nickname) {
    return { isValid: false, errorMessage: "昵称不能为空" };
  }

  // 去除首尾空格
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    return { isValid: false, errorMessage: "昵称不能为空" };
  }

  // 计算字符长度（汉字、英文、数字都算一个字符）
  const charCount = trimmedNickname.length;

  if (charCount > 6) {
    return { isValid: false, errorMessage: "昵称最多6个字符" };
  }

  // 只允许中文汉字、英文字母、数字
  // \u4e00-\u9fff 是中文汉字的 Unicode 范围
  // a-zA-Z 是英文字母
  // 0-9 是数字
  const pattern = /^[\u4e00-\u9fffa-zA-Z0-9]+$/;

  if (!pattern.test(trimmedNickname)) {
    return {
      isValid: false,
      errorMessage: "昵称只能包含中文、英文字母和数字，不允许特殊符号和表情",
    };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * 验证昵称，如果不符合规则则抛出错误
 *
 * @param {string} nickname - 要验证的昵称
 * @returns {string} - 处理后的昵称（去除首尾空格）
 * @throws {Error} - 昵称不符合规则
 */
export function validateNicknameThrow(nickname) {
  const { isValid, errorMessage } = validateNickname(nickname);
  if (!isValid) {
    throw new Error(errorMessage);
  }
  return nickname.trim();
}

/**
 * 获取昵称的剩余可用字符数
 *
 * @param {string} nickname - 昵称
 * @returns {number} - 剩余可用字符数
 */
export function getRemainingChars(nickname) {
  if (!nickname) return 6;
  return Math.max(0, 6 - nickname.length);
}
