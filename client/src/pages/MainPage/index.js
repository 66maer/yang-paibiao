import React, { useState, useEffect } from "react";
import { Flex, Layout, Menu, Space, Button, Avatar } from "antd";
import menuConfig from "./MenuConfig";
import store from "@/store";

const { Header, Content, Footer, Sider } = Layout;


const MainPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    store.dispatch(fetchUserInfo(values));
    const user = store.getState().user;
    console.log(user);
  }, [])



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
