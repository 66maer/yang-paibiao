import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Space, message } from "antd";
import { request } from "@/utils/request";
import SlotPanel from "@/components/SlotPanel";
import store from "@/store";

const TeamTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isHidden, setIsHidden] = useState(false); // 修改 isVisiable 为 isHidden
  const [form] = Form.useForm();
  const [rules, setRules] = useState(Array(25).fill({}));

  const fetchTemplateList = async () => {
    try {
      const guildId = store.getState().guild.guildId; // 从 store 获取 guildId
      const res = await request.post("/template/listTemplates", { guildId });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      setTemplates(res.data.templates);
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    fetchTemplateList();
  }, []);

  const handleRulesChange = (updatedRules) => {
    setRules(updatedRules);
  };

  const handleSave = async (values) => {
    try {
      const api = editingTemplate
        ? "/template/updateTemplate"
        : "/template/createTemplate";
      var payload = {
        ...values,
        rule: JSON.stringify(rules),
      };

      if (editingTemplate) {
        payload = {
          ...payload,
          templateId: editingTemplate.templateId,
        };
      } else {
        payload = {
          ...payload,
          guildId: store.getState().guild.guildId,
          createrId: store.getState().user.userId,
        };
      }

      const res = await request.post(api, payload);
      if (res.code !== 0) {
        throw new Error(res.msg);
      }

      message.success(editingTemplate ? "更新成功" : "新增成功");
      setIsHidden(false); // 修改 isVisiable 为 isHidden
      setEditingTemplate(null);
      form.resetFields();
      setRules(Array(25).fill({})); // 重置 rules

      await fetchTemplateList(); // 调用抽取的函数获取模板列表
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (templateId) => {
    try {
      const res = await request.post("/template/deleteTemplate", {
        templateId,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("删除成功");
      setTemplates((prev) =>
        prev.filter((tpl) => tpl.templateId !== templateId)
      );
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue({ ...template });

    console.log("handleEdit", template);
    try {
      const parsedRules = JSON.parse(template.rule);
      setRules(parsedRules);
    } catch (err) {
      console.error("Failed to parse rule:", err);
    }

    setIsHidden(true); // 修改 isVisiable 为 isHidden
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    setIsHidden(true); // 修改 isVisiable 为 isHidden
  };

  const columns = [
    {
      title: "模板标题",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>编辑</Button>
          <Button danger onClick={() => handleDelete(record.templateId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="team-template-page">
      <Button type="primary" style={{ marginBottom: 16 }} onClick={handleAdd}>
        新增模板
      </Button>
      <Table
        dataSource={templates}
        columns={columns}
        rowKey="templateId"
        pagination={false}
        bordered
      />
      <Modal
        title={editingTemplate ? "编辑模板" : "新增模板"}
        open={isHidden} // 修改 isVisiable 为 isHidden
        onCancel={() => setIsHidden(false)} // 修改 isVisiable 为 isHidden
        footer={null}
        style={{ minWidth: 1060 }}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="title"
            label="模板标题"
            rules={[{ required: true, message: "请输入模板标题" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="notice" label="团队告示">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="编辑面板">
            <div className="board-content">
              <SlotPanel
                mode="edit-only-rule"
                rules={rules}
                onRulesChange={handleRulesChange}
              />
            </div>
          </Form.Item>
          <Form.Item>
            <Space style={{ float: "right" }}>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setIsHidden(false)}>取消</Button>{" "}
              {/* 修改 isVisiable 为 isHidden */}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamTemplate;
