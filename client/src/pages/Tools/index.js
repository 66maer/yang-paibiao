import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu } from "antd";
import { CalculatorOutlined, ToolOutlined } from "@ant-design/icons";

const { Sider, Content } = Layout;

const Tools = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前选中的工具路径
  const selectedKey = location.pathname.split("/")[2] || "subsidy-calculator";

  // 工具列表
  const toolItems = [
    {
      key: "subsidy-calculator",
      icon: <CalculatorOutlined />,
      label: "补贴计算器",
    },
    // 未来可以在这里添加更多工具
  ];

  // 菜单点击处理
  const handleMenuClick = ({ key }) => {
    navigate(`/tools/${key}`);
  };

  return (
    <Layout style={{ height: "100%" }}>
      <Sider width={200} theme="light" style={{ background: " #f6e0e0" }}>
        <div style={{ padding: "16px 0" }}>
          <h3 style={{ textAlign: "center", margin: "0 0 16px 0" }}>
            <ToolOutlined /> 小工具
          </h3>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={toolItems}
            onClick={handleMenuClick}
            style={{ background: "#f6e0e0" }}
          />
        </div>
      </Sider>
      <Content style={{ padding: 24, minHeight: 280, background: "#f6eaea" }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default Tools;
