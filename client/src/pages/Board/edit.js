import React, { useState, useEffect } from "react";
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
  Layout,
  message,
  Modal,
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
import { useParams } from "react-router-dom";
import { request } from "@/utils/request";
import store from "@/store";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

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
  const { teamId, title, teamTime, dungeons, rule, notice } = team;
  const { isLock, isVisiable, crateTime, updateTime } = team;
  const [expanded, setExpanded] = useState(false);
  const [autoTitle, setAutoTitle] = useState(true);
  const [bookXuanjing, setBookXuanjing] = useState(team.bookXuanjing || false);
  const [bookYuntie, setBookYuntie] = useState(team.bookYuntie || false);
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rules, setRules] = useState(team.rule?.slots || Array(25).fill({}));
  const [signupInfos, setSignupInfos] = useState(
    team.signupInfos || Array(25).fill({})
  );

  useEffect(() => {
    if (team.teamId) {
      form.setFieldsValue({
        title: team.title,
        date: dayjs(team.teamTime),
        time: dayjs(team.teamTime),
        dungeons: team.dungeons,
        isLock: team.isLock || false,
        isVisiable: team.isVisiable || false,
        notice: team.notice,
      });
    }
  }, [team, form]); // 监听 team 的变化

  const fetchTemplates = async () => {
    try {
      const res = await request.post("/template/listTemplates", {
        guildId: store.getState().guild.guildId,
      });
      if (res.code === 0) {
        setTemplates(res.data.templates);
      } else {
        message.error(res.msg);
      }
    } catch (error) {
      message.error("获取模板列表失败");
    }
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((tpl) => tpl.templateId === templateId);
    if (template) {
      Modal.confirm({
        title: "应用模板",
        content: "应用模板将覆盖当前团队面板与团队告示，是否继续？",
        onOk: () => {
          try {
            const parsedRule = JSON.parse(template.rule);
            setRules(parsedRule);
            if (template.notice) {
              form.setFieldsValue({
                notice: template.notice,
              });
            }
            message.success("模板应用成功");
          } catch (error) {
            message.error("模板解析失败");
          }
        },
      });
    }
  };

  const saveAsTemplate = async () => {
    try {
      const values = await form.validateFields();
      Modal.confirm({
        title: "保存模板",
        content: (
          <>
            <p>会保存当前团队面板与团队告示信息。</p>
            <Form
              form={form}
              initialValues={{ templateTitle: "" }}
              layout="vertical"
            >
              <Form.Item
                name="templateTitle"
                label="模板标题"
                rules={[{ required: true, message: "请输入模板标题" }]}
              >
                <Input placeholder="请输入模板标题" />
              </Form.Item>
            </Form>
          </>
        ),
        onOk: async () => {
          const templateTitle = form.getFieldValue("templateTitle");
          const payload = {
            title: templateTitle,
            notice: values.notice,
            rule: JSON.stringify(rules),
            guildId: store.getState().guild.guildId,
            createrId: store.getState().user.userId,
          };
          const res = await request.post("/template/createTemplate", payload);
          if (res.code === 0) {
            message.success("模板保存成功");
            await fetchTemplates(); // 刷新模板列表
          } else {
            message.error(res.msg);
          }
        },
      });
    } catch (error) {
      message.error("保存模板失败");
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const pageTitle = teamId ? "编辑团队" : "发布开团";

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

  const handleRulesChange = (updatedRules) => {
    console.log("Updated rules:", updatedRules);
    setRules(updatedRules);
  };

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
            date: teamId ? dayjs(team.teamTime) : dayjs(),
            time: teamId ? dayjs(team.teamTime) : dayjs("19:30", "HH:mm"),
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
                <Form.Item name="date" noStyle rules={[{ required: true }]}>
                  <DatePicker />
                </Form.Item>
                <Form.Item name="time" noStyle rules={[{ required: true }]}>
                  <TimePicker format="HH:mm" minuteStep={5} />
                </Form.Item>
              </Space>
            </Form.Item>
            <Form.Item
              name="dungeons"
              label="副本"
              rules={[{ required: true }]}
            >
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

          <Space size={20} align="baseline">
            <Form.Item name="bookXuanjing" label="大铁标记">
              <Switch
                checkedChildren="大包"
                unCheckedChildren="大拍"
                checked={bookXuanjing}
                onChange={(checked) => setBookXuanjing(checked)}
              />
            </Form.Item>
            <Form.Item name="bookYuntie" label="小铁标记">
              <Switch
                checkedChildren="小包"
                unCheckedChildren="小拍"
                checked={bookYuntie}
                onChange={(checked) => setBookYuntie(checked)}
              />
            </Form.Item>
          </Space>

          <Form.Item label="使用模板">
            <Space>
              <Select
                style={{ width: 200 }}
                options={templates.map((tpl) => ({
                  label: tpl.title,
                  value: tpl.templateId,
                }))}
                onChange={(value) => setSelectedTemplate(value)}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => applyTemplate(selectedTemplate)}
              >
                应用模板
              </Button>
              <Button icon={<SaveOutlined />} onClick={saveAsTemplate}>
                保存为模板
              </Button>
            </Space>
          </Form.Item>

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
        </Form>

        <SlotPanel
          mode="edit"
          rules={rules}
          signup_infos={signupInfos}
          onRulesChange={handleRulesChange}
        />
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

const BoardEditPage = () => {
  const { teamId } = useParams(); // 获取路由参数
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (teamId) {
        try {
          const res = await request.post("/team/getTeam", {
            teamId: Number(teamId),
          });
          if (res.code === 0) {
            setTeam(res.data.teamInfo);
          } else {
            message.error(res.msg);
          }
        } catch (error) {
          message.error("获取团队信息失败", error.msg);
        }
      }
    };

    fetchTeam();
  }, [teamId]);

  return (
    <Layout className="board-layout">
      <Content className="board-layout-content">
        <BoardEditContent team={team || {}} /> {/* 传入 team 数据 */}
      </Content>
    </Layout>
  );
};

export default BoardEditPage;
