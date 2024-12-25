import React from "react";
import { Flex, Layout, Menu, Space, Button, Avatar } from "antd";

const { Header, Content, Footer, Sider } = Layout;

const Board = () => {

    return (
        <Layout>
            <Sider>
                <Menu>
                    <Menu.Item>Board</Menu.Item>
                </Menu>
            </Sider>
            <Content>Board</Content>
        </Layout>
    );



}