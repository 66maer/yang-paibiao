import { useState } from "react";
import { Card, CardBody, Button, Spinner, Chip } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import { getTeamLogs } from "@/api/teams";

/**
 * 团队日志组件
 * 默认收起，点击展开时才请求数据
 */
export default function TeamLogs({ team, guildId }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 只有展开时才请求数据
  const { data: logsData, isLoading } = useSWR(
    isExpanded && team?.id ? `team-logs-${guildId}-${team.id}` : null,
    () => getTeamLogs(guildId, team.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // logsData 已经是日志数组了（因为 getTeamLogs 返回 response.data）
  const logs = logsData || [];

  // 获取操作类型的显示文本和图标
  const getActionDisplay = (actionType) => {
    const displays = {
      // 团队操作
      team_created: { icon: "🎉", text: "开团", color: "success" },
      team_updated: { icon: "✏️", text: "编辑", color: "primary" },
      team_closed: { icon: "✅", text: "关闭", color: "warning" },
      team_reopened: { icon: "🔄", text: "重新开启", color: "secondary" },
      team_deleted: { icon: "🗑️", text: "删除", color: "danger" },

      // 报名操作
      signup_created: { icon: "➕", text: "报名", color: "success" },
      signup_cancelled: { icon: "➖", text: "取消报名", color: "warning" },

      // 状态操作
      team_locked: { icon: "🔒", text: "锁定", color: "warning" },
      team_unlocked: { icon: "🔓", text: "解锁", color: "success" },
      team_hidden: { icon: "👁️‍🗨️", text: "隐藏", color: "default" },
      team_shown: { icon: "👁️", text: "显示", color: "primary" },
      signup_presence_marked: { icon: "✅", text: "进组标记", color: "secondary" },
      slot_assigned: { icon: "🎯", text: "分配坑位", color: "primary" },
      slot_unassigned: { icon: "↩️", text: "取消坑位", color: "default" },
    };
    return displays[actionType] || { icon: "📝", text: actionType, color: "default" };
  };

  // 格式化操作详情描述
  const formatActionDescription = (log) => {
    const { action_type, action_detail } = log;

    switch (action_type) {
      case "team_created":
        return `创建了团队「${action_detail.title}」`;

      case "team_updated":
        const changes = action_detail.changes || {};
        const changeTexts = Object.entries(changes).map(([key]) => {
          const fieldNames = {
            title: "标题",
            team_time: "开团时间",
            dungeon: "副本",
            notice: "告示",
            max_members: "最大人数",
            is_xuanjing_booked: "玄晶预定",
            is_yuntie_booked: "陨铁预定",
          };
          return fieldNames[key] || key;
        });
        return `编辑了团队信息${changeTexts.length > 0 ? `（${changeTexts.join("、")}）` : ""}`;

      case "team_closed":
        return `关闭了团队（${action_detail.status === "completed" ? "完成" : "取消"}）`;

      case "team_reopened":
        return `重新开启了团队`;

      case "team_deleted":
        return `删除了团队`;

      case "signup_created":
        const prefix = action_detail.is_proxy ? `代 ${action_detail.player_name} 报名` : "报名";
        const richTag = action_detail.is_rich ? "【老板】" : "";
        const charInfo = action_detail.character_name || action_detail.player_name;
        return `${prefix} ${richTag}${charInfo}（${action_detail.xinfa}）`;

      case "signup_cancelled":
        return `${action_detail.cancelled_by_self ? "取消了" : "帮"} ${action_detail.player_name} 取消报名`;

      case "team_locked":
        return `锁定了报名`;

      case "team_unlocked":
        return `解锁了报名`;

      case "team_hidden":
        return `隐藏了团队`;

      case "team_shown":
        return `显示了团队`;

      case "signup_presence_marked":
        const statusText = {
          ready: "就绪",
          absent: "缺席",
          null: "未标记"
        }[action_detail.presence_status] || action_detail.presence_status;
        return `标记 ${action_detail.player_name} 为 ${statusText}`;

      case "slot_assigned":
        return `分配 ${action_detail.player_name}（${action_detail.xinfa}）到 ${action_detail.slot_position} 号位`;

      case "slot_unassigned":
        return `取消了 ${action_detail.slot_position} 号位的分配`;

      default:
        return JSON.stringify(action_detail);
    }
  };

  return (
    <div className="mt-6">
      <Button
        size="sm"
        variant="flat"
        onPress={() => setIsExpanded(!isExpanded)}
        className="mb-3"
      >
        {isExpanded ? "▼" : "▶"} 团队日志
      </Button>

      {isExpanded && (
        <Card>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-default-400 py-4">暂无日志记录</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const display = getActionDisplay(log.action_type);
                  return (
                    <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-default-200 last:border-0">
                      {/* 图标 */}
                      <div className="text-2xl flex-shrink-0">{display.icon}</div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Chip size="sm" color={display.color} variant="flat">
                            {display.text}
                          </Chip>
                          <span className="text-sm font-medium text-default-700">
                            {log.action_user_name || "系统"}
                          </span>
                        </div>
                        <p className="text-sm text-default-600 break-words">
                          {formatActionDescription(log)}
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
