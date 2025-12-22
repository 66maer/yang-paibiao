import { useEffect, useMemo, useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Switch } from "@heroui/react";
import { allXinfaList, dpsXinfaList, naiXinfaList, tXinfaList, xinfaInfoTable } from "../../../../config/xinfa";
import { fallbackRule } from "../utils";

/**
 * 规则编辑弹窗组件
 * 用于编辑坑位的报名规则
 * - 是否允许老板报名
 * - 允许报名的心法列表
 * - 提供快捷预设（全部心法、清空、输出专场、奶妈专场、T专场）
 */
const RuleEditorModal = ({ open, onClose, rule, onSave }) => {
  const [localRule, setLocalRule] = useState(rule || fallbackRule);

  // 同步外部规则变化
  const syncedRule = useMemo(() => rule || fallbackRule, [rule]);

  useEffect(() => {
    // 延迟到下一帧更新状态，避免渲染期间的 setState
    const timer = Promise.resolve().then(() => {
      setLocalRule(syncedRule);
    });
    return () => timer.then(() => null);
  }, [syncedRule]);

  /**
   * 应用预设规则
   */
  const applyPreset = (preset) => {
    const presetMap = {
      all: allXinfaList,
      none: [],
      dps: dpsXinfaList,
      heal: naiXinfaList,
      tank: tXinfaList,
    };

    if (presetMap[preset]) {
      setLocalRule({ ...localRule, allowXinfaList: presetMap[preset] });
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-lg font-semibold">编辑报名规则</ModalHeader>
            <ModalBody className="space-y-4">
              {/* 老板报名开关 */}
              <Switch
                isSelected={localRule.allowRich}
                onValueChange={(value) => setLocalRule({ ...localRule, allowRich: value })}
              >
                允许老板报名
              </Switch>

              {/* 快捷预设按钮 */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="flat" onPress={() => applyPreset("all")}>
                  全部心法
                </Button>
                <Button size="sm" variant="flat" onPress={() => applyPreset("none")}>
                  清空
                </Button>
                <Button size="sm" variant="flat" onPress={() => applyPreset("dps")}>
                  输出专场
                </Button>
                <Button size="sm" variant="flat" onPress={() => applyPreset("heal")}>
                  奶妈专场
                </Button>
                <Button size="sm" variant="flat" onPress={() => applyPreset("tank")}>
                  T 专场
                </Button>
              </div>

              {/* 心法选择器 */}
              <Select
                label="允许的心法"
                placeholder="选择可报名的心法"
                selectionMode="multiple"
                selectedKeys={new Set(localRule.allowXinfaList || [])}
                onSelectionChange={(keys) => setLocalRule({ ...localRule, allowXinfaList: Array.from(keys) })}
                classNames={{ trigger: "min-h-[52px]" }}
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
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={close}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  onSave?.(localRule);
                  close();
                }}
              >
                保存规则
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RuleEditorModal;
