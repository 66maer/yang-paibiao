import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider, Tabs, Tab, Input, Select, SelectItem } from "@heroui/react";
import TeamBoard from "@/features/board/components/TeamBoard";
import SignupItemCard from "@/features/board/components/SignupItemCard";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { allXinfaList, xinfaInfoTable } from "@/config/xinfa";

// 构造一组演示报名数据
const mockSignups = [
  {
    id: "s1",
    signupName: "小花",
    game_name: "小花",
    avatar: "https://i.pravatar.cc/150?img=1",
    characterName: "花间游·一号",
    characterXinfa: "huajian",
    role: "dps",
    xinfa: "花间游",
    qqNumber: "123456789",
    isRich: false,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 0,
    slot_index: 0,
    presence: "present",
  },
  {
    id: "s2",
    signupName: "小秀",
    game_name: "小秀",
    avatar: "https://i.pravatar.cc/150?img=2",
    characterName: "云裳·二号",
    characterXinfa: "yunchang",
    role: "healer",
    xinfa: "云裳",
    qqNumber: "987654321",
    isRich: false,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 5,
    slot_index: 5,
    presence: "pending",
  },
  {
    id: "s3",
    signupName: "小明",
    game_name: "小明",
    avatar: "https://i.pravatar.cc/150?img=3",
    characterName: "焚影·三号",
    characterXinfa: "fenying",
    role: "dps",
    xinfa: "焚影",
    qqNumber: "555666777",
    isRich: false,
    isProxy: true,
    proxyUserName: "代报人张三",
    proxyUserQQ: "111222333",
    isLock: true,
    lockSlot: 10,
    slot_index: 10,
    presence: "pending",
  },
  {
    id: "s4",
    signupName: "土豪A",
    game_name: "土豪A",
    avatar: "https://i.pravatar.cc/150?img=4",
    characterName: "老板·A",
    characterXinfa: "xiaochen",
    role: "tank",
    xinfa: "小尘埃",
    qqNumber: "999888777",
    isRich: true,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 15,
    slot_index: 15,
    presence: "absent",
  },
  {
    id: "s5",
    signupName: "剑仙",
    game_name: "剑仙",
    avatar: "https://i.pravatar.cc/150?img=5",
    characterName: "剑网三·五号",
    characterXinfa: "jianxin",
    role: "dps",
    xinfa: "剑心",
    qqNumber: "111222333",
    isRich: false,
    isProxy: false,
    proxyUserName: "",
    proxyUserQQ: "",
    isLock: true,
    lockSlot: 12,
    slot_index: 12,
    presence: "pending",
  },
];

