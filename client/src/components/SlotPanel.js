import { SlidersOutlined, UserAddOutlined } from "@ant-design/icons";
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
import { useDispatch } from "react-redux";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";

const { Text, Paragraph } = Typography;

const EditModalBase = ({ title, open, setOpen, children, onSave }) => {
  return (
    <Modal
      centered
      open={open}
      title={title}
      onCancel={() => setOpen(false)}
      footer={
        <Button type="primary" onClick={onSave}>
          保存
        </Button>
      }
    >
      {children}
    </Modal>
  );
};

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
      <Divider orientation="left" plain>
        （若想只允许老板，勾选后需要清空心法选择）
      </Divider>
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

const EditModalAssign = ({ onSaveAssign, open, setOpen, title }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const dispatch = useDispatch();

  const fetchMembers = async () => {
    try {
      const guildId = store.getState().guild.guildId;
      const cachedMembers = await dispatch(fetchGuildMembersWithCache(guildId));
      setMembers(cachedMembers);
    } catch (err) {
      message.error(err.message);
    }
  };

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

  useEffect(() => {
    if (open) {
      fetchMembers(); // 打开模态框时加载成员数据
    }
  }, [open]);

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
    <EditModalBase
      title={title}
      open={open}
      setOpen={setOpen}
      onSave={() => form.submit()}
    >
      <Form
        form={form}
        onFinish={(values) => {
          onSaveAssign(values);
          setOpen(false);
        }}
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
    </EditModalBase>
  );
};

const EditSlotCard = ({
  rule,
  signupInfo,
  index,
  updateRule,
  onlyRule = false,
}) => {
  const [showEditMask, setShowEditMask] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const onRuleClick = () => {
    setShowRuleModal(true);
  };

  const onAssignClick = () => {
    setShowAssignModal(true);
  };

  const chineseNumbers = ["【一】", "【二】", "【三】", "【四】", "【五】"];
  const circledNumbers = ["①", "②", "③", "④", "⑤"];

  const ruleTitle = `编辑规则： ${chineseNumbers[Math.floor(index / 5)]}队 · ${
    circledNumbers[index % 5]
  }`;
  const assignTitle = `编辑报名信息： ${
    chineseNumbers[Math.floor(index / 5)]
  }队 · ${circledNumbers[index % 5]}`;

  const [curRule, setCurRule] = useState(
    rule || { allow_rich: false, allow_xinfa_list: [] }
  );

  const onSaveRule = () => {
    updateRule(index, curRule);
    setShowRuleModal(false);
  };

  return (
    <>
      <div
        className="slot-card"
        onMouseEnter={() => setShowEditMask(true)}
        onMouseLeave={() => setShowEditMask(false)}
      >
        <SlotCard cardInfo={{ rules: rule, signupInfo }} index={index} />
        {showEditMask && (
          <div className="mask">
            <div
              className={`mask-button mask-rule ${onlyRule ? "full-mask" : ""}`}
              onClick={onRuleClick}
            >
              <SlidersOutlined className="mask-icon" />
              <span className="mask-text">报名规则</span>
            </div>
            {!onlyRule && (
              <div className="mask-button mask-assign" onClick={onAssignClick}>
                <UserAddOutlined className="mask-icon" />
                <span className="mask-text">团长钦定</span>
              </div>
            )}
          </div>
        )}
      </div>
      <EditModalBase
        title={ruleTitle}
        open={showRuleModal}
        setOpen={setShowRuleModal}
        onSave={onSaveRule}
      >
        <EditModalRule curRule={curRule} setCurRule={setCurRule} />
      </EditModalBase>
      {!onlyRule && (
        <EditModalAssign
          open={showAssignModal}
          setOpen={setShowAssignModal}
          onSaveAssign={(data) => {
            // Handle saving assign data here if needed
          }}
          title={assignTitle}
        />
      )}
    </>
  );
};

const SlotXiaoDui = ({ rules, signupInfos, indexD, mode, updateRule }) => {
  const cardFactory = (mode, globalIndex, rule, signupInfo) => {
    const baseProps = {
      key: globalIndex,
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
        return (
          <SlotCard
            key={globalIndex}
            cardInfo={{ rules: rule, signupInfo }}
            index={globalIndex}
          />
        );
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
