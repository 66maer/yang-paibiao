import { EditOutlined } from "@ant-design/icons";
import { dpsXinfaList, naiXinfaList } from "../utils/xinfa";
import SlotCard from "./SlotCard";
import "./SlotPanel.scss";
import { useState, useEffect } from "react";
import {
  AutoComplete,
  Avatar,
  Button,
  Checkbox,
  Divider,
  Flex,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tabs,
  Typography,
  Input,
  message,
} from "antd";
import { xinfaInfoTable } from "../utils/xinfa";
import { request } from "@/utils/request"; // 引入请求工具
import store from "@/store"; // 引入 Redux store

const { Text, Paragraph } = Typography;
var lastModalTab = "rule";

const EditModalRule = ({ curRule, setCurRule }) => {
  const { allow_rich = false, allow_xinfa_list = [] } = curRule;

  const xinfaOptions = Object.keys(xinfaInfoTable).map((xinfa) => {
    return {
      label: <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />,
      value: xinfa,
    };
  });

  const QuickButton = (text) => {
    const onQuickClick = (text) => {
      if (text === "全选") {
        setCurRule({
          ...curRule,
          allow_xinfa_list: Object.keys(xinfaInfoTable),
        });
      } else if (text === "清空") {
        setCurRule({
          ...curRule,
          allow_xinfa_list: [],
        });
      } else {
        const list = Object.keys(xinfaInfoTable).filter((xinfa) =>
          xinfaInfoTable[xinfa].type.includes(text)
        );
        setCurRule({
          ...curRule,
          allow_xinfa_list: list,
        });
      }
    };
    return (
      <Button style={{ width: 70 }} onClick={() => onQuickClick(text)}>
        {text}
      </Button>
    );
  };

  return (
    <Flex vertical>
      <Checkbox
        checked={allow_rich}
        onChange={(e) => {
          setCurRule({
            ...curRule,
            allow_rich: e.target.checked,
          });
        }}
      >
        <Text>允许老板</Text>
      </Checkbox>
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
        value={allow_xinfa_list}
        onChange={(values) => {
          setCurRule({
            ...curRule,
            allow_xinfa_list: values,
          });
        }}
      />
    </Flex>
  );
};

const EditModalAssign = ({ onSaveAssign }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await request.post("/guild/listGuildMembers", {
          guildId: store.getState().guild.guildId,
        });
        if (res.code !== 0) {
          throw new Error(res.msg);
        }
        setMembers(res.data.members);
      } catch (err) {
        message.error(err.message);
      }
    };
    fetchMembers();
  }, []);

  const fetchCharacters = async (userId) => {
    try {
      const res = await request.post("/character/listUserCharacters", {
        userId,
      });
      if (res.code !== 0) {
        throw new Error(res.msg);
      }
      setCharacters(res.data.characters);
    } catch (err) {
      message.error(err.message);
    }
  };

  const onMemberSelect = (value, option) => {
    const userId = option.key;
    fetchCharacters(userId);
    form.setFieldsValue({ character_name: null, xinfa: null });
  };

  const onMemberChange = (value) => {
    const selectedMember = members.find(
      (member) => member.groupNickname === value
    );
    if (!selectedMember) {
      setCharacters([]);
      form.setFieldsValue({ character_name: null, xinfa: null });
    }
  };

  const onCharacterSelect = (value, option) => {
    const selected = characters.find((char) => char.characterId === option.key);
    setSelectedCharacter(selected);
    form.setFieldsValue({ xinfa: selected?.xinfa });
  };

  const xinfaOptions = characters.map((char) => ({
    label: (
      <Space key={char.characterId}>
        <Avatar src={`/xinfa/${xinfaInfoTable[char.xinfa].icon}`} />
        <Text>{char.name}</Text>
      </Space>
    ),
    value: char.name,
    key: char.characterId,
  }));

  const memberOptions = members.map((member) => ({
    label: member.groupNickname,
    value: member.groupNickname,
    key: member.userId,
  }));

  return (
    <Form
      form={form}
      onFinish={(values) => onSaveAssign(values)}
      labelCol={{
        span: 4,
      }}
    >
      <Form.Item
        name="user"
        label="指定团员"
        rules={[{ required: true, message: "请选择团员" }]}
      >
        <AutoComplete
          allowClear
          placeholder="选择团员"
          options={memberOptions}
          onSelect={onMemberSelect}
          onChange={onMemberChange}
        />
      </Form.Item>
      <Form.Item name="character_name" label="游戏角色">
        <AutoComplete
          allowClear
          placeholder="选择角色"
          options={xinfaOptions}
          onSelect={onCharacterSelect}
        />
      </Form.Item>
      <Form.Item
        name="xinfa"
        label="心法"
        rules={[{ required: true, message: "请选择心法" }]}
      >
        <Select
          showSearch
          allowClear
          placeholder="心法"
          options={Object.keys(xinfaInfoTable).map((xinfa) => ({
            label: (
              <Space>
                <Avatar src={`/xinfa/${xinfaInfoTable[xinfa].icon}`} />
                <Text>{xinfaInfoTable[xinfa].name}</Text>
              </Space>
            ),
            value: xinfa,
          }))}
        />
      </Form.Item>
    </Form>
  );
};

