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

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title, Paragraph } = Typography;

const fetchTeamList = async () => {
  const res = await request.get("/team/list");
  console.log(res);
  if (res.code !== 0) {
    throw new Error(res.message);
  }
  return res.data;
};

const teamList = [
  {
    id: "1",
    title: "12月27日 第一车",
    teamTime: "20:00",
    dungeons: "英雄一之窟",
    rule: "规则",
    notice: "这是公告，",
    bookXuanjing: false,
    bookYuntie: true,
    isLock: false,
    crateTime: "2021-12-27T12:00:00",
    updateTime: "2021-12-27T12:00:00",
  },
];

const items = [
  {
    key: "1227",
    label: (
      <Space>
        12月27日
        <DateTag date={new Date()} />
      </Space>
    ),
    children: [
      {
        key: "122601",
        label: "第一车",
      },
      {
        key: "122602",
        label: "第二车",
      },
      {
        key: "122603",
        label: "第三车",
      },
    ],
  },
  {
    key: "1228",
    label: (
      <Space>
        12月28日
        <DateTag
          date={new Date(new Date().getTime() + -3 * 24 * 60 * 60 * 1000)}
        />
      </Space>
    ),
    children: [
      {
        key: "122701",
        label: "第一车",
      },
      {
        key: "122702",
        label: "第二车",
      },
      {
        key: "122703",
        label: "第三车",
      },
    ],
  },
];

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
            {teamTime}
          </Tag>
          <Tag
            className="team-tag"
            icon={<img src={"玄晶.png"} alt="玄晶" />}
            color={bookXuanjing ? "#f50" : "#5a0"}
          >
            {bookXuanjing ? "大铁已包" : "大铁尚在"}
          </Tag>
          <Tag
            className="team-tag"
            icon={<img src={"陨铁.png"} alt="陨铁" />}
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
              {notice.repeat(200)}
            </Paragraph>
          </blockquote>
        </pre>
      </Paragraph>
      <SlotPanel />
    </div>
  );
};

const BoardLayoutSider = ({ isAdmin }) => {
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
        defaultSelectedKeys={["122602"]}
        defaultOpenKeys={["1227"]}
        items={items}
        style={{ background: "#f6e0e0" }}
        inlineIndent={16}
      />
    </div>
  );
};

const Board = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTeamList();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(false);
    //fetchData();
  }, []);

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
    console.log(isSuperAdmin, role);
    return true;
    return isSuperAdmin || role === "admin" || role === "assistant";
  })();

  return (
    <Layout className="board-layout">
      <Sider className="board-layout-sider" width={250}>
        <BoardLayoutSider isAdmin={isAdmin} />
      </Sider>
      <Content className="board-layout-content">
        <BoardEditContent team={teamList[0]} isAdmin={isAdmin} />
      </Content>
    </Layout>
  );
};

export default Board;
