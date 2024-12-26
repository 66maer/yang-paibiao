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
            content: "Board",
        },
        {
            key: "edit",
            label: "看板编辑",
            icon: <InsertRowAboveOutlined />,
            allowedRoles: ["admin"],
            content: "Edit",
        }
    ];

    const filteredMenu = menu.filter(item => {
        if (!item.allowedRoles || item.allowedRoles.includes(role) || isSuperAdmin) {
            return true;
        }
        return false;
    });

    return filteredMenu;
}

export default menuConfig;