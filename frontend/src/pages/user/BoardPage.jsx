import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import { getTeamList } from "../../api/teams";
import TeamSidebar from "../../components/board/TeamSidebar";
import TeamContent from "../../components/board/TeamContent";
import TeamRightPanel from "../../components/board/TeamRightPanel";
import TeamEditForm from "../../components/board/TeamEditForm";
import { showToast } from "../../utils/toast";
import sleepingImg from "../../assets/睡觉.png";

/**
 * 开团看板页面
 */
export default function BoardPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

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

      const teamList = response.data?.items || [];
      setTeams(teamList);

      // 如果没有选中的团队，自动选中第一个
      if (!selectedTeamId && teamList.length > 0) {
        setSelectedTeamId(teamList[0].id);
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
    setEditingTeam(null);
    setIsEditMode(true);
  };

  // 处理编辑开团
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setIsEditMode(true);
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingTeam(null);
  };

  // 处理表单提交成功
  const handleFormSuccess = () => {
    setIsEditMode(false);
    setEditingTeam(null);
    loadTeams();
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
              <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                请先选择群组
              </h2>
              <p className="text-default-600">
                您需要先选择一个群组才能查看开团看板
              </p>
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

  // 如果是编辑模式，显示编辑表单
  if (isEditMode) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* 左侧导航 */}
          <div className="col-span-2 overflow-hidden">
            <TeamSidebar
              teams={teams}
              selectedTeamId={editingTeam?.id}
              onSelectTeam={setSelectedTeamId}
              isAdmin={isAdmin}
              onCreateTeam={handleCreateTeam}
            />
          </div>

          {/* 右侧内容区域 */}
          <div className="col-span-10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* 编辑表单 */}
              <div className="col-span-9 overflow-auto">
                <TeamEditForm
                  team={editingTeam}
                  guildId={currentGuild.id}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelEdit}
                />
              </div>

              {/* 右侧面板 - 编辑模式下的辅助信息 */}
              <div className="col-span-3 overflow-hidden">
                <TeamRightPanel
                  team={editingTeam}
                  isAdmin={isAdmin}
                  isEditMode={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 正常查看模式
  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* 左侧导航 - 开团列表 */}
        <div className="col-span-2 overflow-hidden">
          <TeamSidebar
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            isAdmin={isAdmin}
            onCreateTeam={handleCreateTeam}
          />
        </div>

        {/* 右侧内容区域 */}
        <div className="col-span-10 overflow-hidden">
          {selectedTeam ? (
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* 团队详情 */}
              <div className="col-span-8 overflow-auto">
                <TeamContent
                  team={selectedTeam}
                  isAdmin={isAdmin}
                  onEdit={handleEditTeam}
                  onRefresh={loadTeams}
                />
              </div>

              {/* 右侧面板 - 我的报名/候补列表 或 候补列表/报名日志 */}
              <div className="col-span-4 overflow-hidden">
                <TeamRightPanel
                  team={selectedTeam}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          ) : (
            <Card className="h-full">
              <CardBody className="flex items-center justify-center">
                <div className="text-center space-y-4">
                  <img
                    src={sleepingImg}
                    alt="暂无开团"
                    className="w-128 h-64 object-contain mx-auto"
                  />
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
