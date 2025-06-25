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
  Select,
  DatePicker,
  Input,
} from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import store from "@/store";
import { fetchGuildMembersWithCache } from "@/store/modules/guild";
import { request } from "@/utils/request";
import dayjs from "dayjs";
import { dungeonsTable } from "@/utils/dungeons";

const AddHistoryRecordModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [members, setMembers] = useState([]);
  const [workersCount, setWorkersCount] = useState(25);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTotalEditable, setIsTotalEditable] = useState(true);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const specialDrops = [
    { name: "玄晶", color: "gold" },
    { name: "沙子", color: "blue" },
    { name: "外观挂件", color: "blue" },
    { name: "毕业精简", color: "blue" },
    { name: "追须", color: "blue" },
    { name: "高价其他", color: "blue" },
    { name: "T腰坠", color: "black" },
    { name: "奶腰坠", color: "black" },
    { name: "烂掉的精简", color: "black" },
    { name: "烂掉的特效武器", color: "black" },
  ];

  useEffect(() => {
    if (visible) {
      loadMembers();
      form.resetFields();
      // 重置已选标签
      setSelectedTags([]);
      // 设置默认值
      form.setFieldsValue({
        date: dayjs(),
        special_drops: [],
        workersCount: 20,
      });
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
    const nextSelectedTags = checked ? [...selectedTags, tag] : selectedTags.filter((t) => t !== tag);
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
    const currentSalary = form.getFieldValue(isTotalEditable ? "salary" : "perPersonSalary");
    handleSalaryChange(currentSalary);
  };

  const handleWorkersCountChange = (value) => {
    setWorkersCount(value);
    const currentSalary = form.getFieldValue(isTotalEditable ? "salary" : "perPersonSalary");
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const date = values.date;

      // 第一步：创建开团
      const createTeamPayload = {
        title: `${date.format("MM月DD日")} ${values.dungeons}`,
        dungeons: values.dungeons,
        teamTime: date.toISOString(),
        rule: JSON.stringify(Array(25).fill({})),
        notice: values.notice || "",
        guildId: store.getState().guild.guildId,
        createrId: store.getState().user.userId,
        isLock: true,
        isHidden: false,
      };

      const createRes = await request.post("/team/createTeam", createTeamPayload);

      if (createRes.code !== 0) {
        throw new Error(createRes.msg || "创建开团失败");
      }

      const teamId = createRes.data.teamId;

      // 第二步：关闭开团并添加记录
      const summary = JSON.stringify({
        salary: values.salary,
        perPersonSalary: values.perPersonSalary,
        specialDrops: values.special_drops,
        workersCount,
        bossCount: 25 - workersCount,
        blacklist: values.blacklist,
      });

      const closePayload = {
        teamId,
        closeId: store.getState().user.userId,
        summary,
      };

      const closeRes = await request.post("/team/closeTeam", closePayload);

      if (closeRes.code !== 0) {
        throw new Error(closeRes.msg || "关闭开团失败");
      }

      onSuccess();
    } catch (error) {
      message.error(error.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="添加历史记录"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          提交记录
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
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date" label="开团日期" rules={[{ required: true, message: "请选择日期" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dungeons" label="副本" rules={[{ required: true, message: "请选择副本" }]}>
              <Select options={dungeonsTable} placeholder="请选择副本" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notice" label="备注说明">
          <Input.TextArea placeholder="可选的备注信息" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

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
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")}
                  parser={(value) => value?.replace(/,/g, "")}
                  onChange={handleSalaryChange}
                  onFocus={(e) => e.target.select()}
                  controls={false}
                />
              </Form.Item>
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              <Button icon={<SwapOutlined />} onClick={toggleSalaryMode} shape="circle" />
            </Col>
            <Col span={10}>
              <Form.Item name="perPersonSalary" noStyle>
                <InputNumber
                  addonBefore="人均"
                  addonAfter="金"
                  min={0}
                  style={{ width: "100%" }}
                  disabled={isTotalEditable}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{4})(?!\d))/g, ",")}
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
            {specialDrops.map((item) => (
              <Tag.CheckableTag
                key={item.name}
                checked={selectedTags.indexOf(item.name) > -1}
                onChange={(checked) => handleTagChange(item.name, checked)}
                style={{
                  backgroundColor: selectedTags.indexOf(item.name) > -1 ? item.color : "transparent",
                  color: selectedTags.indexOf(item.name) > -1 ? "white" : item.color,
                  borderColor: item.color,
                  marginBottom: "8px",
                  marginRight: "8px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {item.name}
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
              <Slider min={10} max={25} value={workersCount} onChange={handleWorkersCountChange} />
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

export default AddHistoryRecordModal;
