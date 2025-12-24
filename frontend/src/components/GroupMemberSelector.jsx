import { useMemo, useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import useSWR from "swr";
import Fuse from "fuse.js";
import { pinyin } from "pinyin-pro";
import { getGuildMembers } from "../api/guilds";
import useCurrentGuild from "../hooks/useCurrentGuild";
import MemberRoleSelector from "./MemberRoleSelector";
import { allXinfaList, xinfaInfoTable } from "../config/xinfa";
import { Select, SelectItem, Input } from "@heroui/react";

/**
 * 群组成员角色选择器组件
 * 整合成员选择、角色名输入、心法选择的完整联动体验
 * 成员选择格式参考UserSelector，显示名称、QQ号、其他昵称
 *
 * @param {Object} props
 * @param {number} props.guildId - 群组ID（可选，默认使用全局当前群组）
 * @param {string|number} props.memberId - 选中的成员用户ID
 * @param {Function} props.onMemberChange - 成员变化回调 (memberId) => void
 * @param {string} props.characterName - 角色名
 * @param {Function} props.onCharacterNameChange - 角色名变化回调 (name) => void
 * @param {string} props.characterXinfa - 心法
 * @param {Function} props.onXinfaChange - 心法变化回调 (xinfa) => void
 * @param {string} props.memberLabel - 成员选择标签
 * @param {string} props.characterLabel - 角色名标签
 * @param {string} props.xinfaLabel - 心法选择标签
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
 */
export default function GroupMemberSelector({
  guildId,
  memberId,
  onMemberChange,
  characterName,
  onCharacterNameChange,
  characterXinfa,
  onXinfaChange,
  memberLabel = "群组成员",
  characterLabel = "角色名",
  xinfaLabel = "心法",
  isRequired = false,
  isDisabled = false,
}) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const { currentGuildId } = useCurrentGuild();
  const effectiveGuildId = guildId ?? currentGuildId;
  
  // 是否有有效的群组ID（决定是否显示角色卡片）
  const hasValidGuild = Boolean(effectiveGuildId);

  // 获取群组成员列表
  const { data: membersData, isLoading } = useSWR(
    effectiveGuildId ? `guild-members-${effectiveGuildId}` : null,
    () => getGuildMembers(effectiveGuildId, { page: 1, page_size: 2000 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  );

  const members = useMemo(() => {
    // 后端可能返回两种结构：
    // 1) { code, message, data: [ ... ] }
    // 2) { code, message, data: { items: [ ... ], total, ... } }
    // 也兼容少数 { items: [ ... ] } 的情况
    const payload = membersData?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(membersData?.items)) return membersData.items;
    return [];
  }, [membersData]);

  // 预处理成员数据，生成拼音与首字母索引
  const enhancedMembers = useMemo(() => {
    if (!members.length) return [];
    const toPinyin = (text) => pinyin(text || "", { toneType: "none", type: "array" }).join("");
    const toInitials = (text) => pinyin(text || "", { pattern: "first", toneType: "none", type: "array" }).join("");

    return members.map((member) => {
      const userNickname = member.user?.nickname || "";
      const groupNickname = member.group_nickname || "";
      const pinyinUser = toPinyin(userNickname);
      const initialsUser = toInitials(userNickname);
      const pinyinGroup = toPinyin(groupNickname);
      const initialsGroup = toInitials(groupNickname);

      const searchText = [userNickname, groupNickname, pinyinUser, initialsUser, pinyinGroup, initialsGroup]
        .filter(Boolean)
        .join("|")
        .toLowerCase();

      return {
        ...member,
        searchText,
      };
    });
  }, [members]);

  // 配置 Fuse.js 模糊搜索
  const fuse = useMemo(() => {
    if (!enhancedMembers.length) return null;
    return new Fuse(enhancedMembers, {
      keys: [
        { name: "user.nickname", weight: 2 },
        { name: "group_nickname", weight: 2 },
        { name: "searchText", weight: 2 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
      shouldSort: true,
    });
  }, [enhancedMembers]);

  // 前端模糊搜索
  const filteredMembers = useMemo(() => {
    if (!searchKeyword || !fuse) return enhancedMembers.slice(0, 50);
    const results = fuse.search(searchKeyword);
    return results.slice(0, 50).map((result) => result.item);
  }, [enhancedMembers, searchKeyword, fuse]);

  // 处理成员显示文本（参考UserSelector格式）
  const getPrimaryNickname = (member) => {
    const user = member.user;
    if (!user) return "未知成员";
    if (user.nickname) return user.nickname;
    const other = (user.other_nicknames || []).find(Boolean);
    return other || String(user.qq_number || "");
  };

  const getOtherNicknamesText = (member) => {
    const user = member.user;
    if (!user) return "";
    const others = (user.other_nicknames || []).filter(Boolean);
    if (!others.length) return "";
    // 不包含主昵称，避免重复
    const primary = user.nickname || "";
    const filtered = others.filter((n) => n !== primary);
    return filtered.join(", ");
  };

  const getDisplayName = (member) => {
    const user = member.user;
    if (!user) return "未知成员";
    return `${getPrimaryNickname(member)} (${user.qq_number})`;
  };

  return (
    <div className="space-y-3">
      {/* 成员选择 */}
      <Autocomplete
        label={memberLabel}
        placeholder="输入昵称或QQ号搜索..."
        selectedKey={memberId ? String(memberId) : null}
        onSelectionChange={(key) => {
          onMemberChange?.(key);
          // 选中后填充输入框为所选成员的展示名
          const selected = (members || []).find((m) => String(m.user_id) === String(key));
          if (selected) {
            setSearchKeyword(getDisplayName(selected));
          }
        }}
        inputValue={searchKeyword}
        onInputChange={setSearchKeyword}
        isRequired={isRequired}
        isDisabled={isDisabled || !effectiveGuildId}
        isLoading={isLoading}
        className="w-full"
        allowsCustomValue={false}
        description={!effectiveGuildId ? "请先选择群组" : undefined}
      >
        {filteredMembers.map((member) => (
          <AutocompleteItem key={member.user_id} value={String(member.user_id)} textValue={getDisplayName(member)}>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium">
                {getPrimaryNickname(member)} ({member.user?.qq_number})
              </div>
              {getOtherNicknamesText(member) && (
                <div className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  {getOtherNicknamesText(member)}
                </div>
              )}
              {member.group_nickname && (
                <div className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                  群内昵称: {member.group_nickname}
                </div>
              )}
            </div>
          </AutocompleteItem>
        ))}
      </Autocomplete>

      {/* 角色卡片（仅当有成员且有效群组时显示） */}
      {hasValidGuild && memberId ? (
        <MemberRoleSelector
          memberId={Number(memberId)}
          value={characterName}
          onChange={(name) => {
            onCharacterNameChange?.(name);
            // 当选择角色卡片时，自动填入对应心法
            const charactersData = members.find(m => String(m.user_id) === String(memberId));
            // 这里需要从MemberRoleSelector获取角色数据，暂时先不自动填入
          }}
          label={characterLabel}
          placeholder="选择或输入角色名..."
          isRequired={false}
          isDisabled={isDisabled}
        />
      ) : (
        /* 普通角色名输入框（当没有成员或群组时） */
        <Input
          label={characterLabel}
          placeholder="输入角色名..."
          value={characterName || ""}
          onValueChange={onCharacterNameChange}
          isRequired={false}
          isDisabled={isDisabled}
        />
      )}

      {/* 心法选择 */}
      <Select
        label={xinfaLabel}
        placeholder="选择心法"
        selectedKeys={characterXinfa ? new Set([characterXinfa]) : new Set()}
        onSelectionChange={(keys) => {
          const selectedXinfa = Array.from(keys)[0];
          onXinfaChange?.(selectedXinfa);
        }}
        isRequired={false}
        isDisabled={isDisabled}
      >
        {allXinfaList.map((xinfa) => {
          const info = xinfaInfoTable[xinfa];
          return (
            <SelectItem key={xinfa} textValue={info.name}>
              <div className="flex items-center gap-2">
                <img src={`/xinfa/${info.icon}`} alt={info.name} className="w-6 h-6" />
                <span>{info.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </Select>
    </div>
  );
}
