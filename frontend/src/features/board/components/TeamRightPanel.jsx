import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Divider, Tabs, Tab, Button } from "@heroui/react";
import useSWR from "swr";
import useAuthStore from "@/stores/authStore";
import SignupItemCard from "./SignupItemCard";
import SignupModal from "./SignupModal";
import ProxySignupModal from "./ProxySignupModal";
import { getSignups, cancelSignup } from "@/api/signups";
import { getTeamDetail } from "@/api/teams";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { transformSignups } from "@/utils/signupTransform";
import { buildWaitlistFromIds } from "./TeamBoard/utils";

/**
 * 右侧面板 - 报名信息与候补列表
 * - 第一页：报名信息（本人报名 + 代报名列表）
 * - 第二页：候补列表（管理员可取消候补）
 */
export default function TeamRightPanel({ team, isAdmin, onRefresh, onUpdateTeam }) {
  const { user } = useAuthStore();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);

  // 使用 SWR 加载报名数据
  const { data: signupsData, mutate: reloadSignups } = useSWR(
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

  // 筛选出当前用户的报名（本人报名）
  const mySignup = useMemo(() => {
    if (!user || !signupList) return null;
    return signupList.find((signup) => {
      // 本人报名：signup_user_id 等于当前用户 ID
      return signup.userId === user.id;
    });
  }, [signupList, user]);

  // 筛选出当前用户的代报名列表
  const myProxySignups = useMemo(() => {
    if (!user || !signupList) return [];
    return signupList.filter((signup) => {
      // 代报名：submitter_id 等于当前用户，且 signup_user_id 不等于当前用户（包括 null）
      return signup.submitterId === user.id && signup.userId !== user.id;
    });
  }, [signupList, user]);

  // 计算候补列表（优先使用后端返回的，向后兼容前端计算）
  const waitlist = useMemo(() => {
    if (!team) return [];

    // 使用后端返回的 waitlist
    if (team.waitlist && Array.isArray(team.waitlist) && team.waitlist.length > 0) {
      return buildWaitlistFromIds(team.waitlist, signupList);
    }

    // 向后兼容：如果没有后端 waitlist，返回空数组
    // 因为后端现在会计算，这种情况应该只在数据迁移前出现
    return [];
  }, [team, signupList]);

  // 检查当前用户是否已在该车报名
  const hasUserSignedUp = useMemo(() => {
    if (!user || !signupList) return false;
    return signupList.some((signup) => signup.userId === user.id);
  }, [signupList, user]);

  /**
   * 处理报名
   */
  const handleSignup = async () => {
    setShowSignupModal(true);
  };

  /**
   * 处理代报名
   */
  const handleProxySignup = async () => {
    setShowProxyModal(true);
  };

  /**
   * 处理删除报名
   */
  const handleDeleteSignup = async (signup) => {
    try {
      await cancelSignup(team.guild_id, team.id, signup.id);
      // 删除成功后刷新数据
      await reloadSignups();
    } catch (error) {
      console.error("取消报名失败:", error);
      alert(error.response?.data?.message || "取消报名失败，请重试");
    }
  };

  /**
   * 处理取消候补
   */
  const handleRemoveWaitlist = async (waitlistItem) => {
    try {
      await cancelSignup(team.guild_id, team.id, waitlistItem.id);
      // 删除成功后刷新数据
      await reloadSignups();
    } catch (error) {
      console.error("取消候补失败:", error);
      alert(error.response?.data?.message || "取消候补失败，请重试");
    }
  };

  /**
   * 报名成功后的回调：刷新本组件的报名数据和团队数据
   * 注意：不需要刷新整个团队列表，避免页面闪烁影响用户体验
   */
  const handleSignupSuccess = async () => {
    // 并行刷新报名数据和团队数据
    await Promise.all([
      reloadSignups(), // 刷新报名数据
      (async () => {
        // 刷新团队数据（排表和候补列表）
        if (team && onUpdateTeam) {
          try {
            const response = await getTeamDetail(team.guild_id, team.id);
            const updatedTeam = response.data || response;
            onUpdateTeam(updatedTeam);
          } catch (error) {
            console.error("刷新团队数据失败:", error);
          }
        }
      })(),
    ]);
  };

  if (!team) {
    return (
      <Card className="h-full">
        <CardBody className="flex items-center justify-center">
          <div className="text-center text-default-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">请先选择一个团队</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="w-full flex gap-2">
          {team.is_locked ? (
            // 团队已锁定时显示禁用按钮
            <Button color="warning" variant="flat" className="flex-1" isDisabled>
              🔒 团队锁定，无法报名
            </Button>
          ) : (
            // 团队未锁定时显示报名和代报名按钮
            <>
              <Button
                color="primary"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                onPress={handleSignup}
                isDisabled={hasUserSignedUp}
              >
                {hasUserSignedUp ? "✅ 已报名" : "✨ 立即报名"}
              </Button>
              <Button color="secondary" variant="flat" className="flex-1" onPress={handleProxySignup}>
                👥 代报名
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="overflow-auto p-0">
        <Tabs
          aria-label="报名管理"
          variant="underlined"
          color="primary"
          classNames={{
            tabList: "w-full px-4",
            cursor: "bg-pink-500",
            tabContent: "group-data-[selected=true]:text-pink-600",
          }}
        >
          {/* 报名信息 */}
          <Tab key="signup-info" title="报名信息">
            <div className="p-4 space-y-4">
              {!mySignup && myProxySignups.length === 0 ? (
                // 情况1：未报名且无代报名
                <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-default-300">
                  <div className="text-center text-default-400">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-sm">你还没有报名，点击上方按钮报名</p>
                  </div>
                </div>
              ) : (
                // 情况2和3：有本人报名或有代报名
                <div className="space-y-4">
                  {/* 未报名但有代报名时的提示 */}
                  {!mySignup && myProxySignups.length > 0 && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-default-300">
                      <div className="text-center text-default-400">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-sm">你还没有报名，点击上方按钮报名</p>
                      </div>
                    </div>
                  )}

                  {/* 本人报名信息 */}
                  {mySignup && (
                    <div>
                      <h4 className="text-sm font-semibold text-default-600 mb-2">我的报名</h4>
                      <SignupItemCard
                        signup={mySignup}
                        type="signup"
                        isAdmin={isAdmin}
                        currentUser={user}
                        onDelete={() => handleDeleteSignup(mySignup)}
                      />
                    </div>
                  )}

                  {/* 代报名列表 */}
                  {myProxySignups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-default-600 mb-2">代报名 ({myProxySignups.length})</h4>
                      <div className="space-y-2">
                        {myProxySignups.map((signup, index) => (
                          <SignupItemCard
                            key={index}
                            signup={signup}
                            type="signup"
                            isAdmin={isAdmin}
                            currentUser={user}
                            onDelete={() => handleDeleteSignup(signup)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tab>

          {/* 候补列表 */}
          <Tab key="waitlist" title="候补列表">
            <div className="p-4">
              {waitlist.length === 0 ? (
                <div className="p-8 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-dashed border-default-300">
                  <div className="text-center text-default-400">
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-sm">暂无候补成员</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-default-500 mb-3">
                    共 {waitlist.length} 人候补{isAdmin && "（管理员可取消候补）"}
                  </div>
                  {waitlist.map((item, index) => (
                    <SignupItemCard
                      key={index}
                      signup={item}
                      type="waitlist"
                      waitlistOrder={item.waitlist_order || index + 1}
                      isAdmin={isAdmin}
                      currentUser={user}
                      onDelete={() => handleRemoveWaitlist(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        guildId={team?.guild_id}
        teamId={team?.id}
        team={team}
        user={user}
        onSuccess={handleSignupSuccess}
      />

      <ProxySignupModal
        isOpen={showProxyModal}
        onClose={() => setShowProxyModal(false)}
        guildId={team?.guild_id}
        teamId={team?.id}
        team={team}
        user={user}
        onSuccess={handleSignupSuccess}
      />
    </Card>
  );
}
