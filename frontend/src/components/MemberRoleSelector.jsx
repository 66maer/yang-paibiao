import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Input, Spinner } from "@heroui/react";
import useSWR from "swr";
import { getUserCharacters } from "../api/characters";
import { xinfaInfoTable } from "../config/xinfa";

/**
 * 成员角色选择组件
 * 根据成员ID显示该成员的角色列表，用户可以快速选择或自由输入
 *
 * @param {Object} props
 * @param {number} props.memberId - 成员ID
 * @param {string} props.value - 当前选中的角色名
 * @param {Function} props.onChange - 角色名变化回调 (characterName) => void
 * @param {string} props.label - 输入框标签
 * @param {string} props.placeholder - 输入框占位符
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
 */
export default function MemberRoleSelector({
  memberId,
  value,
  onChange,
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

  const characters = useMemo(() => charactersData?.items || [], [charactersData]);

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
  const handleSelectCharacter = (characterName) => {
    setInputValue(characterName);
    onChange?.(characterName);
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

                  return (
                    <button
                      key={character.id}
                      onClick={() => handleSelectCharacter(character.name)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-md transition
                        ${
                          isSelected
                            ? "bg-primary text-white ring-2 ring-primary"
                            : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                        }
                      `}
                    >
                      {xinfa && (
                        <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-5 h-5" title={xinfa.name} />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{xinfa?.name || "未知心法"}</span>
                        <span className="text-xs text-gray-500">{character.name}</span>
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
