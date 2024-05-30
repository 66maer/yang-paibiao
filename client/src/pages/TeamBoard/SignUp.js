import {
  Card,
  Avatar,
  Tag,
  Tooltip,
  Flex,
  Space,
  Typography,
  Popover,
  Modal,
  Tabs,
  Checkbox,
  Button,
  Divider,
  Switch,
  Popconfirm,
  AutoComplete,
  Select,
  Input,
  Form,
  message,
} from "antd";
import { xinfaInfoTable } from "@/utils/xinfa";
import { request } from "@/utils";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;

const SingUp = ({ activeKey, setSignUpOpen, activeTeam, setActiveTeam }) => {
  const [form] = Form.useForm();
  const [characterList, setCharacterList] = useState([]);

  // useEffect(() => {
  //   request
  //     .post("/getCharacter")
  //     .then((res) => {
  //       setCharacterList(res);
  //     })
  //     .catch((err) => {
  //       const { response } = err;
  //       if (response) {
  //         message.error(response.data.message);
  //       } else {
  //         message.error("网络错误");
  //       }
  //     });
  // }, []);

  const onFinish = (values) => {
    const { character, xinfa, is_rich, is_wujie, is_proxy } = values;
    const tags = [];
    if (is_rich) tags.push("老板");
    if (is_wujie) tags.push("无界");
    request
      .post("/signup", {
        uuid: activeKey,
        character_name: character,
        xinfa,
        is_rich,
        is_proxy,
        tags,
      })
      .then((res) => {
        message.success(res.message);
        setActiveTeam(
          activeTeam.map((team) => {
            if (team.uuid === activeKey) {
              team = res.newTeam;
            }
            return team;
          })
        );

        setSignUpOpen(false);
      })
      .catch((err) => {
        const { response } = err;
        if (response) {
          message.error(response.data.message);
        } else {
          message.error("网络错误");
        }
      });

    console.log(values);
  };

  const options = Object.keys(xinfaInfoTable).map((xinfa) => {
    return {
      label: (
        <Space>
          <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />
          <Text>{xinfaInfoTable[xinfa].name}</Text>
        </Space>
      ),
      value: xinfa,
    };
  });
  const onFilterOption = (inputValue, option) => {
    const regex = new RegExp(inputValue.split("").join(".*"));
    const list = xinfaInfoTable[option.value].nickname;
    return list.some((item) => regex.test(item));
  };
  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
        requiredMark="optional"
        layout="vertical"
      >
        <Form.Item name="is_proxy" label="代报名">
          <Switch
          //onChange={onRichSwitch}
          />
        </Form.Item>

        <Form.Item
          name="character"
          label="选择角色"
          rules={[{ max: 10, message: "角色名不能超过10个字符" }]}
        >
          <AutoComplete options={characterList} />
        </Form.Item>
        <Form.Item
          name="xinfa"
          label="选择心法"
          rules={[{ required: true, message: "请选择心法" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="搜索心法"
            options={options}
            style={{ width: 300 }}
            filterOption={onFilterOption}
          />
        </Form.Item>
        <Form.Item label="标记">
          <Space>
            <Form.Item name="is_rich">
              <Switch
                checkedChildren="老板"
                unCheckedChildren="打工"
                style={{ width: 80 }}
                //onChange={onRichSwitch}
              />
            </Form.Item>
            <Form.Item name="is_wujie">
              <Switch
                checkedChildren="无界"
                unCheckedChildren="端游"
                style={{ width: 80 }}
                //onChange={onRichSwitch}
              />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              报名
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

export default SingUp;
