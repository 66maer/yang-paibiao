import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Space,
  Select,
  Avatar,
  Modal,
  Form,
} from "antd";
import { request } from "@/utils/request";
import store from "@/store";
import servers from "@/utils/sever";
import { xinfaInfoTable } from "@/utils/xinfa";

const { Option } = Select;

const Character = () => {
  const [characters, setCharacters] = useState([]);
  const [originalCharacters, setOriginalCharacters] = useState([]);
  const [editing, setEditing] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await request.post("/character/listUserCharacters", {
          userId: store.getState().user.userId,
        });
        if (res.code !== 0) {
          throw new Error(res.msg);
        }
        setCharacters(res.data.characters);
        setOriginalCharacters(res.data.characters);
      } catch (err) {
        message.error(err.message);
      }
    };
    fetchCharacters();
  }, []);

  const handleSave = async (record) => {
    try {
      const res = await request.post("/character/updateCharacter", {
        characterId: record.characterId,
        name: record.name,
        server: record.server,
        xinfa: record.xinfa,
        remark: record.remark,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("更新成功");
      setEditing((prev) => ({ ...prev, [record.characterId]: false }));
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (characterId) => {
    try {
      const res = await request.post("/character/deleteCharacter", {
        characterId,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("删除成功");
      setCharacters((prev) =>
        prev.filter((char) => char.characterId !== characterId)
      );
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCancel = (characterId) => {
    setCharacters((prev) =>
      prev.map((char) =>
        char.characterId === characterId
          ? originalCharacters.find(
              (original) => original.characterId === characterId
            )
          : char
      )
    );
    setEditing((prev) => ({ ...prev, [characterId]: false }));
  };

  const handleAddCharacter = async (values) => {
    try {
      const res = await request.post("/character/createCharacter", {
        userId: store.getState().user.userId,
        ...values,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("添加成功");

      setCharacters((prev) => [...prev, res.data.characterInfo]);
      setOriginalCharacters((prev) => [...prev, res.data.characterInfo]);
      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCancelAdd = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const serverOptions = Object.entries(servers).map(([group, options]) => ({
    label: group,
    options: options.map((server) => ({ label: server, value: server })),
  }));

  const xinfaOptions = Object.keys(xinfaInfoTable).map((xinfa) => ({
    label: (
      <Space key={xinfa}>
        <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />
        <span>{xinfaInfoTable[xinfa].name}</span>
      </Space>
    ),
    value: xinfa,
  }));

  const columns = [
    {
      title: "角色名",
      dataIndex: "name",
      key: "name",
      render: (text, record) =>
        editing[record.characterId] ? (
          <Input
            value={record.name}
            onChange={(e) =>
              setCharacters((prev) =>
                prev.map((char) =>
                  char.characterId === record.characterId
                    ? { ...char, name: e.target.value }
                    : char
                )
              )
            }
          />
        ) : (
          text
        ),
    },
    {
      title: "服务器",
      dataIndex: "server",
      key: "server",
      render: (text, record) =>
        editing[record.characterId] ? (
          <Select
            value={record.server}
            options={serverOptions}
            onChange={(value) =>
              setCharacters((prev) =>
                prev.map((char) =>
                  char.characterId === record.characterId
                    ? { ...char, server: value }
                    : char
                )
              )
            }
            style={{ width: 150 }}
          />
        ) : (
          text
        ),
    },
    {
      title: "心法",
      dataIndex: "xinfa",
      key: "xinfa",
      render: (xinfa, record) =>
        editing[record.characterId] ? (
          <Select
            showSearch
            value={record.xinfa}
            options={xinfaOptions}
            onChange={(value) =>
              setCharacters((prev) =>
                prev.map((char) =>
                  char.characterId === record.characterId
                    ? { ...char, xinfa: value }
                    : char
                )
              )
            }
            style={{ width: 200 }}
            filterOption={(input, option) =>
              xinfaInfoTable[option.value].nickname.some((nickname) =>
                nickname.includes(input)
              )
            }
          />
        ) : (
          <Space key={xinfa}>
            <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />
            <span>{xinfaInfoTable[xinfa].name}</span>
          </Space>
        ),
    },
    {
      title: "备注",
      dataIndex: "remark",
      key: "remark",
      render: (text, record) =>
        editing[record.characterId] ? (
          <Input
            value={record.remark}
            onChange={(e) =>
              setCharacters((prev) =>
                prev.map((char) =>
                  char.characterId === record.characterId
                    ? { ...char, remark: e.target.value }
                    : char
                )
              )
            }
          />
        ) : (
          text
        ),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) =>
        editing[record.characterId] ? (
          <Space>
            <Button type="primary" onClick={() => handleSave(record)}>
              保存
            </Button>
            <Button onClick={() => handleCancel(record.characterId)}>
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              onClick={() =>
                setEditing((prev) => ({ ...prev, [record.characterId]: true }))
              }
            >
              编辑
            </Button>
            <Button danger onClick={() => handleDelete(record.characterId)}>
              删除
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div className="character-page">
      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={() => setIsModalVisible(true)}
      >
        添加角色
      </Button>
      <Table
        dataSource={characters}
        columns={columns}
        rowKey="characterId"
        pagination={false}
        bordered
      />
      <Modal
        title="添加新角色"
        open={isModalVisible}
        onCancel={handleCancelAdd}
        footer={null}
      >
        <Form form={form} onFinish={handleAddCharacter} layout="vertical">
          <Form.Item
            name="name"
            label="角色名"
            rules={[{ required: true, message: "请输入角色名" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="server"
            label="服务器"
            rules={[{ required: true, message: "请选择服务器" }]}
          >
            <Select options={serverOptions} />
          </Form.Item>
          <Form.Item
            name="xinfa"
            label="心法"
            rules={[{ required: true, message: "请选择心法" }]}
          >
            <Select
              showSearch
              options={xinfaOptions}
              filterOption={(input, option) =>
                xinfaInfoTable[option.value].nickname.some((nickname) =>
                  nickname.includes(input)
                )
              }
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={handleCancelAdd}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Character;
