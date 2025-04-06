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
} from "@ant-design/icons";
import store from "@/store";
import BoardEditContent from "./edit";
import { useNavigate, useParams } from "react-router-dom";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";
import CloseTeamModal from "./close"; // 导入 closeTeam 函数
import SignupModal from "./singup";
import SlotAllocate from "@/components/SlotAllocate"; // 导入 SlotAllocate 函数

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title, Paragraph } = Typography;

const fetchTeamList = async () => {
  try {
    const res = await request.post("/team/listTeams", {
      guildId: store.getState().guild.guildId,
      filter: "only_open",
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

export const fetchSignupsByTeam = async (teamId) => {
  try {
    const res = await request.post("/signup/getSignupsByTeam", {
      teamId,
    });
    if (res.code === 0) {
      return res.data.signups.map((signup) => {
        const parsedSignupInfo = (() => {
          try {
            return JSON.parse(signup.signupInfo || "{}");
          } catch (error) {
            console.error("Failed to parse signupInfo:", error);
            return {};
          }
        })();
        return { ...signup, ...parsedSignupInfo };
      });
    } else {
      throw new Error(res.msg || "获取报名列表失败");
    }
  } catch (error) {
    console.error("Failed to fetch signups:", error);
    return [];
  }
};

const BoardContent = ({ team = {}, isAdmin, refreshTeamList }) => {
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
  const [signupVisible, setSignupVisible] = useState(false);
  const [signupList, setSignupList] = useState([]);
  const [slotMemberList, setSlotMemberList] = useState([]);
  const navigate = useNavigate();

  const refreshSignupList = async () => {
    const signups = await fetchSignupsByTeam(teamId);
    const [slotMemberList, candidateList] = SlotAllocate(parsedRule, signups);
    setSignupList(signups);
    setSlotMemberList(slotMemberList);
  };

  const handleSignUp = () => {
    if (isLock) {
      console.warn("报名已被锁定，无法报名！");
      return;
    }
    setSignupVisible(true);
  };

  const handleCloseTeam = () => {
    setCloseTeamVisible(true);
  };

  useEffect(() => {
    refreshSignupList();
  }, [teamId]);

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
      <SlotPanel rules={parsedRule} signup_infos={slotMemberList} />
      <CloseTeamModal
        team={team}
        visible={closeTeamVisible}
        onClose={() => {
          setCloseTeamVisible(false);
          refreshTeamList();
        }}
      />
      <SignupModal
        visible={signupVisible}
        onClose={() => setSignupVisible(false)}
        teamId={teamId}
        refreshSignupList={refreshSignupList}
        signupList={signupList}
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
    children: teams.map((team) => ({
      key: `${team.teamId}`,
      label: `${new Date(team.teamTime).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })} ${team.dungeons}`,
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

  const refreshTeamList = async () => {
    try {
      const teams = await fetchTeamList();
      setTeamList(teams);
      if (
        teams.length > 0 &&
        (!teamId || !teams.some((team) => team.teamId == teamId))
      ) {
        navigate(`/board/${teams[0].teamId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (teamList.length === 0) {
      const fetchData = async () => {
        await refreshTeamList();
        setLoading(false);
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
          <BoardContent
            team={selectedTeam}
            isAdmin={isAdmin}
            refreshTeamList={refreshTeamList} // 传递刷新函数
          />
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
