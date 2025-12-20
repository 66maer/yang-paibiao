import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Tooltip,
} from "@heroui/react";
import { Reorder, motion } from "framer-motion";
import {
  allXinfaList,
  dpsXinfaList,
  naiXinfaList,
  tXinfaList,
  xinfaInfoTable,
} from "../../config/xinfa";
import { allocateSlots, buildEmptyRules, getRuleLabel } from "../../utils/slotAllocation";

const fallbackRule = { allowRich: false, allowXinfaList: [] };

const presenceLabels = {
  present: "已进组",
  pending: "待确认",
  absent: "缺席",
};

const presenceColors = {
  present: "success",
  pending: "warning",
  absent: "danger",
};

const getSignupKey = (signup) =>
  signup?.id ?? signup?.signupId ?? signup?.signup_id ?? signup?.userId ?? signup?.user_id ?? null;

const buildSlots = (slots, rules) =>
  Array.from({ length: rules.length }, (_, idx) => ({
    slotIndex: idx,
    rule: rules[idx] ?? fallbackRule,
    signup: slots[idx] ?? null,
  }));

const RuleTag = ({ rule }) => {
  if (rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <Chip size="sm" color="secondary" variant="flat">
        老板坑
      </Chip>
    );
  }

  if (!rule.allowRich && (!rule.allowXinfaList || rule.allowXinfaList.length === 0)) {
    return (
      <Chip size="sm" color="default" variant="flat">
        未开放
      </Chip>
    );
  }

  if (!rule.allowRich && rule.allowXinfaList.length === allXinfaList.length) {
    return (
      <Chip size="sm" color="primary" variant="flat">
        不限心法
      </Chip>
    );
  }

  return (
    <Chip size="sm" color="primary" variant="flat">
      允许 {rule.allowXinfaList.length} 心法
    </Chip>
  );
};

const RuleTooltip = ({ rule }) => {
  if (!rule) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs text-default-500">报名规则</div>
      <div className="flex flex-wrap gap-2 items-center">
        {rule.allowRich && (
          <Chip size="sm" color="secondary" variant="flat">
            老板可报
          </Chip>
        )}
        {!rule.allowRich && <Chip size="sm">仅打工</Chip>}
        <Chip size="sm" variant="bordered">
          {getRuleLabel(rule)}
        </Chip>
      </div>
      <Divider className="my-1" />
      <div className="flex flex-wrap gap-1">
        {(rule.allowXinfaList || []).map((xinfa) => {
          const info = xinfaInfoTable[xinfa];
          if (!info) return null;
          return (
            <Chip
              key={xinfa}
              size="sm"
              startContent={<img src={`/xinfa/${info.icon}`} alt={info.name} className="w-4 h-4" />}
              variant="flat"
            >
              {info.name}
            </Chip>
          );
        })}
        {rule.allowXinfaList?.length === allXinfaList.length && (
          <span className="text-xs text-default-500">全部心法均可报名</span>
        )}
      </div>
    </div>
  );
};

