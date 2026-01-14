import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Input, Spinner, Badge, Chip } from "@heroui/react";
import useSWR from "swr";
import { getUserCharacters } from "@/api/characters";
import { getUserCdStatus } from "@/api/weeklyRecords";
import { xinfaInfoTable } from "@/config/xinfa";
import { sortCharacters } from "@/utils/characterSort";

/**
 * 成员角色选择组件
 * 根据成员ID显示该成员的角色列表，用户可以快速选择或自由输入
 * 支持多修心法切换
 *
 * @param {Object} props
 * @param {number} props.memberId - 成员ID
 * @param {string} props.value - 当前选中的角色名
 * @param {Function} props.onChange - 角色名变化回调 (characterName) => void
 * @param {Function} props.onRoleSelect - 角色卡片选中回调 (characterName, xinfa, characterId) => void
 * @param {string} props.label - 输入框标签
 * @param {string} props.placeholder - 输入框占位符
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
 * @param {string} props.dungeonFilter - 可选，用于筛选CD状态的副本名称
 */
export default function MemberRoleSelector({
  memberId,
  value,
  onChange,
  onRoleSelect,
  label = "角色名",
  placeholder = "选择或输入角色名...",
  isRequired = false,
  isDisabled = false,
  dungeonFilter = null,
}) {
  const [inputValue, setInputValue] = useState(value || "");
  // 记录每个角色当前选中的心法（用于多修切换）
  const [selectedXinfaMap, setSelectedXinfaMap] = useState({});

  // 获取成员的角色列表
  const { data: charactersData, isLoading } = useSWR(
    memberId ? `user-characters-${memberId}` : null,
    () => getUserCharacters(memberId, { page: 1, page_size: 100 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  );

  // 获取成员角色的CD状态
  const { data: cdStatusData } = useSWR(
    memberId ? `user-cd-status-${memberId}-${dungeonFilter || "all"}` : null,
    () => getUserCdStatus(memberId, dungeonFilter),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1分钟内去重
    }
  );

  const cdStatus = cdStatusData?.data || cdStatusData || {};

  const characters = useMemo(() => {
    const rawCharacters = charactersData?.items || [];
    // 使用排序工具函数进行排序，并考虑CD状态
    const sorted = sortCharacters(rawCharacters, memberId);

    // 将已清CD的角色排到最后
    if (Object.keys(cdStatus).length > 0 && dungeonFilter) {
      return sorted.sort((a, b) => {
        const aHasCd = cdStatus[a.id]?.[dungeonFilter] || false;
        const bHasCd = cdStatus[b.id]?.[dungeonFilter] || false;
        if (aHasCd && !bHasCd) return 1;
        if (!aHasCd && bHasCd) return -1;
        return 0;
      });
    }
    return sorted;
  }, [charactersData, memberId, cdStatus, dungeonFilter]);

  // 同步外部 value 变化
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // 处理输入变化
  const handleInputChange = (val) => {
    setInputValue(val);
    onChange?.(val);
  };

  // 处理点击角色卡片
  const handleSelectCharacter = (character, selectedXinfa = null) => {
    const characterName = character.name;
    setInputValue(characterName);
    onChange?.(characterName);

    // 确定使用的心法：优先使用传入的选中心法，否则使用角色主心法
    const xinfaToUse = selectedXinfa || selectedXinfaMap[character.id] || character.xinfa;

    // 获取心法key（兼容旧数据的中文名称和新数据的key）
    let xinfaKey = null;
    if (xinfaToUse && xinfaInfoTable[xinfaToUse]) {
      // 直接作为key查找
      xinfaKey = xinfaToUse;
    } else if (xinfaToUse) {
      // 通过中文名称查找（兼容旧数据）
      xinfaKey = Object.keys(xinfaInfoTable).find((key) => xinfaInfoTable[key].name === xinfaToUse);
    }

    // 调用onRoleSelect回调，传递角色ID
    onRoleSelect?.(characterName, xinfaKey, character.id);
  };

  // 处理多修心法切换
  const handleXinfaSwitch = (e, character, xinfaKey) => {
    e.stopPropagation(); // 阻止冒泡到卡片点击事件

    // 更新该角色选中的心法
    setSelectedXinfaMap((prev) => ({
      ...prev,
      [character.id]: xinfaKey,
    }));

    // 如果当前已选中该角色，需要更新报名使用的心法
    if (inputValue === character.name) {
      handleSelectCharacter(character, xinfaKey);
    }
  };

  // 是否有角色数据可以展示
  const hasCharacters = characters.length > 0;

  return (
    <div className="space-y-3">
      {/* 角色列表卡片（仅在有角色时显示） */}
      {hasCharacters && !isDisabled && (
        <Card className="bg-gray-50/50 dark:bg-gray-900/50 border border-dashed">
          <CardBody className="gap-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {characters.map((character) => {
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

                  // 当前选中的心法（用于多修切换）
                  const currentXinfaKey = selectedXinfaMap[character.id] || character.xinfa;
                  const xinfa = getXinfaInfo(currentXinfaKey);
                  const isSelected = inputValue === character.name;

                  // 获取所有可用心法（主心法 + 多修心法）
                  const allXinfas = [character.xinfa, ...(character.secondary_xinfas || [])];
                  const hasMultipleXinfas = allXinfas.length > 1;

                  // 检查该角色是否已清CD（任意副本或指定副本）
                  const characterCdStatus = cdStatus[character.id] || {};
                  const hasClearedCd = dungeonFilter
                    ? characterCdStatus[dungeonFilter]
                    : Object.keys(characterCdStatus).length > 0;
                  const clearedDungeons = Object.keys(characterCdStatus);

                  // 获取当前成员的角色关联信息（备注）
                  const playerInfo = character.players?.find((p) => p.user_id === memberId);
                  const notes = playerInfo?.notes || character.remark || "";

                  // 心法颜色样式
                  const xinfaColor = xinfa?.color || "#6b7280";

                  // 根据是否选中和CD状态调整渐变色
                  const gradientStyle = hasClearedCd
                    ? {
                        background: `linear-gradient(135deg, #9ca3af50, #9ca3af10)`,
                        border: isSelected ? `2px solid #9ca3af` : `1px solid #9ca3af40`,
                        opacity: 0.7,
                      }
                    : {
                        background: isSelected
                          ? `linear-gradient(135deg, ${xinfaColor}ee, ${xinfaColor}66)`
                          : `linear-gradient(135deg, ${xinfaColor}50, ${xinfaColor}10)`,
                        border: isSelected ? `2px solid ${xinfaColor}` : `1px solid ${xinfaColor}40`,
                      };

                  return (
                    <div key={character.id} className="flex flex-col w-[180px]">
                      <button
                        onClick={() => handleSelectCharacter(character)}
                        style={gradientStyle}
                        className={`
                          flex items-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]
                          ${isSelected ? "text-white shadow-lg" : "text-gray-800 dark:text-gray-200 hover:shadow-md"}
                          ${hasMultipleXinfas ? "rounded-b-none" : ""}
                        `}
                      >
                        {/* 心法图标 */}
                        {xinfa && (
                          <div className="relative flex-shrink-0">
                            <img
                              src={`/xinfa/${xinfa.icon}`}
                              alt={xinfa.name}
                              className="w-10 h-10 rounded-md"
                              title={xinfa.name}
                            />
                          </div>
                        )}

                        {/* 右侧：角色名和备注 */}
                        <div className="flex flex-col items-start min-w-0 flex-1 gap-0.5">
                          <div className="flex items-center gap-1 w-full">
                            <span className="text-sm font-semibold truncate text-left">{character.name}</span>
                            {hasClearedCd && (
                              <Chip size="sm" color="default" variant="flat" className="text-[10px] h-4 px-1">
                                已清
                              </Chip>
                            )}
                          </div>
                          {notes && (
                            <p
                              className={`text-[12px] leading-tight w-full line-clamp-2 text-left ${
                                isSelected ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                              }`}
                              title={notes}
                            >
                              {notes}
                            </p>
                          )}
                          {hasClearedCd && clearedDungeons.length > 0 && !dungeonFilter && (
                            <p
                              className="text-[10px] text-gray-400 truncate w-full text-left"
                              title={clearedDungeons.join(", ")}
                            >
                              {clearedDungeons.slice(0, 2).join(", ")}
                              {clearedDungeons.length > 2 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* 多修心法切换栏 */}
                      {hasMultipleXinfas && (
                        <div
                          className="flex gap-0.5 px-1 py-1 rounded-b-lg bg-black/20 dark:bg-white/10"
                          style={{
                            borderLeft: gradientStyle.border,
                            borderRight: gradientStyle.border,
                            borderBottom: gradientStyle.border,
                          }}
                        >
                          {allXinfas.map((xKey) => {
                            const xInfo = getXinfaInfo(xKey);
                            if (!xInfo) return null;
                            const isCurrentXinfa = currentXinfaKey === xKey;
                            return (
                              <button
                                key={xKey}
                                onClick={(e) => handleXinfaSwitch(e, character, xKey)}
                                className={`
                                  flex-1 flex items-center justify-center p-1 rounded transition-all
                                  ${
                                    isCurrentXinfa
                                      ? "bg-white/30 ring-1 ring-white/50"
                                      : "hover:bg-white/20 opacity-60 hover:opacity-100"
                                  }
                                `}
                                title={xInfo.name}
                              >
                                <img src={`/xinfa/${xInfo.icon}`} alt={xInfo.name} className="w-6 h-6 rounded" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 角色名输入框 */}
      <Input
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onValueChange={handleInputChange}
        isRequired={isRequired}
        isDisabled={isDisabled}
        className="w-full"
      />
    </div>
  );
}
