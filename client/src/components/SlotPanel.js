import { EditOutlined } from "@ant-design/icons";
import { dpsXinfaList, naiXinfaList } from "../utils/xinfa";
import SlotCard from "./SlotCard";
import "./SlotPanel.scss";
import { useState } from "react";
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
} from "antd";
import { xinfaInfoTable } from "../utils/xinfa";

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

const EditModalAssign = () => {
  const [form] = Form.useForm();
  const onFinish = (values) => {};
  const [dataSource, setDataSource] = useState([
    { value: "张三" },
    { value: "李四" },
    { value: "王五" },
  ]);

  const onUserNicknameFilterOption = (inputValue, option) => {
    const regex = new RegExp(inputValue.split("").join(".*"));
    const list = dataSource.map((item) => item.value);
    return list.some((item) => regex.test(item));
  };

  const onXinfaFilterOption = (inputValue, option) => {
    const regex = new RegExp(inputValue.split("").join(".*"));
    const list = xinfaInfoTable[option.value].nickname;
    return list.some((item) => regex.test(item));
  };

  const onUserClear = () => {
    form.resetFields();
  };

  const xinfaOptions = Object.keys(xinfaInfoTable).map((xinfa) => {
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

  return (
    <Form
      form={form}
      onFinish={onFinish}
      labelCol={{
        span: 4,
      }}
    >
      <Form.Item
        name="user"
        label="指定团员"
        rules={[{ required: true, message: "请填写昵称" }]}
      >
        <AutoComplete
          allowClear
          backfill
          placeholder="选择团员或填写编外人员"
          options={dataSource}
          filterOption
        />
      </Form.Item>
      <Form.Item name="character_name" label="游戏角色">
        <AutoComplete
          allowClear
          backfill
          placeholder=""
          options={dataSource}
          filterOption
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
          options={xinfaOptions}
          style={{ width: 300 }}
          filterOption={onXinfaFilterOption}
        />
      </Form.Item>

      <Form.Item>
        <Flex justify="center">
          <Space>
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

const EditModal = ({
  slot,
  index,
  open,
  setOpen,
  onlyRule = false,
  updateSlot,
}) => {
  const [curRule, setCurRule] = useState(
    slot.rules || {
      allow_rich: false,
      allow_xinfa_list: [],
    }
  );

  const onEditModalCancel = () => {
    setOpen(false);
  };

  const onSave = () => {
    slot = {
      ...slot,
      rules: curRule,
    };
    updateSlot(index, slot);
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
      children: <EditModalAssign />,
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

const EditSlotCard = ({ slot, index, onlyRule, updateSlot }) => {
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
        <SlotCard cardInfo={slot} index={index} />
        {showEditMask && (
          <div className="mask">
            <EditOutlined className="mask-icon" />
          </div>
        )}
      </div>
      <EditModal
        slot={slot}
        index={index}
        open={showEditModal}
        setOpen={setShowEditModal}
        onlyRule={onlyRule}
        updateSlot={updateSlot}
      />
    </>
  );
};

const SlotXiaoDui = ({ slotD, indexD, mode, updateSlot }) => {
  return (
    <div className="slot-xiaodui">
      {slotD.map((slot, index) => {
        return mode === "edit" ? (
          <EditSlotCard
            slot={slot}
            index={indexD * 5 + index}
            updateSlot={updateSlot}
          />
        ) : mode === "edit-only-rule" ? (
          <EditSlotCard
            slot={slot}
            index={indexD * 5 + index}
            updateSlot={updateSlot}
            onlyRule={true}
          />
        ) : (
          <SlotCard cardInfo={slot} index={indexD * 5 + index} />
        );
      })}
    </div>
  );
};

const SlotPanel = ({ initialSlotsT, mode = "show", onSlotChange }) => {
  console.log("SlotPanel", initialSlotsT);
  const [slotsT, setSlotsT] = useState(
    initialSlotsT || Array(5).fill(Array(5).fill({}))
  );

  const updateSlot = (index, updatedSlot) => {
    console.log("updateSlot", index, updatedSlot);
    const teamIndex = Math.floor(index / 5);
    const slotIndex = index % 5;
    const updatedSlotsT = [...slotsT];
    console.log("updateSlotT", index, updatedSlotsT);
    updatedSlotsT[teamIndex] = [...updatedSlotsT[teamIndex]];
    updatedSlotsT[teamIndex][slotIndex] = updatedSlot;
    setSlotsT(updatedSlotsT);
    if (onSlotChange) {
      onSlotChange(updatedSlotsT); // 调用回调函数，将更新后的数据传递给父组件
    }
  };

  return (
    <div className="slot-panel" style={{ display: "flex" }}>
      {slotsT.map((slotD, indexD) => {
        return (
          <SlotXiaoDui
            slotD={slotD}
            indexD={indexD}
            mode={mode}
            updateSlot={updateSlot}
          />
        );
      })}
    </div>
  );
};

export default SlotPanel;
