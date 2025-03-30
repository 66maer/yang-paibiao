import React, { useState, useEffect } from "react";
import {
  Flex,
  Layout,
  Menu,
  Space,
  Button,
  Avatar,
  Spin,
  Typography,
  Tag,
  Empty,
  Tooltip,
  message,
  Modal,
  Form,
  InputNumber,
  Slider,
  Row,
  Col,
  AutoComplete,
  Select,
} from "antd";
import { request } from "@/utils/request";
import SlotCard from "@/components/SlotCard";
import DateTag from "@/components/DateTag";
import "./index.scss";
import SlotPanel from "@/components/SlotPanel";
import {
  CompassOutlined,
  ClockCircleOutlined,
  AntDesignOutlined,
  EditOutlined,
  CloseCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import store from "@/store";
import BoardEditContent from "./edit";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title, Paragraph } = Typography;
const { CheckableTag } = Tag;

const fetchTeamList = async () => {
  try {
    const res = await request.post("/team/listTeams", {
      guildId: store.getState().guild.guildId,
      filter: "open",
      page: 0,
      pageSize: 100,
    });
    if (res.code !== 0) {
      throw new Error(res.msg);
    }
    return res.data.teams;
  } catch (error) {
    console.error("Failed to fetch team list:", error);
    return [];
  }
};

