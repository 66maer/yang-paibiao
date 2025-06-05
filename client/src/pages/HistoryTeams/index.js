import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Space, message, Badge, Tag } from "antd";
import { request } from "@/utils/request";
import dayjs from "dayjs";
import SlotPanel from "@/components/SlotPanel";
import store from "@/store";
import AddHistoryRecordModal from "./AddHistoryRecordModal";

const HistoryTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 1000,
    total: 9000,
  });

  // 添加权限检查逻辑
  const isAdmin = (() => {
    const { isSuperAdmin } = store.getState().user;
    const { role } = store.getState().guild;
    return isSuperAdmin || role === "owner" || role === "helper";
  })();

  const fetchHistoryTeams = async (page = 1, pageSize = 1000) => {
    setLoading(true);
    try {
      const res = await request.post("/team/listTeams", {
        guildId: store.getState().guild.guildId,
        filter: "only_close",
        page: page - 1,
        pageSize,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }

      // 对获取的数据按照关闭时间从近到远进行排序
      const sortedTeams = [...res.data.teams].sort(
        (a, b) => dayjs(b.closeTime).valueOf() - dayjs(a.closeTime).valueOf()
      );

      setTeams(sortedTeams);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: res.data.totalCount,
      }));
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryTeams();
  }, []);

  const handleViewDetails = (team) => {
    setSelectedTeam(team);
    setIsModalVisible(true);
  };

  const handleTableChange = (pagination) => {
    fetchHistoryTeams(pagination.current, pagination.pageSize);
  };

  const handleAddHistoryRecord = () => {
    setIsAddModalVisible(true);
  };

  const handleAddHistorySuccess = () => {
    setIsAddModalVisible(false);
    fetchHistoryTeams(); // 刷新列表
    message.success("历史记录添加成功");
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "副本",
      dataIndex: "dungeons",
      key: "dungeons",
      filters: Array.from(new Set(teams.map((team) => team.dungeons))).map((dungeon) => ({
        text: dungeon,
        value: dungeon,
      })),
      onFilter: (value, record) => record.dungeons === value,
    },
    {
      title: "创建日期",
      dataIndex: "createTime",
      key: "createTime",
      sorter: (a, b) => dayjs(a.createTime).valueOf() - dayjs(b.createTime).valueOf(),
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "结束日期",
      dataIndex: "closeTime",
      key: "closeTime",
      defaultSortOrder: "descend", // 添加默认排序
      sorter: (a, b) => dayjs(a.closeTime).valueOf() - dayjs(b.closeTime).valueOf(),
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "金团记录",
      dataIndex: "summary",
      key: "summary",
      sorter: (a, b) => {
        try {
          const parsedA = JSON.parse(a.summary || "{}");
          const parsedB = JSON.parse(b.summary || "{}");
          return (parsedA.perPersonSalary || 0) - (parsedB.perPersonSalary || 0);
        } catch (e) {
          return 0;
        }
      },
      render: (text, record, index) => {
        try {
          const parsedSummary = JSON.parse(text);
          const perPersonSalary = parsedSummary.perPersonSalary || 0;
          const currentDungeon = record.dungeons;

          // 按照副本分类计算统计数据
          const sameTypeDungeonTeams = teams.filter((team) => team.dungeons === currentDungeon);
          const salaries = sameTypeDungeonTeams
            .map((team) => {
              try {
                return JSON.parse(team.summary || "{}").perPersonSalary || null;
              } catch {
                return null;
              }
            })
            .filter((salary) => salary !== null);

          const minSalary = Math.min(...salaries);
          const maxSalary = Math.max(...salaries);
          const avgSalary =
            salaries.length > 0 ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length : 0;

          const deviationThreshold = avgSalary * 0.34; // Define a threshold for deviation
          const isMin = perPersonSalary === minSalary;
          const isMax = perPersonSalary === maxSalary;
          const isFarBelowAvg = perPersonSalary < avgSalary - deviationThreshold;
          const isFarAboveAvg = perPersonSalary > avgSalary + deviationThreshold;

          const content = (
            <>
              {parsedSummary.salary || "未知"} 金{" "}
              <span style={{ color: "#888" }}>（人均 {parsedSummary.perPersonSalary || "未知"} 金）</span>
              <div>
                {(parsedSummary.specialDrops || []).length > 0
                  ? (parsedSummary.specialDrops || []).map((drop, index) => (
                      <Tag key={index} color="blue" style={{ marginBottom: "5px" }}>
                        {drop}
                      </Tag>
                    ))
                  : "无特殊掉落"}
              </div>
            </>
          );

          if (isMin && salaries.length > 1) {
            return (
              <Badge.Ribbon text="★史低" color="green">
                {content}
              </Badge.Ribbon>
            );
          }
          if (isMax && salaries.length > 1) {
            return (
              <Badge.Ribbon text="★史高" color="red">
                {content}
              </Badge.Ribbon>
            );
          }
          if (isFarBelowAvg) {
            return (
              <Badge.Ribbon text="黑鬼" color="purple">
                {content}
              </Badge.Ribbon>
            );
          }
          if (isFarAboveAvg) {
            return (
              <Badge.Ribbon text="小红手" color="pink">
                {content}
              </Badge.Ribbon>
            );
          }
          return content;
        } catch (e) {
          return text || "暂无记录";
        }
      },
    },
    {
      title: "黑本人",
      dataIndex: "summary",
      key: "blacklist",
      render: (text) => {
        try {
          const parsedSummary = JSON.parse(text);
          return parsedSummary.blacklist || "无";
        } catch (e) {
          return "无";
        }
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {isAdmin && (
          <Button type="primary" onClick={handleAddHistoryRecord}>
            新增历史记录
          </Button>
        )}
      </div>
      <Table
        dataSource={teams}
        columns={columns}
        rowKey="teamId"
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
        }}
      />
      <Modal
        title="开团详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        style={{ minWidth: 1060 }}
      >
        {selectedTeam ? (
          <div>
            <p>
              <strong>标题：</strong> {selectedTeam.title}
            </p>
            <p>
              <strong>创建日期：</strong> {dayjs(selectedTeam.createTime).format("YYYY-MM-DD HH:mm")}
            </p>
            <p>
              <strong>结束日期：</strong> {dayjs(selectedTeam.closeTime).format("YYYY-MM-DD HH:mm")}
            </p>
            <p>
              <strong>创建人：</strong> {selectedTeam.createrNickname || "未知"}
            </p>
            <p>
              <strong>关闭人：</strong> {selectedTeam.closeNickname || "未知"}
            </p>
            <p>
              <strong>副本：</strong> {selectedTeam.dungeons}
            </p>
            <p>
              <strong>今天记录</strong>
              {selectedTeam.summary
                ? (() => {
                    try {
                      const parsedSummary = JSON.parse(selectedTeam.summary);
                      return (
                        <>
                          <div>
                            {parsedSummary.salary || "未知"} 金{" "}
                            <span style={{ color: "#888" }}>（人均 {parsedSummary.perPersonSalary || "未知"} 金）</span>
                          </div>
                          <div>
                            <strong>特殊掉落：</strong>
                            {(parsedSummary.specialDrops || []).length > 0
                              ? (parsedSummary.specialDrops || []).map((drop, index) => (
                                  <Tag key={index} color="blue" style={{ marginBottom: "5px" }}>
                                    {drop}
                                  </Tag>
                                ))
                              : "无特殊掉落"}
                          </div>
                          <div>
                            <strong>黑本人：</strong>
                            {parsedSummary.blacklist || "无"}
                          </div>
                        </>
                      );
                    } catch (e) {
                      return "解析失败";
                    }
                  })()
                : "暂无备注"}
            </p>
            <p>
              <strong>团队告示：</strong> {selectedTeam.notice || "暂无告示"}
            </p>
            <SlotPanel
              mode="view"
              rules={JSON.parse(selectedTeam.rule || Array(25).fill({}))}
              //signup_infos={[]} // 暂无报名信息
            />
          </div>
        ) : (
          <p>加载中...</p>
        )}
      </Modal>

      <AddHistoryRecordModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSuccess={handleAddHistorySuccess}
      />
    </div>
  );
};

export default HistoryTeams;
