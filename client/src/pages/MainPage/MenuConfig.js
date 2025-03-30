import React from "react";
import {
  InsertRowAboveOutlined,
  AppstoreOutlined,
  UserOutlined,
  AppstoreAddOutlined,
  ProductOutlined,
  SnippetsOutlined,
  CloudSyncOutlined,
  CoffeeOutlined,
} from "@ant-design/icons";

const menuConfig = (role, isSuperAdmin) => {
  const menu = [
    {
      key: "board",
      label: "开团看板",
      icon: <InsertRowAboveOutlined />,
      content: "board",
    },
    {
      key: "members",
      label: "成员管理",
      icon: <UserOutlined />,
      allowedRoles: ["owner"],
      content: "members",
    },
    {
      key: "characters",
      label: "我的角色",
      icon: <CoffeeOutlined />,
      content: "characters",
    },
    {
      key: "team-template",
      label: "开团模板",
      icon: <ProductOutlined />,
      allowedRoles: ["owner", "helper"],
      content: "team-template",
    },
    {
      key: "history-teams",
      label: "历史开团",
      icon: <SnippetsOutlined />,
      content: "history-teams",
    },
  ];

  const filteredMenu = menu.filter((item) => {
    if (
      !item.allowedRoles ||
      item.allowedRoles.includes(role) ||
      isSuperAdmin
    ) {
      return true;
    }
    return false;
  });

  return filteredMenu;
};

export default menuConfig;