const CloseTeamModal = ({ team, visible, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [workersCount, setWorkersCount] = useState(20);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTotalEditable, setIsTotalEditable] = useState(true); // 控制总工资和人均工资的输入模式
  const dispatch = useDispatch();

  const specialDrops = [
    "玄晶",
    "沙子",
    "外观挂件",
    "毕业精简",
    "追须",
    "高价其他",
  ];

  useEffect(() => {
    if (visible) {
      loadMembers();
      form.resetFields();
    }
  }, [visible, form]);

  const loadMembers = async () => {
    try {
      const guildId = store.getState().guild.guildId;
      const cachedMembers = await dispatch(fetchGuildMembersWithCache(guildId));
      setMembers(cachedMembers);
    } catch (err) {
      message.error("加载团队成员失败: " + err.message);
    }
  };

  const handleTagChange = (tag, checked) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
    form.setFieldsValue({ special_drops: nextSelectedTags });
  };

  const handleSalaryChange = (value, workersCountOverride) => {
    const numericValue = parseInt(value, 10) || 0;
    const effectiveWorkersCount = workersCountOverride ?? workersCount;
    if (isTotalEditable) {
      console.log("salary", numericValue, effectiveWorkersCount);
      form.setFieldsValue({
        perPersonSalary: Math.floor(numericValue / effectiveWorkersCount),
      });
    } else {
      form.setFieldsValue({
        salary: numericValue * effectiveWorkersCount,
      });
    }
  };

  const toggleSalaryMode = () => {
    setIsTotalEditable(!isTotalEditable);
    const currentSalary = form.getFieldValue(
      isTotalEditable ? "salary" : "perPersonSalary"
    );
    handleSalaryChange(currentSalary);
  };

  const handleWorkersCountChange = (value) => {
    console.log("workersCount", value);
    setWorkersCount(value);
    const currentSalary = form.getFieldValue(
      isTotalEditable ? "salary" : "perPersonSalary"
    );
    handleSalaryChange(currentSalary, value); // 使用最新的 value 参数
  };

  const memberOptions = [
    {
      label: "野人",
      value: "野人",
      key: -1,
    },
    ...members.map((member) => ({
      label: member.groupNickname,
      value: member.groupNickname,
      key: member.userId,
    })),
  ];

  return (
    <Modal
      title="打完收工"
      open={visible}
      onCancel={onClose}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onSubmit({
              ...values,
              workersCount,
              bossCount: 25 - workersCount,
            });
          })
          .catch((info) => {
            console.log("验证失败:", info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          salary: 0,
          perPersonSalary: 0,
          special_drops: [],
          workersCount: 20,
          blacklist: null,
        }}
      >
        <Form.Item label="金团工资">
          <Row gutter={8} align="middle">
            <Col span={10}>
              <Form.Item name="salary" noStyle>
                <InputNumber
                  addonBefore="金团"
                  addonAfter="金"
                  min={0}
                  style={{ width: "100%" }}
                  disabled={!isTotalEditable}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/,/g, "")}
                  onChange={handleSalaryChange}
                  onFocus={(e) => e.target.select()}
                  controls={false}
                />
              </Form.Item>
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              <Button
                icon={<SwapOutlined />}
                onClick={toggleSalaryMode}
                shape="circle"
              />
            </Col>
            <Col span={10}>
              <Form.Item name="perPersonSalary" noStyle>
                <InputNumber
                  addonBefore="人均"
                  addonAfter="金"
                  min={0}
                  style={{ width: "100%" }}
                  disabled={isTotalEditable}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/,/g, "")}
                  onChange={handleSalaryChange}
                  onFocus={(e) => e.target.select()}
                  controls={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item name="special_drops" label="特殊掉落">
          <div>
            {specialDrops.map((tag) => (
              <CheckableTag
                key={tag}
                checked={selectedTags.indexOf(tag) > -1}
                onChange={(checked) => handleTagChange(tag, checked)}
              >
                {tag}
              </CheckableTag>
            ))}
          </div>
        </Form.Item>

        <Form.Item label="分工资情况">
          <Row align="middle">
            <Col span={4}>
              <Text>打工: {workersCount}</Text>
            </Col>
            <Col span={16}>
              <Slider
                min={10}
                max={25}
                value={workersCount}
                onChange={handleWorkersCountChange} // 更新滑动条的回调
              />
            </Col>
            <Col span={4} style={{ textAlign: "right" }}>
              <Text>老板: {25 - workersCount}</Text>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item name="blacklist" label="黑本人">
          <AutoComplete
            allowClear
            showSearch
            placeholder="选择团员或直接输入"
            options={memberOptions}
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BoardContent = ({ team = {}, isAdmin }) => {
  const { teamId, title, teamTime, dungeons, rule, notice } = team;
  const {
    bookXuanjing,
    bookYuntie,
    isLock,
    isHidden,
    createTime,
    updateTime,
    createrNickname,
  } = team;

  let parsedRule = [];
  try {
    parsedRule = rule ? JSON.parse(rule) : [];
  } catch (error) {
    console.error("Failed to parse rule:", error);
    message.error("规则解析失败，已重置为默认值");
    parsedRule = [];
  }

  const [expanded, setExpanded] = useState(false);
  const [closeTeamVisible, setCloseTeamVisible] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = () => {
    if (isLock) {
      console.warn("报名已被锁定，无法报名！");
      return;
    }
    // ...报名逻辑...
  };

  const handleCloseTeam = () => {
    setCloseTeamVisible(true);
  };

  const handleCloseTeamSubmit = async (values) => {
    try {
      const res = await request.post("/team/closeTeam", {
        teamId: teamId,
        ...values,
      });

      if (res.code !== 0) {
        throw new Error(res.msg || "关闭开团失败");
      }

      message.success("已成功关闭开团");
      setCloseTeamVisible(false);

      navigate("/board");
    } catch (error) {
      message.error(error.message || "操作失败，请重试");
    }
  };

  return (
    <div className="board-content">
      <Flex justify="space-between" align="center">
        <div style={{ display: "flex", alignItems: "center" }}>
          {isLock && (
            <Avatar
              size={32}
              shape="square"
              src="/lock.svg"
              className="board-content-avatar"
            />
          )}
          <Space>
            <Title level={2} className="board-content-title">
              {title}
            </Title>
            {isHidden && (
              <Tag className="team-tag" color="#e66">
                仅管理员可见
              </Tag>
            )}
          </Space>
        </div>
        <Space>
          {isAdmin && (
            <Tooltip title="编辑开团">
              <Button
                shape="circle"
                icon={<EditOutlined />}
                onClick={() => navigate(`/board/edit/${teamId}`)}
              />
            </Tooltip>
          )}
          {isAdmin && (
            <Tooltip title="关闭开团">
              <Button
                shape="circle"
                icon={<CloseCircleOutlined />}
                onClick={handleCloseTeam}
              />
            </Tooltip>
          )}
          <Tooltip title={isLock ? "报名已被锁定" : ""}>
            <Button type="primary" disabled={isLock} onClick={handleSignUp}>
              报名
            </Button>
          </Tooltip>
        </Space>
      </Flex>
      <Paragraph>
        <pre>
          <Tag icon={<CompassOutlined />} className="team-tag" color="geekblue">
            {dungeons}
          </Tag>
          <Tag icon={<ClockCircleOutlined />} className="team-tag" color="cyan">
            {new Date(teamTime).toLocaleString()}
          </Tag>
          <Tag
            className="team-tag"
            icon={<img src="/玄晶.png" alt="玄晶" />}
            color={bookXuanjing ? "#f50" : "#5a0"}
          >
            {bookXuanjing ? "大铁已包" : "大铁可拍"}
          </Tag>
          <Tag
            className="team-tag"
            icon={<img src="/陨铁.png" alt="陨铁" />}
            color={bookYuntie ? "#f50" : "#5a0"}
          >
            {bookYuntie ? "小铁已包" : "小铁可拍"}
          </Tag>
          <blockquote>
            <Paragraph
              ellipsis={{
                rows: 3,
                expandable: "collapsible",
                expanded,
                onExpand: (_, info) => setExpanded(info.expanded),
              }}
            >
              {notice}
            </Paragraph>
          </blockquote>
          <div
            style={{
              textAlign: "right",
              fontSize: "12px",
              color: "#888",
            }}
          >
            由 {createrNickname || "未知"} 创建于{" "}
            {new Date(createTime).toLocaleString()}， 最后更新时间{" "}
            {new Date(updateTime).toLocaleString()}
          </div>
        </pre>
      </Paragraph>
      <SlotPanel rules={parsedRule} />
      <CloseTeamModal
        team={team}
        visible={closeTeamVisible}
        onClose={() => setCloseTeamVisible(false)}
        onSubmit={handleCloseTeamSubmit}
      />
    </div>
  );
};

const BoardLayoutSider = ({ isAdmin, teamList, teamId }) => {
  const navigate = useNavigate();

  const groupedTeams = teamList
    .sort((a, b) => new Date(a.teamTime) - new Date(b.teamTime))
    .reduce((acc, team) => {
      const dateKey = new Date(team.teamTime).toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(team);
      return acc;
    }, {});

  const menuItems = Object.entries(groupedTeams).map(([date, teams]) => ({
    key: date,
    label: (
      <Space>
        {date}
        <DateTag date={new Date(teams[0].teamTime)} />
      </Space>
    ),
    children: teams.map((team, index) => ({
      key: `${team.teamId}`,
      label: `第${index + 1}车`,
    })),
  }));

  const handleMenuClick = ({ key }) => {
    navigate(`/board/${key}`);
  };

  const defaultSelectedKey = String(teamId || (teamList[0]?.teamId ?? null));

  return (
    <div style={{ height: "100%" }}>
      {isAdmin && (
        <Button
          className="kaituan-button"
          type="primary"
          variant="link"
          icon={<AntDesignOutlined />}
          onClick={() => navigate("/board/edit")} // 修复导航路径
        >
          开 团
        </Button>
      )}

      <Menu
        mode="inline"
        defaultSelectedKeys={[defaultSelectedKey]}
        defaultOpenKeys={menuItems
          .filter((item) =>
            item.children.some((child) => child.key === defaultSelectedKey)
          )
          .map((item) => item.key)}
        items={menuItems}
        style={{ background: "#f6e0e0" }}
        inlineIndent={16}
        onClick={handleMenuClick}
      />
    </div>
  );
};

const Board = () => {
  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { teamId } = useParams();

  useEffect(() => {
    if (teamList.length === 0) {
      const fetchData = async () => {
        try {
          const teams = await fetchTeamList();
          setTeamList(teams);
          if (teams.length > 0 && !teamId) {
            navigate(`/board/${teams[0].teamId}`);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [teamId, navigate, teamList]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ height: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  const isAdmin = (() => {
    const { isSuperAdmin } = store.getState().user;
    const { role } = store.getState().guild;
    return isSuperAdmin || role === "owner" || role === "helper";
  })();

  const selectedTeam = teamList.find((team) => team.teamId == teamId);

  return (
    <Layout className="board-layout">
      <Sider className="board-layout-sider" width={250}>
        <BoardLayoutSider
          isAdmin={isAdmin}
          teamList={teamList}
          teamId={teamId}
        />
      </Sider>
      <Content className="board-layout-content">
        {selectedTeam ? (
          <BoardContent team={selectedTeam} isAdmin={isAdmin} />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Empty
              style={{}}
              description="最近没开团，别急，尊重夕阳红命运..."
            />
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Board;
