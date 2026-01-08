import { useMemo, useState } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import useSWR from "swr";
import { pinyin } from "pinyin-pro";
import { getGuildMembers } from "@/api/guilds";
import useCurrentGuild from "@/hooks/useCurrentGuild";
import MemberRoleSelector from "./MemberRoleSelector";
import XinfaSelector from "./XinfaSelector";
import { Input } from "@heroui/react";

/**
 * 群组成员角色选择器组件
 * 整合成员选择、角色名输入、心法选择的完整联动体验
 * 成员选择格式参考UserSelector，显示名称、QQ号、其他昵称
 *
 * @param {Object} props
 * @param {number} props.guildId - 群组ID（可选，默认使用全局当前群组）
 * @param {string|number} props.memberId - 选中的成员用户ID
 * @param {Function} props.onMemberChange - 成员变化回调 (memberId) => void
 * @param {Function} props.onPlayerNameChange - 玩家名称输入变化回调 (playerName) => void
 * @param {string} props.characterName - 角色名
 * @param {Function} props.onCharacterNameChange - 角色名变化回调 (name) => void
 * @param {Function} props.onCharacterIdChange - 角色ID变化回调 (characterId) => void
 * @param {string} props.characterXinfa - 心法
 * @param {Function} props.onXinfaChange - 心法变化回调 (xinfa) => void
 * @param {string} props.memberLabel - 成员选择标签
 * @param {string} props.characterLabel - 角色名标签
 * @param {string} props.xinfaLabel - 心法选择标签
 * @param {boolean} props.isRequired - 是否必填
 * @param {boolean} props.isDisabled - 是否禁用
 * @param {boolean} props.allowCustomValue - 是否允许自定义输入（不仅从列表选择）
 * @param {boolean} props.showXinfa - 是否显示心法选择器（默认true）
 * @param {Array<number|string>} props.excludeUserIds - 需要排除的用户ID列表
 * @param {string} props.dungeonFilter - 可选，用于筛选CD状态的副本名称
 */
