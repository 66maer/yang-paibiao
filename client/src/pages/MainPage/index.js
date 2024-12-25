import React, { useState, useEffect } from "react";
import { Flex, Layout, Menu, Space, Button, Avatar, message, Spin } from "antd"; // 添加 Spin 组件
import menuConfig from "./MenuConfig";
import store from "@/store";
import { fetchUserInfo } from "@/store/modules/user";

const { Header, Content, Footer, Sider } = Layout;

const MainPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // 添加 loading 状态

  useEffect(() => {
    const fetchData = async () => {
      try {
        await store.dispatch(fetchUserInfo());
        const user = store.getState().user;
        console.log(user);
        // 根据用户权限设置菜单项
        //setItems(menuConfig(user.permissions));
      } catch (err) {
        console.error(err);
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
            defaultSelectedKeys={["2"]}
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
      <Content>Content</Content>
      <Footer style={{ textAlign: "center" }}>
        小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1
      </Footer>
    </Layout>
  );
};

export default MainPage;
