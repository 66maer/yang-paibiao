// App.js
import React, { useEffect, useState } from "react";
import { Layout, Button, Space, message, Avatar } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { removeLocalToken, request } from "@/utils";
import store from "@/store";
import { setRole } from "@/store/modules/league";
import { setUserInfo } from "@/store/modules/user";
import { ConfigProvider, Menu } from "antd";
import menuConfig from "./MenuConfig";
import zhCN from "antd/locale/zh_CN";

const { Header, Content, Sider, Footer } = Layout;

const App = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    document.title = "小秧排表 - 花眠";
    const link = document.querySelector("link[rel*='icon']");
    link.href = "/logo.png";

    const getItems = async () => {
      try {
        const res = await request.post("/getUserInfo");
        store.dispatch(setRole(res.role));
        store.dispatch(setUserInfo({ id: res.id, nickname: res.nickname }));
        const userRole = res.role;

        // 筛选Items, 仅返回key, label, icon
        const filteredItems = menuConfig
          .filter((item) => {
            if (item.disabled) {
              return false;
            }
            if (item.admin) {
              return userRole === "leader" || userRole === "assistant";
            }
            return true;
          })
          .map((item) => {
            return {
              key: item.key,
              label: item.label,
              icon: item.icon,
              style: {
                height: 64,
                fontSize: 18,
              },
            };
          });

        setItems(filteredItems);
      } catch (err) {
        const { response } = err;
        if (response) {
          message.error(response.data.message);
        } else {
          message.error("网络错误");
        }
      }
    };

    getItems();
  }, []);

  const curSelectedKey = window.location.pathname.split("/")[1];

  const onMenuClick = (route) => {
    navigate(route.key);
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: { colorPrimary: "#ec9bad" },
        components: {
          Layout: {
            headerBg: "#dc8b9d",
            footerBg: "#dc8b9d",
            footerPadding: "5px 50px",
          },
          Menu: {
            itemSelectedBg: "#f0c9cf",
            itemSelectedColor: "#c04851",
            itemBg: "#ec9bad",
          },
        },
      }}
    >
      <Layout style={{ height: "100vh" }}>
        <Header style={{ display: "flex", height: 80 }}>
          <div className="logo">
            <img
              src="/logo-title.png"
              alt="logo"
              style={{ marginTop: 8, width: 312, height: 64 }}
            />
          </div>
          <Space style={{ marginLeft: "auto" }}>
            <Avatar size="large" gap={1}>
              头像
            </Avatar>
            <div style={{ color: "#fff", fontSize: 18 }}>
              {store.getState().user.nickname}
            </div>
            <Button
              onClick={() => {
                removeLocalToken();
                navigate("/login");
              }}
            >
              退出登录
            </Button>
          </Space>
        </Header>
        <Layout>
          <Sider>
            <Menu
              mode="inline"
              defaultSelectedKeys={curSelectedKey}
              onClick={onMenuClick}
              style={{ height: "100%", borderRight: 0 }}
              items={items}
            />
          </Sider>
          <Layout>
            <Content
              style={{
                background: "#e6d2d5",
                padding: 24,
                margin: 0,
                minHeight: 280,
                minWidth: 1120,
              }}
            >
              <Outlet />
            </Content>
          </Layout>
        </Layout>
        <Footer
          style={{
            textAlign: "center",
          }}
        >
          <a href="https://beian.miit.gov.cn/" target="_blank">
            小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1
          </a>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};
export default App;
