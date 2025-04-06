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
  Spin,
  Popover,
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
  PushpinOutlined,
  UserSwitchOutlined,
  UserOutlined,
  TeamOutlined,
  PayCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SlotPanel from "@/components/SlotPanel";
import { dungeonsTable } from "@/utils/dungeons";
import SlotAllocate from "../../components/SlotAllocate";
import { useParams, useNavigate } from "react-router-dom";
import { request } from "@/utils/request";
import store from "@/store";
import { fetchSignupsByTeam } from "./index"; // 引入 fetchSignupsByTeam 函数
import { xinfaInfoTable } from "@/utils/xinfa";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const FormSwitchButton = ({ form, fieldName, trueIcon, falseIcon, tooltip }) => {
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
          backgroundColor: form.getFieldValue(fieldName) ? "#f5222d" : "#52c41a",
        }}
      />
    </Tooltip>
  );
};

const BoardEditContent = ({ team = {}, onBack }) => {
  const { teamId, title, dungeons } = team;
  const { isLock, isHidden } = team;
  const [autoTitle, setAutoTitle] = useState(!teamId); // 根据 teamId 判断默认值
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rules, setRules] = useState(team.rule || Array(25).fill({}));
  const [signupInfos, setSignupInfos] = useState(team.signupInfos || Array(25).fill({}));
  const [candidateList, setCandidateList] = useState([]); // 添加候补列表状态
  const [signups, setSignups] = useState([]); // 添加原始报名列表状态
  const [assignedSignups, setAssignedSignups] = useState([]); // 添加团长指定报名状态
  const [loading, setLoading] = useState(true); // 添加加载状态
  const navigate = useNavigate();

  useEffect(() => {
    if (team.teamId) {
      form.setFieldsValue({
        title: team.title,
        date: dayjs(team.teamTime),
        time: dayjs(team.teamTime),
        dungeons: team.dungeons,
        isLock: team.isLock || false,
        isHidden: team.isHidden || false,
        bookXuanjing: team.bookXuanjing || false,
        bookYuntie: team.bookYuntie || false,
        notice: team.notice,
      });

      try {
        const parsedRule = JSON.parse(team.rule || Array(25).fill({}));
        setRules(parsedRule);
      } catch (error) {
        console.error("Failed to parse rule:", error);
        message.error("规则解析失败，已重置为默认值");
        setRules(Array(25).fill({}));
      }

      setAutoTitle(false); // 编辑模式下关闭自动生成标题
    }
    setLoading(false); // 数据加载完成后设置为 false
  }, [team, form]); // 监听 team 的变化

  useEffect(() => {
    const fetchSignups = async () => {
      if (team.teamId) {
        const signups = await fetchSignupsByTeam(team.teamId);
        const [slotMemberList, candidates] = SlotAllocate(rules, signups);
        setSignupInfos(slotMemberList); // 设置最终的报名列表
        setCandidateList(candidates); // 设置候补列表
        setSignups(signups); // 设置原始报名列表
      }
    };

    fetchSignups();
  }, [team.teamId, rules]); // 添加对 team.teamId 和 rules 的监听

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
            <Form form={form} initialValues={{ templateTitle: "" }} layout="vertical">
              <Form.Item name="templateTitle" label="模板标题" rules={[{ required: true, message: "请输入模板标题" }]}>
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

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        rule: JSON.stringify(rules),
        teamTime: new Date(`${values.date.format("YYYY-MM-DD")}T${values.time.format("HH:mm:ss")}`).toISOString(),
        guildId: store.getState().guild.guildId,
        createrId: store.getState().user.userId,
        isLock: values.isLock,
        isHidden: values.isHidden,
        bookXuanjing: values.bookXuanjing,
        bookYuntie: values.bookYuntie,
      };

      const api = teamId ? "/team/updateTeam" : "/team/createTeam";
      if (teamId) {
        payload.teamId = teamId;
      }

      const res = await request.post(api, payload);
      if (res.code === 0) {
        message.success(teamId ? "团队更新成功" : "团队创建成功");

        // 如果有团长指定的报名，一次性提交
        if (assignedSignups.length > 0) {
          const createdTeamId = teamId || res.data.teamId;
          // 提交所有团长指定的报名
          const assignPromises = assignedSignups.map((assignData) => {
            return request.post("/signup/createSignup", {
              ...assignData,
              teamId: createdTeamId,
            });
          });

          try {
            await Promise.all(assignPromises);
            message.success("团长指定报名提交成功");
          } catch (error) {
            message.error("部分团长指定报名提交失败，请刷新页面后重试");
          }
        }

        navigate(teamId ? `/board/${teamId}` : `/board/${res.data.teamId}`);
      } else {
        throw new Error(res.msg);
      }
    } catch (error) {
      message.error(error.msg || "保存失败");
    }
  };

  const handleRulesChange = (updatedRules) => {
    console.log("Updated rules:", updatedRules);
    setRules(updatedRules);
  };

  const handleSignupInfosChange = (updatedSignupInfos, newAssignedSignups) => {
    console.log("Updated signup infos:", updatedSignupInfos, newAssignedSignups);
    setSignupInfos(updatedSignupInfos);
    setAssignedSignups(newAssignedSignups);
  };

  const renderSignupList = (signups) => {
    const handleCancelSignup = (signupId) => {
      console.log("取消报名:", signupId);
      // 空实现，后续可添加取消报名逻辑
    };

    const renderTimelineItem = (item) => {
      const getDot = (signup) => {
        const color = signup.isRich ? "orange" : "green";
        if (signup.cancelTime) {
          return <CloseCircleOutlined style={{ color: "red" }} />;
        }
        if (signup.isProxy) {
          return <UserSwitchOutlined style={{ color: color }} />;
        }
        if (signup.isLock) {
          return <LockOutlined style={{ color: color }} />;
        }
        return <UserOutlined style={{ color: "green" }} />;
      };

      const getTags = (signup) => {
        const tags = [];
        if (signup.isProxy) {
          tags.push(
            <Tag color="purple" icon={<UserSwitchOutlined />}>
              代报名
            </Tag>
          );
        }
        if (signup.isRich) {
          tags.push(
            <Tag color="orange" icon={<PayCircleOutlined />}>
              老板
            </Tag>
          );
        }
        if (signup.isLock) {
          tags.push(
            <Tag color="green" icon={<LockOutlined />}>
              锁定报名
            </Tag>
          );
        }
        if (signup.cancelTime) {
          tags.push(
            <Tag color="red" icon={<CloseCircleOutlined />}>
              已取消
            </Tag>
          );
        }
        if (tags.length > 0) {
          return <Space>{tags}</Space>;
        }
        return null;
      };

      return {
        dot: getDot(item),
        children: (
          <Popover
            content={
              <Space direction="vertical" size={4}>
                {getTags(item)}
                <Space>
                  <Avatar src={`/xinfa/${xinfaInfoTable[item.characterXinfa].icon}`} size={20} />
                  {item.characterName}
                </Space>
                {`报名时间: ${item.signupTime}`}
                {item.isProxy && `由 ${item.submitName} 代报名`}
                {item.cancelTime && `取消时间: ${item.cancelTime}`}
                {item.cancelTime && `由`}
                <Button danger onClick={() => handleCancelSignup(item.signupId)}>
                  取消报名
                </Button>
              </Space>
            }
            title={item.signupName}
          >
            <Space>
              <Avatar src={`/xinfa/${xinfaInfoTable[item.characterXinfa].icon}`} size={24} />
              {`${item.signupName} (${item.characterName})`}
            </Space>
          </Popover>
        ),
      };
    };

    return (
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
            items={signups.map((signup) => renderTimelineItem(signup))}
            style={{
              marginTop: 16,
            }}
          />
        </div>
      </div>
    );
  };

  const renderCandidateList = (candidates) => {
    return (
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
          {/* <Timeline
            mode="left"
            items={candidates.map((candidate, index) =>
              renderTimelineItem({ ...candidate, index }, true)
            )}
            style={{
              marginTop: 16,
            }}
          /> */}
        </div>
      </div>
    );
  };

  return (
    <Flex style={{ height: "100%" }}>
      {loading ? (
        <Spin style={{ margin: "auto" }} size="large" />
      ) : (
        <div className="board-content">
          <Form
            form={form}
            labelAlign="right"
            onFinish={onFinish}
            initialValues={{
              isLock: isLock || false,
              isHidden: isHidden || false,
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
                <Button onClick={onBack}>返回</Button>
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
              <Form.Item name="isHidden">
                <FormSwitchButton
                  form={form}
                  fieldName="isHidden"
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
              <Form.Item name="dungeons" label="副本" rules={[{ required: true }]}>
                <Select options={dungeonsTable} style={{ width: 150 }} placeholder="请选择副本" />
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
              <Form.Item name="bookXuanjing" label="大铁标记" valuePropName="checked">
                <Switch checkedChildren="大包" unCheckedChildren="大拍" />
              </Form.Item>
              <Form.Item name="bookYuntie" label="小铁标记" valuePropName="checked">
                <Switch checkedChildren="小包" unCheckedChildren="小拍" />
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
                <Button type="primary" icon={<DownloadOutlined />} onClick={() => applyTemplate(selectedTemplate)}>
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
            signup_infos={signupInfos} // 将最终的报名列表传递给 SlotPanel
            onRulesChange={handleRulesChange}
            onSignupInfosChange={handleSignupInfosChange}
          />
        </div>
      )}
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
              children: renderSignupList(signups),
            },
            {
              label: "候补列表",
              children: renderCandidateList(candidateList),
            },
          ]}
        />
      </div>
    </Flex>
  );
};

const BoardEditPage = () => {
  const navigate = useNavigate(); // 添加导航钩子
  const { teamId } = useParams(); // 获取路由参数
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) {
        return;
      }
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
    };
    fetchTeam();
  }, [teamId]);

  return (
    <Layout className="board-layout">
      <Content className="board-layout-content">
        <BoardEditContent
          team={team || {}}
          onBack={() => navigate(teamId ? `/board/${teamId}` : "/board")} // 返回时带上 teamId
        />
      </Content>
    </Layout>
  );
};

export default BoardEditPage;
