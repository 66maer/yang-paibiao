import { allXinfaList } from "../config/xinfa";

/**
 * 角色排序工具函数
 * 按照以下优先级排序：
 * 1. 优先级（priority）从小到大
 * 2. 心法（xinfa）按照 allXinfaList 中的顺序
 * 3. 角色ID（id）从小到大
 *
 * @param {Array} characters - 角色列表
 * @param {number} memberId - 当前成员ID（用于获取优先级信息）
 * @returns {Array} 排序后的角色列表
 */
export function sortCharacters(characters, memberId) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return characters;
  }

  // 创建心法索引映射，用于排序
  const xinfaIndexMap = {};
  allXinfaList.forEach((xinfa, index) => {
    xinfaIndexMap[xinfa] = index;
  });

  return [...characters].sort((a, b) => {
    // 1. 按优先级排序（从小到大）
    const priorityA = a.players?.find((p) => p.user_id === memberId)?.priority ?? 999;
    const priorityB = b.players?.find((p) => p.user_id === memberId)?.priority ?? 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2. 按心法顺序排序
    const xinfaIndexA = xinfaIndexMap[a.xinfa] ?? 999;
    const xinfaIndexB = xinfaIndexMap[b.xinfa] ?? 999;

    if (xinfaIndexA !== xinfaIndexB) {
      return xinfaIndexA - xinfaIndexB;
    }

    // 3. 按角色ID排序（从小到大）
    return (a.id || 0) - (b.id || 0);
  });
}
