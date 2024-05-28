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
  Popconfirm,
  Modal,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { EditPanel } from "@/components/TeamPanel";
import dayjs from "dayjs";
import { request } from "@/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { store } from "@/store";
import { fetchTeamTemplete } from "@/store/modules/teamTemplete";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Publish = (props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const team = location.state ? location.state.team : null;
  const pageTitle = team ? "编辑团队" : "发布团队";

  const teamTemplete = useSelector((state) => state.teamTemplete.teamTemplete);

  useEffect(() => {
    store.dispatch(fetchTeamTemplete());
  }, []);

  let formSlots = team
    ? team.slots
    : Array.from({ length: 25 }).fill({
        rule: {
          available_xinfa: [],
          allow_rich: false,
        },
        member: null,
      });

  const [panelSlots, setPanelSlots] = useState(formSlots);
  const [ver, setVer] = useState(false);

  const onSave = (slots) => {
    formSlots = slots;
  };

  const onTempleteApply = () => {
    const value = form.getFieldValue("templete");
    const templete = teamTemplete.find((t) => t.name === value);
    if (!templete) {
      message.error("模板不存在");
      return;
    }
    formSlots.forEach((slot, index) => {
      slot.rule = {
        available_xinfa: templete.slot_rules[index].available_xinfa,
        allow_rich: templete.slot_rules[index].allow_rich,
      };
      slot.member = null;
    });
    setPanelSlots(formSlots);
    console.log("formSlots: ", formSlots);
    console.log("panelSlots: ", panelSlots);
    setVer(true);
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
        layout="vertical"
      >
        <Space align="baseline">
          <Form.Item
            name="title"
            label="标题"
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
          <Space>
            <Form.Item name="templete">
              <Select
                style={{
                  width: 300,
                }}
                allowClear
                options={teamTemplete.map((t) => ({
                  label: t.name,
                  value: t.name,
                }))}
              />
            </Form.Item>
            <Form.Item>
              <Popconfirm
                title="确定应用模板吗?"
                description="应用后会覆盖当前所有内容, 清除所有已经报名的成员"
                onConfirm={onTempleteApply}
              >
                <Button type="primary">应用模板</Button>
              </Popconfirm>
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item>
          <EditPanel onSave={onSave} slots={panelSlots} onlyRuly={ver} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" size="large" htmlType="submit">
              {team ? "保存" : "发布"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Flex>
  );
};

export default Publish;
