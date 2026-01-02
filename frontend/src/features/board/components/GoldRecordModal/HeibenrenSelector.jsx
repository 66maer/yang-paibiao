import { Switch } from "@heroui/react";
import GroupMemberSelector from "@/components/common/GroupMemberSelector";

/**
 * 黑本人选择器组件
 * 支持野人黑本模式和成员选择模式
 *
 * @param {boolean} isWildHeibenren - 是否野人黑本
 * @param {function} onWildChange - 野人模式切换回调
 * @param {number} memberId - 成员ID
 * @param {function} onMemberChange - 成员变化回调
 * @param {function} onPlayerNameChange - 玩家名称变化回调
 * @param {string} characterName - 角色名
 * @param {function} onCharacterNameChange - 角色名变化回调
 * @param {function} onCharacterIdChange - 角色ID变化回调
 * @param {number} guildId - 群组ID
 */
export default function HeibenrenSelector({
  isWildHeibenren,
  onWildChange,
  memberId,
  onMemberChange,
  onPlayerNameChange,
  characterName,
  onCharacterNameChange,
  onCharacterIdChange,
  guildId
}) {
  // 处理野人模式切换
  const handleWildChange = (isWild) => {
    onWildChange(isWild);
    // 切换时清空数据
    if (isWild) {
      onMemberChange(null);
      onPlayerNameChange?.("");
      onCharacterIdChange(null);
      onCharacterNameChange("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">黑本人</span>
        <Switch size="sm" isSelected={isWildHeibenren} onValueChange={handleWildChange}>
          野人黑本
        </Switch>
      </div>

      {!isWildHeibenren && (
        <GroupMemberSelector
          guildId={guildId}
          memberId={memberId}
          onMemberChange={onMemberChange}
          onPlayerNameChange={onPlayerNameChange}
          characterName={characterName}
          onCharacterNameChange={onCharacterNameChange}
          onCharacterIdChange={onCharacterIdChange}
          memberLabel="选择成员"
          characterLabel="黑本角色"
          allowCustomValue={true}
          showXinfa={false}
        />
      )}
    </div>
  );
}
