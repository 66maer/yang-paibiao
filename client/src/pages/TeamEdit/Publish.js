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

const Publish = (props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const team = location.state ? location.state.team : null;
  const pageTitle = team ? "编辑团队" : "发布团队";

  let formSlots = team
    ? team.slots
    : Array.from({ length: 25 }).fill({
        rule: {
          available_xinfa: [],
          allow_rich: false,
        },
        member: null,
      });

  const onSave = (slots) => {
    formSlots = slots;
  };

  const onTempleteSelectChange = (value) => {
    console.log("未实现模板变更：", value);
  };

  const onFinish = (values) => {
    const { title, date, time } = values;
    const team_time = dayjs(
      `${date.format("YYYY-MM-DD")} ${time.format("HH:mm")}`
    ).format();
    const url = team ? "/updateTeam" : "/publishTeam";

    request
      .post(url, {
        uuid: team ? team.uuid : null,
        title,
        team_time,
        slots: formSlots,
      })
      .then((res) => {
        message.success(res.message);
        navigate("/teamEdit");
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
          onClick={() => navigate("/teamEdit")}
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
          title: team ? team.title : "",
          date: team ? dayjs(team.team_time) : dayjs(),
          time: team ? dayjs(team.team_time) : dayjs("19:30", "HH:mm"),
        }}
      >
        <Space align="baseline">
          <Form.Item
            name="title"
            rules={[{ required: true, message: "请输入标题" }]}
            style={{
              width: 800,
            }}
          >
            <Input
              size="large"
              showCount
              maxLength={20}
              placeholder="请输入标题"
            />
          </Form.Item>
        </Space>
        <Form.Item name="date" label="开团日期">
          <DatePicker />
        </Form.Item>
        <Form.Item name="time" label="时间">
          <TimePicker format="HH:mm" minuteStep={5} />
        </Form.Item>
        <Form.Item label="选择模板">
          <Select
            defaultValue="未实现"
            style={{
              width: 120,
            }}
            onClear={onTempleteSelectChange}
            onSelect={onTempleteSelectChange}
            allowClear
            options={[
              {
                value: "未实现",
                label: "未实现",
              },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <EditPanel onSave={onSave} slots={formSlots} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" size="large" htmlType="submit">
            {team ? "保存" : "发布"}
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  );
};

export default Publish;
