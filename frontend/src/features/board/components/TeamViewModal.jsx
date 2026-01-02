import { useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Card, CardBody, Chip, Divider } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import { getSignups } from "@/api/signups";
import TeamBoard from "@/features/board/components/TeamBoard/TeamBoard";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { transformSignups } from "@/utils/signupTransform";

/**
 * 团队查看弹窗（只读模式）
 */
export default function TeamViewModal({ team, isOpen, onClose }) {
  // 使用 SWR 加载报名数据
  const { data: signupsData } = useSWR(
    team?.guild_id && team?.id ? `signups-${team.guild_id}-${team.id}` : null,
    () => getSignups(team.guild_id, team.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // 解析并转换报名列表
  const signupList = useMemo(() => {
    const rawData = signupsData?.data?.items || signupsData?.data || signupsData || [];
    return transformSignups(rawData);
  }, [signupsData]);

  // 准备规则和视图映射
  const rules = useMemo(() => {
    if (team?.slot_rules && team.slot_rules.length > 0) {
      return team.slot_rules;
    }
    if (team?.rules && team.rules.length > 0) {
      return team.rules;
    }
    return buildEmptyRules();
  }, [team?.slot_rules, team?.rules]);

  const slotView = useMemo(() => {
    return team?.slot_view || [];
  }, [team?.slot_view]);

  if (!team) return null;

  const teamTime = team.team_time ? new Date(team.team_time) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      classNames={{
        base: "max-w-7xl",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex-col items-start gap-3 pb-4">
          {/* 标题行 */}
          <div className="flex items-center gap-3 w-full">
            {team.is_locked && (
              <Chip size="lg" variant="flat" color="warning">
                🔒
              </Chip>
            )}
            <h2 className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              {team.title || "未命名开团"}
            </h2>
            {team.is_hidden && (
              <Chip size="lg" variant="flat" color="default">
                仅管理员可见
              </Chip>
            )}
            <Chip
              size="lg"
              variant="flat"
              color={team.status === "completed" ? "success" : "warning"}
            >
              {team.status === "completed" ? "已完成" : "已取消"}
            </Chip>
          </div>

          {/* 副本和时间信息 */}
          <div className="flex items-center gap-4 text-default-600 w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-lg font-medium">{team.dungeon || "未设置副本"}</span>
            </div>
            <Divider orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span className="text-lg">
                {teamTime ? format(teamTime, "yyyy-MM-dd HH:mm", { locale: zhCN }) : "未设置时间"}
              </span>
            </div>
            <Divider orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-lg">{team.max_members || 0} 人</span>
            </div>
          </div>

          {/* 预订信息 */}
          {(team.is_xuanjing_booked || team.is_yuntie_booked) && (
            <div className="flex items-center gap-2 w-full">
              {team.is_xuanjing_booked && (
                <Chip color="success" variant="flat">
                  已订玄晶
                </Chip>
              )}
              {team.is_yuntie_booked && (
                <Chip color="success" variant="flat">
                  已订云铁
                </Chip>
              )}
            </div>
          )}

          {/* 公告 */}
          {team.notice && (
            <Card className="w-full bg-default-50">
              <CardBody className="py-2">
                <div className="text-sm text-default-700">
                  <span className="font-semibold">📢 公告：</span>
                  {team.notice}
                </div>
              </CardBody>
            </Card>
          )}
        </ModalHeader>

        <ModalBody className="px-6 pb-6">
          <div className="space-y-4">
            {/* 团队面板 - 只读模式 */}
            <TeamBoard
              rules={rules}
              signupList={signupList}
              view={slotView}
              mode="view"
              isAdmin={false}
              guildId={team.guild_id}
            />

            {/* 报名统计 */}
            <Card>
              <CardBody>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-default-600">总报名数：</span>
                    <span className="text-lg font-semibold">{signupList.length}</span>
                  </div>
                  <Divider orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <span className="text-default-600">已分配坑位：</span>
                    <span className="text-lg font-semibold">
                      {signupList.filter((s) => s.slot_position).length}
                    </span>
                  </div>
                  {team.closed_at && (
                    <>
                      <Divider orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-2">
                        <span className="text-default-600">关闭时间：</span>
                        <span className="text-lg">
                          {format(new Date(team.closed_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
