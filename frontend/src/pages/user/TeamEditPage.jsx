import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spinner } from "@heroui/react";
import useAuthStore from "../../stores/authStore";
import TeamEditForm from "../../components/board/TeamEditForm";
import TeamRightPanel from "../../components/board/TeamRightPanel";
import { getTeamDetail } from "../../api/teams";
import { showToast } from "../../utils/toast";

/**
 * 独立的开团创建/编辑页面
 * - 创建模式：/team/new
 * - 编辑模式：/team/:teamId/edit
 */
export default function TeamEditPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { user } = useAuthStore();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  // 获取当前群组
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);
  const currentRole = currentGuild?.role || "member";
  const isAdmin = ["owner", "helper"].includes(currentRole);
  const isEdit = !!teamId;

  // 加载团队详情（编辑模式）
  useEffect(() => {
    if (isEdit && currentGuild?.id) {
      loadTeamDetail();
    }
  }, [teamId, currentGuild?.id]);

  const loadTeamDetail = async () => {
    if (!currentGuild?.id || !teamId) return;

    try {
      setLoading(true);
      const response = await getTeamDetail(currentGuild.id, teamId);
      setTeam(response.data);
    } catch (error) {
      console.error("加载开团详情失败:", error);
      showToast.error(error || "加载开团详情失败");
      // 加载失败则返回开团列表
      navigate("/board");
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交成功
  const handleFormSuccess = () => {
    // 返回到开团列表页
    navigate("/board");
  };

  // 处理取消
  const handleCancel = () => {
    // 返回到开团列表页
    navigate("/board");
  };

  // 检查是否有群组
  if (!currentGuild) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center space-y-4">
          <div className="text-6xl">📋</div>
          <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">请先选择群组</h2>
          <p className="text-default-600">您需要先选择一个群组才能创建开团</p>
        </div>
      </div>
    );
  }

  // 编辑模式加载中
  if (isEdit && loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] px-4">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* 左侧：编辑表单 */}
        <div className="col-span-9 overflow-auto">
          <TeamEditForm team={team} guildId={currentGuild.id} onSuccess={handleFormSuccess} onCancel={handleCancel} />
        </div>

        {/* 右侧：辅助信息面板 */}
        <div className="col-span-3 overflow-hidden">
          <TeamRightPanel team={team} isAdmin={isAdmin} isEditMode={true} />
        </div>
      </div>
    </div>
  );
}
