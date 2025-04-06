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
  Switch,
  Row,
  Col,
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
  const { allowRich = false, allowXinfaList = [] } = curRule;

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
          allowXinfaList: Object.keys(xinfaInfoTable),
        });
      } else if (text === "清空") {
        setCurRule({
          ...curRule,
          allowXinfaList: [],
        });
      } else {
        const list = Object.keys(xinfaInfoTable).filter((xinfa) =>
          xinfaInfoTable[xinfa].type.includes(text)
        );
        setCurRule({
          ...curRule,
          allowXinfaList: list,
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
        checked={allowRich}
        onChange={(e) => {
          setCurRule({
            ...curRule,
            allowRich: e.target.checked,
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
        value={allowXinfaList}
        onChange={(values) => {
          setCurRule({
            ...curRule,
            allowXinfaList: values,
          });
        }}
      />
    </Flex>
  );
};

const EditModalAssign = ({ onSaveAssign, open, setOpen, title, index }) => {
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
    form.setFieldsValue({ characterName: null, xinfa: null });
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
      form.setFieldsValue({ characterName: null, xinfa: null });
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

  const onFilterOption = (inputValue, option) => {
    const regex = new RegExp(inputValue.split("").join(".*"));
    const list = xinfaInfoTable[option.value].nickname;
    return list.some((item) => regex.test(item));
  };

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
          // 准备指定报名的数据
          console.log("指定报名数据000:", values);
          const submitNember = members.find(
            (member) => member.groupNickname === store.getState().user.userId
          );
          const selectedMember = members.find(
            (member) => member.groupNickname === values.user
          );
          const selectedChar = characters.find(
            (char) => char.name === values.characterName
          );

          const assignData = {
            slotIndex: index,
            submitUserId: store.getState().user.userId,
            signupUserId: selectedMember?.userId || 0,
            signupCharacterId: selectedChar?.characterId || 0,
            signupInfo: JSON.stringify({
              submitName:
                submitNember?.groupNickname || store.getState().user.nickname,
              signupName: values.user,
              characterName: values.characterName || "未指定",
              characterXinfa: values.xinfa || "未知",
              isLock: true, // 团长指定的都是锁定的
            }),
            isRich: values.isRich || false,
            isProxy: true, // 团长指定的都是代报名
            clientType: values.isWujie ? "无界" : "旗舰",
            lockSlot: index, // 锁定在当前位置
          };
          console.log("指定报名数据111:", assignData);
          onSaveAssign(assignData);
          setOpen(false);
        }}
        layout="vertical"
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
        <Form.Item name="characterName" label="游戏角色">
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
            filterOption={onFilterOption}
          />
        </Form.Item>

        <Row>
          <Col flex="auto">
            <Form.Item name="isRich" valuePropName="checked" label="是否是老板">
              <Switch checkedChildren="当老板" unCheckedChildren="打工仔" />
            </Form.Item>
          </Col>
          <Col flex="auto">
            <Form.Item
              name="isWujie"
              valuePropName="checked"
              label="客户端类型"
            >
              <Switch checkedChildren="无界端" unCheckedChildren="旗舰端" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </EditModalBase>
  );
};

const EditSlotCard = ({
  rule,
  signupInfo,
  index,
  updateRule,
  updateSignupInfo,
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
    rule || { allowRich: false, allowXinfaList: [] }
  );

  const onSaveRule = () => {
    updateRule(index, curRule);
    setShowRuleModal(false);
  };

  const onSaveAssign = (assignData) => {
    if (updateSignupInfo) {
      updateSignupInfo(assignData);
    }
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
          onSaveAssign={onSaveAssign}
          title={assignTitle}
          index={index}
        />
      )}
    </>
  );
};

const SlotXiaoDui = ({
  rules,
  signupInfos,
  indexD,
  mode,
  updateRule,
  updateSignupInfo,
}) => {
  const cardFactory = (mode, globalIndex, rule, signupInfo) => {
    const baseProps = {
      key: globalIndex,
      rule,
      signupInfo,
      index: globalIndex,
      updateRule,
      updateSignupInfo,
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
  onSignupInfosChange,
}) => {
  const [assignedSignups, setAssignedSignups] = useState([]);

  const updateRule = (index, updatedRule) => {
    const updatedRules = [...rules];
    updatedRules[index] = updatedRule;

    if (onRulesChange) {
      onRulesChange(updatedRules);
    }
  };

  const updateSignupInfo = (assignData) => {
    const updatedAssignedSignups = assignedSignups.filter(
      (signup) => signup.lockSlot !== assignData.lockSlot
    );
    updatedAssignedSignups.push(assignData);

    setAssignedSignups(updatedAssignedSignups);

    const parsedSignupInfo = (() => {
      try {
        return JSON.parse(assignData.signupInfo || "{}");
      } catch (error) {
        console.error("Failed to parse signupInfo:", error);
        return {};
      }
    })();

    console.log("更新后的报名数据:", updatedAssignedSignups, signup_infos);
    const updatedSignupInfos = [...signup_infos];
    updatedSignupInfos[assignData.lockSlot] = {
      submitUserId: assignData.submitUserId,
      signupUserId: assignData.signupUserId,
      signupCharacterId: assignData.signupCharacterId,
      isRich: assignData.isRich,
      isProxy: assignData.isProxy,
      clientType: assignData.clientType,
      ...parsedSignupInfo,
    };

    if (onSignupInfosChange) {
      onSignupInfosChange(updatedSignupInfos, updatedAssignedSignups);
    }
  };

  return (
    <div className="slot-panel" style={{ display: "flex" }}>
      {Array.from({ length: 5 }, (_, indexD) => (
        <SlotXiaoDui
          key={indexD}
          rules={rules}
          signupInfos={signup_infos}
          indexD={indexD}
          mode={mode}
          updateRule={updateRule}
          updateSignupInfo={updateSignupInfo}
        />
      ))}
    </div>
  );
};

export default SlotPanel;
