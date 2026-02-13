import GameCard from "@/components/common/GameCard";
import { useThemeContext } from "@/contexts/ThemeContext";
import cardData from "./cardData.json";
import { typeConfig, getImagePath } from "./cardUtils";

export default function Games2026Page() {
  const { isDark, toggleTheme } = useThemeContext();

  const sections = [
    { key: "恶魔卡", label: "恶魔卡", color: isDark ? "text-red-400" : "text-red-800" },
    { key: "混沌卡", label: "混沌卡", color: isDark ? "text-amber-400" : "text-amber-800" },
    { key: "绝境卡", label: "绝境卡", color: isDark ? "text-emerald-400" : "text-emerald-800" },
  ];

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100"}`}
    >
      <div className="max-w-[900px] mx-auto">
        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-800"}`}>团建卡牌图鉴</h1>
          <button
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {isDark ? "浅色模式" : "深色模式"}
          </button>
        </div>

        {/* 各类型卡牌 */}
        {sections.map(({ key, label, color }) => {
          const { dir, type } = typeConfig[key];
          const cards = cardData[key] || [];

          return (
            <section key={key} className="mb-10">
              <h2 className={`text-xl font-bold mb-4 ${color}`}>
                {label}
                <span className={`text-sm font-normal ml-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  ({cards.length} 张)
                </span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {cards.map((card) => (
                  <GameCard
                    key={`${key}-${card.id}`}
                    type={type}
                    title={card.name}
                    description={card.desc}
                    enhancedEffect={card.desc_strengthen}
                    note={card.note}
                    image={getImagePath(card.name, dir)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
