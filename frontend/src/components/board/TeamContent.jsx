import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider, Tooltip } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import { closeTeam, updateTeam } from "../../api/teams";
import {
  getSignups,
  lockSignup,
  removeSlotAssignment,
  updatePresenceStatus,
  createSignup,
  cancelSignup,
} from "../../api/signups";
import { showToast, showConfirm } from "../../utils/toast";
import TeamBoard from "./TeamBoard";
import { buildEmptyRules } from "../../utils/slotAllocation";
import { transformSignups } from "../../utils/signupTransform";
import useAuthStore from "../../stores/authStore";

/**
 * 中间内容 - 开团详情
 */
export default function TeamContent({ team, isAdmin, onEdit, onRefresh }) {
  const [boardMode, setBoardMode] = useState("view");
  const [pendingSlotView, setPendingSlotView] = useState(null); // 暂存未提交的视觉映射
  const { user } = useAuthStore();
  const prevTeamIdRef = useRef(null);

  // Always call hooks in the same order - move conditional check below
  const teamTime = team?.team_time ? new Date(team.team_time) : null;

  // 监听团队切换，提示未保存的更改
  useEffect(() => {
    const currentTeamId = team?.id;

    // 如果团队ID发生变化且不是初始加载
    if (prevTeamIdRef.current !== null && prevTeamIdRef.current !== currentTeamId && pendingSlotView) {
      showToast.warning("您有未保存的连连看更改已丢失");
      setPendingSlotView(null);
      setBoardMode("view"); // 重置为浏览模式
    }

    prevTeamIdRef.current = currentTeamId;
  }, [team?.id, pendingSlotView]);

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

  // Prepare rules, signup list, and view mapping with memoization
  const memoizedInputs = useMemo(
    () => ({
      rawRules: team?.slot_rules || team?.rules || [],
      signupList: signupList,
      slotView: team?.slot_view || [],
    }),
    [team?.slot_rules, team?.rules, signupList, team?.slot_view]
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

  // 处理模式切换
  const handleModeChange = async (newMode) => {
    // 如果有未保存的连连看更改，提示用户
    if (pendingSlotView && boardMode === "drag") {
      const confirmed = await showConfirm("您有未保存的连连看更改，确定要切换模式吗？未保存的更改将丢失。");
      if (!confirmed) return;
      setPendingSlotView(null); // 清空未保存的更改
    }
    setBoardMode(newMode);
  };

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

  // 排表模式 - 分配坑位
  const handleAssign = async (slotIndex, payload) => {
    let signupId = payload.signupId;
    const slotPosition = slotIndex + 1; // 转换为1-based索引

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

      showToast.success(`已将 ${payload.playerName || "报名"} 分配到 ${slotPosition} 号坑位`);
      await mutateSignups(); // 刷新报名列表
    } catch (error) {
      console.error("分配坑位失败:", error);
      showToast.error(error?.response?.data?.message || error || "分配坑位失败");
    }
  };

  // 排表模式 - 删除坑位分配
  const handleAssignDelete = async (slotIndex) => {
    // 从报名列表中找到该坑位对应的报名
    const signup = signupList.find((s) => s.slot_position === slotIndex + 1);
    if (!signup) {
      showToast.error("未找到该坑位的报名");
      return;
    }

    try {
      await removeSlotAssignment(team.guild_id, team.id, signup.id);
      showToast.success(`已删除 ${slotIndex + 1} 号坑位的分配`);
      await mutateSignups(); // 刷新报名列表
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

  // 连连看模式 - 暂存视觉映射(不直接提交)
  const handleReorder = async (newView) => {
    setPendingSlotView(newView);
  };

  // 连连看模式 - 提交视觉映射
  const handleSubmitReorder = async () => {
    if (!pendingSlotView) return;

    try {
      await updateTeam(team.guild_id, team.id, {
        slot_view: pendingSlotView,
      });
      showToast.success("已保存视觉映射");
      setPendingSlotView(null); // 清空暂存
      onRefresh?.(); // 刷新团队数据
    } catch (error) {
      console.error("保存视觉映射失败:", error);
      showToast.error(error?.response?.data?.message || "保存视觉映射失败");
    }
  };

  // 连连看模式 - 取消编辑
  const handleCancelReorder = () => {
    setPendingSlotView(null);
    showToast.info("已取消编辑");
  };

  // 连连看模式 - 恢复原始设置
  const handleResetSlotView = async () => {
    const confirmed = await showConfirm("确定要恢复到原始面板状态吗？这将重置所有连连看的排列。");

    if (!confirmed) return;

    try {
      // 生成 0-24 的数组作为原始顺序
      const originalView = Array.from({ length: 25 }, (_, i) => i);
      await updateTeam(team.guild_id, team.id, {
        slot_view: originalView,
      });
      showToast.success("已恢复到原始面板状态");
      setPendingSlotView(null); // 清空暂存
      onRefresh?.(); // 刷新团队数据
    } catch (error) {
      console.error("恢复原始设置失败:", error);
      showToast.error(error?.response?.data?.message || "恢复原始设置失败");
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
    } catch (error) {
      console.error("取消报名失败:", error);
      showToast.error(error?.response?.data?.message || "取消报名失败");
    }
  };

  return (
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
            <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">{team.title || "未命名开团"}</h2>
            {team.is_hidden && (
              <Chip size="sm" variant="flat" color="default">
                仅管理员可见
              </Chip>
            )}
          </div>

          {/* 操作按钮 */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Tooltip content="编辑开团">
                <Button size="sm" variant="flat" color="primary" onPress={() => onEdit(team)}>
                  ✏️ 编辑
                </Button>
              </Tooltip>
              <Tooltip content="关闭开团">
                <Button size="sm" variant="flat" color="danger" onPress={handleCloseTeam}>
                  ❌ 关闭
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* 基础信息标签 */}
        <div className="flex flex-wrap gap-2">
          {/* 副本 */}
          <Chip size="sm" variant="flat" color="primary" startContent={<span>🏛️</span>}>
            {team.dungeon || "未指定副本"}
          </Chip>

          {/* 时间 */}
          {teamTime && (
            <Chip size="sm" variant="flat" color="secondary" startContent={<span>🕐</span>}>
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
              <h3 className="text-sm font-semibold text-default-600">📢 团队告示</h3>
              <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                <p className="text-sm text-default-700 dark:text-default-300 whitespace-pre-wrap">{team.notice}</p>
              </div>
            </div>
          )}

          {/* 团队面板 - 留空 */}
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

              {/* 连连看模式的操作按钮 */}
              {isAdmin && boardMode === "drag" && (
                <div className="flex items-center gap-2">
                  {pendingSlotView && (
                    <>
                      <Button size="sm" variant="flat" color="default" onPress={handleCancelReorder}>
                        取消
                      </Button>
                      <Button size="sm" variant="solid" color="success" onPress={handleSubmitReorder}>
                        ✅ 完成编辑
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="flat" color="warning" onPress={handleResetSlotView}>
                    🔄 恢复原始设置
                  </Button>
                </div>
              )}
            </div>

            <TeamBoard
              rules={rules}
              signupList={memoizedInputs.signupList}
              view={pendingSlotView || memoizedInputs.slotView}
              mode={boardMode}
              guildId={team.guild_id}
              isAdmin={isAdmin}
              currentUser={user}
              onRuleChange={(slotIndex) => showToast.info(`已修改 ${slotIndex + 1} 号坑位规则，保存逻辑待接入`)}
              onAssign={handleAssign}
              onAssignDelete={handleAssignDelete}
              onPresenceChange={handlePresenceChange}
              onReorder={handleReorder}
              onSignupDelete={handleSignupDelete}
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
        </div>
      </CardBody>
    </Card>
  );
}
