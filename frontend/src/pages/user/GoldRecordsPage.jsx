import { useState, useEffect, useMemo } from "react";
import { Card, CardBody, Pagination } from "@heroui/react";
import { showToast } from "../../utils/toast";
import { getGoldRecords } from "../../api/goldRecords";
import useAuthStore from "../../stores/authStore";
import GoldRecordToolbar from "../../components/goldRecords/GoldRecordToolbar";
import GoldTrendChart from "../../components/goldRecords/GoldTrendChart";
import DropDistributionCharts from "../../components/goldRecords/DropDistributionCharts";
import GoldRecordsList from "../../components/goldRecords/GoldRecordsList";
import XuanjingRecordsSidebar from "../../components/goldRecords/XuanjingRecordsSidebar";
import GoldRecordModal from "../../components/board/GoldRecordModal";

/**
 * 金团记录页面
 */
export default function GoldRecordsPage() {
  // 筛选状态
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [dungeonList, setDungeonList] = useState([]);

  // 数据状态
  const [goldRecords, setGoldRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // 模态框状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // 权限
  const { user } = useAuthStore();
  const currentGuild = user?.guilds?.find((g) => g.id === user?.current_guild_id);
  const isAdmin = ["owner", "helper"].includes(currentGuild?.role);

  /**
   * 加载金团记录
   */
  const loadGoldRecords = async () => {
    if (!currentGuild?.id) return;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...(selectedDungeon && { dungeon: selectedDungeon }),
      };

      const response = await getGoldRecords(currentGuild.id, params);
      const records = response.data?.items || response.data?.data || response.data || [];
      const total = response.data?.total || response.total || records.length;

      setGoldRecords(records);
      setTotalRecords(total);
    } catch (error) {
      console.error("加载金团记录失败:", error);
      showToast.error("加载金团记录失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 副本切换或分页变化时重新加载
   */
  useEffect(() => {
    loadGoldRecords();
  }, [currentGuild?.id, selectedDungeon, currentPage]);

  /**
   * 对记录进行排序并添加序号
   */
  const sortedRecords = useMemo(() => {
    // 按 run_date 升序，再按 id 升序
    const sorted = [...goldRecords].sort((a, b) => {
      const dateCompare = new Date(a.run_date) - new Date(b.run_date);
      if (dateCompare !== 0) return dateCompare;
      return a.id - b.id;
    });

    // 添加连续序号和同日序号
    const recordsWithIndex = [];
    const dateGroups = {}; // 记录同一天的记录数量

    sorted.forEach((record, index) => {
      const dateKey = record.run_date;

      // 初始化或增加同日计数
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = 0;
      }
      dateGroups[dateKey]++;

      recordsWithIndex.push({
        ...record,
        sequenceNumber: index + 1, // 连续序号（从1开始）
        dailySequence: dateGroups[dateKey], // 当日序号
      });
    });

    // 为每条记录添加同日总数信息
    return recordsWithIndex.map((record) => ({
      ...record,
      dailyTotal: dateGroups[record.run_date],
    }));
  }, [goldRecords]);

  /**
   * 提取玄晶记录（双闪拆分）
   */
  const xuanjingRecords = useMemo(() => {
    return sortedRecords
      .filter((r) => r.has_xuanjing)
      .flatMap((r) => {
        const records = [];
        // first 和 second 字段直接存储价格数值
        if (r.xuanjing_drops?.first) {
          records.push({
            id: r.id,
            ...r,
            xuanjing: r.xuanjing_drops.first,
            isDouble: !!r.xuanjing_drops.second,
            order: 1,
          });
        }
        if (r.xuanjing_drops?.second) {
          records.push({
            id: r.id,
            ...r,
            xuanjing: r.xuanjing_drops.second,
            isDouble: true,
            order: 2,
          });
        }
        return records;
      })
      .sort((a, b) => new Date(b.run_date) - new Date(a.run_date));
  }, [sortedRecords]);

  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalRecords / pageSize);

  /**
   * 副本列表加载完成回调
   */
  const handleDungeonsLoaded = (dungeons) => {
    setDungeonList(dungeons);
    // 默认选中第一个副本
    if (dungeons.length > 0 && !selectedDungeon) {
      setSelectedDungeon(dungeons[0].value);
    }
  };

  /**
   * 新增记录
   */
  const handleCreate = () => {
    setSelectedRecord(null);
    setModalMode("create");
    setEditModalOpen(true);
  };

  /**
   * 编辑记录
   */
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setModalMode("edit");
    setEditModalOpen(true);
  };

  /**
   * 模态框成功回调
   */
  const handleModalSuccess = () => {
    setEditModalOpen(false);
    loadGoldRecords();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 主内容区 - 9列 */}
        <div className="lg:col-span-10 space-y-4">
          {/* 工具栏 */}
          <GoldRecordToolbar
            selectedDungeon={selectedDungeon}
            onDungeonChange={setSelectedDungeon}
            onCreateClick={handleCreate}
            onDungeonsLoaded={handleDungeonsLoaded}
          />

          {/* 趋势图 */}
          <Card>
            <CardBody>
              <GoldTrendChart data={sortedRecords} />
            </CardBody>
          </Card>

          {/* 掉落分布图 */}
          <DropDistributionCharts records={sortedRecords} />

          {/* 记录列表 */}
          <Card>
            <CardBody>
              <GoldRecordsList
                records={sortedRecords}
                loading={loading}
                onEdit={handleEdit}
                isAdmin={isAdmin}
                currentUserId={user?.id}
              />

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} showControls />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* 侧边栏 - 3列 */}
        <div className="lg:col-span-2">
          <XuanjingRecordsSidebar records={xuanjingRecords} />
        </div>
      </div>

      {/* 编辑/创建模态框 */}
      <GoldRecordModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        record={selectedRecord}
        mode={modalMode}
        guildId={currentGuild?.id}
        onSuccess={handleModalSuccess}
        defaultDungeon={selectedDungeon}
      />
    </div>
  );
}
