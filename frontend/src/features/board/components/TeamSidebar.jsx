import { Card, CardBody, CardHeader, Divider, Chip, Button } from "@heroui/react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 左侧导航 - 开团列表（按日期分组）
 */
export default function TeamSidebar({ teams = [], selectedTeamId, onSelectTeam, isAdmin = false, onCreateTeam }) {
  // 按日期分组
  const groupedTeams = teams.reduce((groups, team) => {
    const teamDate = new Date(team.team_time);
    const dateKey = format(teamDate, "yyyy-MM-dd");

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: teamDate,
        teams: [],
      };
    }

    groups[dateKey].teams.push(team);
    return groups;
  }, {});

  // 按日期排序
  const sortedGroups = Object.values(groupedTeams).sort((a, b) => a.date - b.date);

  // 格式化日期显示
  const formatDateLabel = (date) => {
    if (isToday(date)) return "今天";
    if (isTomorrow(date)) return "明天";
    if (isYesterday(date)) return "昨天";
    return format(date, "MM月dd日 EEEE", { locale: zhCN });
  };

  // 获取日期标签颜色
  const getDateChipColor = (date) => {
    if (isToday(date)) return "success";
    if (isTomorrow(date)) return "primary";
    return "default";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex-col gap-2">
        {isAdmin ? (
          <Button
            color="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
            onPress={onCreateTeam}
          >
            开团
          </Button>
        ) : (
          <div className="w-full flex items-center justify-between">
            <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400">开团列表</h3>
          </div>
        )}
      </CardHeader>
      <Divider />
      <CardBody className="overflow-auto p-2">
        {sortedGroups.length === 0 ? (
          <div className="text-center py-8 text-default-500">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm">暂无开团</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGroups.map((group) => (
              <div key={format(group.date, "yyyy-MM-dd")} className="space-y-2">
                {/* 日期标题 */}
                <div className="flex items-center gap-2 px-2">
                  <Chip size="sm" color={getDateChipColor(group.date)} variant="flat">
                    {formatDateLabel(group.date)}
                  </Chip>
                  <span className="text-xs text-default-400">{group.teams.length} 车</span>
                </div>

                {/* 该日期下的团队列表 */}
                <div className="space-y-1">
                  {group.teams
                    .sort((a, b) => new Date(a.team_time) - new Date(b.team_time))
                    .map((team) => (
                      <TeamItem
                        key={team.id}
                        team={team}
                        isSelected={team.id === selectedTeamId}
                        onClick={() => onSelectTeam(team.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * 单个团队项
 */
function TeamItem({ team, isSelected, onClick }) {
  const teamTime = new Date(team.team_time);

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${
          isSelected
            ? "bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-2 border-pink-300 dark:border-pink-700"
            : "bg-default-100 dark:bg-default-50 hover:bg-default-200 dark:hover:bg-default-100 border-2 border-transparent"
        }
      `}
      onClick={onClick}
    >
      <div className="space-y-1">
        {/* 时间 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{format(teamTime, "HH:mm")}</span>
          <Chip size="sm" variant="flat" color="primary" className="text-xs">
            {team.dungeon || "未指定"}
          </Chip>
        </div>

        {/* 标题 */}
        <div className="text-xs text-default-700 dark:text-default-300 line-clamp-1">{team.title || "未命名开团"}</div>

        {/* 状态标签 */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* 全拍或全包 */}
          {!team.is_xuanjing_booked && !team.is_yuntie_booked && (
            <Chip size="sm" variant="flat" color="success" className="text-xs">
              全拍
            </Chip>
          )}
          {team.is_xuanjing_booked && team.is_yuntie_booked && (
            <Chip size="sm" variant="flat" color="danger" className="text-xs">
              大小包
            </Chip>
          )}
          {/* 混合状态 - 显示两个 Chip */}
          {team.is_xuanjing_booked && !team.is_yuntie_booked && (
            <>
              <Chip size="sm" variant="flat" color="danger" className="text-xs">
                大包
              </Chip>
              <Chip size="sm" variant="flat" color="success" className="text-xs">
                小拍
              </Chip>
            </>
          )}
          {!team.is_xuanjing_booked && team.is_yuntie_booked && (
            <>
              <Chip size="sm" variant="flat" color="success" className="text-xs">
                大拍
              </Chip>
              <Chip size="sm" variant="flat" color="danger" className="text-xs">
                小包
              </Chip>
            </>
          )}
          {team.is_locked && (
            <Chip size="sm" variant="flat" color="warning" className="text-xs">
              🔒 锁定
            </Chip>
          )}
          {team.is_hidden && (
            <Chip size="sm" variant="flat" color="default" className="text-xs">
              👁️ 隐藏
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
