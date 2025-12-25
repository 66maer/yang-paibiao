/**
 * 将 API 返回的报名数据转换为前端组件所需的格式
 *
 * API 返回格式：
 * {
 *   id: 1,
 *   team_id: 2,
 *   submitter_id: 1,
 *   signup_user_id: 123,
 *   signup_character_id: 456,
 *   signup_info: {
 *     submitter_name: "张三",
 *     player_name: "李四",
 *     character_name: "角色名",
 *     xinfa: "花间游"
 *   },
 *   priority: 0,
 *   is_rich: false,
 *   is_proxy: false,
 *   slot_position: null,
 *   presence_status: null,
 *   cancelled_at: null,
 *   cancelled_by: null,
 *   created_at: "2025-12-24T07:22:39.890561",
 *   updated_at: "2025-12-24T07:22:39.890564"
 * }
 *
 * 前端组件期望的格式：
 * {
 *   id: 1,
 *   signupId: 1,
 *   userId: 123,
 *   user_id: 123,
 *   characterId: 456,
 *   signupName: "李四",
 *   characterName: "角色名",
 *   characterXinfa: "花间游",
 *   isRich: false,
 *   isProxy: false,
 *   isLock: false,
 *   lockSlot: null,
 *   presence: null,
 *   cancelTime: null,
 *   submitterName: "张三",
 *   createdAt: "2025-12-24T07:22:39.890561"
 * }
 */

/**
 * 转换单个报名对象
 * @param {Object} signup - API 返回的报名对象
 * @returns {Object} 转换后的报名对象
 */
export function transformSignup(signup) {
  if (!signup) return null;

  const signupInfo = signup.signup_info || {};

  return {
    // ID 字段
    id: signup.id,
    signupId: signup.id,
    userId: signup.signup_user_id, // 可能为 null（代报名且被报名者无账号）
    user_id: signup.signup_user_id,
    characterId: signup.signup_character_id || signup.character_id,

    // 报名信息
    signupName: signupInfo.player_name || signupInfo.submitter_name || "",
    characterName: signupInfo.character_name || "",
    characterXinfa: signupInfo.xinfa || "",

    // 玩家QQ号
    playerQqNumber: signupInfo.player_qq_number || "",

    // 状态标记（驼峰命名）
    isRich: signup.is_rich || false,
    isProxy: signup.is_proxy || false,
    isLock: signup.slot_position !== null && signup.slot_position !== undefined,
    lockSlot: signup.slot_position,
    presence: signup.presence_status || null,

    // 取消状态
    cancelTime: signup.cancelled_at,
    cancel_time: signup.cancelled_at,
    cancelledBy: signup.cancelled_by,

    // 提交者信息
    submitterName: signupInfo.submitter_name || "",
    submitterId: signup.submitter_id,
    submitterQqNumber: signupInfo.submitter_qq_number || "",

    // 优先级
    priority: signup.priority || 0,

    // 时间戳
    createdAt: signup.created_at,
    updatedAt: signup.updated_at,

    // 保留原始数据（用于调试）
    _original: signup,
  };
}

/**
 * 转换报名数组
 * @param {Array} signups - API 返回的报名数组
 * @returns {Array} 转换后的报名数组
 */
export function transformSignups(signups) {
  if (!Array.isArray(signups)) return [];
  return signups.map(transformSignup).filter(Boolean);
}
