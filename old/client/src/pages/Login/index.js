import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Card, Flex, Form, Input, message, Layout } from "antd";
import { UserOutlined, LockOutlined, SmileOutlined } from "@ant-design/icons";
import { fetchLogin, fetchRegister } from "@/store/modules/user";
import store from "@/store";

const LoginCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values) => {
    setLoading(true);
    try {
      await dispatch(fetchLogin(values));
      const nickname = store.getState().user.nickname;
      navigate("/");
      message.success(`欢迎回来，${nickname}`);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="qqNumber" rules={[{ required: true, message: "请输入QQ号!" }]}>
        <Input prefix={<UserOutlined />} placeholder="QQ号" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" style={{ width: "100%" }} loading={loading}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

const RegisterCard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const onFinish = async (values) => {
    setLoading(true);
    try {
      delete values.confirmPassword;
      console.log(values);
      await dispatch(fetchRegister(values));
      navigate("/");
      message.success("注册成功，自动登录");
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="qqNumber" rules={[{ required: true, message: "请输入QQ号!" }]}>
        <Input prefix={<UserOutlined />} placeholder="QQ号" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        rules={[
          { required: true, message: "请再次输入密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次密码不一致"));
            },
          }),
        ]}
        dependencies={["password"]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
      </Form.Item>
      <Form.Item
        name="nickname"
        rules={[
          { required: true, message: "请输入昵称" },
          { max: 6, message: "昵称最长6个字符" },
          { min: 1, message: "昵称最短1个字符" },
        ]}
      >
        <Input prefix={<SmileOutlined />} placeholder="昵称" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" style={{ width: "100%" }} loading={loading}>
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};

const LoginPage = () => {
  const [reg_mode, setRegMode] = useState(false);
  return (
    <Layout style={{ height: "100vh" }}>
      <Layout.Content>
        <Flex justify="center" align="center" vertical gap="large" style={{ height: "100vh" }}>
          <img src="/logo-title.png" alt="logo" draggable="false" />

          <Card style={{ width: 350, position: "relative" }}>
            {/* {reg_mode ? RegisterCard() : LoginCard()} */}
            {LoginCard()}
            <Button
              onClick={() => setRegMode(!reg_mode)}
              type="link"
              style={
                reg_mode
                  ? { position: "absolute", left: 10, bottom: 5 }
                  : { position: "absolute", right: 10, bottom: 5 }
              }
            >
              {reg_mode ? "< 已有账号" : "没有账号？"}
            </Button>
          </Card>
        </Flex>
      </Layout.Content>
      <Layout.Footer style={{ textAlign: "center" }}>
        小秧排表 ©{new Date().getFullYear()} 丐箩箩 | 蜀ICP备2024079726号-1
      </Layout.Footer>
    </Layout>
  );
};

export default LoginPage;
