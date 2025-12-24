import { useState } from "react";
import { Button } from "@heroui/react";
import { xinfaInfoTable } from "../../config/xinfa";
import { updateCharacterRelation } from "../../api/characters";
import { showToast } from "../../utils/toast";

export default function CharacterCard({ character, relationType, onEdit, onDelete, onRelationChanged }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 获取心法信息（兼容旧数据的中文名称和新数据的key）
  const getXinfaInfo = (xinfaValue) => {
    if (!xinfaValue) return null;

    // 先尝试直接作为key查找
    if (xinfaInfoTable[xinfaValue]) {
      return xinfaInfoTable[xinfaValue];
    }

    // 如果不是key，则通过中文名称查找（兼容旧数据）
    const xinfaKey = Object.keys(xinfaInfoTable).find((key) => xinfaInfoTable[key].name === xinfaValue);
    return xinfaKey ? xinfaInfoTable[xinfaKey] : null;
  };

  const xinfa = getXinfaInfo(character.xinfa);

  // 切换关系类型
  const handleToggleRelation = async () => {
    try {
      const newRelationType = relationType === "owner" ? "shared" : "owner";
      await updateCharacterRelation(character.id, newRelationType);
      showToast.success(`已移至${newRelationType === "owner" ? "我的角色" : "共享角色"}`);
      if (onRelationChanged) {
        onRelationChanged();
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "切换失败");
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="group relative h-32 rounded-lg text-white shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      style={{
        background: xinfa ? `linear-gradient(135deg, ${xinfa.color}, #1f1f1f)` : "#1f1f1f",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(character)}
    >
      {/* 鼠标跟随的径向渐变层 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: xinfa
            ? `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, ${xinfa.color
                .replace("rgb(", "rgba(")
                .replace(")", ", 0.9)")}, #0a0a0a 70%)`
            : "#0a0a0a",
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* 门派背景图案 */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundImage: xinfa ? `url(/menpai/${xinfa.menpai}.svg)` : undefined,
        }}
      />

      {/* 内容区域 - 左右布局 */}
      <div className="relative flex h-full p-2 gap-2">
        {/* 左侧：信息区域（两层） */}
        <div className="flex-1 flex flex-col">
          {/* 第一层：心法图标+服务器 | 角色名称 */}
          <div className="flex items-center gap-3 flex-1">
            {/* 心法图标 + 服务器 */}
            <div className="flex flex-col items-center justify-center gap-1">
              {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-12 h-12 rounded shadow-lg" />}
              <div className="text-xs opacity-80 text-center leading-tight whitespace-nowrap">{character.server}</div>
            </div>

            {/* 角色名称 */}
            <div className="flex-1 flex items-center">
              <div className="text-2xl font-bold leading-tight truncate">{character.name}</div>
            </div>
          </div>

          {/* 第二层：备注 */}
          <div className="flex items-center flex-1">
            {character.remark ? (
              <div className="text-sm opacity-70 line-clamp-2">{character.remark}</div>
            ) : (
              <div className="text-xs opacity-50">暂无备注</div>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮（纵向） */}
        <div className="flex flex-col justify-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleRelation();
            }}
            className="text-xs px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
            title={`点击移至${relationType === "owner" ? "共享角色" : "我的角色"}`}
          >
            {relationType === "owner" ? "我的" : "共享"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="text-xs px-3 py-1.5 rounded bg-red-500/30 hover:bg-red-500/50 transition-colors whitespace-nowrap"
            title="删除角色"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
