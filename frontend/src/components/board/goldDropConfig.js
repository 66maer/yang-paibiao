/**
 * 金团掉落配置
 * 每行可以包含一个或多个分组
 * 每个分组包含标题和掉落物品列表
 * 每个物品包含：name（名称）、color（颜色）、extraContent（额外内容类型）
 */
export const goldDropConfig = [
  // 第一行：闪了吗 + 精简
  [
    {
      title: "闪了吗",
      items: [
        { name: "玄晶", color: "warning" },
        { name: "玄晶", color: "warning" },
      ],
    },
    {
      title: "精简",
      items: [
        { name: "毕业精简", color: "secondary" },
        { name: "普通黄字精简", color: "primary" },
        { name: "普通精简", color: "success" },
      ],
    },
  ],
  // 特效武器单独一行
  [
    {
      title: "特效武器",
      items: [
        { name: "特效武器盒子", color: "secondary" },
        { name: "特效武器", color: "primary", extraContent: "xinfa" }, // 需要选择心法
      ],
    },
  ],
  // 特效腰坠单独一行
  [
    {
      title: "特效腰坠",
      items: [
        { name: "根骨腰坠", color: "success" },
        { name: "元气腰坠", color: "success" },
        { name: "力道腰坠", color: "success" },
        { name: "身法腰坠", color: "success" },
        { name: "T腰坠", color: "success" },
        { name: "奶腰坠", color: "success" },
      ],
    },
  ],
  // 其他单独一行
  [
    {
      title: "其他",
      items: [
        { name: "特效挂件", color: "primary" },
        { name: "外观", color: "primary" },
        { name: "沙子", color: "success" },
        { name: "普通挂件", color: "success" },
        { name: "马具", color: "success" },
        { name: "秘籍", color: "success" },
        { name: "追须", color: "success" },
        { name: "门派特效", color: "success" },
      ],
    },
  ],
];
