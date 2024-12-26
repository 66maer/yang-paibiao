import React, { useState, useEffect } from "react";
import { Flex, Layout, Menu, Space, Button, Avatar, message, Spin } from "antd";
import menuConfig from "./MenuConfig";
import store from "@/store";
import { fetchUserInfo } from "@/store/modules/user";
import { fetchGetLeagueRole } from "../../store/modules/guild";
import { Outlet, useNavigate } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;

const MainPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const currentPath = window.location.pathname.split("/")[1] || "board";


  useEffect(() => {
    const fetchData = async () => {
      try {
        await store.dispatch(fetchUserInfo());
        await store.dispatch(fetchGetLeagueRole());
        const isSuperAdmin = store.getState().user.isSuperAdmin;
        const role = store.getState().guild.role;
        setItems(menuConfig(role, isSuperAdmin));
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false); // 数据获取完成后设置 loading 为 false
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ height: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  const onMenuClick = (item) => {
    navigate(item.key);
  }

  return (
    <Layout style={{ height: "100vh" }}>
      <Header>
        <Flex align="center" gap="large">
          <img
            src="/logo-title.png"
            alt="logo"
            draggable="false"
            style={{ marginTop: 4, marginLeft: -30, width: 234, height: 48 }}
          />
          <Menu
            mode="horizontal"
            defaultSelectedKeys={[currentPath]}
            onClick={onMenuClick}
            style={{
              flex: 1,
              minWidth: 0,
            }}
            items={items}
          />
          <Space style={{ marginLeft: "auto" }}>
            <Avatar>头像</Avatar>
            <Button>退出登录</Button>
          </Space>
        </Flex>
      </Header>
      <Content style={{
        padding: 20,
      }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: "center" }}>
        小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1
      </Footer>
    </Layout>
  );
};

export default MainPage;
