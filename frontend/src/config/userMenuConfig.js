/**
 * 用户页面菜单配置
 *
 * 权限角色说明：
 * - owner: 群主
 * - helper: 管理员
 * - member: 普通群员
 * - 如果 allowedRoles 为空或不设置，表示所有角色都可访问
 *
 * 菜单支持二级结构：
 * - children: 子菜单数组（可选）
 */

const userMenuConfig = [
  {
    key: "board",
    label: "开团看板",
    path: "/board",
    icon: "📋",
    // 所有角色都可访问
  },
  {
    key: "characters",
    label: "我的角色",
    path: "/characters",
    icon: "⚔️",
    // 所有角色都可访问
  },
  {
    key: "my-records",
    label: "我的记录",
    path: "/my-records",
    icon: "📊",
    // 所有角色都可访问
  },
  {
    key: "gold-records",
    label: "金团记录",
    path: "/gold-records",
    icon: "💰",
    // 所有角色都可访问
  },
  {
    key: "ranking",
    label: "红黑榜",
    path: "/ranking",
    icon: "🏆",
    // 所有角色都可访问
  },
  {
    key: "tools",
    label: "小工具",
    path: "/tools",
    icon: "🔧",
    // 所有角色都可访问
  },
  {
    key: "admin",
    label: "管理选项",
    icon: "⚙️",
    allowedRoles: ["owner", "helper"], // 仅管理员
    children: [
      {
        key: "members",
        label: "成员管理",
        path: "/members",
        icon: "👥",
      },
      {
        key: "templates",
        label: "开团模板",
        path: "/templates",
        icon: "📝",
      },
      {
        key: "history",
        label: "历史开团",
        path: "/history",
        icon: "📜",
      },
      {
        key: "guild-settings",
        label: "群组预设",
        path: "/guild-settings",
        icon: "🔧",
      },
    ],
  },
];

/**
 * 根据当前用户的群组角色过滤菜单
 * @param {string} role - 用户在当前群组的角色 (owner/helper/member)
 * @returns {Array} 过滤后的菜单项
 */
export const getFilteredMenu = (role) => {
  return userMenuConfig.filter((item) => {
    // 如果没有设置 allowedRoles，表示所有角色都可访问
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true;
    }
    // 检查当前角色是否在允许列表中
    return item.allowedRoles.includes(role);
  });
};

export default userMenuConfig;
