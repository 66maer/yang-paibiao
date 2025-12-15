import React, { useState, useEffect } from "react";
import { Flex, Card, Layout, Menu, Space, Button, Avatar, message, Spin, Popover, Modal, Form, Input, Tag } from "antd";
import menuConfig from "./MenuConfig";
import store from "@/store";
import { fetchUserInfo, fetchLogout, fetchChangePassword, fetchChangeUserInfo } from "@/store/modules/user";
import { fetchGetLeagueRole } from "../../store/modules/guild";
import { Outlet, useNavigate } from "react-router-dom";
import { LockOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { request } from "@/utils/request";

const { Header, Content, Footer, Sider } = Layout;

const UserModal = ({ title, visible, onOk, onCancel, confirmLoading, form, children }) => (
  <Modal
    title={title}
    open={visible}
    confirmLoading={confirmLoading}
    onOk={onOk}
    onCancel={onCancel}
    okText="确认"
    cancelText="取消"
    destroyOnClose
  >
    <Form form={form} layout="vertical">
      {children}
    </Form>
  </Modal>
);

const UserPannel = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [groupNicknameModalVisible, setGroupNicknameModalVisible] = useState(false);

  const guildState = store.getState().guild;
  const { name: guildName, role } = guildState;
  const [groupNickname, setGroupNickname] = useState(guildState.groupNickname);

  const handleSubmit = async (action, onSuccess) => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      await action(values);
      message.success("操作成功");
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.msg || "操作失败";
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (values) => {
    const userId = store.getState().user.userId;
    const qqNumber = store.getState().user.qqNumber;
    const changePasswordRequest = {
      userId,
      qqNumber,
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    };
    return store.dispatch(fetchChangePassword(changePasswordRequest));
  };

  const handleNicknameChange = (values) => {
    const userId = store.getState().user.userId;
    const qqNumber = store.getState().user.qqNumber;
    const changeUserInfoRequest = {
      userId,
      qqNumber,
      nickname: values.newNickname,
    };
    return store.dispatch(fetchChangeUserInfo(changeUserInfoRequest));
  };

  const handleGroupNicknameChange = async (values) => {
    try {
      const guildId = guildState.guildId;
      const userId = store.getState().user.userId;
      const res = await request.post("/guild/updateGuildMember", {
        guildId,
        userId,
        groupNickname: values.newGroupNickname,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      message.success("群昵称更新成功");
      setGroupNickname(values.newGroupNickname);
      store.dispatch(fetchGetLeagueRole(userId));
    } catch (err) {
      message.error(err.message || "群昵称更新失败");
    }
  };

  return (
    <>
      <Space>
        <Popover
          trigger="click"
          content={
            <Flex vertical gap="small">
              <Flex>团名：{guildName}</Flex>
              <Flex>群昵称：{groupNickname}</Flex>
              <Flex>
                权限：
                <Tag color={role === "owner" ? "gold" : role === "helper" ? "blue" : "green"}>
                  {role === "owner" ? "群主" : role === "helper" ? "管理员" : "群员"}
                </Tag>
              </Flex>
              <Button onClick={() => setGroupNicknameModalVisible(true)}>修改群昵称</Button>
            </Flex>
          }
        >
          <Flex vertical style={{ cursor: "pointer", lineHeight: "100%" }} gap="small" align="center">
            <div style={{ fontWeight: "bold" }}>{guildName}</div>
            <div>{groupNickname}</div>
          </Flex>
        </Popover>
        <Popover
          trigger="click"
          content={
            <Flex vertical gap="small">
              <Button onClick={() => setNicknameModalVisible(true)}>修改昵称</Button>

              <Button onClick={() => setPasswordModalVisible(true)}>修改密码</Button>
              <Button
                onClick={() => {
                  store.dispatch(fetchLogout());
                  navigate("/login");
                }}
              >
                退出登录
              </Button>
            </Flex>
          }
        >
          <Avatar size={40}>{store.getState().user.nickname}</Avatar>
        </Popover>
      </Space>
      <UserModal
        title="修改密码"
        visible={passwordModalVisible}
        confirmLoading={isSubmitting}
        form={form}
        onOk={() => handleSubmit(handlePasswordChange, () => setPasswordModalVisible(false))}
        onCancel={() => {
          setPasswordModalVisible(false);
          form.resetFields();
        }}
      >
        <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: "请输入当前密码" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
        </Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: "请输入新密码" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "请确认新密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" />
        </Form.Item>
      </UserModal>
      <UserModal
        title="修改昵称"
        visible={nicknameModalVisible}
        confirmLoading={isSubmitting}
        form={form}
        onOk={() => handleSubmit(handleNicknameChange, () => setNicknameModalVisible(false))}
        onCancel={() => {
          setNicknameModalVisible(false);
          form.resetFields();
        }}
      >
        <Form.Item
          name="newNickname"
          label="新昵称"
          rules={[
            { required: true, message: "请输入新昵称" },
            { max: 6, message: "昵称最长6个字符" },
            { min: 1, message: "昵称最短1个字符" },
          ]}
        >
          <Input prefix={<LockOutlined />} placeholder="新昵称" />
        </Form.Item>
      </UserModal>
      <UserModal
        title="修改群昵称"
        visible={groupNicknameModalVisible}
        confirmLoading={isSubmitting}
        form={form}
        onOk={() => handleSubmit(handleGroupNicknameChange, () => setGroupNicknameModalVisible(false))}
        onCancel={() => {
          setGroupNicknameModalVisible(false);
          form.resetFields();
        }}
      >
        <Form.Item
          name="newGroupNickname"
          label="新群昵称"
          rules={[
            { required: true, message: "请输入新群昵称" },
            { max: 6, message: "群昵称最长6个字符" },
            { min: 1, message: "群昵称最短1个字符" },
          ]}
        >
          <Input placeholder="新群昵称" />
        </Form.Item>
      </UserModal>
    </>
  );
};

const MainPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const currentPath = window.location.pathname.split("/")[1] || "board";

  useEffect(() => {
    const fetchData = async () => {
      try {
        await store.dispatch(fetchUserInfo());
        if (!store.getState().user.userId) {
          message.error("未获取到用户信息，请重新登录");
          navigate("/login");
          return;
        }
      } catch (err) {
        message.error("获取用户信息失败，请重新登录");
        navigate("/login");
        return;
      }
      try {
        await store.dispatch(fetchGetLeagueRole(store.getState().user.userId));
        const isSuperAdmin = store.getState().user.isSuperAdmin;
        const role = store.getState().guild.role;
        setItems(menuConfig(role, isSuperAdmin));
      } catch (err) {
        message.error(err.message);
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

  const onMenuClick = (item) => {
    navigate(item.key);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ height: 64, display: "flex" }}>
        <Flex align="center" gap="large" style={{ width: "100%", height: "100%" }}>
          <img src="/logo-title.png" alt="logo" draggable="false" style={{ marginTop: 4, width: 234, height: 48 }} />
          <Menu
            mode="horizontal"
            defaultSelectedKeys={[currentPath]}
            onClick={onMenuClick}
            style={{
              flex: 1,
              minWidth: 0,
            }}
            items={items}
          />
          <Space style={{ marginLeft: "auto" }}>
            <UserPannel />
          </Space>
        </Flex>
      </Header>
      <Content
        style={{
          padding: 20,
          display: "flex",
          justifyContent: "center",
          overflow: "auto", // 添加溢出滚动
          flex: 1, // 让Content区域填充可用空间
          height: 0, // 这是Flex布局中使用overflow的技巧
        }}
      >
        <div style={{ width: "100%", maxWidth: "1300px" }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1
      </Footer>
    </Layout>
  );
};

export default MainPage;
