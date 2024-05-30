import {
  Button,
  Flex,
  Space,
  Typography,
  Divider,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { EditPanel } from "@/components/TeamPanel";
import dayjs from "dayjs";
import { request } from "@/utils";
import { useNavigate, useLocation } from "react-router-dom";

const EditTemplete = (props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const team = location.state ? location.state.team : null;
  const pageTitle = team ? "编辑模板" : "创建模板";

  let formSlots = [];
  if (!team) {
    formSlots = Array.from({ length: 25 }).fill({
      rule: {
        available_xinfa: [],
        allow_rich: false,
      },
      member: null,
    });
  } else {
    formSlots = team.slot_rules.map((rule) => {
      return {
        rule: {
          available_xinfa: rule.available_xinfa,
          allow_rich: rule.allow_rich,
        },
        member: null,
      };
    });
  }

  const onSave = (slots) => {
    formSlots = slots;
  };

  const onFinish = (values) => {
    const { title } = values;
    const slots = formSlots;
    const data = {
      name: title,
      slot_rules: slots.map((slot) => {
        const { rule } = slot;
        return {
          available_xinfa: rule.available_xinfa,
          allow_rich: rule.allow_rich,
        };
      }),
    };
    request
      .post("/saveTeamTemplete", data)
      .then((res) => {
        message.success(res.message);
        navigate("/teamTemplete");
      })
      .catch((err) => {
        const { response } = err;
        if (response) {
          message.error(response.data.message);
        } else {
          message.error("网络错误");
        }
      });
  };

  return (
    <Flex vertical>
      <Space align="center" size={"large"}>
        <Button
          icon={<ArrowLeftOutlined />}
          size="large"
          onClick={() => navigate("/teamTemplete")}
        >
          返回
        </Button>
        <h1>{pageTitle}</h1>
      </Space>
      <Divider style={{ marginTop: 5 }} />
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={{
          title: team ? team.name : "",
        }}
      >
        <Space align="baseline">
          <Form.Item
            name="title"
            rules={[{ required: true, message: "请输入模板名称" }]}
            style={{
              width: 800,
            }}
          >
            <Input
              size="large"
              showCount
              maxLength={20}
              placeholder="请输入模板名称"
            />
          </Form.Item>
        </Space>
        <Form.Item>
          <EditPanel onSave={onSave} slots={formSlots} onlyRule={true} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" size="large" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  );
};

export default EditTemplete;
