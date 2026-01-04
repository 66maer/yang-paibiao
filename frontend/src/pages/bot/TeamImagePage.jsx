import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Chip, Divider, Spinner, Tooltip } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import axios from "axios";
import TeamBoard from "@/features/board/components/TeamBoard";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { transformSignups } from "@/utils/signupTransform";

/**
 * Bot专用团队截图页面
 * - 无需用户登录
 * - 使用 API Key 验证
 * - 精简展示，专为截图优化
 * - 样式与 TeamContent 保持一致
 */
export default function TeamImagePage() {
  const { guild_qq_number, team_id } = useParams();
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get("apiKey");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!apiKey) {
        setError("缺少 API Key");
        setLoading(false);
        return;
      }

      try {
        // 使用 axios 直接请求，不使用带认证拦截器的 apiClient
        const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9500/api/v2";
        const response = await axios.get(
          `${baseURL}/bot/guilds/${guild_qq_number}/teams/${team_id}/view`,
          {
            headers: {
              "X-API-Key": apiKey,
            },
          }
        );
        setTeamData(response.data.data);
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        setError(err.response?.data?.detail || "数据加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guild_qq_number, team_id, apiKey]);

  // 解析团队数据
  const { teamTime, signupList, rules, waitList } = useMemo(() => {
    if (!teamData) return { teamTime: null, signupList: [], rules: [], waitList: [] };

    const teamTime = teamData.team_time ? new Date(teamData.team_time) : null;
    const signupList = transformSignups(teamData.signups || []);
    const rules = teamData.rules && teamData.rules.length > 0 ? teamData.rules : buildEmptyRules();

    // 候补列表：未分配坑位的报名
    const waitList = signupList.filter(s => s.slot_position === null || s.slot_position === undefined);

    return { teamTime, signupList, rules, waitList };
  }, [teamData]);

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-default-50">
        <Spinner size="lg" label="加载中..." />
      </div>
    );
  }

  // 错误状态
  if (error || !teamData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-default-50">
        <Card className="w-96">
          <CardBody>
            <p className="text-red-500 text-center">{error || "数据加载失败"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-default-50 p-6" data-screenshot-ready="true">
      {/* 使用固定宽度容器，避免滑动条 */}
      <div className="w-full max-w-[1160px] mx-auto">
        <Card className="w-full">
          <CardHeader className="flex-col items-start gap-3 pb-4">
            {/* 标题行 */}
            <div className="flex items-center gap-3 w-full">
              {teamData.is_locked && (
                <Tooltip content="报名已锁定">
                  <Chip size="lg" variant="flat" color="warning">
                    🔒
                  </Chip>
                </Tooltip>
              )}
              <h2 className="text-4xl font-bold text-pink-600 dark:text-pink-400">
                {teamData.title || "未命名开团"}
              </h2>
              {teamData.is_hidden && (
                <Chip size="lg" variant="flat" color="default">
                  仅管理员可见
                </Chip>
              )}
            </div>

            {/* 基础信息标签 */}
            <div className="flex flex-wrap gap-2">
              {/* 副本 */}
              <Chip size="lg" variant="flat" color="primary" startContent={<span>🏛️</span>}>
                {teamData.dungeon || "未指定副本"}
              </Chip>

              {/* 时间 */}
              {teamTime && (
                <Chip size="lg" variant="flat" color="secondary" startContent={<span>🕐</span>}>
                  {format(teamTime, "yyyy-MM-dd HH:mm", { locale: zhCN })}
                </Chip>
              )}

              {/* 大铁 */}
              <Chip
                size="lg"
                variant="flat"
                color={teamData.is_xuanjing_booked ? "danger" : "success"}
                startContent={<img src="/玄晶.png" alt="玄晶" className="w-5 h-5" />}
              >
                {teamData.is_xuanjing_booked ? "大铁已包" : "大铁可拍"}
              </Chip>

              {/* 小铁 */}
              <Chip
                size="lg"
                variant="flat"
                color={teamData.is_yuntie_booked ? "danger" : "success"}
                startContent={<img src="/陨铁.png" alt="陨铁" className="w-5 h-5" />}
              >
                {teamData.is_yuntie_booked ? "小铁已包" : "小铁可拍"}
              </Chip>
            </div>
          </CardHeader>

          <Divider />

          <CardBody>
            <div className="space-y-6">
              {/* 团队告示 */}
              {teamData.notice && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-default-600">📢 团队告示</h3>
                  <div className="p-4 rounded-lg bg-default-100 dark:bg-default-50">
                    <p className="text-sm text-default-700 dark:text-default-300 whitespace-pre-wrap">
                      {teamData.notice}
                    </p>
                  </div>
                </div>
              )}

              {/* 团队面板 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-default-600">👥 团队面板</h3>
                </div>

                <TeamBoard
                  rules={rules}
                  signupList={signupList}
                  view={teamData.slot_view || []}
                  mode="view"
                />
              </div>

              {/* 创建信息 */}
              <div className="text-xs text-default-400 text-right">
                由 {teamData.creator_name || "未知"} 创建于{" "}
                {teamData.created_at
                  ? format(new Date(teamData.created_at), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })
                  : "未知时间"}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 候补列表 */}
        {waitList.length > 0 && (
          <Card className="w-full mt-4">
            <CardHeader>
              <h3 className="text-sm font-semibold text-default-600">
                📋 候补列表 ({waitList.length})
              </h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-2">
                {waitList.map((signup, index) => (
                  <div
                    key={signup.id}
                    className="flex items-center justify-between p-3 bg-default-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-default-500 min-w-[2rem]">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{signup.playerName}</span>
                        <Chip size="sm" variant="flat" color="default">
                          {signup.characterName || "待定"}
                        </Chip>
                        <Chip size="sm" variant="flat" color="primary">
                          {signup.xinfa}
                        </Chip>
                        {signup.isRich && (
                          <Chip size="sm" color="warning" variant="flat">
                            💰 老板
                          </Chip>
                        )}
                      </div>
                    </div>
                    {signup.isProxy && (
                      <Chip size="sm" variant="flat" color="secondary">
                        {signup.submitterName} 代报
                      </Chip>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
