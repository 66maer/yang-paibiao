import React, { useState, useEffect } from "react";
import { Flex, Layout, Menu, Space, Button, Avatar, Spin } from "antd";
import { request } from "@/utils/request";

const { Header, Content, Footer, Sider } = Layout;

const fetchTeamList = async () => {
    const res = await request.get("/team/list");
    console.log(res);
    if (res.code !== 0) {
        throw new Error(res.message);
    }
    return res.data;
};

const Board = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchTeamList();
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
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
        <Layout>
            <Content>Board666</Content>
        </Layout>
    );



}

export default Board;