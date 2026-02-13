import { useThemeContext } from "@/contexts/ThemeContext";

// 三种卡牌类型的配色方案
const themes = {
  恶魔: {
    light: {
      border: "#8B1A1A",
      innerBorder: "rgba(139,26,26,0.25)",
      cardBg: "#1a0808",
      imageBg: "bg-red-100",
      iconColor: "text-red-800",
      titleBg: "linear-gradient(180deg, rgba(120,20,20,0.92) 0%, rgba(100,15,15,0.7) 70%, transparent 100%)",
      titleText: "text-red-100",
      titleShadow: "0 0 10px rgba(255,60,60,0.3), 0 1px 2px rgba(0,0,0,0.5)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(45,8,8,0.3) 45%, rgba(45,8,8,0.75) 60%, #2d0808 75%)",
      descText: "text-red-100",
      enhanceTagBg: "bg-red-900/60 text-red-200",
      enhanceText: "text-red-200",
      divider: "rgba(139,26,26,0.35)",
      noteText: "text-red-300/60",
      tagBg: "linear-gradient(135deg, #8B1A1A, #a02020)",
      tagText: "text-red-100",
      cornerDeco: "rgba(139,26,26,0.4)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(180,40,40,0.08) 0%, transparent 70%)",
    },
    dark: {
      border: "#b82020",
      innerBorder: "rgba(184,32,32,0.3)",
      cardBg: "#0f0404",
      imageBg: "bg-red-950",
      iconColor: "text-red-700",
      titleBg: "linear-gradient(180deg, rgba(60,8,8,0.95) 0%, rgba(40,5,5,0.7) 70%, transparent 100%)",
      titleText: "text-red-300",
      titleShadow: "0 0 12px rgba(255,60,60,0.4), 0 1px 2px rgba(0,0,0,0.8)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(15,4,4,0.4) 45%, rgba(15,4,4,0.8) 60%, #0f0404 75%)",
      descText: "text-gray-200",
      enhanceTagBg: "bg-red-900/50 text-red-300",
      enhanceText: "text-red-200",
      divider: "rgba(184,32,32,0.3)",
      noteText: "text-red-400/50",
      tagBg: "linear-gradient(135deg, #8B1A1A, #b82020)",
      tagText: "text-red-200",
      cornerDeco: "rgba(184,32,32,0.3)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(180,40,40,0.06) 0%, transparent 70%)",
    },
  },
  混沌: {
    light: {
      border: "#8B6914",
      innerBorder: "rgba(139,105,20,0.25)",
      cardBg: "#1a1208",
      imageBg: "bg-amber-100",
      iconColor: "text-amber-800",
      titleBg: "linear-gradient(180deg, rgba(120,90,20,0.9) 0%, rgba(100,75,15,0.65) 70%, transparent 100%)",
      titleText: "text-amber-100",
      titleShadow: "0 0 10px rgba(255,215,0,0.3), 0 1px 2px rgba(0,0,0,0.5)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(40,30,8,0.3) 45%, rgba(40,30,8,0.75) 60%, #28200a 75%)",
      descText: "text-amber-100",
      enhanceTagBg: "bg-amber-800/60 text-amber-200",
      enhanceText: "text-amber-200",
      divider: "rgba(139,105,20,0.35)",
      noteText: "text-amber-300/60",
      tagBg: "linear-gradient(135deg, #8B6914, #a07d18)",
      tagText: "text-amber-100",
      cornerDeco: "rgba(139,105,20,0.4)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(180,140,20,0.08) 0%, transparent 70%)",
    },
    dark: {
      border: "#b8860b",
      innerBorder: "rgba(218,165,32,0.3)",
      cardBg: "#0f0b04",
      imageBg: "bg-gray-800",
      iconColor: "text-amber-600",
      titleBg: "linear-gradient(180deg, rgba(42,31,10,0.95) 0%, rgba(30,22,8,0.7) 70%, transparent 100%)",
      titleText: "text-amber-300",
      titleShadow: "0 0 12px rgba(255,215,0,0.3), 0 1px 2px rgba(0,0,0,0.8)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(15,11,4,0.4) 45%, rgba(15,11,4,0.8) 60%, #0f0b04 75%)",
      descText: "text-gray-200",
      enhanceTagBg: "bg-amber-900/50 text-amber-300",
      enhanceText: "text-amber-200",
      divider: "rgba(184,134,11,0.3)",
      noteText: "text-amber-400/50",
      tagBg: "linear-gradient(135deg, #8B6914, #b8860b)",
      tagText: "text-amber-200",
      cornerDeco: "rgba(184,134,11,0.3)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(180,140,20,0.06) 0%, transparent 70%)",
    },
  },
  天使: {
    light: {
      border: "#3B82C8",
      innerBorder: "rgba(59,130,200,0.25)",
      cardBg: "#081220",
      imageBg: "bg-sky-100",
      iconColor: "text-sky-800",
      titleBg: "linear-gradient(180deg, rgba(30,80,160,0.9) 0%, rgba(20,60,130,0.65) 70%, transparent 100%)",
      titleText: "text-sky-100",
      titleShadow: "0 0 10px rgba(100,180,255,0.3), 0 1px 2px rgba(0,0,0,0.5)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(8,18,32,0.3) 45%, rgba(8,18,32,0.75) 60%, #081220 75%)",
      descText: "text-sky-100",
      enhanceTagBg: "bg-sky-800/60 text-sky-200",
      enhanceText: "text-sky-200",
      divider: "rgba(59,130,200,0.35)",
      noteText: "text-sky-300/60",
      tagBg: "linear-gradient(135deg, #3B82C8, #5BA0E0)",
      tagText: "text-sky-100",
      cornerDeco: "rgba(59,130,200,0.4)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(59,130,200,0.08) 0%, transparent 70%)",
    },
    dark: {
      border: "#60A5FA",
      innerBorder: "rgba(96,165,250,0.3)",
      cardBg: "#040a14",
      imageBg: "bg-sky-950",
      iconColor: "text-sky-700",
      titleBg: "linear-gradient(180deg, rgba(10,30,60,0.95) 0%, rgba(6,20,42,0.7) 70%, transparent 100%)",
      titleText: "text-sky-300",
      titleShadow: "0 0 12px rgba(100,180,255,0.4), 0 1px 2px rgba(0,0,0,0.8)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(4,10,20,0.4) 45%, rgba(4,10,20,0.8) 60%, #040a14 75%)",
      descText: "text-gray-200",
      enhanceTagBg: "bg-sky-900/50 text-sky-300",
      enhanceText: "text-sky-200",
      divider: "rgba(96,165,250,0.3)",
      noteText: "text-sky-400/50",
      tagBg: "linear-gradient(135deg, #3B82C8, #60A5FA)",
      tagText: "text-sky-200",
      cornerDeco: "rgba(96,165,250,0.3)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(96,165,250,0.06) 0%, transparent 70%)",
    },
  },
  绝境: {
    light: {
      border: "#2D6B3F",
      innerBorder: "rgba(45,107,63,0.25)",
      cardBg: "#081a0c",
      imageBg: "bg-emerald-100",
      iconColor: "text-emerald-800",
      titleBg: "linear-gradient(180deg, rgba(30,90,50,0.9) 0%, rgba(20,70,38,0.65) 70%, transparent 100%)",
      titleText: "text-emerald-100",
      titleShadow: "0 0 10px rgba(100,255,150,0.3), 0 1px 2px rgba(0,0,0,0.5)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(8,30,14,0.3) 45%, rgba(8,30,14,0.75) 60%, #0a2010 75%)",
      descText: "text-emerald-100",
      enhanceTagBg: "bg-emerald-800/60 text-emerald-200",
      enhanceText: "text-emerald-200",
      divider: "rgba(45,107,63,0.35)",
      noteText: "text-emerald-300/60",
      tagBg: "linear-gradient(135deg, #2D6B3F, #388f52)",
      tagText: "text-emerald-100",
      cornerDeco: "rgba(45,107,63,0.4)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(45,180,80,0.08) 0%, transparent 70%)",
    },
    dark: {
      border: "#2fa855",
      innerBorder: "rgba(47,168,85,0.3)",
      cardBg: "#040f04",
      imageBg: "bg-emerald-950",
      iconColor: "text-emerald-700",
      titleBg: "linear-gradient(180deg, rgba(10,42,16,0.95) 0%, rgba(6,28,10,0.7) 70%, transparent 100%)",
      titleText: "text-emerald-300",
      titleShadow: "0 0 12px rgba(100,255,150,0.3), 0 1px 2px rgba(0,0,0,0.8)",
      overlay:
        "linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(4,15,4,0.4) 45%, rgba(4,15,4,0.8) 60%, #040f04 75%)",
      descText: "text-gray-200",
      enhanceTagBg: "bg-emerald-900/50 text-emerald-300",
      enhanceText: "text-emerald-200",
      divider: "rgba(47,168,85,0.3)",
      noteText: "text-emerald-400/50",
      tagBg: "linear-gradient(135deg, #2D6B3F, #2fa855)",
      tagText: "text-emerald-200",
      cornerDeco: "rgba(47,168,85,0.3)",
      textureBg: "radial-gradient(ellipse at 30% 20%, rgba(45,180,80,0.06) 0%, transparent 70%)",
    },
  },
};

