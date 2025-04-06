import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  AutoComplete,
  Select,
  Space,
  Avatar,
  Typography,
  message,
  Switch,
  Row,
  Col,
} from "antd";
import { request } from "@/utils/request";
import { useDispatch } from "react-redux";
import { xinfaInfoTable } from "@/utils/xinfa";
import store from "@/store";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";

const { Text } = Typography;

const SignupModal = ({
  visible,
  onClose,
  teamId,
  refreshSignupList,
  signupList,
}) => {
  const [loading, setLoading] = useState(false);
  const [isProxy, setIsProxy] = useState(false);
  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(
    store.getState().user.userId
  );
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const fetchMembers = async () => {
    try {
      const guildId = store.getState().guild.guildId;
      const cachedMembers = await dispatch(fetchGuildMembersWithCache(guildId));
      setMembers(cachedMembers);
    } catch (err) {
      message.error("获取成员列表失败：" + err.message);
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
      message.error("获取角色列表失败：" + err.message);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchMembers();
      fetchCharacters(selectedUserId);
    }
  }, [visible, selectedUserId]);

  useEffect(() => {
    // 当成员列表加载完成后，设置默认值
    if (members.length > 0) {
      const defaultMember = members.find(
        (member) => member.userId === selectedUserId
      );
      if (defaultMember) {
        form.setFieldsValue({ submitUserId: defaultMember.groupNickname });
      }
    }
  }, [members]);

  const handleSignup = async (values) => {
    setLoading(true);
    try {
      const submitUserId = store.getState().user.userId;
      const signupUserId = isProxy
        ? members.find((member) => member.groupNickname === values.submitUserId)
            ?.userId || 0
        : submitUserId;
      const signupCharacterId =
        characters.find((char) => char.name === values.signupCharacterId)
          ?.characterId || 0;

      const submitName =
        members.find((member) => member.userId === submitUserId)
          ?.groupNickname || "未知";
      const signupName =
        members.find((member) => member.userId === signupUserId)
          ?.groupNickname || values.submitUserId;
      const characterName =
        characters.find((char) => char.characterId === signupCharacterId)
          ?.name || values.signupCharacterId;

      const signupInfo = JSON.stringify({
        submitName,
        signupName,
        characterName,
        characterXinfa: values.xinfa || "未知",
        isLock: false,
      });

      console.log("报名信息", {
        submitUserId,
        signupUserId,
        signupCharacterId,
        signupInfo,
        isRich: values.isRich,
        isProxy,
      });

      const isDuplicateSignup = signupList.some(
        (signup) =>
          signupCharacterId != 0 &&
          signup.signupCharacterId === signupCharacterId
      );

      if (isDuplicateSignup) {
        message.error("该角色已报名，不能重复报名！");
        setLoading(false);
        return;
      }

      const isInvalidSelfSignup = signupList.some(
        (signup) =>
          !isProxy &&
          signup.submitUserId === submitUserId &&
          signup.signupUserId === submitUserId
      );

      if (isInvalidSelfSignup) {
        message.error("不可重复报名，请选择代报名！");
        setLoading(false);
        return;
      }

      const clientType = values.isWujie ? "无界" : "旗舰";

      const res = await request.post("/signup/createSignup", {
        teamId,
        submitUserId,
        signupUserId,
        signupCharacterId,
        signupInfo,
        isRich: values.isRich || false,
        isProxy,
        clientType,
        lockSlot: -1,
      });

      if (res.code === 0 && res.data.success) {
        message.success("报名成功！");
        refreshSignupList();
        onClose();
      } else {
        message.error("报名失败，请重试！");
      }
    } catch (error) {
      console.error("报名失败:", error);
      message.error("报名失败，请检查网络或稍后重试！");
    } finally {
      setLoading(false);
    }
  };

  const memberOptions = members.map((member) => ({
    label: member.groupNickname,
    value: member.groupNickname,
    key: member.userId,
  }));

  const characterOptions = characters.map((char) => ({
    label: (
      <Space key={char.characterId}>
        <Avatar src={`/xinfa/${xinfaInfoTable[char.xinfa]?.icon}`} />
        <Text>{char.name}</Text>
      </Space>
    ),
    value: char.name,
    key: char.characterId,
  }));

  const onMemberSelect = (value, option) => {
    const userId = option.key;
    setSelectedUserId(userId);
    fetchCharacters(userId);
  };

  const onMemberChange = (value) => {
    const selectedMember = members.find(
      (member) => member.groupNickname === value
    );
    if (!selectedMember) {
      setCharacters([]);
    }
  };

  const onCharacterSelect = (value, option) => {
    const selectedCharacter = characters.find(
      (char) => char.characterId === option.key
    );
    if (selectedCharacter) {
      form.setFieldsValue({ xinfa: selectedCharacter.xinfa });
    } else {
      message.error("选择的角色无效！");
    }
  };

  const onFilterOption = (inputValue, option) => {
    const regex = new RegExp(inputValue.split("").join(".*"));
    const list = xinfaInfoTable[option.value].nickname;
    return list.some((item) => regex.test(item));
  };

  return (
    <Modal
      title="报名"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form onFinish={handleSignup} layout="vertical" form={form}>
        <Form.Item label="报名人 (代报名请开启右侧开关)">
          <Row align="middle" gutter={16}>
            <Col flex="auto">
              <Form.Item
                name="submitUserId"
                noStyle
                rules={[{ required: true, message: "请填入报名人" }]}
              >
                <AutoComplete
                  disabled={!isProxy}
                  options={memberOptions}
                  placeholder="选择报名人"
                  onSelect={onMemberSelect}
                  onChange={onMemberChange}
                />
              </Form.Item>
            </Col>
            <Col>
              <Switch
                checked={isProxy}
                onChange={(checked) => setIsProxy(checked)}
                checkedChildren="代报名"
                unCheckedChildren="本人"
              />
            </Col>
          </Row>
        </Form.Item>
        <Form.Item name="signupCharacterId" label="角色">
          <AutoComplete
            allowClear
            options={characterOptions}
            placeholder="选择角色"
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
                  <Avatar src={`/xinfa/${xinfaInfoTable[xinfa]?.icon}`} />
                  <Text>{xinfaInfoTable[xinfa]?.name}</Text>
                </Space>
              ),
              value: xinfa,
            }))}
            filterOption={onFilterOption}
          />
        </Form.Item>
        <Row gutter={16}>
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
        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SignupModal;
