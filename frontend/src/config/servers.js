/**
 * 剑网3服务器列表配置
 */

export const SERVERS = {
  电信区: [
    "乾坤一掷",
    "梦江南",
    "长安城",
    "蝶恋花",
    "唯我独尊",
    "幽月轮",
    "龙争虎斗",
    "剑胆琴心",
    "绝代天骄",
    "斗转星移",
  ],
  双线区: ["天鹅坪", "破阵子", "飞龙在天", "青梅煮酒"],
  无界区: ["眉间雪", "有人赴约", "万象长安", "山海相逢"],
};

// 扁平化的服务器列表（用于选择器）
export const ALL_SERVERS = Object.values(SERVERS).flat();

// 获取服务器所属区域
export const getServerRegion = (serverName) => {
  for (const [region, servers] of Object.entries(SERVERS)) {
    if (servers.includes(serverName)) {
      return region;
    }
  }
  return null;
};

export default SERVERS;
