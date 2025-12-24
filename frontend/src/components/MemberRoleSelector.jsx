import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Input, Spinner, Badge } from "@heroui/react";
import useSWR from "swr";
import { getUserCharacters } from "../api/characters";
import { xinfaInfoTable } from "../config/xinfa";
import { sortCharacters } from "../utils/characterSort";

/**
 * 成员角色选择组件
 * 根据成员ID显示该成员的角色列表，用户可以快速选择或自由输入
 *
 * @param {Object} props
 * @param {number} props.memberId - 成员ID
 * @param {string} props.value - 当前选中的角色名
 * @param {Function} props.onChange - 角色名变化回调 (characterName) => void
 * @param {Function} props.onRoleSelect - 角色卡片选中回调 (characterName, xinfa) => void
 * @param {string} props.label - 输入框标签
 * @param {string} props.placeholder - 输入框占位符
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
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
}) {
  const [inputValue, setInputValue] = useState(value || "");

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

  const characters = useMemo(() => {
    const rawCharacters = charactersData?.items || [];
    // 使用排序工具函数进行排序
    return sortCharacters(rawCharacters, memberId);
  }, [charactersData, memberId]);

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
  const handleSelectCharacter = (character) => {
    const characterName = character.name;
    setInputValue(characterName);
    onChange?.(characterName);

    // 获取心法key（兼容旧数据的中文名称和新数据的key）
    let xinfaKey = null;
    if (character.xinfa && xinfaInfoTable[character.xinfa]) {
      // 直接作为key查找
      xinfaKey = character.xinfa;
    } else if (character.xinfa) {
      // 通过中文名称查找（兼容旧数据）
      xinfaKey = Object.keys(xinfaInfoTable).find((key) => xinfaInfoTable[key].name === character.xinfa);
    }

    // 调用onRoleSelect回调
    onRoleSelect?.(characterName, xinfaKey);
  };

  // 是否有角色数据可以展示
  const hasCharacters = characters.length > 0;

  return (
    <div className="space-y-3">
      {/* 角色列表卡片（仅在有角色时显示） */}
      {hasCharacters && !isDisabled && (
        <Card className="bg-gray-50 dark:bg-gray-900/50 border border-dashed">
          <CardBody className="gap-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2">成员的角色</p>
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

                  const xinfa = getXinfaInfo(character.xinfa);
                  const isSelected = inputValue === character.name;

                  // 获取当前成员的角色关联信息（优先级和备注）
                  const playerInfo = character.players?.find((p) => p.user_id === memberId);
                  const priority = playerInfo?.priority ?? 0;
                  const notes = playerInfo?.notes || character.remark || "";

                  // 心法颜色样式
                  const xinfaColor = xinfa?.color || "#6b7280";

                  // 根据是否选中调整渐变色
                  const gradientStyle = {
                    background: isSelected
                      ? `linear-gradient(135deg, ${xinfaColor}ee, ${xinfaColor}66)`
                      : `linear-gradient(135deg, ${xinfaColor}50, ${xinfaColor}10)`,
                    border: isSelected ? `2px solid ${xinfaColor}` : `1px solid ${xinfaColor}40`,
                  };

                  return (
                    <button
                      key={character.id}
                      onClick={() => handleSelectCharacter(character)}
                      style={gradientStyle}
                      className={`
                        flex items-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105
                        ${isSelected ? "text-white shadow-lg" : "text-gray-800 dark:text-gray-200 hover:shadow-md"}
                        w-[180px]
                      `}
                    >
                      {/* 心法图标 + 优先级Badge */}
                      {xinfa && (
                        <div className="relative flex-shrink-0">
                          {/* 优先级Badge显示在左下角，一直显示 */}
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
                        <span className="text-sm font-semibold truncate w-full text-left">{character.name}</span>
                        {notes && (
                          <p
                            className={`text-[12px] leading-tight w-full line-clamp-2  text-left ${
                              isSelected ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                            }`}
                            title={notes}
                          >
                            {notes}
                          </p>
                        )}
                      </div>
                    </button>
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
