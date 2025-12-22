import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider, Tabs, Tab } from "@heroui/react";
import TeamBoard from "../components/board/TeamBoard";
import { buildEmptyRules } from "../utils/slotAllocation";
import { allXinfaList, xinfaInfoTable } from "../config/xinfa";

// 构造一组演示报名数据
const mockSignups = [
  {
    id: "s1",
    signupName: "小花",
    characterName: "花间游·一号",
    characterXinfa: "huajian",
    qqNumber: "123456789",
    isRich: false,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 0,
    presence: "present",
  },
  {
    id: "s2",
    signupName: "小秀",
    characterName: "云裳·二号",
    characterXinfa: "yunchang",
    qqNumber: "987654321",
    isRich: false,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 5,
    presence: "pending",
  },
  {
    id: "s3",
    signupName: "小明",
    characterName: "焚影·三号",
    characterXinfa: "fenying",
    qqNumber: "555666777",
    isRich: false,
    isProxy: true,
    proxyUserName: "代报人张三",
    proxyUserQQ: "111222333",
    isLock: true,
    lockSlot: 10,
    presence: "pending",
  },
  {
    id: "s4",
    signupName: "土豪A",
    characterName: "老板·A",
    characterXinfa: "xiaochen",
    qqNumber: "999888777",
    isRich: true,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 15,
    presence: "absent",
  },
];

const buildDemoRules = () => {
  const base = buildEmptyRules();
  // 0 号坑：锁定，允许奶妈
  base[0] = { allowRich: false, allowXinfaList: ["yunchang", "lijing", "butian", "xiangzhi", "lingsu"] };
  // 1 号坑：输出
  base[1] = { allowRich: false, allowXinfaList: allXinfaList.filter((x) => xinfaInfoTable[x].type.includes("dps")) };
  // 2 号坑：老板坑
  base[2] = { allowRich: true, allowXinfaList: [] };
  // 3 号坑：T 位
  base[3] = { allowRich: false, allowXinfaList: allXinfaList.filter((x) => xinfaInfoTable[x].type.includes("T")) };
  return base;
};

const modes = [
  { key: "view", label: "浏览模式" },
  { key: "edit-rule", label: "规则编辑模式" },
  { key: "assign", label: "指定报名模式" },
  { key: "drag", label: "拖动模式" },
  { key: "mark", label: "进组标记模式" },
];

export default function DebugTeamBoardPage() {
  const [mode, setMode] = useState("view");
  const [rules, setRules] = useState(buildDemoRules);
  const [signups, setSignups] = useState(mockSignups);
  const [view, setView] = useState([]);

  const handleRuleChange = (idx, nextRule) => {
    setRules((prev) => {
      const copy = [...prev];
      copy[idx] = nextRule;
      return copy;
    });
  };

  const handleAssign = (idx, payload) => {
    setSignups((prev) => {
      // 先删除该坑位的现有指定
      const filtered = prev.filter((s) => s.lockSlot !== idx);

      const id = `assign-${Date.now()}`;
      const signup = {
        id,
        signupName: payload.signupName || "[未知成员]",
        characterName: payload.characterName || "未填写角色",
        characterXinfa: payload.characterXinfa,
        qqNumber: payload.qqNumber || "",
        isRich: payload.isRich || false,
        isProxy: payload.isProxy || false,
        proxyUserName: payload.proxyUserName || "",
        proxyUserQQ: payload.proxyUserQQ || "",
        isLock: true,
        lockSlot: idx,
        presence: "pending",
      };
      return [...filtered, signup];
    });
  };

  const handleAssignDelete = (idx) => {
    setSignups((prev) => prev.filter((s) => s.lockSlot !== idx));
  };

  const handlePresenceChange = (idx, status) => {
    setSignups((prev) => prev.map((item) => (item.lockSlot === idx ? { ...item, presence: status } : item)));
  };

  const handleReorder = (mapping) => {
    setView(mapping);
  };

  const resetAll = () => {
    setRules(buildDemoRules());
    setSignups(mockSignups);
    setView([]);
    setMode("view");
  };

  return (
    <div className="p-6">
      <Card className="mb-4">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-pink-600">TeamBoard 调试页</span>
            <Chip size="sm" color="secondary" variant="flat">
              仅前端演示，不写入后端
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="flat" onPress={resetAll}>
              重置
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs selectedKey={mode} onSelectionChange={setMode} color="primary">
            {modes.map((m) => (
              <Tab key={m.key} title={m.label} />
            ))}
          </Tabs>
        </CardBody>
      </Card>

      <TeamBoard
        rules={rules}
        signupList={signups}
        view={view}
        mode={mode}
        onRuleChange={handleRuleChange}
        onAssign={handleAssign}
        onAssignDelete={handleAssignDelete}
        onPresenceChange={handlePresenceChange}
        onReorder={handleReorder}
      />

      <Card className="mt-4">
        <CardHeader>
          <span className="text-sm font-semibold text-default-600">当前视图映射 (slot_view)</span>
        </CardHeader>
        <Divider />
        <CardBody>
          {view.length === 0 ? (
            <div className="text-default-500 text-sm">暂无映射，拖动后这里会显示 slotIndex → signupId</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-default-600">
              {view.map((v) => (
                <div key={`${v.slotIndex}-${v.signupId}`} className="p-2 rounded bg-default-100">
                  坑位 {v.slotIndex + 1} → {v.signupId}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
