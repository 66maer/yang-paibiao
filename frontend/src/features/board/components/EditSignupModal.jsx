import { useEffect, useState, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Switch, Chip } from "@heroui/react";
import useSWR from "swr";
import MemberRoleSelector from "@/components/common/MemberRoleSelector";
import XinfaSelector from "@/components/common/XinfaSelector";
import { updateSignup } from "@/api/signups";
import { getUserCharacters } from "@/api/characters";
import { showToast } from "@/utils/toast";

/**
 * 编辑报名弹窗
 * 允许用户修改自己的报名信息（角色、心法等）
 *
 * @param {boolean} isOpen - 是否打开弹窗
 * @param {Function} onClose - 关闭弹窗回调
 * @param {number} guildId - 群组ID
 * @param {number} teamId - 团队ID
 * @param {Object} signup - 当前报名信息
 * @param {Object} user - 当前登录用户
 * @param {boolean} isAdmin - 是否是管理员
 * @param {Function} onSuccess - 成功回调
 */
export default function EditSignupModal({ isOpen, onClose, guildId, teamId, signup, user, isAdmin, onSuccess }) {
  const [characterName, setCharacterName] = useState("");
  const [characterId, setCharacterId] = useState(null);
  const [xinfa, setXinfa] = useState("");
  const [isRich, setIsRich] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 编辑次数限制
  const MAX_EDIT_COUNT = 3;
  const currentEditCount = signup?.editCount || 0;
  const remainingEdits = MAX_EDIT_COUNT - currentEditCount;
  const canEdit = isAdmin || remainingEdits > 0;

  // 获取用户角色列表
  const { data: charactersData } = useSWR(
    user?.id ? `user-characters-${user.id}` : null,
    () => getUserCharacters(user.id, { page: 1, page_size: 100 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
    }
  );

  const characters = useMemo(() => charactersData?.items || [], [charactersData]);

  // 初始化表单数据
  useEffect(() => {
    if (isOpen && signup) {
      setCharacterName(signup.characterName || "");
      setCharacterId(signup.characterId || null);
      setXinfa(signup.characterXinfa || "");
      setIsRich(signup.isRich || false);
      setSubmitting(false);
    }
  }, [isOpen, signup]);

  // 处理角色卡片选择
  const handleRoleSelect = (name, xinfaKey, charId) => {
    setCharacterName(name);
    setXinfa(xinfaKey);
    setCharacterId(charId || null);
  };

  const handleSubmit = async () => {
    if (!xinfa) {
      showToast.error("请选择心法");
      return;
    }

    if (!canEdit) {
      showToast.error(`已达到修改次数上限（${MAX_EDIT_COUNT}次）`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        signup_character_id: characterId,
        signup_info: {
          submitter_name: signup?.submitterName || user?.nickname || "我",
          player_name: signup?.signupName || "",
          character_name: characterName,
          xinfa,
        },
        is_rich: isRich,
      };

      const response = await updateSignup(guildId, teamId, signup.id, payload);

      const message = response?.message || response?.data?.message || "修改成功";
      showToast.success(message);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      showToast.error(e?.response?.data?.detail || e?.message || "修改失败");
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
        base: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800",
        header: "border-b border-blue-200 dark:border-blue-900",
        footer: "border-t border-blue-200 dark:border-blue-900",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ✏️ 修改报名
            </h2>
            {!isAdmin && (
              <Chip
                size="sm"
                color={remainingEdits > 1 ? "success" : remainingEdits === 1 ? "warning" : "danger"}
                variant="flat"
              >
                剩余 {remainingEdits} 次修改
              </Chip>
            )}
          </div>
          <p className="text-sm text-default-500 font-normal">修改报名信息（角色、心法等），不会影响报名时间和顺序</p>
        </ModalHeader>
        <ModalBody>
          {!canEdit ? (
            <div className="p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400">
              <p className="text-center">
                已达到修改次数上限（{MAX_EDIT_COUNT}次），无法继续修改。
                <br />
                如需修改，请联系团长处理。
              </p>
            </div>
          ) : (
            <>
              {/* 老板位开关 */}
              <div className="flex items-center gap-3 px-1">
                <Switch isSelected={isRich} onValueChange={setIsRich} color="secondary">
                  朕要当老板
                </Switch>
              </div>

              {/* 角色选择器 */}
              <MemberRoleSelector
                memberId={user?.id}
                value={characterName}
                onChange={setCharacterName}
                onRoleSelect={handleRoleSelect}
                label="角色名称"
                placeholder="选择或输入角色名..."
                isRequired={false}
              />

              {/* 心法选择 */}
              <XinfaSelector label="心法" value={xinfa} onChange={setXinfa} isRequired variant="flat" />

              <p className="text-xs text-default-500">
                心法为必填项。修改报名不会改变您的报名时间和排队顺序。
                {!isAdmin && remainingEdits <= 2 && (
                  <span className="text-warning-500 ml-1">注意：每车仅限修改 {MAX_EDIT_COUNT} 次。</span>
                )}
              </p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={submitting}>
            取消
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting} isDisabled={!canEdit}>
            确认修改
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
