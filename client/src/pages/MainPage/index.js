import React, { useState, useEffect } from "react";
import {
  Flex,
  Layout,
  Menu,
  Space,
  Button,
  Avatar,
  message,
  Spin,
  Popover,
  Modal,
  Form,
  Input,
} from "antd";
import menuConfig from "./MenuConfig";
import store from "@/store";
import {
  fetchUserInfo,
  fetchLogout,
  fetchChangePassword,
  fetchChangeUserInfo,
} from "@/store/modules/user";
import { fetchGetLeagueRole } from "../../store/modules/guild";
import { Outlet, useNavigate } from "react-router-dom";
import { LockOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Header, Content, Footer, Sider } = Layout;

const UserModal = ({
  title,
  visible,
  onOk,
  onCancel,
  confirmLoading,
  form,
  children,
}) => (
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

  const handleSubmit = async (action, onSuccess) => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      await action(values);
      message.success("操作成功");
      form.resetFields();
      if (onSuccess) onSuccess(); // 成功时执行回调关闭弹窗
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "操作失败";
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

  return (
    <>
      <Popover
        trigger="click"
        content={
          <Flex vertical gap="small">
            <Flex justify="center">{store.getState().user.qqNumber}</Flex>
            <Button onClick={() => setNicknameModalVisible(true)}>
              修改昵称
            </Button>
            <Button onClick={() => setPasswordModalVisible(true)}>
              修改密码
            </Button>
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

      <UserModal
        title="修改密码"
        visible={passwordModalVisible}
        confirmLoading={isSubmitting}
        form={form}
        onOk={() =>
          handleSubmit(handlePasswordChange, () =>
            setPasswordModalVisible(false)
          )
        }
        onCancel={() => {
          setPasswordModalVisible(false);
          form.resetFields();
        }}
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[{ required: true, message: "请输入当前密码" }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[{ required: true, message: "请输入新密码" }]}
        >
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
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="再次输入密码"
          />
        </Form.Item>
      </UserModal>

      <UserModal
        title="修改昵称"
        visible={nicknameModalVisible}
        confirmLoading={isSubmitting}
        form={form}
        onOk={() =>
          handleSubmit(handleNicknameChange, () =>
            setNicknameModalVisible(false)
          )
        }
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
        await store.dispatch(fetchGetLeagueRole(store.getState().user.userId));
        const isSuperAdmin = store.getState().user.isSuperAdmin;
        const role = store.getState().guild.role;
        setItems(menuConfig(role, isSuperAdmin));
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false); // 数据获取完成后设置 loading 为 false
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
      <Header>
        <Flex align="center" gap="large">
          <img
            src="/logo-title.png"
            alt="logo"
            draggable="false"
            style={{ marginTop: 4, width: 234, height: 48 }}
          />
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
