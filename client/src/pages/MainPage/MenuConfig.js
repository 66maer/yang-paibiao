import React from "react";
import {
  InsertRowAboveOutlined,
  AppstoreOutlined,
  UserOutlined,
  AppstoreAddOutlined,
  ProductOutlined,
  SnippetsOutlined,
  CloudSyncOutlined,
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
