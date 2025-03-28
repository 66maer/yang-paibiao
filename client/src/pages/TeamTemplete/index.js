import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Space, message } from "antd";
import { request } from "@/utils/request";
import SlotPanel from "@/components/SlotPanel";

const TeamTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [slotData, setSlotData] = useState(null); // 新增状态，用于存储 SlotPanel 数据

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await request.post("/template/listTemplates", {
          guildId: 1, // Replace with actual guildId
        });
        if (res.code !== 0) {
          throw new Error(res.message);
        }
        setTemplates(res.data.templates);
      } catch (err) {
        message.error(err.message);
      }
    };
    fetchTemplates();
  }, []);

  const handleSlotDataChange = (updatedSlots) => {
    setSlotData(updatedSlots); // 更新 slotData
  };

  const handleSave = async (values) => {
    try {
      const api = editingTemplate
        ? "/template/updateTemplate"
        : "/template/createTemplate";
      const payload = {
        ...values,
        slots: slotData, // 将 SlotPanel 数据加入 payload
        ...(editingTemplate && { templateId: editingTemplate.templateId }),
      };

      const res = await request.post(api, payload);
      if (res.code !== 0) {
        throw new Error(res.message);
      }

      message.success(editingTemplate ? "更新成功" : "新增成功");
      setIsModalVisible(false);
      setEditingTemplate(null);
      form.resetFields();
      setTemplates((prev) =>
        editingTemplate
          ? prev.map((tpl) =>
              tpl.templateId === editingTemplate.templateId
                ? { ...tpl, ...values }
                : tpl
            )
          : [...prev, res.data.templateInfo]
      );
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
        throw new Error(res.message);
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
    form.setFieldsValue({
      ...template, // 确保包括 notice 字段
    });

    // 简单解析 rule 字段
    let parsedSlots = null;
    try {
      parsedSlots = JSON.parse(template.rule); // 直接解析为 JSON
    } catch (err) {
      console.error("Failed to parse rule:", err);
      parsedSlots = null; // 如果解析失败，使用空数组
    }

    setSlotData(parsedSlots); // 设置初始 slots 数据
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    setIsModalVisible(true);
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
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
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
                initialSlotsT={slotData} // 传递初始数据
                onSlotChange={handleSlotDataChange}
              />
            </div>
          </Form.Item>
          <Form.Item>
            <Space style={{ float: "right" }}>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamTemplate;
