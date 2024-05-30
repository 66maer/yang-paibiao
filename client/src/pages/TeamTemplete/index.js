import {
  Avatar,
  List,
  Space,
  Layout,
  Button,
  Card,
  Typography,
  Popconfirm,
  message,
} from "antd";
import {
  EditOutlined,
  AppstoreAddOutlined,
  FormOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { EditPanel } from "@/components/TeamPanel";
import { useNavigate } from "react-router-dom";
import { request } from "@/utils";
import { store } from "@/store";
import { fetchTeamTemplete } from "@/store/modules/teamTemplete";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const { Text, Title } = Typography;
const { Header, Content, Sider } = Layout;

const TeamTemplete = () => {
  const teamTemplete = useSelector((state) => state.teamTemplete.teamTemplete);

  useEffect(() => {
    store.dispatch(fetchTeamTemplete());
  }, []);

  const navigate = useNavigate();
  return (
    <Layout>
      <Header
        style={{
          backgroundColor: "#e6d2d5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0",
        }}
      >
        <h1>团队模板</h1>
        <Button
          icon={<DiffOutlined />}
          size="large"
          onClick={() => {
            navigate("/teamTemplete/edit");
          }}
        >
          新模板
        </Button>
      </Header>
      <Content>
        <List
          style={{
            height: "100%",
          }}
          size="large"
          // 数据超过10个则展示分页, 否则隐藏
          pagination={
            teamTemplete.length > 10
              ? {
                  onChange: (page) => {
                    console.log(page);
                  },
                  pageSize: 10,
                  align: "center",
                }
              : false
          }
          dataSource={teamTemplete}
          renderItem={(item) => {
            return (
              <List.Item
                key={item.name}
                actions={[
                  <Button
                    icon={<FormOutlined />}
                    onClick={() => {
                      navigate("/teamTemplete/edit", {
                        state: { team: item },
                      });
                    }}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定删除该模板吗?"
                    description="删除后不可恢复"
                    onConfirm={() => {
                      try {
                        request
                          .post("/deleteTeamTemplete", {
                            name: item.name,
                          })
                          .then((res) => {
                            message.success(res.message);
                            store.dispatch(fetchTeamTemplete());
                            //setActiveTeam(activeTeam.filter((t) => t !== item));
                          });
                      } catch (err) {
                        const { response } = err;
                        if (response) {
                          message.error(response.data.message);
                        } else {
                          message.error("网络错误");
                        }
                      }
                    }}
                  >
                    <Button icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>,
                ]}
              >
                <Space>
                  <div style={{ fontSize: "1.5rem" }}>{item.name}</div>
                </Space>
              </List.Item>
            );
          }}
        />
      </Content>
    </Layout>
  );
};

export default TeamTemplete;
