import {
  Card,
  Form,
  Input,
  Button,
  message,
  ConfigProvider,
  Alert,
} from "antd";
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
                <Alert
                  message="当前为测试版，产生的所有信息，都可能会被删除。"
                  type="warning"
                  showIcon
                />
                <Alert
                  message="虽然让输入QQ号，但不会校验(随便填)，未来可能会录入"
                  type="info"
                  showIcon
                />

                <Form.Item
                  name="qqNumber"
                  rules={[{ required: true, message: "请输入QQ号!" }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="QQ号" />
                </Form.Item>
                <Alert
                  message="密码会散列化，不会泄露，但不建议用自己的常用密码"
                  type="info"
                  showIcon
                />
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
                <Alert
                  message="很重要，目前不可修改(没写)，使用可辨识的昵称"
                  type="info"
                  showIcon
                />
                <Form.Item
                  name="nickname"
                  rules={[
                    { required: true, message: "请输入昵称" },
                    { max: 6, message: "昵称最长6个字符" },
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

            <div>
              小秧排表 ©{new Date().getFullYear()} 丐箩箩 |
              蜀ICP备2024079726号-1
            </div>
          </Card>
        </ConfigProvider>
      </div>
    </>
  );
};

export default Login;