const SignupTooltip = ({ signup, rule }) => {
  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;
  return (
    <div className="space-y-2">
      <div className="text-xs text-default-500">报名信息</div>
      <div className="flex items-center gap-2">
        {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-6 h-6 rounded" />}
        <div>
          <div className="text-sm font-semibold">{signup?.signupName || signup?.characterName || "未命名"}</div>
          <div className="text-xs text-default-500">{signup?.characterName || "未填写角色"}</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap text-xs text-default-500">
        {signup?.clientType && <Chip size="sm">{signup.clientType}</Chip>}
        {signup?.isRich && (
          <Chip size="sm" color="secondary" variant="flat">
            老板
          </Chip>
        )}
        {signup?.isProxy && (
          <Chip size="sm" variant="flat" color="warning">
            代报
          </Chip>
        )}
        {signup?.isLock && (
          <Chip size="sm" variant="flat" color="danger">
            锁定
          </Chip>
        )}
      </div>
      <Divider className="my-1" />
      <RuleTooltip rule={rule} />
    </div>
  );
};

const RuleEditorModal = ({ open, onClose, rule, onSave }) => {
  const [localRule, setLocalRule] = useState(rule || fallbackRule);

  // Use effect only to sync external prop changes without side effects during render
  const syncedRule = useMemo(() => rule || fallbackRule, [rule]);

  useEffect(() => {
    // Delay the state update to the next frame to avoid render-time setState
    const timer = Promise.resolve().then(() => {
      setLocalRule(syncedRule);
    });
    return () => timer.then(() => null);
  }, [syncedRule]);

  const onPreset = (preset) => {
    if (preset === "all") {
      setLocalRule({ ...localRule, allowXinfaList: allXinfaList });
    } else if (preset === "none") {
      setLocalRule({ ...localRule, allowXinfaList: [] });
    } else if (preset === "dps") {
      setLocalRule({ ...localRule, allowXinfaList: dpsXinfaList });
    } else if (preset === "heal") {
      setLocalRule({ ...localRule, allowXinfaList: naiXinfaList });
    } else if (preset === "tank") {
      setLocalRule({ ...localRule, allowXinfaList: tXinfaList });
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-lg font-semibold">编辑报名规则</ModalHeader>
            <ModalBody className="space-y-4">
              <Switch
                isSelected={localRule.allowRich}
                onValueChange={(value) => setLocalRule({ ...localRule, allowRich: value })}
              >
                允许老板报名
              </Switch>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="flat" onPress={() => onPreset("all")}>
                  全部心法
                </Button>
                <Button size="sm" variant="flat" onPress={() => onPreset("none")}>
                  清空
                </Button>
                <Button size="sm" variant="flat" onPress={() => onPreset("dps")}>
                  输出专场
                </Button>
                <Button size="sm" variant="flat" onPress={() => onPreset("heal")}>
                  奶妈专场
                </Button>
                <Button size="sm" variant="flat" onPress={() => onPreset("tank")}>
                  T 专场
                </Button>
              </div>

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

const AssignModal = ({ open, onClose, defaultXinfa, onSave }) => {
  const [form, setForm] = useState({
    signupName: "",
    characterName: "",
    characterXinfa: defaultXinfa || allXinfaList[0],
    isRich: false,
    isProxy: false,
    clientType: "旗舰",
  });

  const syncedXinfa = useMemo(() => defaultXinfa || allXinfaList[0], [defaultXinfa]);

  useEffect(() => {
    // Delay to next frame to avoid rendering-time setState
    const timer = Promise.resolve().then(() => {
      setForm((prev) => ({ ...prev, characterXinfa: syncedXinfa }));
    });
    return () => timer.then(() => null);
  }, [syncedXinfa]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal isOpen={open} onClose={onClose} size="lg">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-lg font-semibold">团长指定</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="团员昵称"
                placeholder="请输入团员昵称"
                value={form.signupName}
                onValueChange={(val) => update("signupName", val)}
              />
              <Input
                label="角色名"
                placeholder="请输入角色名"
                value={form.characterName}
                onValueChange={(val) => update("characterName", val)}
              />
              <Select
                label="心法"
                selectedKeys={new Set([form.characterXinfa])}
                onSelectionChange={(keys) => update("characterXinfa", Array.from(keys)[0])}
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
              <div className="flex gap-4">
                <Switch isSelected={form.isRich} onValueChange={(val) => update("isRich", val)}>
                  老板坑
                </Switch>
                <Switch isSelected={form.isProxy} onValueChange={(val) => update("isProxy", val)}>
                  代报
                </Switch>
              </div>
              <Select
                label="客户端"
                selectedKeys={new Set([form.clientType])}
                onSelectionChange={(keys) => update("clientType", Array.from(keys)[0])}
              >
                {[
                  { key: "旗舰", label: "旗舰端" },
                  { key: "无界", label: "无界端" },
                ].map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
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

const PresenceBadge = ({ status }) => {
  if (!status) return null;
  const label = presenceLabels[status] || "待确认";
  const color = presenceColors[status] || "warning";
  return (
    <Chip size="sm" color={color} variant="flat">
      {label}
    </Chip>
  );
};

const SlotCard = ({
  slotIndex,
  rule,
  signup,
  mode,
  isAdmin,
  draggable,
  onRuleChange,
  onAssign,
  onPresenceChange,
  onSlotClick,
}) => {
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const xinfa = signup?.characterXinfa ? xinfaInfoTable[signup.characterXinfa] : null;
  const presence = signup?.presence || signup?.status || "pending";
  const isEditable = isAdmin && (mode === "edit" || mode === "mark");

  const cyclePresence = () => {
    if (!onPresenceChange) return;
    const order = ["pending", "present", "absent"];
    const idx = order.indexOf(presence);
    const next = order[(idx + 1) % order.length];
    onPresenceChange(slotIndex, next);
  };

  const cardBody = signup ? (
    <div
      className="relative h-full p-3 rounded-xl text-white shadow-md overflow-hidden"
      style={{ background: xinfa ? `linear-gradient(135deg, ${xinfa.color}, #1f1f1f)` : "#1f1f1f" }}
    >
      <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: xinfa ? `url(/menpai/${xinfa.menpai}.svg)` : undefined }} />
      <div className="relative flex flex-col gap-2 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {xinfa && <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-9 h-9 rounded" />}
            <div>
              <div className="text-sm font-bold leading-tight">{signup.signupName || signup.characterName || "未知"}</div>
              <div className="text-xs opacity-80 leading-tight">{signup.characterName || "未填写角色"}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {presence && <PresenceBadge status={presence} />}
            <div className="flex gap-1">
              {signup.clientType && (
                <Chip size="sm" variant="flat" color="default">
                  {signup.clientType}
                </Chip>
              )}
              {signup.isRich && (
                <Chip size="sm" variant="flat" color="secondary">
                  老板
                </Chip>
              )}
              {signup.isLock && (
                <Chip size="sm" variant="flat" color="danger">
                  锁定
                </Chip>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-2 text-xs opacity-80">
            {signup.isProxy && <Chip size="sm" variant="flat">代报</Chip>}
            <RuleTag rule={rule} />
          </div>
          {draggable && <div className="text-xs opacity-70">⇅ 拖动</div>}
        </div>
      </div>
    </div>
  ) : (
    <div className="h-full p-3 rounded-xl border border-dashed border-default-300 bg-default-50 dark:bg-default-100 text-default-600">
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-default-500">坑位 {slotIndex + 1}</div>
          <div className="text-sm font-semibold">等待报名</div>
          <RuleTag rule={rule} />
        </div>
        <div className="text-xs text-default-400">点击查看规则</div>
      </div>
    </div>
  );

  const wrapper = (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative h-full"
      onClick={() => onSlotClick?.(slotIndex, signup)}
    >
      <Tooltip
        content={signup ? <SignupTooltip signup={signup} rule={rule} /> : <RuleTooltip rule={rule} />}
        delay={150}
        placement="top"
      >
        {cardBody}
      </Tooltip>
      {isEditable && (
        <div className="absolute inset-0 rounded-xl bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2 gap-2">
          <Button size="sm" color="primary" variant="solid" onPress={() => setRuleModalOpen(true)}>
            规则
          </Button>
          <Button size="sm" color="secondary" variant="flat" onPress={() => setAssignModalOpen(true)}>
            指定
          </Button>
          {mode === "mark" && signup && (
            <Button size="sm" color="success" variant="ghost" onPress={cyclePresence}>
              切换进组状态
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="relative">
      {wrapper}
      <RuleEditorModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        rule={rule}
        onSave={(nextRule) => onRuleChange?.(slotIndex, nextRule)}
      />
      <AssignModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultXinfa={signup?.characterXinfa}
        onSave={(assignData) => onAssign?.(slotIndex, assignData)}
      />
    </div>
  );
};

export default function TeamBoard({
  rules = buildEmptyRules(),
  signupList = [],
  view = [],
  mode = "view",
  isAdmin = false,
  onRuleChange,
  onAssign,
  onPresenceChange,
  onReorder,
  onSlotClick,
}) {
  const { slots } = useMemo(() => allocateSlots(rules, signupList, view), [rules, signupList, view]);
  const [orderedSlots, setOrderedSlots] = useState(() => buildSlots(slots, rules));

  useEffect(() => {
    setOrderedSlots(buildSlots(slots, rules));
  }, [slots, rules]);

  const dragEnabled = isAdmin && mode === "drag";

  const handleReorder = (items) => {
    setOrderedSlots(items);
    if (onReorder) {
      const mapping = items
        .map((item, idx) => ({ slotIndex: idx, signupId: getSignupKey(item.signup) }))
        .filter((row) => row.signupId != null);
      onReorder(mapping);
    }
  };

  const renderGrid = (items) => (
    <div className="grid grid-cols-5 gap-3">
      {items.map((slot) => (
        <SlotCard
          key={slot.slotIndex}
          slotIndex={slot.slotIndex}
          rule={slot.rule}
          signup={slot.signup}
          mode={mode}
          isAdmin={isAdmin}
          draggable={dragEnabled}
          onRuleChange={onRuleChange}
          onAssign={onAssign}
          onPresenceChange={onPresenceChange}
          onSlotClick={onSlotClick}
        />
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-pink-600 dark:text-pink-400">团队面板</span>
          <Chip size="sm" variant="flat" color="secondary">
            5 x 5
          </Chip>
          {dragEnabled && (
            <Chip size="sm" color="warning" variant="flat">
              拖动以重排坑位
            </Chip>
          )}
          {mode === "mark" && (
            <Chip size="sm" color="success" variant="flat">
              标记进组 / 缺席
            </Chip>
          )}
        </div>
        <div className="flex gap-1 text-xs text-default-500">
          <Chip size="sm" variant="bordered">
            左键点击查看详情
          </Chip>
          {isAdmin && <Chip size="sm" variant="bordered">悬停显示编辑</Chip>}
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        {dragEnabled ? (
          <Reorder.Group
            axis="xy"
            values={orderedSlots}
            onReorder={handleReorder}
            className="grid grid-cols-5 gap-3"
          >
            {orderedSlots.map((slot) => (
              <Reorder.Item
                key={slot.slotIndex}
                value={slot}
                className="h-full"
                dragListener={dragEnabled}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <SlotCard
                  slotIndex={slot.slotIndex}
                  rule={slot.rule}
                  signup={slot.signup}
                  mode={mode}
                  isAdmin={isAdmin}
                  draggable={dragEnabled}
                  onRuleChange={onRuleChange}
                  onAssign={onAssign}
                  onPresenceChange={onPresenceChange}
                  onSlotClick={onSlotClick}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          renderGrid(orderedSlots)
        )}
      </CardBody>
    </Card>
  );
}
