import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Switch } from "@heroui/react";
import { allXinfaList, xinfaInfoTable } from "../../../../config/xinfa";

/**
 * 团长指定弹窗组件
 * 用于团长强制指定某个坑位的成员
 * - 团员昵称
 * - 角色名
 * - 心法
 * - 是否老板坑
 * - 是否代报
 */
const AssignModal = ({ open, onClose, defaultXinfa, onSave }) => {
  const [form, setForm] = useState({
    signupName: "",
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
              {/* 团员昵称 */}
              <Input
                label="团员昵称"
                placeholder="请输入团员昵称"
                value={form.signupName}
                onValueChange={(val) => updateField("signupName", val)}
              />

              {/* 角色名 */}
              <Input
                label="角色名"
                placeholder="请输入角色名"
                value={form.characterName}
                onValueChange={(val) => updateField("characterName", val)}
              />

              {/* 心法选择 */}
              <Select
                label="心法"
                selectedKeys={new Set([form.characterXinfa])}
                onSelectionChange={(keys) => updateField("characterXinfa", Array.from(keys)[0])}
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
