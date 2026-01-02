import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startOfDay } from "date-fns";
import { Card, CardBody, Spinner } from "@heroui/react";
import useAuthStore from "@/stores/authStore";
import { getTeamList } from "@/api/teams";
import TeamSidebar from "@/features/board/components/TeamSidebar";
import TeamContent from "@/features/board/components/TeamContent";
import TeamRightPanel from "@/features/board/components/TeamRightPanel";
import { showToast } from "@/utils/toast";

/**
 * 开团看板页面
 */
export default function BoardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取当前群组
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);
  const currentRole = currentGuild?.role || "member";
  const isAdmin = ["owner", "helper"].includes(currentRole);

  // 加载开团列表
  const loadTeams = async () => {
    if (!currentGuild?.id) return;

    try {
      setLoading(true);
      const response = await getTeamList(currentGuild.id, {
        status: "open",
      });

      const rawList = response.data?.items || response.data?.data || response.data || [];
      const sortedTeams = [...rawList].sort((a, b) => new Date(a.team_time) - new Date(b.team_time));
      setTeams(sortedTeams);

      // 自动选中距离今天最近的未来开团（忽略具体时间），否则选最早的一车
      if (sortedTeams.length === 0) {
        setSelectedTeamId(null);
      } else {
        const hasSelected = sortedTeams.some((team) => team.id === selectedTeamId);
        if (!hasSelected) {
          const today = startOfDay(new Date());
          const futureTeams = sortedTeams.filter((team) => startOfDay(new Date(team.team_time)) >= today);
          const preferredTeam = futureTeams[0] || sortedTeams[0];
          setSelectedTeamId(preferredTeam.id);
        }
      }
    } catch (error) {
      console.error("加载开团列表失败:", error);
      showToast.error(error || "加载开团列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadTeams();
  }, [currentGuild?.id]);

  // 处理创建开团
  const handleCreateTeam = () => {
    navigate("/team/new");
  };

  // 处理编辑开团
  const handleEditTeam = (team) => {
    navigate(`/team/${team.id}/edit`);
  };

  // 获取选中的团队详情
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (!currentGuild) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
          <CardBody className="p-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">📋</div>
              <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">请先选择群组</h2>
              <p className="text-default-600">您需要先选择一个群组才能查看开团看板</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }
  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="grid grid-cols-7 gap-4 h-full">
        {/* 左侧导航 - 开团列表 */}
        <div className="col-span-1 overflow-hidden">
          <TeamSidebar
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            isAdmin={isAdmin}
            onCreateTeam={handleCreateTeam}
          />
        </div>

        {/* 右侧内容区域 */}
        <div className="col-span-6 overflow-hidden">
          {selectedTeam ? (
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* 团队详情 */}
              <div className="col-span-10 overflow-auto">
                <TeamContent team={selectedTeam} isAdmin={isAdmin} onEdit={handleEditTeam} onRefresh={loadTeams} />
              </div>

              {/* 右侧面板 - 我的报名/候补列表 或 候补列表/报名日志 */}
              <div className="col-span-2 overflow-hidden">
                <TeamRightPanel team={selectedTeam} isAdmin={isAdmin} onRefresh={loadTeams} />
              </div>
            </div>
          ) : (
            <Card className="h-full">
              <CardBody className="flex items-center justify-center">
                <div className="text-center space-y-4">
                  <img src="/睡觉.png" alt="暂无开团" className="w-128 h-64 object-contain mx-auto" />
                  <p className="text-default-500 text-2xl">尊重夕阳红命运...</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
