import { useEffect, useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Switch } from "@heroui/react";
import useSWR from "swr";
import GroupMemberSelector from "../GroupMemberSelector";
import { createSignup } from "../../api/signups";
import { getGuildMembers } from "../../api/guilds";
import { showToast } from "../../utils/toast";
import { getMemberNickname } from "../../utils/memberUtils";

/**
 * 代报名弹窗
 */
export default function ProxySignupModal({ isOpen, onClose, guildId, teamId, team, user, onSuccess }) {
  const [memberId, setMemberId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterId, setCharacterId] = useState(null);
  const [xinfa, setXinfa] = useState("");
  const [isRich, setIsRich] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 获取群组成员列表
  const { data: membersData } = useSWR(
    guildId ? `guild-members-${guildId}` : null,
    () => getGuildMembers(guildId, { page: 1, page_size: 2000 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5分钟内去重
    }
  );

  // 根据 memberId 获取成员信息，自动填充 player_name（优先级：群昵称 > 主要昵称 > 其他昵称 > QQ号）
  const selectedMember = useMemo(() => {
    if (!memberId || !membersData) return null;
    const members = membersData?.data?.items || membersData?.data || [];
    return members.find((m) => String(m.user_id) === String(memberId));
  }, [memberId, membersData]);

  const playerName = useMemo(() => {
    if (!selectedMember) return "";
    return getMemberNickname(selectedMember);
  }, [selectedMember]);

  useEffect(() => {
    if (isOpen) {
      setMemberId("");
      setCharacterName("");
      setCharacterId(null);
      setXinfa("");
      setIsRich(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // 验证：必须选择成员和心法
    if (!memberId) {
      showToast.error("请选择群组成员");
      return;
    }
    if (!xinfa) {
      showToast.error("请选择心法");
      return;
    }

    try {
      setSubmitting(true);
      await createSignup(guildId, teamId, {
        signup_user_id: Number(memberId),
        signup_character_id: characterId,
        signup_info: {
          submitter_name: user?.nickname || "我",
          player_name: playerName, // 自动从成员获取
          character_name: characterName || "",
          xinfa,
        },
        is_rich: isRich,
      });
      showToast.success("代报名成功");
      onSuccess?.();
      onClose?.();
    } catch (e) {
      showToast.error(e || "代报名失败");
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
        base: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800",
        header: "border-b border-blue-200 dark:border-blue-900",
        footer: "border-t border-blue-200 dark:border-blue-900",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            👥 代报名
          </h2>
          {team && <p className="text-sm text-default-500 font-normal">{team.title || "未命名开团"}</p>}
        </ModalHeader>
        <ModalBody>
          {/* 使用 GroupMemberSelector 替换所有输入字段 */}
          <GroupMemberSelector
            guildId={guildId}
            memberId={memberId}
            onMemberChange={setMemberId}
            characterName={characterName}
            onCharacterNameChange={setCharacterName}
            onCharacterIdChange={setCharacterId}
            characterXinfa={xinfa}
            onXinfaChange={setXinfa}
            memberLabel="被代报的群组成员"
            characterLabel="角色名称"
            xinfaLabel="心法"
            isRequired
          />

          {/* 老板位开关 */}
          <div className="flex items-center gap-3 px-1">
            <Switch isSelected={isRich} onValueChange={setIsRich} color="secondary">
              老板位（卡位）
            </Switch>
          </div>

          <p className="text-xs text-default-500">选择群组成员后，会自动填充报名者名称和角色信息。</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={submitting}>
            取消
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
            确认代报
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
