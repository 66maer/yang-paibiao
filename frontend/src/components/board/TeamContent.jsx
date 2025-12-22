import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Tooltip,
} from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import SignupModal from "./SignupModal";
import { closeTeam } from "../../api/teams";
import { showToast, showConfirm } from "../../utils/toast";
import TeamBoard from "./TeamBoard";
import { allocateSlots, buildEmptyRules } from "../../utils/slotAllocation";
import { xinfaInfoTable } from "../../config/xinfa";

/**
 * 中间内容 - 开团详情
 */
export default function TeamContent({ team, isAdmin, onEdit, onRefresh }) {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [boardMode, setBoardMode] = useState("view");

  // Always call hooks in the same order - move conditional check below
  const teamTime = team?.team_time ? new Date(team.team_time) : null;

  // Prepare rules, signup list, and view mapping with memoization
  const memoizedInputs = useMemo(
    () => ({
      rawRules: team?.slot_rules || team?.rules || [],
      signupList: team?.signup_list || team?.signups || [],
      slotView: team?.slot_view || [],
    }),
    [team?.slot_rules, team?.rules, team?.signup_list, team?.signups, team?.slot_view]
  );

  // Build rules with memoization to avoid recomputation
  const rules = useMemo(() => {
    if (memoizedInputs.rawRules && memoizedInputs.rawRules.length > 0) {
      return memoizedInputs.rawRules;
    }
    return buildEmptyRules();
  }, [memoizedInputs.rawRules]);

  // Calculate slot allocation with memoization
  const allocation = useMemo(() => {
    return allocateSlots(rules, memoizedInputs.signupList, memoizedInputs.slotView);
  }, [rules, memoizedInputs.signupList, memoizedInputs.slotView]);

  if (!team) return null;

  const boardModes = [
    { key: "view", label: "浏览", icon: "👀" },
    { key: "edit", label: "编辑规则", icon: "🛠️", adminOnly: true },
    { key: "mark", label: "进组标记", icon: "✅", adminOnly: true },
    { key: "drag", label: "拖动排序", icon: "🧲", adminOnly: true },
  ];

  // 处理关闭开团
  const handleCloseTeam = async () => {
    const confirmed = await showConfirm("确定要关闭这个团吗？关闭后将无法继续报名。");

    if (!confirmed) return;

    try {
      await closeTeam(team.guild_id, team.id);
      showToast.success("开团已关闭");
      onRefresh?.();
    } catch (error) {
      console.error("关闭开团失败:", error);
      showToast.error(error || "关闭开团失败");
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex-col items-start gap-3 pb-4">
          {/* 标题行 */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {team.is_locked && (
                <Tooltip content="报名已锁定">
                  <Chip size="sm" variant="flat" color="warning">
                    🔒
                  </Chip>
                </Tooltip>
              )}
              <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {team.title || "未命名开团"}
              </h2>
              {team.is_hidden && (
                <Chip size="sm" variant="flat" color="default">
                  仅管理员可见
                </Chip>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Tooltip content="编辑开团">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => onEdit(team)}
                    >
                      ✏️ 编辑
                    </Button>
                  </Tooltip>
                  <Tooltip content="关闭开团">
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={handleCloseTeam}
                    >
                      ❌ 关闭
                    </Button>
                  </Tooltip>
                </>
              )}
              <Tooltip content={team.is_locked ? "报名已锁定" : "点击报名"}>
                <Button
                  size="md"
                  color="primary"
                  className="bg-gradient-to-r from-pink-500 to-purple-500"
                  isDisabled={team.is_locked}
                  onPress={() => setIsSignupModalOpen(true)}
                >
                  📝 报名
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* 基础信息标签 */}
          <div className="flex flex-wrap gap-2">
            {/* 副本 */}
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              startContent={<span>🏛️</span>}
            >
              {team.dungeon || "未指定副本"}
            </Chip>

            {/* 时间 */}
            {teamTime && (
              <Chip
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<span>🕐</span>}
              >
                {format(teamTime, "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </Chip>
            )}

            {/* 大铁 */}
            <Chip
              size="sm"
              variant="flat"
              color={team.is_xuanjing_booked ? "danger" : "success"}
              startContent={<span>💎</span>}
            >
              {team.is_xuanjing_booked ? "大铁已包" : "大铁可拍"}
            </Chip>

            {/* 小铁 */}
            <Chip
              size="sm"
              variant="flat"
              color={team.is_yuntie_booked ? "danger" : "success"}
              startContent={<span>⚙️</span>}
            >
              {team.is_yuntie_booked ? "小铁已包" : "小铁可拍"}
            </Chip>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="overflow-auto">
          <div className="space-y-6">
            {/* 团队告示 */}
            {team.notice && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-default-600">
                  📢 团队告示
                </h3>
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                  <p className="text-sm text-default-700 dark:text-default-300 whitespace-pre-wrap">
                    {team.notice}
                  </p>
                </div>
              </div>
            )}

            {/* 团队面板 - 留空 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-default-600">👥 团队面板</h3>
                  <Chip size="sm" variant="flat" color="secondary">
                    25 人
                  </Chip>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    {boardModes
                      .filter((mode) => !mode.adminOnly || isAdmin)
                      .map((mode) => (
                        <Button
                          key={mode.key}
                          size="sm"
                          variant={boardMode === mode.key ? "solid" : "flat"}
                          color={boardMode === mode.key ? "primary" : "default"}
                          onPress={() => setBoardMode(mode.key)}
                        >
                          <span className="mr-1">{mode.icon}</span>
                          {mode.label}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
              <TeamBoard
                rules={rules}
                signupList={memoizedInputs.signupList}
                view={memoizedInputs.slotView}
                mode={boardMode}
                onRuleChange={(slotIndex) =>
                  showToast.info(`已修改 ${slotIndex + 1} 号坑位规则，保存逻辑待接入`)
                }
                onAssign={(slotIndex, payload) =>
                  showToast.info(`已指定 ${slotIndex + 1} 号坑位，待接入后端: ${payload.signupName || "未命名"}`)
                }
                onAssignDelete={(slotIndex) =>
                  showToast.success(`已删除 ${slotIndex + 1} 号坑位的指定，待接入后端`)
                }
                onPresenceChange={(slotIndex, status) =>
                  showToast.success(`已标记坑位 ${slotIndex + 1} 为 ${status}`)
                }
                onReorder={(mapping) =>
                  showToast.success(`已更新坑位顺序，待保存 view 字段，映射数量 ${mapping.length}`)
                }
              />
            </div>

            {/* 候补列表 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-default-600">📋 候补列表</h3>
              <WaitlistList waitlist={allocation.waitlist} />
            </div>

            {/* 我的报名 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-default-600">✅ 我的报名</h3>
              <MySignupPlaceholder />
            </div>

            {/* 创建信息 */}
            {team.creator && (
              <div className="text-xs text-default-400 text-right">
                由 {team.creator.nickname || "未知"} 创建于{" "}
                {team.created_at
                  ? format(new Date(team.created_at), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })
                  : "未知时间"}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 报名模态框 */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        team={team}
      />
    </>
  );
}

const WaitlistList = ({ waitlist = [] }) => {
  if (!waitlist || waitlist.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-dashed border-default-300">
        <div className="text-center text-default-400">
          <div className="text-4xl mb-2">🪑</div>
          <p className="text-sm">暂无候补</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {waitlist.map((member, idx) => {
        const xinfa = member.characterXinfa ? xinfaInfoTable[member.characterXinfa] : null;
        return (
          <Card key={`${member.id || idx}-${member.characterName || idx}`} shadow="none" className="border border-default-200">
            <CardBody className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                {xinfa ? (
                  <img src={`/xinfa/${xinfa.icon}`} alt={xinfa.name} className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center text-default-500">
                    ?
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{member.signupName || "[未知成员]"}</div>
                  <div className="text-xs text-default-500">{member.characterName || "未填写角色"}</div>
                  <div className="flex gap-1 flex-wrap text-xs">
                    {member.isRich && (
                      <Chip size="sm" variant="flat" color="secondary">
                        老板
                      </Chip>
                    )}
                    {member.clientType && <Chip size="sm">{member.clientType}</Chip>}
                  </div>
                </div>
              </div>
              <Chip size="sm" color="default" variant="flat">
                候补
              </Chip>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

const MySignupPlaceholder = () => (
  <div className="p-8 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-2 border-dashed border-default-300">
    <div className="text-center text-default-400">
      <div className="text-4xl mb-2">🚧</div>
      <p className="text-sm">我的报名模块待与后端联调</p>
    </div>
  </div>
);
