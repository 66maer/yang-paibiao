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
  Tooltip,
  Timeline,
  Collapse,
} from "antd";
import {
  EditOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  SaveOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SlotPanel from "@/components/SlotPanel";
import { dungeonsTable } from "@/utils/dungeons";
import SlotAllocate from "../../components/SlotAllocate";

const { Title, Paragraph } = Typography;

const timelineItems = [
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
  { color: "green", children: "张三1" },
  { color: "red", children: "李四2" },
  { color: "#66ccff", children: "王五王五王五王五王五王五" },
];

const FormSwitchButton = ({
  form,
  fieldName,
  trueIcon,
  falseIcon,
  tooltip,
}) => {
  const [, forceUpdate] = useState();
  return (
    <Tooltip title={tooltip}>
      <Button
        type="primary"
        shape="circle"
        icon={form.getFieldValue(fieldName) ? trueIcon : falseIcon}
        onClick={() => {
          form.setFieldsValue({
            [fieldName]: !form.getFieldValue(fieldName),
          });
          forceUpdate({}); // 强制更新组件
        }}
        style={{
          backgroundColor: form.getFieldValue(fieldName)
            ? "#f5222d"
            : "#52c41a",
        }}
      />
    </Tooltip>
  );
};

const BoardEditContent = ({ team = {} }) => {
  const { id, title, teamTime, dungeons, rule, notice } = team;
  const {
    bookXuanjing,
    bookYuntie,
    isLock,
    isVisiable,
    crateTime,
    updateTime,
  } = team;
  const [expanded, setExpanded] = useState(false);
  const [autoTitle, setAutoTitle] = useState(true);
  const [form] = Form.useForm();

  const pageTitle = id ? "编辑团队" : "发布开团";

  const generateTitle = () => {
    const date = form.getFieldValue("date")?.format("MM月DD日");
    const dayOfWeek = form.getFieldValue("date")?.format("d");
    const daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
    const dayOfWeekChinese = daysOfWeek[dayOfWeek];
    const formattedDate = date ? `${date}(周${dayOfWeekChinese})` : "";
    const time = form.getFieldValue("time")?.format("HH:mm");
    const dungeon = form.getFieldValue("dungeons");
    console.log(date, time, dungeon);
    if (date && time && dungeon) {
      return `${formattedDate} ${time} ${dungeon}`;
    }
    return "";
  };

  const onValuesChange = (changedValues, allValues) => {
    if (autoTitle) {
      form.setFieldsValue({ title: generateTitle() });
    }
  };

  const onFinish = (values) => {
    console.log(values);
  };

  console.log(team);

  const rules = [
    { allowXinfaList: ["a", "b"], allowRich: false },
    { allowXinfaList: ["a", "c"], allowRich: false },
  ];

  const signup = [
    {
      id: 1,
      xinfa: "a",
      isRich: false,
    },
    {
      id: 2,
      xinfa: "b",
      isRich: false,
    },
    {
      id: 3,
      xinfa: "a",
      isRich: false,
    },
  ];

  console.log("======");
  SlotAllocate(rules, signup);

  return (
    <Flex style={{ height: "100%" }}>
      <div className="board-content">
        <Form
          form={form}
          labelAlign="right"
          onFinish={onFinish}
          initialValues={{
            isLock: isLock || false,
            isVisiable: isVisiable || false,
            date: id ? dayjs(team.teamTime) : dayjs(),
            time: id ? dayjs(team.teamTime) : dayjs("19:30", "HH:mm"),
            dungeons: dungeons || undefined,
            title: title,
          }}
          onValuesChange={onValuesChange}
        >
          <Flex justify="space-between" align="center">
            <Title level={3} className="board-content-title">
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

          <Space size={20} align="baseline">
            <Form.Item name="title" label="开团标题">
              <Input
                showCount
                maxLength={30}
                disabled={autoTitle}
                style={{
                  width: 800,
                }}
              />
            </Form.Item>
            <Form.Item name="isLock">
              <FormSwitchButton
                form={form}
                fieldName="isLock"
                trueIcon={<LockOutlined />}
                falseIcon={<UnlockOutlined />}
                tooltip="锁定团队，不允许自由报名"
              />
            </Form.Item>
            <Form.Item name="isVisiable">
              <FormSwitchButton
                form={form}
                fieldName="isVisiable"
                trueIcon={<EyeInvisibleOutlined />}
                falseIcon={<EyeOutlined />}
                tooltip="隐藏团队，仅管理员可见"
              />
            </Form.Item>
          </Space>
          <Space size={60} align="baseline">
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
            <Form.Item label="生成标题">
              <Switch
                checkedChildren="自动"
                unCheckedChildren="手动"
                checked={autoTitle}
                onChange={(checked) => {
                  setAutoTitle(checked);
                  if (checked) {
                    form.setFieldsValue({ title: generateTitle() });
                  }
                }}
              />
            </Form.Item>
          </Space>

          <Form.Item name="notice" label="团队告示" style={{ width: 800 }}>
            <Input.TextArea
              showCount
              autoSize={{
                minRows: 2,
                maxRows: 6,
              }}
            />
          </Form.Item>
          <Divider />
          <Form.Item label="使用模板">
            <Space>
              <Select style={{ width: 200 }}></Select>
              <Button type="primary" icon={<DownloadOutlined />}>
                应用模板
              </Button>
              <Button icon={<SaveOutlined />}>保存为模板</Button>
            </Space>
          </Form.Item>
        </Form>

        <SlotPanel mode="edit" />
      </div>
      <div
        style={{
          width: 265,
          marginLeft: 10,
        }}
      >
        <Collapse
          style={{ width: 250 }}
          items={[
            {
              label: "报名列表",
              children: (
                <div
                  style={{
                    marginTop: -16,
                    marginRight: -16,
                    marginBottom: -16,
                  }}
                >
                  <div
                    style={{
                      height: 1000,
                      overflowY: "auto",
                    }}
                  >
                    <Timeline
                      mode="left"
                      items={timelineItems}
                      style={{
                        marginTop: 16,
                      }}
                    />
                  </div>
                </div>
              ),
            },
            { label: "候补列表", children: <div>团队成员</div> },
          ]}
        />
      </div>
    </Flex>
  );
};

export default BoardEditContent;