const EditModal = ({
  rule,
  signupInfo,
  index,
  open,
  setOpen,
  onlyRule = false,
  updateRule,
}) => {
  const [curRule, setCurRule] = useState(
    rule || { allow_rich: false, allow_xinfa_list: [] }
  );
  const [assignData, setAssignData] = useState(
    signupInfo || { user: null, character_name: null, xinfa: null }
  );

  const onEditModalCancel = () => {
    setOpen(false);
  };

  const onSave = () => {
    updateRule(index, curRule); // 仅更新规则
    setOpen(false);
  };

  const onTabChange = (key) => {
    lastModalTab = key;
  };

  const tabs = [
    {
      key: "rule",
      label: "规则",
      children: <EditModalRule curRule={curRule} setCurRule={setCurRule} />,
    },
    onlyRule || {
      key: "assign",
      label: "钦定",
      children: (
        <EditModalAssign
          onSaveAssign={(data) => {
            setAssignData(data);
          }}
        />
      ),
    },
  ];

  const chineseNumbers = ["【一】", "【二】", "【三】", "【四】", "【五】"];
  const circledNumbers = ["①", "②", "③", "④", "⑤"];

  return (
    <Modal
      centered
      open={open}
      title={`编辑坑位： ${chineseNumbers[Math.floor(index / 5)]}队 · ${
        circledNumbers[index % 5]
      }`}
      onCancel={onEditModalCancel}
      footer={
        <Button type="primary" onClick={onSave}>
          保存
        </Button>
      }
    >
      <Tabs
        defaultActiveKey={lastModalTab}
        items={tabs}
        size="large"
        centered
        tabBarGutter={100}
        onChange={onTabChange}
      />
    </Modal>
  );
};

const EditSlotCard = ({ rule, signupInfo, index, onlyRule, updateRule }) => {
  const [showEditMask, setShowEditMask] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const onEditMaskClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <div
        className="slot-card"
        onClick={onEditMaskClick}
        onMouseEnter={() => setShowEditMask(true)}
        onMouseLeave={() => setShowEditMask(false)}
      >
        <SlotCard cardInfo={{ rule, signupInfo }} index={index} />
        {showEditMask && (
          <div className="mask">
            <EditOutlined className="mask-icon" />
          </div>
        )}
      </div>
      <EditModal
        rule={rule}
        signupInfo={signupInfo}
        index={index}
        open={showEditModal}
        setOpen={setShowEditModal}
        onlyRule={onlyRule}
        updateRule={updateRule}
      />
    </>
  );
};

const SlotXiaoDui = ({ rules, signupInfos, indexD, mode, updateRule }) => {
  const cardFactory = (mode, globalIndex, rule, signupInfo) => {
    const baseProps = {
      rule,
      signupInfo,
      index: globalIndex,
      updateRule,
    };
    switch (mode) {
      case "edit":
        return <EditSlotCard {...baseProps} />;
      case "edit-only-rule":
        return <EditSlotCard {...baseProps} onlyRule={true} />;
      default:
        return <SlotCard cardInfo={{ rule, signupInfo }} index={globalIndex} />;
    }
  };

  return (
    <div className="slot-xiaodui">
      {rules.slice(indexD * 5, indexD * 5 + 5).map((rule, index) => {
        const globalIndex = indexD * 5 + index;
        return cardFactory(mode, globalIndex, rule, signupInfos[globalIndex]);
      })}
    </div>
  );
};

const SlotPanel = ({
  rules = Array(25).fill({}),
  signup_infos = Array(25).fill({}),
  mode = "show",
  onRulesChange,
}) => {
  const updateRule = (index, updatedRule) => {
    const updatedRules = [...rules];
    updatedRules[index] = updatedRule;

    if (onRulesChange) {
      onRulesChange(updatedRules);
    }
  };

  return (
    <div className="slot-panel" style={{ display: "flex" }}>
      {Array.from({ length: 5 }, (_, indexD) => (
        <SlotXiaoDui
          rules={rules}
          signupInfos={signup_infos}
          indexD={indexD}
          mode={mode}
          updateRule={updateRule}
        />
      ))}
    </div>
  );
};

export default SlotPanel;
