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

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title, Paragraph } = Typography;

const fetchTeamList = async () => {
  try {
    const res = await request.post("/team/listTeams", {
      guildId: store.getState().guild.guildId,
      includeClose: false,
      page: 0,
      pageSize: 100,
    });
    if (res.code !== 0) {
      throw new Error(res.message);
    }
    return res.data.teams;
  } catch (error) {
    console.error("Failed to fetch team list:", error);
    return [];
  }
};

const BoardContent = ({ team = {}, isAdmin }) => {
  const { id, title, teamTime, dungeons, rule, notice } = team;
  const { bookXuanjing, bookYuntie, isLock, crateTime, updateTime } = team;
  const [expanded, setExpanded] = useState(false);

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
          </Space>
        </div>
        <Space>
          {isAdmin && <Button shape="circle" icon={<EditOutlined />} />}
          {isAdmin && <Button shape="circle" icon={<CloseCircleOutlined />} />}
          <Button type="primary">报名</Button>
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
            {bookXuanjing ? "大铁已包" : "大铁尚在"}
          </Tag>
          <Tag
            className="team-tag"
            icon={<img src="/陨铁.png" alt="陨铁" />}
            color={bookYuntie ? "#f50" : "#5a0"}
          >
            {bookYuntie ? "小铁已包" : "小铁尚在"}
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
        </pre>
      </Paragraph>
      <SlotPanel />
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
  }, [teamId, navigate]);

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
