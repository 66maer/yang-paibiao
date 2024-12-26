import React, { useState, useEffect } from "react";
import { Flex, Layout, Menu, Space, Button, Avatar, Spin } from "antd";
import { request } from "@/utils/request";
import SlotCard from "@/components/SlotCard";

const { Header, Content, Footer, Sider } = Layout;

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
      key: "1226",
      label: "2024年12月26日",
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
      key: "1227",
      label: "2024年12月27日",
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
      <Sider>
        <Menu
          mode="inline"
          defaultSelectedKeys={["122602"]}
          defaultOpenKeys={["1226"]}
          style={{
            background: "#f6e0e0",
            height: "100%",
          }}
          items={items}
        />
      </Sider>
      <Content
        style={{
          background: "#f6eaea",
          padding: 24,
        }}
      >
        <SlotCard />
      </Content>
    </Layout>
  );
};

export default Board;
