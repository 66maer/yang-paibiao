import { Card, CardBody, CardHeader, Divider, Tabs, Tab } from "@heroui/react";

/**
 * 右侧面板 - 根据用户角色显示不同内容
 * - 普通用户: 我的报名 / 候补列表
 * - 管理员: 候补列表 / 报名日志
 * - 编辑模式: 显示帮助提示
 */
export default function TeamRightPanel({ team, isAdmin, isEditMode = false }) {
  // 编辑模式下显示帮助信息
  if (isEditMode) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">
            💡 编辑提示
          </h3>
        </CardHeader>
        <Divider />
        <CardBody className="overflow-auto">
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                🪄 自动生成标题
              </h4>
              <p className="text-default-600 text-xs">
                填写完时间和副本后，点击「自动生成」按钮可以快速生成标题
              </p>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                ⏰ 不指定时间
              </h4>
              <p className="text-default-600 text-xs">
                适用于活动团、排表团等不需要具体时间的开团
              </p>
            </div>

            <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20">
              <h4 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">
                💎 铁标记
              </h4>
              <p className="text-default-600 text-xs">
                大铁（玄晶）和小铁（陨铁）是否已被预定
              </p>
            </div>

            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                🔒 高级设置
              </h4>
              <p className="text-default-600 text-xs">
                • 仅管理员可见：隐藏开团，普通成员看不到<br />
                • 锁定报名：禁止新的报名
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

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
        <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">
          {isAdmin ? "管理面板" : "我的信息"}
        </h3>
      </CardHeader>
      <Divider />
      <CardBody className="overflow-auto p-0">
        <Tabs
          aria-label="右侧面板"
          variant="underlined"
          color="primary"
          classNames={{
            tabList: "w-full px-4",
            cursor: "bg-pink-500",
            tabContent: "group-data-[selected=true]:text-pink-600",
          }}
        >
          {isAdmin ? (
            <>
              {/* 管理员视图 */}
              <Tab key="waitlist" title="候补列表">
                <div className="p-4">
                  <WaitlistContent />
                </div>
              </Tab>
              <Tab key="logs" title="报名日志">
                <div className="p-4">
                  <SignupLogsContent />
                </div>
              </Tab>
            </>
          ) : (
            <>
              {/* 普通用户视图 */}
              <Tab key="my-signup" title="我的报名">
                <div className="p-4">
                  <MySignupContent />
                </div>
              </Tab>
              <Tab key="waitlist" title="候补列表">
                <div className="p-4">
                  <WaitlistContent />
                </div>
              </Tab>
            </>
          )}
        </Tabs>
      </CardBody>
    </Card>
  );
}

/**
 * 我的报名内容
 */
function MySignupContent() {
  return (
    <div className="p-8 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-2 border-dashed border-default-300">
      <div className="text-center text-default-400">
        <div className="text-4xl mb-2">🚧</div>
        <p className="text-sm">我的报名功能开发中...</p>
      </div>
    </div>
  );
}

/**
 * 候补列表内容
 */
function WaitlistContent() {
  return (
    <div className="p-8 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-dashed border-default-300">
      <div className="text-center text-default-400">
        <div className="text-4xl mb-2">🚧</div>
        <p className="text-sm">候补列表功能开发中...</p>
      </div>
    </div>
  );
}

/**
 * 报名日志内容
 */
function SignupLogsContent() {
  return (
    <div className="p-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-dashed border-default-300">
      <div className="text-center text-default-400">
        <div className="text-4xl mb-2">🚧</div>
        <p className="text-sm">报名日志功能开发中...</p>
      </div>
    </div>
  );
}
