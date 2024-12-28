import React, { useState } from "react";
import {
  Avatar,
  Button,
  Divider,
  Flex,
  Form,
  Input,
  Space,
  Tag,
  Typography,
  Switch,
  DatePicker,
  TimePicker,
  Select,
} from "antd";
import {
  EditOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import SlotPanel from "@/components/SlotPanel";
import { dungeonsTable } from "@/utils/dungeons";

const { Title, Paragraph } = Typography;

const BoardEditContent = ({ team = {} }) => {
  const { id, title, teamTime, dungeons, rule, notice } = team;
  const { bookXuanjing, bookYuntie, isLock, crateTime, updateTime } = team;
  const [expanded, setExpanded] = useState(false);
  const [autoTitle, setAutoTitle] = useState(true);
  const [form] = Form.useForm();
  const [, forceUpdate] = useState(); // 用于强制更新组件

  const pageTitle = id ? "编辑团队" : "发布开团";

  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <div className="board-content">
      <Form
        form={form}
        labelAlign="right"
        labelCol={{ span: 2 }}
        onFinish={onFinish}
        initialValues={{ isLock: isLock || false }} // 设置初始值
      >
        <Flex justify="space-between" align="center">
          <Title level={4} className="board-content-title">
            {pageTitle}
          </Title>
          <Space>
            <Button>返回</Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Space>
        </Flex>
        <Divider style={{ marginTop: 5 }} />

        <Form.Item name="title" label="开团标题">
          <Space align="center" size={"large"}>
            <Input
              showCount
              maxLength={20}
              disabled={autoTitle}
              style={{
                width: 800,
              }}
            />
            <Switch
              checkedChildren="自动"
              unCheckedChildren="手动"
              checked={autoTitle}
              onChange={(checked) => setAutoTitle(checked)}
            />
          </Space>
        </Form.Item>
        <Form.Item label="发车时间">
          <Space>
            <Form.Item name="date" noStyle>
              <DatePicker />
            </Form.Item>
            <Form.Item name="time" noStyle>
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="dungeons" label="副本">
          <Select
            options={dungeonsTable}
            style={{ width: 150 }}
            placeholder="请选择副本"
          />
        </Form.Item>
        <Form.Item name="isLock" label="是否锁车">
          <Space>
            <Button
              type="primary"
              shape="circle"
              icon={
                form.getFieldValue("isLock") ? (
                  <LockOutlined />
                ) : (
                  <UnlockOutlined />
                )
              }
              onClick={() => {
                form.setFieldsValue({ isLock: !form.getFieldValue("isLock") });
                forceUpdate({}); // 强制更新组件
              }}
              style={{
                backgroundColor: form.getFieldValue("isLock")
                  ? "#f5222d"
                  : "#52c41a",
              }}
            />
          </Space>
        </Form.Item>
        <Form.Item name="notice" label="团队告示">
          <Input.TextArea
            showCount
            autoSize={{
              minRows: 2,
              maxRows: 6,
            }}
          />
        </Form.Item>
      </Form>

      <SlotPanel />
    </div>
  );
};

export default BoardEditContent;
