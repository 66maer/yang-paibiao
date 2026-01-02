import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from "@heroui/react";
import { getGuildRanking } from "@/api/ranking";
import useAuthStore from "@/stores/authStore";
import { showError } from "@/utils/toast.jsx";

export default function RankingPage() {
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const { user } = useAuthStore();
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);

  useEffect(() => {
    loadRanking();
  }, [currentGuild?.id]);

  const loadRanking = async () => {
    if (!currentGuild?.id) return;

    setLoading(true);
    try {
      const response = await getGuildRanking(currentGuild.id);
      setRanking(response.data);
    } catch (error) {
      console.error("加载红黑榜失败:", error);
      showError(error.response?.data?.detail || "加载红黑榜失败");
    } finally {
      setLoading(false);
    }
  };

  const renderChangeIndicator = (change, value) => {
    if (change === "new") {
      return (
        <Chip size="sm" color="primary" variant="flat">
          NEW
        </Chip>
      );
    } else if (change === "up") {
      return (
        <span className="text-green-500 font-medium flex items-center gap-1">
          <span>↑</span>
          <span>{value}</span>
        </span>
      );
    } else if (change === "down") {
      return (
        <span className="text-red-500 font-medium flex items-center gap-1">
          <span>↓</span>
          <span>{value}</span>
        </span>
      );
    } else {
      return <span className="text-gray-400">—</span>;
    }
  };

  const formatLastHeibenren = (dateStr, carNumber, daysAgo) => {
    if (!dateStr) return "-";
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    return (
      <div className="flex flex-col gap-1">
        <div>{`${year}年${month}月${day}日`}</div>
        <div className="text-xs text-gray-500">
          {carNumber && `第${carNumber}车`}
          {daysAgo !== null && daysAgo !== undefined && ` · ${daysAgo}天前`}
        </div>
      </div>
    );
  };

  const renderCalculationTooltip = (item) => {
    if (!item.calculation_detail) {
      return Number(item.rank_score).toFixed(2);
    }

    const detail = item.calculation_detail;
    const tooltipContent = (
      <div className="space-y-2 max-w-sm">
        <div className="font-semibold border-b pb-1">计算详情</div>

        <div className="space-y-1 text-xs">
          <div className="font-medium">黑本记录：</div>
          {detail.records.map((record, idx) => (
            <div key={record.record_id} className="pl-2 text-gray-300">
              {idx + 1}. {record.dungeon} ({new Date(record.run_date).toLocaleDateString()})
              <div className="pl-2 text-gray-400">
                金额: {record.gold} × 修正系数: {Number(record.correction_factor).toFixed(2)} ={" "}
                {Number(record.corrected_gold).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-xs border-t pt-2">
          <div>总金额: {detail.total_gold}</div>
          <div>修正后总金额: {Number(detail.corrected_total_gold).toFixed(2)}</div>
          <div>黑本次数: {detail.heibenren_count}</div>
          <div>平均金额: {Number(detail.average_gold).toFixed(2)}</div>
          <div>修正后平均金额: {Number(detail.corrected_average_gold).toFixed(2)}</div>
          <div>Rank修正系数: {Number(detail.rank_modifier).toFixed(4)}</div>
        </div>

        <div className="border-t pt-2 font-semibold text-primary">
          Rank分 = ({Number(detail.corrected_average_gold).toFixed(2)} ÷ 5000) ×{" "}
          {Number(detail.rank_modifier).toFixed(4)} = {Number(detail.rank_score).toFixed(2)}
        </div>
      </div>
    );

    return (
      <Tooltip content={tooltipContent} placement="left" className="max-w-md">
        <div className="font-bold text-lg text-primary cursor-help">{Number(item.rank_score).toFixed(2)}</div>
      </Tooltip>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-gray-500">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardBody>
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-black bg-clip-text text-transparent">
                红黑榜
              </h1>
              <p className="text-sm text-gray-500 mt-1">{ranking.guild_name}</p>
            </div>
            <Button size="sm" variant="flat" color="primary" onClick={() => setShowExplanation(true)}>
              📊 计算说明
            </Button>
          </div>

          {ranking.rankings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无黑本记录</div>
          ) : (
            <Table aria-label="红黑榜">
              <TableHeader>
                <TableColumn>排名</TableColumn>
                <TableColumn>用户</TableColumn>
                <TableColumn>黑本次数</TableColumn>
                <TableColumn>平均金团</TableColumn>
                <TableColumn>Rank分</TableColumn>
                <TableColumn>最近黑本</TableColumn>
                <TableColumn>变化</TableColumn>
              </TableHeader>
              <TableBody>
                {ranking.rankings.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell>
                      <div className="font-bold text-lg">
                        {item.rank_position <= 3 ? (
                          <span
                            className={
                              item.rank_position === 1
                                ? "text-yellow-500"
                                : item.rank_position === 2
                                ? "text-gray-400"
                                : "text-orange-600"
                            }
                          >
                            #{item.rank_position}
                          </span>
                        ) : (
                          <span className="text-gray-600">#{item.rank_position}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.user_avatar && <Avatar src={item.user_avatar} size="sm" />}
                        <span className="font-medium">{item.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {item.heibenren_count}次
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">{Number(item.average_gold).toFixed(0)}</div>
                    </TableCell>
                    <TableCell>{renderCalculationTooltip(item)}</TableCell>
                    <TableCell>
                      {formatLastHeibenren(
                        item.last_heibenren_date,
                        item.last_heibenren_car_number,
                        item.last_heibenren_days_ago
                      )}
                    </TableCell>
                    <TableCell>{renderChangeIndicator(item.rank_change, item.rank_change_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* 计算说明模态框 */}
      <Modal isOpen={showExplanation} onClose={() => setShowExplanation(false)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">Rank分计算说明</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* 计算公式 */}
              <div>
                <h4 className="font-semibold text-lg mb-3">计算公式</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <div className="font-mono text-sm">
                    <strong>Rank分</strong> = (修正后的平均金团金额 ÷ 5000) × Rank修正系数
                  </div>
                  <div className="font-mono text-sm">
                    <strong>修正后的平均金团金额</strong> = Σ(每车金团金额 × 副本与赛季修正系数) / 黑本次数
                  </div>
                  <div className="font-mono text-sm">
                    <strong>Rank修正系数</strong> = 1 + 0.5(1 - e<sup>-(N-5)/5</sup>)
                    <span className="text-gray-500 ml-2">其中 N 为黑本次数</span>
                  </div>
                  <div className="font-mono text-sm text-gray-500">
                    注：最后除以 5000 是为了让 Rank分 保持在一个较小的数值范围内，便于比较。
                  </div>
                </div>
              </div>

              {/* 当前赛季修正系数 */}
              {ranking.season_factors && ranking.season_factors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3">当前的 【副本与赛季修正系数】</h4>
                  <div className="space-y-2">
                    {ranking.season_factors.map((factor, idx) => (
                      <Card key={idx} className="border">
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{factor.dungeon}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {new Date(factor.start_date).toLocaleDateString()}
                                {factor.end_date ? ` ~ ${new Date(factor.end_date).toLocaleDateString()}` : " ~ 至今"}
                              </div>
                              {factor.description && (
                                <div className="text-xs text-gray-400 mt-1">{factor.description}</div>
                              )}
                            </div>
                            <Chip color="primary" variant="flat" size="lg">
                              ×{Number(factor.correction_factor).toFixed(2)}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 说明 */}
              <div>
                <h4 className="font-semibold text-lg mb-3">说明</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>赛季修正系数用于平衡不同时期副本的难度差异</li>
                  <li>Rank修正系数会随着黑本次数增加而提高，鼓励多次参与</li>
                  <li>鼠标悬停在每个人的Rank分上可以查看详细计算过程</li>
                  <li>排名每次有新的黑本记录时自动更新</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => setShowExplanation(false)}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
