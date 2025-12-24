import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch } from "@heroui/react";
import XinfaSelector from "../XinfaSelector";
import { createSignup } from "../../api/signups";
import { showToast } from "../../utils/toast";

/**
 * 代报名弹窗
 */
export default function ProxySignupModal({ isOpen, onClose, guildId, teamId, team, user, onSuccess }) {
  const [signupUserId, setSignupUserId] = useState("");
  const [signupCharacterId, setSignupCharacterId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [xinfa, setXinfa] = useState("");
  const [isRich, setIsRich] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSignupUserId("");
      setSignupCharacterId("");
      setPlayerName("");
      setCharacterName("");
      setXinfa("");
      setIsRich(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!playerName) {
      showToast.error("请填写报名者名称");
      return;
    }
    if (!xinfa) {
      showToast.error("请选择心法");
      return;
    }

    try {
      setSubmitting(true);
      await createSignup(guildId, teamId, {
        signup_user_id: signupUserId ? Number(signupUserId) : null,
        signup_character_id: signupCharacterId ? Number(signupCharacterId) : null,
        signup_info: {
          submitter_name: user?.nickname || "我",
          player_name: playerName,
          character_name: characterName,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="报名者名称"
              placeholder="必填，显示在名单中"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              isRequired
            />
            <XinfaSelector label="心法" value={xinfa} onChange={setXinfa} isRequired variant="flat" />
            <Input
              label="角色名称"
              placeholder="可选"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
            />
            <div className="flex items-center gap-3 px-1">
              <Switch isSelected={isRich} onValueChange={setIsRich} color="secondary">
                老板位（卡位）
              </Switch>
            </div>
          </div>

          <div className="rounded-lg border border-default-200 dark:border-default-700 p-3 space-y-2 bg-default-50 dark:bg-default-50/5">
            <p className="text-xs text-default-500">如果被代报的人/角色在系统内，可填 ID 便于自动补全信息（可留空）。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="系统内用户ID"
                placeholder="可选"
                value={signupUserId}
                onChange={(e) => setSignupUserId(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <Input
                label="系统内角色ID"
                placeholder="可选"
                value={signupCharacterId}
                onChange={(e) => setSignupCharacterId(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
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
