import { useMemo, useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Spinner,
} from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import { closeTeam, updateTeam, getHeibenRecommendations } from "@/api/teams";
import {
  getSignups,
  lockSignup,
  removeSlotAssignment,
  updatePresenceStatus,
  createSignup,
  cancelSignup,
  swapSlots,
} from "@/api/signups";
import { callMembers } from "@/api/guilds";
import { showToast, showConfirm } from "@/utils/toast";
import TeamBoard from "./TeamBoard";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { transformSignups } from "@/utils/signupTransform";
import useAuthStore from "@/stores/authStore";
import GoldRecordModal from "./GoldRecordModal";
import TeamLogs from "./TeamLogs";

/**
 * 中间内容 - 开团详情
 */
export default function TeamContent({ team, isAdmin, onEdit, onRefresh, onUpdateTeam }) {
  const [boardMode, setBoardMode] = useState("view");
  const [goldRecordModalOpen, setGoldRecordModalOpen] = useState(false);
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { user } = useAuthStore();
  const prevTeamIdRef = useRef(null);

  // Always call hooks in the same order - move conditional check below
  const teamTime = team?.team_time ? new Date(team.team_time) : null;

  // 监听团队切换，重置模式
  useEffect(() => {
    const currentTeamId = team?.id;
    if (prevTeamIdRef.current !== null && prevTeamIdRef.current !== currentTeamId) {
      setBoardMode("view"); // 重置为浏览模式
    }
    prevTeamIdRef.current = currentTeamId;
  }, [team?.id]);

  // 使用 SWR 加载报名数据
  const { data: signupsData, mutate: mutateSignups } = useSWR(
    team?.guild_id && team?.id ? `signups-${team.guild_id}-${team.id}` : null,
    () => getSignups(team.guild_id, team.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0, // 不自动刷新，只在报名后手动刷新
    }
  );

  // 解析并转换报名列表
  const signupList = useMemo(() => {
    const rawData = signupsData?.data?.items || signupsData?.data || signupsData || [];
    return transformSignups(rawData);
  }, [signupsData]);

  // Prepare rules and slot assignments with memoization
  const memoizedInputs = useMemo(
    () => ({
      rawRules: team?.slot_rules || team?.rules || [],
      signupList: signupList,
      slotAssignments: team?.slot_assignments || null, // 后端返回的坑位分配
      waitlist: team?.waitlist || [], // 后端返回的候补列表
    }),
    [team?.slot_rules, team?.rules, signupList, team?.slot_assignments, team?.waitlist]
  );

  // Build rules with memoization to avoid recomputation
  const rules = useMemo(() => {
    if (memoizedInputs.rawRules && memoizedInputs.rawRules.length > 0) {
      return memoizedInputs.rawRules;
    }
    return buildEmptyRules();
  }, [memoizedInputs.rawRules]);

  if (!team) return null;

  const boardModes = [
    { key: "view", label: "浏览", icon: "👀" },
    { key: "assign", label: "排表模式", icon: "🎯", adminOnly: true },
    { key: "mark", label: "进组标记", icon: "✅", adminOnly: true },
    { key: "drag", label: "连连看", icon: "🧲", adminOnly: true },
  ];

  // 处理模式切换（简化版，不再需要暂存逻辑）
  const handleModeChange = async (newMode) => {
    setBoardMode(newMode);
  };

  // 处理关闭开团
  const handleCloseTeam = async () => {
    // 直接打开金团记录弹窗
    setGoldRecordModalOpen(true);
  };

  // 处理金团记录保存成功
  const handleGoldRecordSuccess = async () => {
    setGoldRecordModalOpen(false);
    onRefresh?.();
  };

  // 处理黑本推荐
  const handleHeibenRecommendation = async () => {
    if (!signupList || signupList.length === 0) {
      showToast.warning("当前团队没有报名用户");
      return;
    }

    setRecommendationModalOpen(true);
    setLoadingRecommendations(true);

    try {
      // 获取所有已报名的用户ID
      const memberUserIds = signupList.map((signup) => signup.user_id);

      const response = await getHeibenRecommendations(team.guild_id, team.id, memberUserIds);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error("加载黑本推荐失败:", error);
      showToast.error(error.response?.data?.detail || "加载黑本推荐失败");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // 排表模式 - 分配坑位
  const handleAssign = async (slotIndex, payload) => {
    let signupId = payload.signupId;
    const slotPosition = slotIndex; // 使用0-based索引（0-24）

    try {
      // 如果没有 signupId，需要先创建报名
      if (!signupId) {
        if (!payload.playerName || !payload.characterXinfa) {
          showToast.error("请填写玩家名称和心法");
          return;
        }

        // 构造报名数据
        const signupData = {
          signup_user_id: payload.memberId ? Number(payload.memberId) : null,
          signup_character_id: null, // 排表模式通常不关联角色ID
          signup_info: {
            submitter_name: user?.nickname || "管理员",
            player_name: payload.playerName,
            character_name: payload.characterName || "",
            xinfa: payload.characterXinfa,
          },
          is_rich: payload.isRich || false,
        };

        // 创建报名
        const createResult = await createSignup(team.guild_id, team.id, signupData);
        signupId = createResult?.data?.id;

        if (!signupId) {
          showToast.error("创建报名失败");
          return;
        }
      }

      // 锁定坑位
      await lockSignup(team.guild_id, team.id, signupId, {
        slot_position: slotPosition,
      });

      showToast.success(`已将 ${payload.playerName || "报名"} 分配到坑位`);
      await mutateSignups(); // 刷新报名列表
    } catch (error) {
      console.error("分配坑位失败:", error);
      showToast.error(error?.response?.data?.message || error || "分配坑位失败");
    }
  };

  // 排表模式 - 删除坑位分配
  const handleAssignDelete = async (slotIndex) => {
    // 从报名列表中找到该坑位对应的报名（使用0-based索引）
    const signup = signupList.find((s) => s.slot_position === slotIndex);
    if (!signup) {
      showToast.error("未找到该坑位的报名");
      return;
    }

    try {
      await removeSlotAssignment(team.guild_id, team.id, signup.id);
      showToast.success(`已删除坑位的分配`);
      await mutateSignups(); // 刷新报名列表
      onRefresh?.(); // 刷新团队数据以获取新的 slot_assignments
    } catch (error) {
      console.error("删除坑位分配失败:", error);
      showToast.error(error?.response?.data?.message || "删除坑位分配失败");
    }
  };

  // 进组标记模式 - 更新到场状态
  const handlePresenceChange = async (signupId, status) => {
    if (!signupId) {
      showToast.error("未找到报名信息");
      return;
    }

    try {
      await updatePresenceStatus(team.guild_id, team.id, signupId, {
        presence_status: status, // ready, absent, null
      });
      const statusText = status === "ready" ? "就绪" : status === "absent" ? "缺席" : "未标记";
      showToast.success(`已标记为 ${statusText}`);
      await mutateSignups(); // 刷新报名列表
    } catch (error) {
      console.error("更新到场状态失败:", error);
      showToast.error(error?.response?.data?.message || "更新到场状态失败");
    }
  };

  // 连连看模式 - 直接交换坑位（调用后端接口）
  const handleSwapSlots = async (slotIndexA, slotIndexB) => {
    console.log("[Swap] Attempting slot swap:", { slotIndexA, slotIndexB });

    // 乐观更新：先在本地交换 slot_assignments 和 rules
    const originalAssignments = team.slot_assignments || [];
    const originalRules = team.slot_rules || team.rules || [];

    const newAssignments = [...originalAssignments];
    const newRules = [...originalRules];

    // 确保数组足够长
    while (newAssignments.length < Math.max(slotIndexA, slotIndexB) + 1) {
      newAssignments.push({ signup_id: null, locked: false });
    }
    while (newRules.length < Math.max(slotIndexA, slotIndexB) + 1) {
      newRules.push({ allowRich: false, allowXinfaList: [] });
    }

    // 交换 slot_assignments
    [newAssignments[slotIndexA], newAssignments[slotIndexB]] = [newAssignments[slotIndexB], newAssignments[slotIndexA]];

    // 同时交换 rules（确保下次重新计算时交换效果不会失效）
    [newRules[slotIndexA], newRules[slotIndexB]] = [newRules[slotIndexB], newRules[slotIndexA]];

    // 乐观更新本地状态（立即更新 UI）
    if (onUpdateTeam) {
      onUpdateTeam({
        ...team,
        slot_assignments: newAssignments,
        slot_rules: newRules,
        rules: newRules, // 兼容旧字段名
      });
    }

    try {
      await swapSlots(team.guild_id, team.id, slotIndexA, slotIndexB);
      console.log("[Swap] API success, slot swapped");
      showToast.success("已交换坑位");
    } catch (error) {
      console.error("交换坑位失败:", error);
      showToast.error(error?.response?.data?.message || "交换坑位失败");

      // 失败时回滚到原始状态
      if (onUpdateTeam) {
        onUpdateTeam({
          ...team,
          slot_assignments: originalAssignments,
          slot_rules: originalRules,
          rules: originalRules, // 兼容旧字段名
        });
      }
    }
  };

  // 连连看模式 - 恢复原始设置
  const handleResetSlotAssignments = async () => {
    const confirmed = await showConfirm("确定要重新计算坑位分配吗？这将根据报名规则重新分配所有未锁定的坑位。");

    if (!confirmed) return;
    if (!confirmed) return;

    try {
      // 触发后端重新计算坑位分配（通过更新规则触发）
      // 暂时使用刷新来重新获取数据
      onRefresh?.();
      showToast.success("已重新计算坑位分配");
    } catch (error) {
      console.error("重新计算失败:", error);
      showToast.error(error?.response?.data?.message || "重新计算失败");
    }
  };

  // 删除报名
  const handleSignupDelete = async (signup) => {
    const confirmed = await showConfirm(`确定要取消 ${signup?.signupName || "该成员"} 的报名吗？`);

    if (!confirmed) return;

    try {
      await cancelSignup(team.guild_id, team.id, signup.id);
      showToast.success("已取消报名");
      await mutateSignups(); // 刷新报名列表
      onRefresh?.(); // 刷新团队数据以获取新的 slot_assignments
    } catch (error) {
      console.error("取消报名失败:", error);
      showToast.error(error?.response?.data?.message || "取消报名失败");
    }
  };

  // 召唤单个成员
  const handleCallMember = async (signup) => {
    if (!signup?.playerQqNumber) {
      showToast.error("无法获取成员QQ号");
      return;
    }

    try {
      await callMembers(team.guild_id, {
        qq_numbers: [signup.playerQqNumber],
        message: `请进组：${team.title}`,
      });
      showToast.success(`已召唤 ${signup.signupName}`);
    } catch (error) {
      console.error("召唤成员失败:", error);
      showToast.error(error?.response?.data?.message || "召唤成员失败");
    }
  };

  // 召唤所有未标记的成员
  const handleCallAllUnmarked = async () => {
    // 过滤出已分配坑位但未标记的成员
    const unmarkedSignups = signupList.filter((s) => s.lockSlot !== null && s.lockSlot !== undefined && !s.presence);

    if (unmarkedSignups.length === 0) {
      showToast.warning("没有需要召唤的成员");
      return;
    }

    // 提取QQ号（过滤掉空值）
    const qqNumbers = unmarkedSignups.map((s) => s.playerQqNumber).filter(Boolean);

    if (qqNumbers.length === 0) {
      showToast.error("无法获取成员QQ号");
      return;
    }

    try {
      await callMembers(team.guild_id, {
        qq_numbers: qqNumbers,
        message: `请进组：${team.title}`,
      });
      showToast.success(`已召唤 ${qqNumbers.length} 名成员`);
    } catch (error) {
      console.error("召唤成员失败:", error);
      showToast.error(error?.response?.data?.message || "召唤成员失败");
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
                  <Chip size="lg" variant="flat" color="warning">
                    🔒
                  </Chip>
                </Tooltip>
              )}
              <h2 className="text-4xl font-bold text-pink-600 dark:text-pink-400">{team.title || "未命名开团"}</h2>
              {team.is_hidden && (
                <Chip size="lg" variant="flat" color="default">
                  仅管理员可见
                </Chip>
              )}
            </div>

            {/* 操作按钮 */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Tooltip content="查看黑本推荐">
                  <Button size="md" variant="flat" color="secondary" onPress={handleHeibenRecommendation}>
                    🎯 黑本推荐
                  </Button>
                </Tooltip>
                <Tooltip content="编辑开团">
                  <Button size="md" variant="flat" color="primary" onPress={() => onEdit(team)}>
                    ✏️ 编辑
                  </Button>
                </Tooltip>
                <Tooltip content="关闭开团">
                  <Button size="md" variant="flat" color="danger" onPress={handleCloseTeam}>
                    ❌ 关闭
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>

          {/* 基础信息标签 */}
          <div className="flex flex-wrap gap-2">
            {/* 副本 */}
            <Chip size="lg" variant="flat" color="primary" startContent={<span>🏛️</span>}>
              {team.dungeon || "未指定副本"}
            </Chip>

            {/* 时间 */}
            {teamTime && (
              <Chip size="lg" variant="flat" color="secondary" startContent={<span>🕐</span>}>
                {format(teamTime, "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </Chip>
            )}

            {/* 大铁 */}
            <Chip
              size="lg"
              variant="flat"
              color={team.is_xuanjing_booked ? "danger" : "success"}
              startContent={<img src="/玄晶.png" alt="玄晶" className="w-5 h-5" />}
            >
              {team.is_xuanjing_booked ? "大铁已包" : "大铁可拍"}
            </Chip>

            {/* 小铁 */}
            <Chip
              size="lg"
              variant="flat"
              color={team.is_yuntie_booked ? "danger" : "success"}
              startContent={<img src="/陨铁.png" alt="陨铁" className="w-5 h-5" />}
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
                <h3 className="text-sm font-semibold text-default-600">📢 团队告示</h3>
                <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                  <p className="text-sm text-default-700 dark:text-default-300 whitespace-pre-wrap">{team.notice}</p>
                </div>
              </div>
            )}

            {/* 团队面板 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-default-600">👥 团队面板</h3>
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
                            onPress={() => handleModeChange(mode.key)}
                          >
                            <span className="mr-1">{mode.icon}</span>
                            {mode.label}
                          </Button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 进组标记模式的操作按钮 */}
                {isAdmin && boardMode === "mark" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="flat" color="warning" onPress={handleCallAllUnmarked}>
                      📣 召唤全体未标记
                    </Button>
                  </div>
                )}
              </div>

              <TeamBoard
                rules={rules}
                signupList={memoizedInputs.signupList}
                slotAssignments={memoizedInputs.slotAssignments}
                mode={boardMode}
                guildId={team.guild_id}
                isAdmin={isAdmin}
                currentUser={user}
                onRuleChange={(slotIndex) => showToast.info(`已修改 ${slotIndex + 1} 号坑位规则，保存逻辑待接入`)}
                onAssign={handleAssign}
                onAssignDelete={handleAssignDelete}
                onPresenceChange={handlePresenceChange}
                onSwapSlots={handleSwapSlots}
                onSignupDelete={handleSignupDelete}
                onCallMember={handleCallMember}
              />
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

            {/* 团队日志 */}
            <TeamLogs team={team} guildId={team.guild_id} />
          </div>
        </CardBody>
      </Card>

      {/* 金团记录弹窗 */}
      <GoldRecordModal
        isOpen={goldRecordModalOpen}
        onClose={() => setGoldRecordModalOpen(false)}
        team={team}
        guildId={team?.guild_id}
        onSuccess={handleGoldRecordSuccess}
      />

      {/* 黑本推荐弹窗 */}
      <Modal
        isOpen={recommendationModalOpen}
        onClose={() => setRecommendationModalOpen(false)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">黑本推荐</h3>
              <p className="text-sm text-gray-500">基于红黑分、频次和时间的综合推荐</p>
            </div>
          </ModalHeader>
          <ModalBody>
            {loadingRecommendations ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">暂无推荐数据</div>
            ) : (
              <Table aria-label="黑本推荐列表">
                <TableHeader>
                  <TableColumn>排名</TableColumn>
                  <TableColumn>用户</TableColumn>
                  <TableColumn>红黑分</TableColumn>
                  <TableColumn>黑本次数</TableColumn>
                  <TableColumn>推荐分</TableColumn>
                  <TableColumn>状态</TableColumn>
                </TableHeader>
                <TableBody>
                  {recommendations.map((rec, index) => (
                    <TableRow key={rec.user_id}>
                      <TableCell>
                        <div className="font-bold text-lg">
                          {index + 1 <= 3 ? (
                            <span
                              className={
                                index + 1 === 1
                                  ? "text-yellow-500"
                                  : index + 1 === 2
                                  ? "text-gray-400"
                                  : "text-orange-600"
                              }
                            >
                              #{index + 1}
                            </span>
                          ) : (
                            <span className="text-gray-600">#{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rec.user_avatar && <Avatar src={rec.user_avatar} size="sm" />}
                          <span className="font-medium">{rec.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{Number(rec.rank_score).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {rec.heibenren_count}次
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg text-primary">
                          {Number(rec.recommendation_score).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rec.is_new ? (
                          <Chip size="sm" color="primary" variant="flat">
                            NEW
                          </Chip>
                        ) : rec.cars_since_last !== null && rec.cars_since_last > 0 ? (
                          <Chip size="sm" color="warning" variant="flat">
                            {rec.cars_since_last}车未黑
                          </Chip>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="font-semibold">计算说明：</div>
                <div>• 推荐分 = 红黑分 × 频次修正系数 × 时间修正系数</div>
                <div>• 频次修正系数：1次(1.5) → 2次(1.25) → 3次(1.1) → 4次以上(1.0)</div>
                <div>• 时间修正系数：ln(20 + e^(0.04(x-10))) - 2，其中 x 为距离上次黑本的车次数</div>
                <div>• NEW：无黑本记录的用户，使用平均红黑分 × 4</div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setRecommendationModalOpen(false)}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
