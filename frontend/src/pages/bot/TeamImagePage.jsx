import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Chip, Divider, Spinner } from "@heroui/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import axios from "axios";
import TeamBoard from "@/features/board/components/TeamBoard";
import { buildEmptyRules } from "@/utils/slotAllocation";
import { transformSignups } from "@/utils/signupTransform";

/**
 * Bot专用团队截图页面
 * - 无需用户登录
 * - 使用API Key验证
 * - 精简展示，专为截图优化
 */
export default function TeamImagePage() {
  const { guild_id, team_id } = useParams();
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
          `${baseURL}/bot/guilds/${guild_id}/teams/${team_id}/view`,
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
  }, [guild_id, team_id, apiKey]);

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner size="lg" label="加载中..." />
      </div>
    );
  }

  // 错误状态
  if (error || !teamData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardBody>
            <p className="text-red-500 text-center">{error || "数据加载失败"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // 解析团队数据
  const {
    title,
    team_time,
    dungeon,
    creator_name,
    notice,
    is_xuanjing_booked,
    is_yuntie_booked,
    is_locked,
    rules: rawRules,
    slot_view,
    signups: rawSignups,
  } = teamData;

  const teamTime = new Date(team_time);
  const signupList = transformSignups(rawSignups || []);
  const rules = rawRules && rawRules.length > 0 ? rawRules : buildEmptyRules();

  // 候补列表（未分配坑位的报名）
  const waitList = signupList.filter(s => s.slot_position === null || s.slot_position === undefined);

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-screenshot-ready="true">
      <div className="max-w-[800px] mx-auto space-y-4">
        {/* 团队信息卡片 */}
        <Card>
          <CardHeader className="flex flex-col items-start gap-2 pb-2">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-bold">{title}</h1>
              {is_locked && (
                <Chip color="warning" size="sm" variant="flat">
                  🔒 已锁定
                </Chip>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <Chip size="sm" variant="flat" color="primary">
                {format(teamTime, "MM月dd日 HH:mm", { locale: zhCN })}
              </Chip>
              <Chip size="sm" variant="flat">
                {dungeon}
              </Chip>
              <Chip size="sm" variant="flat">
                团长：{creator_name}
              </Chip>
            </div>
          </CardHeader>

          <Divider />

          <CardBody className="space-y-4">
            {/* 预定信息 */}
            <div className="flex gap-2">
              {is_xuanjing_booked && (
                <Chip size="sm" color="secondary" variant="flat">
                  ✨ 已定玄晶
                </Chip>
              )}
              {is_yuntie_booked && (
                <Chip size="sm" color="secondary" variant="flat">
                  ⚔️ 已定陨铁
                </Chip>
              )}
            </div>

            {/* 团队告示 */}
            {notice && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{notice}</p>
              </div>
            )}

            {/* 团队面板 */}
            <div className="bg-white rounded-lg">
              <TeamBoard
                rules={rules}
                signupList={signupList}
                slotView={slot_view}
                mode="view"
                readOnly={true}
              />
            </div>
          </CardBody>
        </Card>

        {/* 候补列表 */}
        {waitList.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">候补列表 ({waitList.length})</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-2">
                {waitList.map((signup, index) => (
                  <div
                    key={signup.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{signup.playerName}</span>
                      <Chip size="sm" variant="flat">
                        {signup.characterName}
                      </Chip>
                      <Chip size="sm" variant="flat" color="primary">
                        {signup.xinfa}
                      </Chip>
                      {signup.isRich && (
                        <Chip size="sm" color="warning" variant="flat">
                          老板
                        </Chip>
                      )}
                    </div>
                    {signup.isProxy && (
                      <Chip size="sm" variant="flat" color="default">
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
