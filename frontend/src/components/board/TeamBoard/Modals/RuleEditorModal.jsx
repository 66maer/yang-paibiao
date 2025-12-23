import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Avatar,
  Badge,
  RadioGroup,
  Radio,
} from "@heroui/react";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  tXinfaList,
  neigongXinfaList,
  waigongXinfaList,
  xinfaInfoTable,
} from "../../../../config/xinfa";
import { CheckIcon, TrashIcon, CheckSquareIcon } from "../../../icons.jsx";
// 如项目中已有 CheckSquareIcon，请改为导入该图标；临时使用 CopyIcon 作为方框类图标
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

  // 模式：使用独立状态，避免受心法数量限制
  const deriveMode = (r) => {
    const allowRich = !!r.allowRich;
    const xinfaCount = (r.allowXinfaList || []).length;
    if (allowRich && xinfaCount === 0) return "rich";
    if (allowRich && xinfaCount > 0) return "mixed";
    return "worker";
  };

  const [mode, setMode] = useState(() => deriveMode(localRule));

  // 当外部规则同步时，同时同步模式
  useEffect(() => {
    setMode(deriveMode(syncedRule));
  }, [syncedRule]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === "rich") {
      setLocalRule({ ...localRule, allowRich: true, allowXinfaList: [] });
    } else if (nextMode === "mixed") {
      // 保持当前心法列表，允许为空；仅设置 allowRich=true
      setLocalRule({ ...localRule, allowRich: true, allowXinfaList: localRule.allowXinfaList || [] });
    } else {
      setLocalRule({ ...localRule, allowRich: false, allowXinfaList: localRule.allowXinfaList || [] });
    }
  };

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
      neigong: neigongXinfaList,
      waigong: waigongXinfaList,
    };
    if (presetMap[preset] !== undefined) {
      setLocalRule({ ...localRule, allowXinfaList: presetMap[preset] });
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent className="max-w-[960px]">
        {(close) => (
          <>
            <ModalHeader className="text-lg font-semibold">编辑报名规则</ModalHeader>
            <ModalBody className="space-y-4">
              {/* 模式选择：打工坑 / 老板坑 / 混合坑 */}
              <div className="space-y-2">
                <span className="text-sm text-default-500">模式选择</span>
                <RadioGroup orientation="horizontal" value={mode} onValueChange={handleModeChange} className="gap-3">
                  <Radio value="worker">打工坑</Radio>
                  <Radio value="rich">老板坑</Radio>
                  <Radio value="mixed">打工/老板均可</Radio>
                </RadioGroup>
              </div>

              {/* 快捷预设按钮 */}
              <div className="space-y-2">
                <span className="text-sm text-default-500">快捷选项</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("all")}>
                    <CheckSquareIcon size={16} className="mr-1" /> 全选
                  </Button>
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("dps")}>
                    <img src="/dps.svg" alt="dps" className="w-4 h-4 mr-1" /> dps
                  </Button>
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("neigong")}>
                    <img src="/内功.svg" alt="内功" className="w-4 h-4 mr-1" /> 内功
                  </Button>
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("waigong")}>
                    <img src="/外功.svg" alt="外功" className="w-4 h-4 mr-1" /> 外功
                  </Button>
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("heal")}>
                    <img src="/奶妈.svg" alt="奶妈" className="w-4 h-4 mr-1" /> 奶妈
                  </Button>
                  <Button size="sm" variant="flat" isDisabled={mode === "rich"} onPress={() => applyPreset("tank")}>
                    <img src="/T.svg" alt="T" className="w-4 h-4 mr-1" /> T
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isDisabled={mode === "rich"}
                    onPress={() => applyPreset("none")}
                  >
                    <TrashIcon size={16} className="mr-1" /> 清空
                  </Button>
                </div>
              </div>

              {/* 可用心法矩阵选择（Avatar + 选中 Badge） */}
              <div className="space-y-2">
                <span className="text-sm text-default-500">可用心法</span>
                <div className={`grid grid-cols-8 gap-3 ${mode === "rich" ? "opacity-50 pointer-events-none" : ""}`}>
                  {allXinfaList.map((xinfa) => {
                    const info = xinfaInfoTable[xinfa];
                    const selected = (localRule.allowXinfaList || []).includes(xinfa);
                    return (
                      <div
                        key={xinfa}
                        className={`flex flex-col items-center cursor-pointer select-none rounded-md p-1 hover:bg-default-100`}
                        onClick={() => {
                          if (mode === "rich") return;
                          const current = new Set(localRule.allowXinfaList || []);
                          if (current.has(xinfa)) current.delete(xinfa);
                          else current.add(xinfa);
                          setLocalRule({ ...localRule, allowXinfaList: Array.from(current) });
                        }}
                      >
                        <Badge
                          isOneChar
                          color="success"
                          content={<CheckIcon />}
                          placement="bottom-right"
                          isInvisible={!selected}
                        >
                          <Avatar
                            src={`/xinfa/${info.icon}`}
                            alt={info.name}
                            size="md"
                            isBordered
                            color={selected ? "success" : "default"}
                          />
                        </Badge>
                        <span className="mt-1 text-xs text-default-600">{info.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
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
