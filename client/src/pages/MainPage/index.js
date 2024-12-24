import React from "react";
import { Flex, Layout, Menu, Space, Button, Avatar } from "antd";

const { Header, Content, Footer, Sider } = Layout;

const MainPage = () => {
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
          >
            <Menu.Item key="1">nav 1</Menu.Item>
            <Menu.Item key="2">nav 2</Menu.Item>
            <Menu.Item key="3">nav 3</Menu.Item>
          </Menu>
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
