import React from "react";
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
} from "antd";
import {
  LockOutlined,
  UserSwitchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { xinfaInfoTable } from "@/utils/xinfa";
import { store } from "@/store";
import { request } from "@/utils";

const { Text } = Typography;

const tagInfoTable = [
  { name: "老板", color: "gold" },
  { name: "无界", color: "purple" },
];

const EditModelRule = ({ curRule, setCurRule, curMember, setCurMember }) => {
  const { available_xinfa, allow_rich } = curRule;

  const onCheckGroupChange = (value) => {
    setCurRule({
      available_xinfa: value,
      allow_rich,
    });
  };

  const QuickButton = (text) => {
    const onQuickClick = (text) => {
      if (text === "全选") {
        setCurRule({
          available_xinfa: Object.keys(xinfaInfoTable),
          allow_rich,
        });
      } else if (text === "清空") {
        setCurRule({
          available_xinfa: [],
          allow_rich,
        });
      } else {
        const list = Object.keys(xinfaInfoTable).filter((xinfa) =>
          xinfaInfoTable[xinfa].type.includes(text)
        );
        const set = new Set([...available_xinfa, ...list]);
        setCurRule({
          available_xinfa: Array.from(set),
          allow_rich,
        });
      }
    };
    return (
      <Button style={{ width: 70 }} onClick={() => onQuickClick(text)}>
        {text}
      </Button>
    );
  };

  const xinfaOptions = Object.keys(xinfaInfoTable).map((xinfa) => {
    return {
      label: <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />,
      value: xinfa,
    };
  });

  const onRichSwitch = (checked) => {
    if (checked) {
      setCurRule({
        available_xinfa,
        allow_rich: true,
      });
    } else {
      setCurRule({
        available_xinfa,
        allow_rich: false,
      });
    }
  };

  return (
    <Flex vertical>
      <Switch
        checkedChildren="老板"
        unCheckedChildren="打工"
        style={{ width: 80 }}
        onChange={onRichSwitch}
      />
      <Divider orientation="left" plain>
        快捷选项
      </Divider>
      <Space.Compact block>
        {QuickButton("全选")}
        {QuickButton("清空")}
      </Space.Compact>
      <Space.Compact block>
        {QuickButton("dps")}
        {QuickButton("内功")}
        {QuickButton("外功")}
        {QuickButton("奶妈")}
        {QuickButton("T")}
      </Space.Compact>
      <Divider orientation="left" plain>
        可用心法
      </Divider>
      <Checkbox.Group
        options={xinfaOptions}
        value={available_xinfa}
        onChange={onCheckGroupChange}
      />
    </Flex>
  );
};

const EditModeAssign = ({ curMember, setCurMember, setIsModalOpen }) => {
  const [form] = Form.useForm();

  const options = Object.keys(xinfaInfoTable).map((xinfa) => {
    return {
      label: (
        <Space key={xinfa}>
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

  const onUserClear = () => {
    form.resetFields();
    setCurMember(null);
  };

  const onFinish = (values) => {
    const { nickname, character_name, xinfa, is_rich, is_wujie } = values;
    const tags = [];
    if (is_rich) tags.push("老板");
    if (is_wujie) tags.push("无界");
    setCurMember({
      nickname,
      character_name,
      xinfa,
      tags,
      is_rich,
      is_lock: true,
    });
    setIsModalOpen(false);
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      style={{ width: 400 }}
      labelCol={{
        span: 6,
      }}
    >
      <Form.Item
        name="nickname"
        label="指定团员"
        rules={[{ required: true, message: "请填写昵称" }]}
      >
        <Input
          showCount
          allowClear
          maxLength={6}
          style={{ width: 300 }}
          placeholder="填写昵称"
        />
      </Form.Item>
      <Form.Item name="character_name" label="游戏角色">
        <Input
          showCount
          allowClear
          maxLength={10}
          style={{ width: 300 }}
          placeholder="游戏角色"
        />
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
            />
          </Form.Item>
          <Form.Item name="is_wujie">
            <Switch
              checkedChildren="无界"
              unCheckedChildren="端游"
              style={{ width: 80 }}
            />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item>
        <Flex justify="center">
          <Space size={50}>
            <Button type="primary" htmlType="submit">
              锁定
            </Button>
            <Button onClick={onUserClear} danger>
              重置
            </Button>
          </Space>
        </Flex>
      </Form.Item>
    </Form>
  );
};

const EditModal = (props) => {
  const tabs = [
    {
      key: "role",
      label: "规则",
      children: EditModelRule(props),
    },
    {
      key: "user",
      label: "钦定",
      children: EditModeAssign(props),
    },
  ];
  return (
    <Tabs
      defaultActiveKey="role"
      items={tabs}
      size="large"
      centered
      tabBarGutter={100}
    ></Tabs>
  );
};

const getRuleContent = ({ available_xinfa, allow_rich }) => {
  const xinfaLength = Object.keys(xinfaInfoTable).length;
  const icons = [];
  if (available_xinfa.length <= xinfaLength - 9) {
    available_xinfa.forEach((xinfa) => {
      const item = xinfaInfoTable[xinfa];
      icons.push(
        <Tooltip key={xinfa} title={item.name} placement="top">
          <div>
            <Avatar src={`/xinfa/${item.icon}`} />
          </div>
        </Tooltip>
      );
    });
  } else if (available_xinfa.length === xinfaLength) {
    icons.push(
      <Tooltip key="all" title="不限定心法" placement="top">
        <div>
          <Avatar src="/jx3.png" />
        </div>
      </Tooltip>
    );
  } else {
    const xinfaSet = new Set(available_xinfa);
    Object.keys(xinfaInfoTable).forEach((xinfa) => {
      if (!xinfaSet.has(xinfa)) {
        const item = xinfaInfoTable[xinfa];
        icons.push(
          <Tooltip key={xinfa} title={`${item.name}(禁用)`} placement="top">
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar src={`/xinfa/${item.icon}`} />
              <div
                className="mask"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <img
                  src="/ban.png"
                  style={{ width: "100%", height: "100%" }}
                  alt="禁用"
                />
              </div>
            </div>
          </Tooltip>
        );
      }
    });
  }

  return (
    <Space direction="vertical" align="center">
      {!allow_rich && !available_xinfa.length && (
        <Avatar size={64} icon={<LockOutlined />}></Avatar>
      )}
      {allow_rich && (
        <Tooltip title="老板" placement="top">
          <Avatar
            shape="square"
            size={available_xinfa.length ? "default" : 48}
            src="/rich.png"
          />
        </Tooltip>
      )}
      {available_xinfa.length ? (
        <Avatar.Group
          maxCount={6}
          maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
        >
          {icons}
        </Avatar.Group>
      ) : null}
    </Space>
  );
};

const showRuleCard = ({ available_xinfa, allow_rich }) => {
  return (
    <Card
      hoverable
      styles={{
        body: {
          height: "100%",
          padding: 10,
        },
      }}
      style={{
        width: 200,
        height: 115,
        background: "lightgray",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getRuleContent({ available_xinfa, allow_rich })}
      </div>
    </Card>
  );
};

const getTagList = (tags) => {
  if (!tags) return null;
  // 最多显示三个tag, 小于三个tag全部显示
  tags = tags.slice(0, 3);
  // 匹配tagList中的tag
  return tags.map((tag) => {
    const tagInfo = tagInfoTable.find((item) => item.name === tag);
    if (tagInfo) {
      return (
        <Tag color={tagInfo.color} key={tag}>
          {tag}
        </Tag>
      );
    }
    return <Tag key={tag}>{tag}</Tag>;
  });
};

const showUserCard = ({ member }) => {
  const { nickname, character_name, xinfa, tags, is_proxy, is_lock } = member;
  const xinfaInfo = xinfaInfoTable[xinfa] || {
    icon: "daxia.png",
    color: "gray",
  };

  return (
    <Card
      hoverable
      styles={{
        body: {
          height: "100%",
          padding: 10,
        },
      }}
      style={{
        width: 200,
        height: 115,
        background: xinfaInfo.color,
      }}
    >
      <Flex vertical>
        <Flex justify="space-between" align="center">
          <Avatar src={`/xinfa/${xinfaInfo.icon}`} />
          <div>{getTagList(tags)}</div>
        </Flex>
        <Flex justify="center" style={{ marginTop: -5, marginBottom: 5 }}>
          <Space align="baseline" size={5}>
            {is_proxy ? (
              <UserSwitchOutlined style={{ fontSize: "1.5rem" }} />
            ) : is_lock ? (
              <LockOutlined style={{ fontSize: "1.5rem" }} />
            ) : null}
            <div style={{ fontSize: "1.5rem" }}>{nickname}</div>
          </Space>
        </Flex>
        <Flex justify="flex-end">
          <Text type="secondary">{character_name}</Text>
        </Flex>
      </Flex>
    </Card>
  );
};

const ShowCard = ({ member, rule, onUserCancelSignup }) => {
  if (!member?.nickname) {
    return showRuleCard(rule);
  }
  if (member.is_lock) {
    return showUserCard({ member });
  }

  const popoverContent = (
    <Flex gap="middle" vertical>
      <div>{getRuleContent(rule)}</div>
      {store.getState().user.id === member.user ? (
        <Flex justify="flex-end" onClick={() => onUserCancelSignup(member._id)}>
          <Button danger>取消报名</Button>
        </Flex>
      ) : null}
    </Flex>
  );

  return (
    <Popover content={popoverContent} trigger="click" title="坑位要求: ">
      {showUserCard({ member })}
    </Popover>
  );
};

const EditCard = ({ member, rule, onSave }) => {
  const [showEditMask, setShowEditMask] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [curMember, setCurMember] = React.useState(member);
  const [curRule, setCurRule] = React.useState(rule);

  const confirm = () => {
    setCurMember(null);
    onSave && onSave(null, curRule);
  };

  const handleMouseEnter = () => {
    setShowEditMask(true);
  };
  const handleMouseLeave = () => {
    setShowEditMask(false);
  };

  const handleClick = () => {
    if (!curMember?.user || curMember?.is_lock) {
      setIsModalOpen(true);
    }
  };
  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleAfterClose = () => {
    onSave && onSave(curMember, curRule);
  };

  return (
    <Popconfirm
      title="警告，当前格已经有报名信息"
      description="如果要编辑，需要先清空报名信息"
      onConfirm={confirm}
      okText="知晓, 清空报名信息"
      showCancel={false}
      disabled={!curMember?.user || curMember?.is_lock}
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          cursor: "pointer",
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {curMember?.nickname
          ? showUserCard({ member: curMember })
          : showRuleCard(curRule)}

        {showEditMask ? (
          <div
            className="mask"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <EditOutlined
              style={{
                width: "100%",
                height: "100%",
                fontSize: "3rem",
                justifyContent: "center",
                align: "center",
              }}
            />
          </div>
        ) : null}
      </div>
      <Modal
        centered
        open={isModalOpen}
        onCancel={handleModalCancel}
        afterClose={handleAfterClose}
        footer={null}
      >
        {EditModal({
          curMember,
          setCurMember,
          curRule,
          setCurRule,
          setIsModalOpen,
        })}
      </Modal>
    </Popconfirm>
  );
};

export { ShowCard, EditCard };
