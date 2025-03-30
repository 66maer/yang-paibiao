import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Space, message } from "antd";
import { request } from "@/utils/request";
import dayjs from "dayjs";
import SlotPanel from "@/components/SlotPanel";
import store from "@/store";

const HistoryTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchHistoryTeams = async (page = 1, pageSize = 10) => {
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
      setTeams(res.data.teams);
      setPagination((prev) => ({
        ...prev,
        current: page,
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

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "创建日期",
      dataIndex: "createTime",
      key: "createTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "结束日期",
      dataIndex: "closeTime",
      key: "closeTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "报名人数",
      dataIndex: "signupCount",
      key: "signupCount",
      render: () => "暂未实现", // 占位符
    },
    {
      title: "金团备注",
      dataIndex: "summary",
      key: "summary",
      render: (text) => text || "暂无备注",
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
          onChange: (page, pageSize) =>
            handleTableChange({ current: page, pageSize }),
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
              <strong>创建日期：</strong>{" "}
              {dayjs(selectedTeam.createTime).format("YYYY-MM-DD HH:mm")}
            </p>
            <p>
              <strong>结束日期：</strong>{" "}
              {dayjs(selectedTeam.closeTime).format("YYYY-MM-DD HH:mm")}
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
              <strong>金团备注：</strong> {selectedTeam.summary || "暂无备注"}
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
    </div>
  );
};

export default HistoryTeams;