export default function GroupMemberSelector({
  guildId,
  memberId,
  onMemberChange,
  onPlayerNameChange,
  characterName,
  onCharacterNameChange,
  onCharacterIdChange,
  characterXinfa,
  onXinfaChange,
  memberLabel = "群组成员",
  characterLabel = "角色名",
  xinfaLabel = "心法",
  isRequired = false,
  isDisabled = false,
  allowCustomValue = false,
  showXinfa = true,
  excludeUserIds = [],
  dungeonFilter = null,
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
    let memberList = [];
    if (Array.isArray(payload)) memberList = payload;
    else if (payload && Array.isArray(payload.items)) memberList = payload.items;
    else if (Array.isArray(membersData?.items)) memberList = membersData.items;

    console.log("GroupMemberSelector - excludeUserIds:", excludeUserIds);
    console.log(
      "GroupMemberSelector - memberList before filter:",
      memberList.length,
      memberList.map((m) => ({ id: m.user_id, name: m.user?.nickname }))
    );

    // 过滤掉被排除的用户
    if (excludeUserIds && excludeUserIds.length > 0) {
      const excludeSet = new Set(excludeUserIds.map((id) => String(id)));
      console.log("GroupMemberSelector - excludeSet:", Array.from(excludeSet));
      memberList = memberList.filter((member) => {
        const shouldExclude = excludeSet.has(String(member.user_id));
        if (shouldExclude) {
          console.log("GroupMemberSelector - excluding member:", member.user_id, member.user?.nickname);
        }
        return !shouldExclude;
      });
    }

    console.log("GroupMemberSelector - memberList after filter:", memberList.length);
    return memberList;
  }, [membersData, excludeUserIds]);

  // 预处理成员数据，生成拼音与首字母索引
  const enhancedMembers = useMemo(() => {
    if (!members.length) return [];
    const toPinyin = (text) => pinyin(text || "", { toneType: "none", type: "array" }).join("");
    const toInitials = (text) => pinyin(text || "", { pattern: "first", toneType: "none", type: "array" }).join("");

    const result = members.map((member) => {
      const user = member.user || {};
      const userNickname = user.nickname || "";
      const groupNickname = member.group_nickname || "";
      const otherNicknames = user.other_nicknames || [];
      const qqNumber = String(user.qq_number || "");

      // 主昵称拼音
      const pinyinUser = toPinyin(userNickname);
      const initialsUser = toInitials(userNickname);

      // 群昵称拼音
      const pinyinGroup = toPinyin(groupNickname);
      const initialsGroup = toInitials(groupNickname);

      // 其他昵称拼音
      const otherPinyin = otherNicknames.map(toPinyin);
      const otherInitials = otherNicknames.map(toInitials);

      const searchText = [
        userNickname,
        groupNickname,
        ...otherNicknames,
        qqNumber,
        pinyinUser,
        initialsUser,
        pinyinGroup,
        initialsGroup,
        ...otherPinyin,
        ...otherInitials,
      ]
        .filter(Boolean)
        .join("|")
        .toLowerCase();

      return {
        ...member,
        searchText,
      };
    });

    return result;
  }, [members]);

  // 根据搜索关键词过滤成员
  const filteredMembers = useMemo(() => {
    // 如果没有搜索关键词，显示前50个成员
    if (!searchKeyword.trim()) {
      return enhancedMembers.slice(0, 50);
    }

    const searchKey = searchKeyword.toLowerCase().trim();
    const filtered = enhancedMembers.filter((member) => member.searchText.includes(searchKey));

    // 确保当前选中的成员始终在列表中（即使搜索关键词不匹配）
    if (memberId) {
      const selectedMember = enhancedMembers.find((m) => String(m.user_id) === String(memberId));
      if (selectedMember && !filtered.find((m) => String(m.user_id) === String(memberId))) {
        // 将选中的成员添加到列表开头
        filtered.unshift(selectedMember);
      }
    }

    return filtered.slice(0, 50);
  }, [enhancedMembers, searchKeyword, memberId]);

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
          // 当从列表中选择成员时，获取该成员的昵称并传递给父组件
          if (key) {
            const selectedMember = enhancedMembers.find((m) => String(m.user_id) === String(key));
            if (selectedMember) {
              const playerName = getPrimaryNickname(selectedMember);
              onPlayerNameChange?.(playerName);
            }
          } else {
            onPlayerNameChange?.("");
          }
        }}
        onInputChange={(value) => {
          // 更新搜索关键词用于过滤列表
          setSearchKeyword(value || "");
          // 如果允许自定义输入，将输入值传递给父组件作为 player_name
          if (allowCustomValue) {
            onPlayerNameChange?.(value);
          }
        }}
        isRequired={isRequired}
        isDisabled={isDisabled || !effectiveGuildId}
        isLoading={isLoading}
        className="w-full"
        allowsCustomValue={allowCustomValue}
        description={!effectiveGuildId ? "请先选择群组" : undefined}
        items={filteredMembers}
        defaultItems={filteredMembers}
      >
        {(member) => (
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
        )}
      </Autocomplete>

      {/* 角色卡片（仅当有成员且有效群组时显示） */}
      {hasValidGuild && memberId ? (
        <MemberRoleSelector
          memberId={Number(memberId)}
          value={characterName}
          onChange={(name) => {
            onCharacterNameChange?.(name);
          }}
          onRoleSelect={(name, xinfa, characterId) => {
            onCharacterNameChange?.(name);
            // 当选择角色卡片时，自动填入对应心法
            if (xinfa) {
              onXinfaChange?.(xinfa);
            }
            // 如果提供了 onCharacterIdChange 回调，传递角色ID
            if (characterId) {
              onCharacterIdChange?.(characterId);
            }
          }}
          label={characterLabel}
          placeholder="选择或输入角色名..."
          isRequired={false}
          isDisabled={isDisabled}
          dungeonFilter={dungeonFilter}
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
      {showXinfa && (
        <XinfaSelector
          label={xinfaLabel}
          placeholder="选择心法"
          value={characterXinfa}
          onChange={onXinfaChange}
          isRequired={isRequired}
          isDisabled={isDisabled}
        />
      )}
    </div>
  );
}