// 构造候补列表数据
const mockWaitlist = [
  {
    id: "w1",
    game_name: "候补小A",
    avatar: "https://i.pravatar.cc/150?img=10",
    role: "tank",
    xinfa: "朱雀",
    characterXinfa: "zhuque",
    waitlist_order: 1,
  },
  {
    id: "w2",
    game_name: "候补小B",
    avatar: "https://i.pravatar.cc/150?img=11",
    role: "healer",
    xinfa: "灵素",
    characterXinfa: "lingsu",
    waitlist_order: 2,
  },
  {
    id: "w3",
    game_name: "候补小C",
    avatar: "https://i.pravatar.cc/150?img=12",
    role: "dps",
    xinfa: "丐帮",
    characterXinfa: "gaibang",
    waitlist_order: 3,
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
  const [waitlist, setWaitlist] = useState(mockWaitlist);
  const [view, setView] = useState([]);

  // 测试数据切换
  const [testScenario, setTestScenario] = useState("full");
  const [isAdmin, setIsAdmin] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

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

  const handleReorder = (newView) => {
    setView(newView);
  };

  const handleSignupDelete = (signup) => {
    // 模拟删除报名
    setSignups((prev) => prev.filter((s) => s.id !== signup.id));
  };

  const resetAll = () => {
    setRules(buildDemoRules());
    setSignups(mockSignups);
    setWaitlist(mockWaitlist);
    setView([]);
    setMode("view");
  };

  // 测试场景切换
  const applyTestScenario = (scenario) => {
    setTestScenario(scenario);
    switch (scenario) {
      case "empty":
        // 清空所有数据
        setSignups([]);
        setWaitlist([]);
        break;
      case "full":
        // 完整数据
        setSignups(mockSignups);
        setWaitlist(mockWaitlist);
        break;
      case "few-signups":
        // 少量报名
        setSignups(mockSignups.slice(0, 2));
        setWaitlist([]);
        break;
      case "many-waitlist":
        // 多个候补
        setSignups(mockSignups.slice(0, 1));
        setWaitlist([
          ...mockWaitlist,
          ...mockWaitlist.map((w, i) => ({ ...w, id: `w-extra-${i}`, waitlist_order: i + 4 })),
        ]);
        break;
      case "all-present":
        // 所有人进组
        setSignups(mockSignups.map((s) => ({ ...s, presence: "present" })));
        setWaitlist(mockWaitlist);
        break;
      case "some-absent":
        // 部分缺席
        setSignups(mockSignups.map((s, i) => ({ ...s, presence: i % 2 === 0 ? "absent" : "present" })));
        setWaitlist(mockWaitlist);
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* 控制面板 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-pink-600">🐛 TeamBoard 调试页</span>
            <Chip size="sm" color="secondary" variant="flat">
              仅前端演示，不写入后端
            </Chip>
          </div>
          <div className="flex gap-2">
            <Button size="sm" color="warning" variant="flat" onPress={resetAll}>
              🔄 重置全部
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {/* 第一行：模式选择 */}
          <div>
            <p className="text-sm font-semibold text-default-600 mb-2">👀 选择 TeamBoard 模式</p>
            <Tabs selectedKey={mode} onSelectionChange={setMode} color="primary" size="sm">
              {modes.map((m) => (
                <Tab key={m.key} title={m.label} />
              ))}
            </Tabs>
          </div>

          {/* 第二行：测试场景 */}
          <div>
            <p className="text-sm font-semibold text-default-600 mb-2">🎯 测试场景</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                color={testScenario === "full" ? "primary" : "default"}
                variant={testScenario === "full" ? "solid" : "flat"}
                onPress={() => applyTestScenario("full")}
              >
                完整数据 (5人报名+3候补)
              </Button>
              <Button
                size="sm"
                color={testScenario === "empty" ? "primary" : "default"}
                variant={testScenario === "empty" ? "solid" : "flat"}
                onPress={() => applyTestScenario("empty")}
              >
                空状态
              </Button>
              <Button
                size="sm"
                color={testScenario === "few-signups" ? "primary" : "default"}
                variant={testScenario === "few-signups" ? "solid" : "flat"}
                onPress={() => applyTestScenario("few-signups")}
              >
                少量报名 (2人)
              </Button>
              <Button
                size="sm"
                color={testScenario === "many-waitlist" ? "primary" : "default"}
                variant={testScenario === "many-waitlist" ? "solid" : "flat"}
                onPress={() => applyTestScenario("many-waitlist")}
              >
                多候补 (6人)
              </Button>
              <Button
                size="sm"
                color={testScenario === "all-present" ? "primary" : "default"}
                variant={testScenario === "all-present" ? "solid" : "flat"}
                onPress={() => applyTestScenario("all-present")}
              >
                全进组
              </Button>
              <Button
                size="sm"
                color={testScenario === "some-absent" ? "primary" : "default"}
                variant={testScenario === "some-absent" ? "solid" : "flat"}
                onPress={() => applyTestScenario("some-absent")}
              >
                部分缺席
              </Button>
            </div>
          </div>

          {/* 第三行：角色和显示选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-default-600">👤 用户角色</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color={isAdmin ? "primary" : "default"}
                  variant={isAdmin ? "solid" : "flat"}
                  onPress={() => setIsAdmin(true)}
                >
                  管理员
                </Button>
                <Button
                  size="sm"
                  color={!isAdmin ? "primary" : "default"}
                  variant={!isAdmin ? "solid" : "flat"}
                  onPress={() => setIsAdmin(false)}
                >
                  普通用户
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-default-600">📋 显示选项</p>
              <Button
                size="sm"
                color="secondary"
                variant={showRightPanel ? "solid" : "flat"}
                onPress={() => setShowRightPanel(!showRightPanel)}
              >
                {showRightPanel ? "✓ 显示右侧面板" : "✗ 隐藏右侧面板"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TeamBoard 和右侧面板 */}
      <div className="flex gap-4">
        {/* 左侧 TeamBoard */}
        <Card className="flex-1">
          <CardBody className="p-6">
            <TeamBoard
              rules={rules}
              signupList={signups}
              view={view}
              mode={mode}
              isAdmin={isAdmin}
              currentUser={{ id: "test-user-1" }}
              onRuleChange={handleRuleChange}
              onAssign={handleAssign}
              onAssignDelete={handleAssignDelete}
              onPresenceChange={handlePresenceChange}
              onReorder={handleReorder}
              onSignupDelete={handleSignupDelete}
            />
          </CardBody>
        </Card>

        {/* 右侧面板 */}
        {showRightPanel && (
          <div className="w-96 space-y-4">
            {/* 报名信息面板 */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-lg font-bold text-pink-600">报名信息</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-2 max-h-96 overflow-auto">
                {signups.length === 0 ? (
                  <p className="text-sm text-default-400 text-center py-4">暂无报名</p>
                ) : (
                  signups.map((signup) => (
                    <div key={signup.id} className="mb-2">
                      <SignupItemCard signup={signup} type="signup" />
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            {/* 候补列表面板 */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-lg font-bold text-yellow-600">候补列表</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-2 max-h-96 overflow-auto">
                {waitlist.length === 0 ? (
                  <p className="text-sm text-default-400 text-center py-4">暂无候补</p>
                ) : (
                  waitlist.map((item) => (
                    <div key={item.id} className="mb-2">
                      <SignupItemCard
                        signup={item}
                        type="waitlist"
                        waitlistOrder={item.waitlist_order}
                        onDelete={
                          isAdmin ? () => setWaitlist((prev) => prev.filter((w) => w.id !== item.id)) : undefined
                        }
                      />
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* 调试信息面板 */}
      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-default-600">📊 调试信息</span>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-xs text-default-500">报名人数</p>
              <p className="text-2xl font-bold text-blue-600">{signups.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="text-xs text-default-500">已进组</p>
              <p className="text-2xl font-bold text-green-600">
                {signups.filter((s) => s.presence === "present").length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-xs text-default-500">候补人数</p>
              <p className="text-2xl font-bold text-yellow-600">{waitlist.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
              <p className="text-xs text-default-500">缺席</p>
              <p className="text-2xl font-bold text-red-600">{signups.filter((s) => s.presence === "absent").length}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-default-600 mb-2">当前模式</p>
            <div className="p-3 rounded-lg bg-default-100 dark:bg-default-50">
              <p className="text-sm text-default-600">{modes.find((m) => m.key === mode)?.label || mode}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-default-600 mb-2">视图映射 (slot_view)</p>
            {!view || view.length === 0 ? (
              <p className="text-xs text-default-500">拖动后会显示 视觉索引 → 数据坑位索引</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-xs">
                {view.slice(0, 15).map((dataIdx, visualIdx) => (
                  <div
                    key={`${visualIdx}-${dataIdx}`}
                    className="p-2 rounded bg-pink-100 dark:bg-pink-950/30 text-center"
                  >
                    {visualIdx + 1} → {dataIdx + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
