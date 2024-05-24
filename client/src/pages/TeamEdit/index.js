import React, { useEffect, useState } from "react";
import {
  Avatar,
  List,
  Space,
  Layout,
  Button,
  Card,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  AppstoreAddOutlined,
  FormOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { request } from "@/utils";
import Publish from "./Publish";
import store from "@/store";
import { useNavigate } from "react-router-dom";
import DateTag from "@/components/DateTag";
const dayjs = require("dayjs");

const { Text, Title } = Typography;
const { Header, Content, Sider } = Layout;

const TeamEdit = () => {
  const [activeTeam, setActiveTeam] = useState([]);
  useEffect(() => {
    const getActiveTeam = async () => {
      try {
        const res = await request.post("/getActiveTeam");
        setActiveTeam(res);
      } catch (err) {
        console.log(err);
      }
    };

    getActiveTeam();
  }, []);

  const navigate = useNavigate();

  const onPublishClick = async () => {
    navigate("/teamEdit/edit");
  };

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
        <h1>当前团队</h1>
        <Button
          icon={<AppstoreAddOutlined />}
          size="large"
          onClick={onPublishClick}
        >
          开团
        </Button>
      </Header>
      <Content>
        {/* 这里放数据展示组件 */}
        {/* 如：<YourDataDisplayComponent /> */}
        <List
          style={{
            height: "100%",
          }}
          size="large"
          // 数据超过10个则展示分页, 否则隐藏
          pagination={
            activeTeam.length > 10
              ? {
                  onChange: (page) => {
                    console.log(page);
                  },
                  pageSize: 10,
                  align: "center",
                }
              : false
          }
          dataSource={activeTeam}
          // footer={
          //   <div style={{ padding: "10px" }}>
          //     共有 {activeTeam.length} 个团队
          //   </div>
          // }
          renderItem={(item) => {
            return (
              <List.Item
                key={item.uuid}
                actions={[
                  <Button
                    icon={<FormOutlined />}
                    onClick={() => {
                      navigate("/teamEdit/edit", { state: { team: item } });
                    }}
                  >
                    编辑
                  </Button>,
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      try {
                        request
                          .post("/closeTeam", {
                            uuid: item.uuid,
                          })
                          .then((res) => {
                            message.success(res.message);
                            setActiveTeam(activeTeam.filter((t) => t !== item));
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
                    结束
                  </Button>,
                ]}
              >
                <Space>
                  <DateTag date={item.team_time} />
                  <div style={{ fontSize: "1.5rem" }}>
                    {
                      // 格式：日期(x月x日) - 标题 - 时间(时:分)
                      `${dayjs(item.team_time).format("MM月DD日")} - ${
                        item.title
                      } - ${dayjs(item.team_time).format("HH:mm")}`
                    }
                  </div>
                </Space>
              </List.Item>
            );
          }}
        />
      </Content>
    </Layout>
  );
};

export default TeamEdit;
