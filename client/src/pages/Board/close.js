import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Slider,
  Row,
  Col,
  AutoComplete,
  Button,
  Tag,
  message,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import store from "@/store";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";
import { request } from "@/utils/request";

const closeTeam = async (payload) => {
  try {
    const res = await request.post("/team/closeTeam", payload);

    if (res.code !== 0) {
      throw new Error(res.msg || "关闭开团失败");
    }

    message.success("已成功关闭开团");
  } catch (error) {
    message.error(error.msg || "操作失败，请重试");
    throw error;
  }
};

const CloseTeamModal = ({ team, visible, onClose }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [workersCount, setWorkersCount] = useState(20);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTotalEditable, setIsTotalEditable] = useState(true);
  const [countdown, setCountdown] = useState(5); // 倒计时
  const [canSubmit, setCanSubmit] = useState(false); // 是否可以点击“记录并保存”
  const dispatch = useDispatch();

  const specialDrops = [
    "玄晶",
    "沙子",
    "外观挂件",
    "毕业精简",
    "追须",
    "高价其他",
  ];

  useEffect(() => {
    if (visible) {
      loadMembers();
      form.resetFields();
      setCountdown(5); // 重置倒计时
      setCanSubmit(false); // 禁用按钮
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            setCanSubmit(true); // 启用按钮
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible, form]);

  const loadMembers = async () => {
    try {
      const guildId = store.getState().guild.guildId;
      const cachedMembers = await dispatch(fetchGuildMembersWithCache(guildId));
      setMembers(cachedMembers);
    } catch (err) {
      message.error("加载团队成员失败: " + err.message);
    }
  };

  const handleTagChange = (tag, checked) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
    form.setFieldsValue({ special_drops: nextSelectedTags });
  };

  const handleSalaryChange = (value, workersCountOverride) => {
    const numericValue = parseInt(value, 10) || 0;
    const effectiveWorkersCount = workersCountOverride ?? workersCount;
    if (isTotalEditable) {
      form.setFieldsValue({
        perPersonSalary: Math.floor(numericValue / effectiveWorkersCount),
      });
    } else {
      form.setFieldsValue({
        salary: numericValue * effectiveWorkersCount,
      });
    }
  };

  const toggleSalaryMode = () => {
    setIsTotalEditable(!isTotalEditable);
    const currentSalary = form.getFieldValue(
      isTotalEditable ? "salary" : "perPersonSalary"
    );
    handleSalaryChange(currentSalary);
  };

  const handleWorkersCountChange = (value) => {
    setWorkersCount(value);
    const currentSalary = form.getFieldValue(
      isTotalEditable ? "salary" : "perPersonSalary"
    );
    handleSalaryChange(currentSalary, value);
  };

  const memberOptions = [
    {
      label: "野人",
      value: "野人",
      key: -1,
    },
    ...members.map((member) => ({
      label: member.groupNickname,
      value: member.groupNickname,
      key: member.userId,
    })),
  ];

  const handleSaveWithoutRecord = async () => {
    const payload = {
      teamId: team.teamId,
      closeId: store.getState().user.userId, // 当前用户 ID
      summary: "", // 不记录内容
    };
    await closeTeam(payload); // 调用 closeTeam 函数
    onClose(); // 调用 onClose 回调
  };

  const handleSaveWithRecord = async () => {
    try {
      const values = await form.validateFields();
      const summary = JSON.stringify({
        salary: values.salary,
        perPersonSalary: values.perPersonSalary,
        specialDrops: values.special_drops,
        workersCount,
        bossCount: 25 - workersCount,
        blacklist: values.blacklist,
      });

      const payload = {
        teamId: team.teamId,
        closeId: store.getState().user.userId, // 当前用户 ID
        summary, // 记录内容
      };
      await closeTeam(payload); // 调用 closeTeam 函数
      onClose(); // 调用 onClose 回调
    } catch (error) {
      message.error(error.msg || "操作失败，请重试");
    }
  };

  return (
    <Modal
      title="打完收工"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="saveWithoutRecord" onClick={handleSaveWithoutRecord}>
          不记录直接保存
        </Button>,
        <Button
          key="saveWithRecord"
          type="primary"
          disabled={!canSubmit}
          onClick={handleSaveWithRecord}
        >
          {canSubmit ? "记录并保存" : `记录并保存 (${countdown}s)`}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          salary: 0,
          perPersonSalary: 0,
          special_drops: [],
          workersCount: 20,
          blacklist: null,
        }}
      >
        <Form.Item label="金团工资">
          <Row gutter={8} align="middle">
            <Col span={10}>
              <Form.Item name="salary" noStyle>
                <InputNumber
                  addonBefore="金团"
                  addonAfter="金"
                  min={0}
                  style={{ width: "100%" }}
                  disabled={!isTotalEditable}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/,/g, "")}
                  onChange={handleSalaryChange}
                  onFocus={(e) => e.target.select()}
                  controls={false}
                />
              </Form.Item>
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              <Button
                icon={<SwapOutlined />}
                onClick={toggleSalaryMode}
                shape="circle"
              />
            </Col>
            <Col span={10}>
              <Form.Item name="perPersonSalary" noStyle>
                <InputNumber
                  addonBefore="人均"
                  addonAfter="金"
                  min={0}
                  style={{ width: "100%" }}
                  disabled={isTotalEditable}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/,/g, "")}
                  onChange={handleSalaryChange}
                  onFocus={(e) => e.target.select()}
                  controls={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item name="special_drops" label="特殊掉落">
          <div>
            {specialDrops.map((tag) => (
              <Tag.CheckableTag
                key={tag}
                checked={selectedTags.indexOf(tag) > -1}
                onChange={(checked) => handleTagChange(tag, checked)}
              >
                {tag}
              </Tag.CheckableTag>
            ))}
          </div>
        </Form.Item>

        <Form.Item label="分工资情况">
          <Row align="middle">
            <Col span={4}>
              <span>打工: {workersCount}</span>
            </Col>
            <Col span={16}>
              <Slider
                min={10}
                max={25}
                value={workersCount}
                onChange={handleWorkersCountChange}
              />
            </Col>
            <Col span={4} style={{ textAlign: "right" }}>
              <span>老板: {25 - workersCount}</span>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item name="blacklist" label="黑本人">
          <AutoComplete
            allowClear
            showSearch
            placeholder="选择团员或直接输入"
            options={memberOptions}
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CloseTeamModal;