export default function GameCard({ title, description, enhancedEffect, note, image, type = "混沌" }) {
  const { isDark } = useThemeContext();
  const t = themes[type]?.[isDark ? "dark" : "light"] || themes["混沌"][isDark ? "dark" : "light"];

  return (
    <div
      className="relative w-[260px] h-[380px] rounded-lg overflow-hidden select-none transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group"
      style={{
        border: `3px solid ${t.border}`,
        boxShadow: `0 4px 20px ${t.border}40, 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        background: t.cardBg,
      }}
    >
      {/* 内边框装饰 */}
      <div
        className="absolute inset-[3px] rounded-md pointer-events-none z-30"
        style={{ border: `1px solid ${t.innerBorder}` }}
      />

      {/* 四角装饰 */}
      {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-3 h-3 z-30 pointer-events-none`}
          style={{
            borderTop: i < 2 ? `2px solid ${t.cornerDeco}` : "none",
            borderBottom: i >= 2 ? `2px solid ${t.cornerDeco}` : "none",
            borderLeft: i % 2 === 0 ? `2px solid ${t.cornerDeco}` : "none",
            borderRight: i % 2 === 1 ? `2px solid ${t.cornerDeco}` : "none",
          }}
        />
      ))}

      {/* 纹理叠加层 */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: t.textureBg }} />

      {/* === 图片背景层 === */}
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ objectPosition: "100% 25%" }}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center ${t.imageBg}`}
          style={{ paddingBottom: "35%" }}
        >
          <span className={`text-6xl opacity-20 ${t.iconColor}`}>⚔</span>
        </div>
      )}

      {/* 渐变遮罩层 */}
      <div className="absolute inset-0 z-[2]" style={{ background: t.overlay }} />

      {/* === 内容层 === */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* 顶部标题栏 */}
        <div className="shrink-0 px-3 py-2 text-center" style={{ background: t.titleBg }}>
          <h3 className={`text-base font-bold tracking-widest ${t.titleText}`} style={{ textShadow: t.titleShadow }}>
            {title}
          </h3>
        </div>

        {/* 图片展示区占位 */}
        <div className="shrink-0" style={{ height: "55%" }} />

        {/* 描述区 */}
        <div className="flex-1 flex flex-col px-3 pb-2.5 min-h-0">
          {/* 卡牌效果 */}
          <p className={`text-xs leading-relaxed shrink-0 ${t.descText}`}>{description}</p>

          {/* 强化效果 */}
          {enhancedEffect && (
            <div className="shrink-0 mt-1.5">
              <div className="border-t mb-1.5" style={{ borderColor: t.divider }} />
              <div className="flex items-start gap-1.5">
                <span className={`text-[10px] font-bold shrink-0 mt-0.5 px-1 py-0.5 rounded ${t.enhanceTagBg}`}>
                  强化
                </span>
                <p className={`text-xs leading-relaxed ${t.enhanceText}`}>{enhancedEffect}</p>
              </div>
            </div>
          )}

          {/* 弹性留白 */}
          <div className="flex-1" />

          {/* 小注 */}
          {note && (
            <div className="shrink-0">
              <div className="border-t mb-1.5" style={{ borderColor: t.divider }} />
              <p className={`text-[10px] italic leading-relaxed text-center ${t.noteText}`}>{note}</p>
            </div>
          )}
        </div>
      </div>

      {/* 类型标签 */}
      <div
        className={`absolute top-9 right-0 z-30 px-2 py-0.5 text-[10px] font-bold rounded-l ${t.tagText}`}
        style={{
          background: t.tagBg,
          boxShadow: `-2px 1px 4px rgba(0,0,0,0.3)`,
        }}
      >
        {type}
      </div>

      {/* hover 高光 */}
      <div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${t.border}15 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
