// 卡牌类型 → 图片目录 & 显示类型名
export const typeConfig = {
  恶魔卡: { dir: "恶魔", type: "恶魔" },
  混沌卡: { dir: "混沌", type: "混沌" },
  绝境卡: { dir: "绝境", type: "绝境" },
  天使卡: { dir: "天使", type: "天使" },
};

// 特殊图片名映射（卡牌名 → 实际图片文件名，不含扩展名）
export const imageNameMap = {
  "混沌奇穴·一": "混沌奇穴",
  "混沌奇穴·二": "混沌奇穴",
  "混沌奇穴·三": "混沌奇穴",
  "混沌奇穴·四": "混沌奇穴",
};

export function getImagePath(cardName, dir) {
  const fileName = imageNameMap[cardName] || cardName;
  return `/images/cards/${dir}/${fileName}.png`;
}
