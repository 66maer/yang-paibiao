import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { allXinfaList, xinfaInfoTable } from "../../../../config/xinfa";
import GroupMemberSelector from "../../../GroupMemberSelector";

/**
 * 团长指定弹窗组件
 * 用于团长强制指定某个坑位的成员
 * - 群组成员（使用GroupMemberSelector，统一处理成员+角色+心法选择）
 * - 是否老板坑
 * - 是否代报
 */
const AssignModal = ({ open, onClose, defaultXinfa, onSave }) => {
  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    characterName: "",
    characterXinfa: defaultXinfa || allXinfaList[0],
    isRich: false,
    isProxy: false,
  });

  // 同步外部心法变化
  const syncedXinfa = useMemo(() => defaultXinfa || allXinfaList[0], [defaultXinfa]);

  useEffect(() => {
    // 延迟到下一帧更新状态，避免渲染期间的 setState
    const timer = Promise.resolve().then(() => {
      setForm((prev) => ({ ...prev, characterXinfa: syncedXinfa }));
    });
    return () => timer.then(() => null);
  }, [syncedXinfa]);

  /**
   * 更新表单字段
   */
  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal isOpen={open} onClose={onClose} size="lg">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-lg font-semibold">团长指定</ModalHeader>
            <ModalBody className="space-y-4">
              {/* 群组成员 + 角色 + 心法选择（统一组件） */}
              <GroupMemberSelector
                memberId={form.memberId}
                onMemberChange={(memberId) => updateField("memberId", memberId)}
                characterName={form.characterName}
                onCharacterNameChange={(characterName) => updateField("characterName", characterName)}
                characterXinfa={form.characterXinfa}
                onXinfaChange={(xinfa) => updateField("characterXinfa", xinfa)}
                memberLabel="群组成员"
                characterLabel="角色名"
                xinfaLabel="心法"
                isRequired
              />

              {/* 老板坑/代报开关 */}
              <div className="flex gap-4">
                <Switch isSelected={form.isRich} onValueChange={(val) => updateField("isRich", val)}>
                  老板坑
                </Switch>
                <Switch isSelected={form.isProxy} onValueChange={(val) => updateField("isProxy", val)}>
                  代报
                </Switch>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={close}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  onSave?.(form);
                  close();
                }}
              >
                保存指定
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AssignModal;
