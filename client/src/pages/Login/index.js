import { Card, Form, Input, Button, message, ConfigProvider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import "./index.scss";
import { useDispatch } from "react-redux";
import { fetchLogin, fetchRegister } from "@/store/modules/user";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SHA512 } from "crypto-js";
import React, { useState } from "react";

const Login = () => {
  useEffect(() => {
    document.title = "小秧排表 - 花眠 - 登录";
    const link = document.querySelector("link[rel*='icon']");
    link.href = "/logo.png";
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const handleToggleForm = () => {
    setIsRegistering(!isRegistering);
  };
  const onFinishLogin = async (values) => {
    values.password = SHA512(values.password).toString();
    try {
      await dispatch(fetchLogin(values));
      navigate("/");
      message.success("登录成功");
    } catch (err) {
      const { response } = err;
      if (response) {
        message.error(response.data.message);
      } else {
        message.error("网络错误");
      }
    }
  };
  const onFinishRegister = async (values) => {
    // 处理注册逻辑
    values.password = SHA512(values.password).toString();
    try {
      await dispatch(fetchRegister(values));
      navigate("/");
      message.success("注册成功");
    } catch (err) {
      const { response } = err;
      if (response) {
        message.error(response.data.message);
      } else {
        message.error("网络错误");
      }
    }
  };

  return (
    <>
      <div className="login-bg" />
      <div className="login-frame">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#ec9bad",
            },
          }}
        >
          <Card className="login-container">
            <div className="logo-container">
              <img src="logo-title.png" alt="Logo" className="logo" />
            </div>
            {/* 根据状态显示不同的表单 */}
            {!isRegistering ? (
              <Form onFinish={onFinishLogin} className="login-form">
                <Form.Item
                  name="qqNumber"
                  rules={[{ required: true, message: "请输入QQ号!" }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="QQ号" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="login-form-button"
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Form onFinish={onFinishRegister} className="register-form">
                <Form.Item
                  name="qqNumber"
                  rules={[{ required: true, message: "请输入QQ号!" }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="QQ号" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                  />
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
                        return Promise.reject("两次密码不一致");
                      },
                    }),
                  ]}
                  dependencies={["password"]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="确认密码"
                  />
                </Form.Item>
                <Form.Item
                  name="nickname"
                  rules={[
                    { required: true, message: "请输入昵称" },
                    { max: 10, message: "昵称最长10个字符" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="昵称"
                    name="nickname"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="register-form-button"
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            )}
            {/* 切换按钮 */}
            <Button onClick={handleToggleForm}>
              {isRegistering ? "<< 返回登录" : "注册账号 >>"}
            </Button>
          </Card>
        </ConfigProvider>
      </div>
    </>
  );
};

export default Login;
