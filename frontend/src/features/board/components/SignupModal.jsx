import { useEffect, useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Switch } from "@heroui/react";
import useSWR from "swr";
import MemberRoleSelector from "@/components/common/MemberRoleSelector";
import XinfaSelector from "@/components/common/XinfaSelector";
import { createSignup } from "@/api/signups";
import { createCharacter, getUserCharacters } from "@/api/characters";
import { getGuildMembers } from "@/api/guilds";
import { showToast } from "@/utils/toast";
import { getMemberNickname, getUserNickname } from "@/utils/memberUtils";

/**
 * 自己报名弹窗
 */
export default function SignupModal({ isOpen, onClose, guildId, teamId, team, user, onSuccess }) {
  const [characterName, setCharacterName] = useState("");
  const [characterId, setCharacterId] = useState(null);
  const [xinfa, setXinfa] = useState("");
  const [isRich, setIsRich] = useState(false);
  const [saveToMyCharacters, setSaveToMyCharacters] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取用户角色列表用于去重检查
  const { data: charactersData } = useSWR(
    user?.id ? `user-characters-${user.id}` : null,
    () => getUserCharacters(user.id, { page: 1, page_size: 100 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  );

  // 获取群组成员列表用于获取群昵称
  const { data: membersData } = useSWR(
    guildId ? `guild-members-${guildId}` : null,
    () => getGuildMembers(guildId, { page: 1, page_size: 2000 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  );

  const characters = useMemo(() => charactersData?.items || [], [charactersData]);

  // 自动获取昵称（优先级：群昵称 > 主要昵称 > 其他昵称 > QQ号）
  const playerName = useMemo(() => {
    if (!user) return "";

    // 如果有群组ID，尝试从成员列表获取群昵称
    if (guildId && membersData) {
      const members = membersData?.data?.items || membersData?.data || [];
      const currentMember = members.find((m) => m.user_id === user.id);
      if (currentMember) {
        return getMemberNickname(currentMember);
      }
    }

    // 否则使用用户昵称
    return getUserNickname(user);
  }, [user, guildId, membersData]);

  // 判断是否显示"保存到我的角色"勾选框
  // 只有当角色名不为空，且（角色名+心法）组合在用户角色列表中不存在时，才显示勾选框
  const shouldShowSaveSwitch = useMemo(() => {
    if (!characterName || !xinfa) return false;
    return !characters.some((c) => c.name === characterName && c.xinfa === xinfa);
  }, [characterName, xinfa, characters]);

  useEffect(() => {
    if (isOpen) {
      setCharacterName("");
      setCharacterId(null);
      setXinfa("");
      setIsRich(false);
      setSaveToMyCharacters(true);
      setSubmitting(false);
    }
  }, [isOpen]);

  // 处理角色卡片选择
  const handleRoleSelect = (name, xinfaKey, charId) => {
    setCharacterName(name);
    setXinfa(xinfaKey);
    setCharacterId(charId || null);
    // 选择已有角色时，不需要保存（勾选框会自动隐藏）
  };

  const handleSubmit = async () => {
    if (!xinfa) {
      showToast.error("请选择心法");
      return;
    }
    try {
      setSubmitting(true);

      // 1. 如果勾选了"保存到我的角色"且勾选框可见
      if (shouldShowSaveSwitch && saveToMyCharacters && characterName) {
        try {
          await createCharacter({
            name: characterName,
            server: "乾坤一掷",
            xinfa: xinfa,
          });
        } catch (e) {
          // 忽略角色创建失败（可能是后端去重）
          console.warn("角色保存失败，继续提交报名", e);
        }
      }

      // 2. 提交报名
      const response = await createSignup(guildId, teamId, {
        signup_user_id: user?.id || null,
        signup_character_id: characterId,
        signup_info: {
          submitter_name: playerName || "我",
          player_name: playerName || "",
          character_name: characterName,
          xinfa,
        },
        is_rich: isRich,
      });

      // 3. 成功提示（显示后端返回的详细消息）
      const message = response?.message || response?.data?.message || "报名成功";
      showToast.success(message);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      showToast.error(e || "报名失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="lg"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800",
        header: "border-b border-pink-200 dark:border-pink-900",
        footer: "border-t border-pink-200 dark:border-pink-900",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            📝 报名开团
          </h2>
          {team && <p className="text-sm text-default-500 font-normal">{team.title || "未命名开团"}</p>}
        </ModalHeader>
        <ModalBody>
          {/* 老板位开关 */}
          <div className="flex items-center gap-3 px-1">
            <Switch isSelected={isRich} onValueChange={setIsRich} color="secondary">
              朕要当老板
            </Switch>
          </div>

          {/* 角色选择器（带角色卡片） */}
          <MemberRoleSelector
            memberId={user?.id}
            value={characterName}
            onChange={setCharacterName}
            onRoleSelect={handleRoleSelect}
            label="角色名称"
            placeholder="选择或输入角色名..."
            isRequired={false}
            dungeonFilter={team?.dungeon}
          />

          {/* 心法选择 */}
          <XinfaSelector label="心法" value={xinfa} onChange={setXinfa} isRequired variant="flat" />

          {/* "保存到我的角色"勾选框（条件显示） */}
          {shouldShowSaveSwitch && (
            <div className="flex items-center gap-2 px-1">
              <Switch isSelected={saveToMyCharacters} onValueChange={setSaveToMyCharacters} color="success" size="sm">
                <span className="text-sm">保存到我的角色</span>
              </Switch>
            </div>
          )}

          <p className="text-xs text-default-500">
            心法为必填项。{shouldShowSaveSwitch ? "勾选后会将角色保存到你的角色列表。" : ""}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={submitting}>
            取消
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
            确认报名
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
