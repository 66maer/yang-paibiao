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
  DiffOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { EditPanel } from "@/components/TeamPanel";
import { useNavigate } from "react-router-dom";
import { request } from "@/utils";
import { store } from "@/store";

const { Text, Title } = Typography;
const { Header, Content, Sider } = Layout;

const TeamTemplete = () => {
  const teamTp = store.getState().teamTemplete.teamTemplete;
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
        <Button icon={<DiffOutlined />} size="large">
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
            teamTp.length > 10
              ? {
                  onChange: (page) => {
                    console.log(page);
                  },
                  pageSize: 10,
                  align: "center",
                }
              : false
          }
          dataSource={teamTp}
          renderItem={(item) => {
            return (
              <List.Item
                key={item.name}
                actions={[
                  <Button
                    icon={<FormOutlined />}
                    onClick={() => {
                      navigate("/teamTemplete/edit", {
                        state: { teamTp: item },
                      });
                    }}
                  >
                    编辑
                  </Button>,
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      try {
                        request
                          .post("/closeTeam", {
                            uuid: item.uuid,
                          })
                          .then((res) => {
                            message.success(res.message);
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
                    删除
                  </Button>,
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
