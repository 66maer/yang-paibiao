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

const menuConfig = [
  {
    key: "teamBoard",
    label: "开团看板",
    icon: <InsertRowAboveOutlined />,
  },
  {
    key: "teamEdit",
    label: "编辑团队",
    icon: <ProductOutlined />,
    admin: true,
  },
  {
    key: "teamTemplete",
    label: "团队模板",
    icon: <SnippetsOutlined />,
    admin: true,
  },
  {
    key: "manageLeague",
    label: "管理团员",
    icon: <AppstoreAddOutlined />,
    admin: true,
    disabled: true,
  },
  {
    key: "userCharacter",
    label: "我的角色",
    icon: <UserOutlined />,
    disabled: true,
  },
  {
    key: "careerHistory",
    label: "生涯记录",
    icon: <UserOutlined />,
    disabled: true,
  },
  {
    key: "teamHistory",
    label: "开团记录",
    icon: <UserOutlined />,
    disabled: true,
  },
  {
    key: "version",
    label: "版本信息",
    icon: <CloudSyncOutlined />,
  },
];

export default menuConfig;
