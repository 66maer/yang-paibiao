import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Chip, Button, Tooltip } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import useAuthStore from "@/stores/authStore";
import { getTeamList, reopenTeam } from "@/api/teams";
import { showToast, showConfirm } from "@/utils/toast";
import TeamViewModal from "@/features/board/components/TeamViewModal";

/**
 * 历史开团页面
 */
export default function HistoryPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // 获取当前群组
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);
  const currentRole = currentGuild?.role || "member";
  const isAdmin = ["owner", "helper"].includes(currentRole);

  // 加载历史开团列表
  const loadHistoryTeams = async () => {
    if (!currentGuild?.id) return;

    try {
      setLoading(true);
      // 获取已完成和已取消的开团
      const [completedRes, cancelledRes] = await Promise.all([
        getTeamList(currentGuild.id, { status: "completed" }),
        getTeamList(currentGuild.id, { status: "cancelled" }),
      ]);

      const completedTeams = completedRes.data?.items || completedRes.data?.data || completedRes.data || [];
      const cancelledTeams = cancelledRes.data?.items || cancelledRes.data?.data || cancelledRes.data || [];

      // 合并并按时间倒序排序
      const allTeams = [...completedTeams, ...cancelledTeams].sort(
        (a, b) => new Date(b.team_time) - new Date(a.team_time)
      );
      setTeams(allTeams);
    } catch (error) {
      console.error("加载历史开团列表失败:", error);
      showToast.error(error || "加载历史开团列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadHistoryTeams();
  }, [currentGuild?.id]);

  // 处理查看开团详情
  const handleView = (team) => {
    setSelectedTeam(team);
    setViewModalOpen(true);
  };

  // 处理重新开启
  const handleReopen = async (team) => {
    const confirmed = await showConfirm(`确定要重新开启「${team.title}」吗？开团将恢复到开团看板中。`);
    if (!confirmed) return;

    try {
      await reopenTeam(currentGuild.id, team.id);
      showToast.success("已重新开启开团");
      loadHistoryTeams(); // 刷新列表
    } catch (error) {
      console.error("重新开启失败:", error);
      showToast.error(error?.response?.data?.message || error || "重新开启失败");
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "cancelled":
        return "已取消";
      default:
        return status;
    }
  };

  if (!currentGuild) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
          <CardBody className="p-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">📋</div>
              <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">请先选择群组</h2>
              <p className="text-default-600">您需要先选择一个群组才能查看历史开团</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex justify-between items-center pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <h1 className="text-2xl font-bold">历史开团</h1>
          </div>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            onClick={loadHistoryTeams}
            isLoading={loading}
          >
            刷新
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-default-500 text-xl">暂无历史开团记录</p>
            </div>
          ) : (
            <Table aria-label="历史开团列表">
              <TableHeader>
                <TableColumn>标题</TableColumn>
                <TableColumn>副本</TableColumn>
                <TableColumn>开团时间</TableColumn>
                <TableColumn>状态</TableColumn>
                <TableColumn>关闭时间</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.title}</TableCell>
                    <TableCell>{team.dungeon}</TableCell>
                    <TableCell>
                      {format(new Date(team.team_time), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      <Chip color={getStatusColor(team.status)} size="sm" variant="flat">
                        {getStatusText(team.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {team.closed_at
                        ? format(new Date(team.closed_at), "yyyy-MM-dd HH:mm", { locale: zhCN })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip content="查看详情">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onClick={() => handleView(team)}
                          >
                            查看
                          </Button>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip content="重新开启">
                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              onClick={() => handleReopen(team)}
                            >
                              重新开启
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 查看详情弹窗 */}
      {selectedTeam && (
        <TeamViewModal
          team={selectedTeam}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
}
