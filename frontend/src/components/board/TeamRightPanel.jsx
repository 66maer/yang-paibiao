import { useState } from "react";
import { Card, CardBody, CardHeader, Divider, Tabs, Tab, Button } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import SignupCard from "./SignupCard";
import WaitlistCard from "./WaitlistCard";

/**
 * 右侧面板 - 报名信息与候补列表
 * - 第一页：报名信息（本人报名 + 代报名列表）
 * - 第二页：候补列表（管理员可取消候补）
 */
export default function TeamRightPanel({ team, isAdmin }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // TODO: 从 API 获取报名数据
  const mySignup = null; // 当前用户的报名
  const myProxySignups = []; // 当前用户的代报名列表
  const waitlist = []; // 候补列表

  /**
   * 处理报名
   */
  const handleSignup = async () => {
    // TODO: 调用报名 API
    console.log("处理报名");
  };

  /**
   * 处理代报名
   */
  const handleProxySignup = async () => {
    // TODO: 打开代报名弹窗
    console.log("处理代报名");
  };

  /**
   * 处理删除报名
   */
  const handleDeleteSignup = async (signup) => {
    // TODO: 调用删除报名 API
    console.log("删除报名", signup);
  };

  /**
   * 处理取消候补
   */
  const handleRemoveWaitlist = async (waitlistItem) => {
    // TODO: 调用取消候补 API
    console.log("取消候补", waitlistItem);
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
        <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">报名管理</h3>
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
                <div className="space-y-4">
                  <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-default-300">
                    <div className="text-center text-default-400">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm mb-4">你还没有报名</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          color="primary"
                          size="lg"
                          className="bg-gradient-to-r from-pink-500 to-purple-500"
                          onPress={handleSignup}
                          isLoading={loading}
                        >
                          ✨ 立即报名
                        </Button>
                        <Button
                          color="secondary"
                          size="lg"
                          variant="flat"
                          onPress={handleProxySignup}
                          isLoading={loading}
                        >
                          👥 代报名
                        </Button>
                      </div>
                    </div>
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

                  {/* 代报名按钮 */}
                  <div>
                    <Button color="secondary" variant="flat" fullWidth onPress={handleProxySignup} isLoading={loading}>
                      👥 代报名其他成员
                    </Button>
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
    </Card>
  );
}
