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
} from "antd";
import { request } from "@/utils/request";
import SlotCard from "@/components/SlotCard";
import DateTag from "../../components/DateTag";
import "./index.scss";
import SlotPanel from "../../components/SlotPanel";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const fetchTeamList = async () => {
  const res = await request.get("/team/list");
  console.log(res);
  if (res.code !== 0) {
    throw new Error(res.message);
  }
  return res.data;
};

const BoardContent = (team) => {
  const { id, title, teamTime, dungeons, role, notice } = team;
  const { bookXuanjing, bookYuntie, isLock, crateTime, updateTime } = team;
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
            date={new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}
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

  return (
    <Layout
      style={{
        height: "100%",
      }}
    >
      <Sider style={{ overflow: "auto" }}>
        <Menu
          className="board-menu"
          mode="inline"
          defaultSelectedKeys={["122602"]}
          defaultOpenKeys={["1227"]}
          style={{
            background: "#f6e0e0",
            height: "100%",
          }}
          items={items}
          inlineIndent={16}
        />
      </Sider>
      <Content
        style={{
          background: "#f6eaea",
          padding: 24,
          overflow: "auto", // 添加此行
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Title>12月27日 第二车</Title>
          <Space>
            发车时间: 20:00
            <Avatar>玄晶</Avatar>
            <Avatar>陨铁</Avatar>
          </Space>
          <br />
          <SlotPanel />
        </div>
      </Content>
    </Layout>
  );
};

export default Board;
