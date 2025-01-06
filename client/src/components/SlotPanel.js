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
  Space,
  Tabs,
  Typography,
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

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="user" label="指定团员">
        <AutoComplete
          allowClear
          backfill
          placeholder="选择团员或填写编外人员"
          options={dataSource}
          filterOption
        ></AutoComplete>
      </Form.Item>
    </Form>
  );
};

const EditModal = ({ slot, index, open, setOpen }) => {
  const onEditModalCancel = () => {
    setOpen(false);
  };

  const onTabChange = (key) => {
    lastModalTab = key;
  };

  const [curRule, setCurRule] = useState({});

  const tabs = [
    {
      key: "rule",
      label: "规则",
      children: <EditModalRule curRule={curRule} setCurRule={setCurRule} />,
    },
    { key: "assign", label: "钦定", children: <EditModalAssign /> },
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
      footer={null}
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

const EditSlotCard = ({ slot, index }) => {
  const [showEditMask, setShowEditMask] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const onEditMaskClick = () => {
    setShowEditModal(true);
  };

  const onEditMaskMouseEnter = () => {
    setShowEditMask(true);
  };
  const onEditMaskMouseLeave = () => {
    setShowEditMask(false);
  };

  return (
    <>
      <div
        className="slot-card"
        onClick={onEditMaskClick}
        onMouseEnter={onEditMaskMouseEnter}
        onMouseLeave={onEditMaskMouseLeave}
      >
        <SlotCard slot={slot} index={index} />
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
      />
    </>
  );
};

const SlotXiaoDui = ({ slotD, indexD, mode }) => {
  return (
    <div className="slot-xiaodui">
      {slotD.map((slot, index) => {
        return mode === "edit" ? (
          <EditSlotCard slot={slot} index={indexD * 5 + index} />
        ) : (
          <SlotCard slot={slot} index={index} />
        );
      })}
    </div>
  );
};

const SlotPanel = ({ slotsT, mode = "show" }) => {
  slotsT = slotsT || Array(5).fill(Array(5).fill({}));
  return (
    <div className="slot-panel" style={{ display: "flex" }}>
      {slotsT.map((slotD, indexD) => {
        return <SlotXiaoDui slotD={slotD} indexD={indexD} mode={mode} />;
      })}
    </div>
  );
};

export default SlotPanel;
