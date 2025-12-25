import { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Divider, Tabs, Tab, Button } from "@heroui/react";
import useSWR from "swr";
import useAuthStore from "../../stores/authStore";
import SignupCard from "./SignupCard";
import WaitlistCard from "./WaitlistCard";
import SignupModal from "./SignupModal";
import ProxySignupModal from "./ProxySignupModal";
import { getSignups } from "../../api/signups";
import { allocateSlots, buildEmptyRules } from "../../utils/slotAllocation";

/**
 * 右侧面板 - 报名信息与候补列表
 * - 第一页：报名信息（本人报名 + 代报名列表）
 * - 第二页：候补列表（管理员可取消候补）
 */
export default function TeamRightPanel({ team, isAdmin, onRefresh }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
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

  // 获取报名列表
  const signupList = useMemo(() => {
    return signupsData?.data?.items || signupsData?.data || signupsData || [];
  }, [signupsData]);

  // 筛选出当前用户的报名（本人报名）
  const mySignup = useMemo(() => {
    if (!user || !signupList) return null;
    return signupList.find((signup) => {
      const isOwn = signup.user_id === user.id || signup.signup_user_id === user.id;
      const isProxy = signup.submitted_by === user.id || signup.submitter_user_id === user.id;
      return isOwn && !isProxy;
    });
  }, [signupList, user]);

  // 筛选出当前用户的代报名列表
  const myProxySignups = useMemo(() => {
    if (!user || !signupList) return [];
    return signupList.filter((signup) => {
      const submitterId = signup.submitted_by || signup.submitter_user_id;
      const signupUserId = signup.user_id || signup.signup_user_id;
      return submitterId === user.id && signupUserId !== user.id;
    });
  }, [signupList, user]);

  // 计算候补列表
  const waitlist = useMemo(() => {
    if (!team) return [];
    const rules = team?.slot_rules || team?.rules || buildEmptyRules();
    const allocation = allocateSlots(rules, signupList);
    return allocation.waitlist || [];
  }, [team, signupList]);

  // 检查当前用户是否已在该车报名
  const hasUserSignedUp = useMemo(() => {
    if (!user || !signupList) return false;
    return signupList.some((signup) =>
      signup.user_id === user.id || signup.signup_user_id === user.id
    );
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
    // TODO: 调用删除报名 API
    console.log("删除报名", signup);
    // 删除成功后需要刷新数据
    await reloadSignups();
    await onRefresh?.();
  };

  /**
   * 处理取消候补
   */
  const handleRemoveWaitlist = async (waitlistItem) => {
    // TODO: 调用取消候补 API
    console.log("取消候补", waitlistItem);
    // 取消成功后需要刷新数据
    await reloadSignups();
    await onRefresh?.();
  };

  /**
   * 报名成功后的回调：刷新本组件的报名数据 + 刷新父组件的团队数据
   */
  const handleSignupSuccess = async () => {
    await reloadSignups(); // 刷新报名数据
    await onRefresh?.(); // 刷新团队数据（更新 signup_list）
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
                isLoading={loading}
                isDisabled={hasUserSignedUp}
              >
                {hasUserSignedUp ? "✅ 已报名" : "✨ 立即报名"}
              </Button>
              <Button
                color="secondary"
                variant="flat"
                className="flex-1"
                onPress={handleProxySignup}
                isLoading={loading}
              >
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
              {!mySignup ? (
                // 未报名状态
                <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-default-300">
                  <div className="text-center text-default-400">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-sm">你还没有报名，点击上方按钮报名</p>
                  </div>
                </div>
              ) : (
                // 已报名状态
                <div className="space-y-4">
                  {/* 本人报名信息 */}
                  <div>
                    <h4 className="text-sm font-semibold text-default-600 mb-2">我的报名</h4>
                    <SignupCard signup={mySignup} isOwn={true} canDelete={true} onDelete={handleDeleteSignup} />
                  </div>

                  {/* 代报名列表 */}
                  {myProxySignups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-default-600 mb-2">
                        我的代报名 ({myProxySignups.length})
                      </h4>
                      <div className="space-y-2">
                        {myProxySignups.map((signup, index) => (
                          <SignupCard key={index} signup={signup} canDelete={true} onDelete={handleDeleteSignup} />
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
                    <WaitlistCard key={index} waitlistItem={item} isAdmin={isAdmin} onRemove={handleRemoveWaitlist} />
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
