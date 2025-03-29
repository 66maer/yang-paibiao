import React, { useState, useEffect } from "react";
import { Table, Input, Select, Button, message, Space, Tag } from "antd";
import { request } from "@/utils/request";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import store from "@/store";

const { Option } = Select;

const GuildMember = () => {
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.guild);
  const { isSuperAdmin } = useSelector((state) => state.user);

  useEffect(() => {
    if (!(isSuperAdmin || role === "owner" || role === "helper")) {
      message.error("无权限访问该页面");
      navigate("/"); // 跳转到首页或其他页面
    }
  }, [role, isSuperAdmin, navigate]);

  const [members, setMembers] = useState([]);
  const [originalMembers, setOriginalMembers] = useState([]); // 保存原始成员数据
  const [editing, setEditing] = useState({}); // 记录正在编辑的成员

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await request.post("/guild/listGuildMembers", {
          guildId: store.getState().guild.guildId,
        });
        if (res.code !== 0) {
          throw new Error(res.msg);
        }
        setMembers(res.data.members);
        setOriginalMembers(res.data.members); // 保存原始数据
      } catch (err) {
        message.error(err.message);
      }
    };
    fetchMembers();
  }, []);

  const handleSave = async (record) => {
    try {
      const res = await request.post("/guild/updateGuildMember", {
        guildId: store.getState().guild.guildId,
        userId: record.userId,
        groupNickname: record.groupNickname,
        role: record.groupRole,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("更新成功");
      setEditing((prev) => ({ ...prev, [record.userId]: false }));
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCancel = (userId) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.userId === userId
          ? originalMembers.find((original) => original.userId === userId)
          : member
      )
    );
    setEditing((prev) => ({ ...prev, [userId]: false }));
  };

  const columns = [
    {
      title: "序号",
      dataIndex: "index",
      key: "index",
      width: 20, // 固定宽度
      render: (_, __, index) => index + 1,
    },
    {
      title: "群昵称",
      dataIndex: "groupNickname",
      key: "groupNickname",
      width: 150, // 固定宽度
      render: (text, record) =>
        editing[record.userId] ? (
          <Input
            maxLength={6}
            value={record.groupNickname}
            onChange={(e) =>
              setMembers((prev) =>
                prev.map((member) =>
                  member.userId === record.userId
                    ? { ...member, groupNickname: e.target.value }
                    : member
                )
              )
            }
            style={{ width: "100%" }} // 确保输入框宽度一致
          />
        ) : (
          text
        ),
    },
    {
      title: "昵称",
      dataIndex: "nickname",
      key: "nickname",
      width: 150, // 固定宽度
    },
    {
      title: "QQ号",
      dataIndex: "qqNumber",
      key: "qqNumber",
      width: 150, // 固定宽度
    },
    {
      title: "身份与权限",
      dataIndex: "groupRole",
      key: "groupRole",
      width: 150, // 固定宽度
      render: (text, record) =>
        editing[record.userId] ? (
          <Select
            value={record.groupRole}
            onChange={(value) =>
              setMembers((prev) =>
                prev.map((member) =>
                  member.userId === record.userId
                    ? { ...member, groupRole: value }
                    : member
                )
              )
            }
            style={{ width: "100%" }} // 确保下拉框宽度一致
            disabled={record.groupRole === "owner"} // 禁用群主的下拉框
          >
            {record.groupRole === "owner" ? (
              <Option value="owner">群主</Option>
            ) : (
              <>
                <Option value="helper">管理员</Option>
                <Option value="member">群员</Option>
                <Option value="blacklist">黑名单</Option>
              </>
            )}
          </Select>
        ) : (
          <Tag color={getTagColor(text)}>{getRoleLabel(text)}</Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      width: 200, // 固定宽度
      render: (_, record) =>
        editing[record.userId] ? (
          <Space>
            <Button type="primary" onClick={() => handleSave(record)}>
              修改
            </Button>
            <Button onClick={() => handleCancel(record.userId)}>取消</Button>
          </Space>
        ) : (
          <Button
            onClick={() =>
              setEditing((prev) => ({ ...prev, [record.userId]: true }))
            }
          >
            编辑
          </Button>
        ),
    },
  ];

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "群主";
      case "helper":
        return "管理员";
      case "member":
        return "群员";
      case "blacklist":
        return "黑名单";
      default:
        return "未知";
    }
  };

  const getTagColor = (role) => {
    switch (role) {
      case "owner":
        return "gold";
      case "helper":
        return "blue";
      case "member":
        return "green";
      case "blacklist":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div className="guild-member-page">
      <Table
        dataSource={members}
        columns={columns}
        rowKey="userId"
        pagination={false}
        bordered // 添加边框
        style={{ tableLayout: "fixed" }} // 固定表格布局
      />
    </div>
  );
};

export default GuildMember;
