import { useState, useEffect, useCallback } from "react";
import { Typography, InputNumber, Switch, Button, Table, Space, message, Popconfirm, Input, Row, Col } from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  ReloadOutlined,
  ClearOutlined,
  DeleteOutlined,
  PlusOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const SubsidyCalculatorV3 = () => {
  // 默认补贴项配置
  const DEFAULT_ITEMS = [
    { id: "t-subsidy", name: "T补", people: 4, expectedAmount: 3000, isFixed: false, isDeletable: true },
    { id: "milk-subsidy", name: "奶补", people: 5, expectedAmount: 3000, isFixed: false, isDeletable: true },
    { id: "water-fish", name: "水煮鱼", people: 1, expectedAmount: 1000, isFixed: true, isDeletable: true },
    { id: "jade-flute", name: "玉笛", people: 1, expectedAmount: 1500, isFixed: true, isDeletable: true },
    { id: "twenty-four", name: "二十四", people: 1, expectedAmount: 1500, isFixed: true, isDeletable: true },
    { id: "tongze", name: "同泽", people: 1, expectedAmount: 500, isFixed: true, isDeletable: true },
  ];

  // 状态管理
  const [totalAmount, setTotalAmount] = useState(""); // 总金团
  const [maxSubsidy, setMaxSubsidy] = useState(0); // 最大可补贴金额
  const [calculateMode, setCalculateMode] = useState("proportion"); // 计算模式：proportion(等比例) / equal(等金额)
  const [subsidyItems, setSubsidyItems] = useState([...DEFAULT_ITEMS]); // 补贴项列表
  const [customItemCounter, setCustomItemCounter] = useState(1); // 自定义项计数器

  // 计算最大可补贴金额
  useEffect(() => {
    if (totalAmount && !isNaN(totalAmount)) {
      setMaxSubsidy(Math.floor(totalAmount * 0.2));
    } else {
      setMaxSubsidy(0);
    }
  }, [totalAmount]);

  // 计算实补金额
  const calculateActualAmounts = useCallback(() => {
    if (!totalAmount || maxSubsidy === 0) {
      // 没有总金团设置，单项实补金额等于应补金额
      return subsidyItems.map((item) => ({
        ...item,
        actualUnitAmount: item.expectedAmount,
        totalActualAmount: item.people * item.expectedAmount,
        deductionInfo: null,
        hasError: false,
      }));
    }

    // 计算总应补金额（人数 × 应补金额的总和）
    const totalExpected = subsidyItems.reduce((sum, item) => sum + item.people * item.expectedAmount, 0);

    if (totalExpected <= maxSubsidy) {
      // 总应补不超过最大补贴，按原价补贴
      return subsidyItems.map((item) => ({
        ...item,
        actualUnitAmount: item.expectedAmount,
        totalActualAmount: item.people * item.expectedAmount,
        deductionInfo: null,
        hasError: false,
      }));
    }

    // 总应补超过最大补贴，需要扣除
    const fixedItems = subsidyItems.filter((item) => item.isFixed);
    const floatingItems = subsidyItems.filter((item) => !item.isFixed);

    // 计算锁定项总补贴
    const totalFixedSubsidy = fixedItems.reduce((sum, item) => sum + item.people * item.expectedAmount, 0);
    const remainingAmount = maxSubsidy - totalFixedSubsidy;

    // 检查固定项是否超过最大补贴
    const hasFixedError = totalFixedSubsidy > maxSubsidy;

    if (calculateMode === "proportion") {
      // 等比例扣除模式
      const totalFloatingExpected = floatingItems.reduce((sum, item) => sum + item.people * item.expectedAmount, 0);

      if (totalFloatingExpected === 0) {
        // 没有浮动项，所有项都是固定项
        return subsidyItems.map((item) => ({
          ...item,
          actualUnitAmount: item.expectedAmount,
          totalActualAmount: item.people * item.expectedAmount,
          deductionInfo: null,
          hasError: hasFixedError,
        }));
      }

      if (remainingAmount >= totalFloatingExpected) {
        // 剩余金额足够浮动项或没有浮动项
        return subsidyItems.map((item) => ({
          ...item,
          actualUnitAmount: item.expectedAmount,
          totalActualAmount: item.people * item.expectedAmount,
          deductionInfo: null,
          hasError: hasFixedError,
        }));
      } else {
        // 浮动项按比例扣除
        const ratio = remainingAmount / totalFloatingExpected;
        return subsidyItems.map((item) => {
          const originalUnitAmount = item.expectedAmount;
          if (item.isFixed) {
            return {
              ...item,
              actualUnitAmount: originalUnitAmount,
              totalActualAmount: item.people * originalUnitAmount,
              deductionInfo: null,
              hasError: hasFixedError,
            };
          } else {
            const actualUnitAmount = Math.floor(originalUnitAmount * ratio);
            const totalActualAmount = actualUnitAmount * item.people;
            const deduction = originalUnitAmount - actualUnitAmount;
            const deductionPercent = originalUnitAmount > 0 ? ((deduction / originalUnitAmount) * 100).toFixed(1) : 0;
            const isNegative = actualUnitAmount < 0;
            return {
              ...item,
              actualUnitAmount,
              totalActualAmount,
              deductionInfo:
                deduction !== 0
                  ? `${isNegative ? "负补贴" : "扣除"}${Math.abs(deduction)}，${deductionPercent}%`
                  : null,
              hasError: hasFixedError,
            };
          }
        });
      }
    } else {
      // 等金额扣除模式
      const totalFloatingPeople = floatingItems.reduce((sum, item) => sum + item.people, 0);
      const totalFloatingExpected = floatingItems.reduce((sum, item) => sum + item.people * item.expectedAmount, 0);

      if (totalFloatingPeople === 0) {
        // 没有浮动人员，锁定项正常补贴
        return subsidyItems.map((item) => ({
          ...item,
          actualUnitAmount: item.expectedAmount,
          totalActualAmount: item.people * item.expectedAmount,
          deductionInfo: null,
          hasError: hasFixedError,
        }));
      }

      if (remainingAmount >= totalFloatingExpected) {
        // 剩余金额足够浮动项按原价补贴
        return subsidyItems.map((item) => ({
          ...item,
          actualUnitAmount: item.expectedAmount,
          totalActualAmount: item.people * item.expectedAmount,
          deductionInfo: null,
          hasError: hasFixedError,
        }));
      }

      // 需要扣除，计算每人扣除金额
      const totalDeduction = totalFloatingExpected - remainingAmount;
      const perPersonDeduction = totalDeduction / totalFloatingPeople;

      return subsidyItems.map((item) => {
        const originalUnitAmount = item.expectedAmount;
        if (item.isFixed) {
          // 锁定项始终得到原价补贴
          return {
            ...item,
            actualUnitAmount: originalUnitAmount,
            totalActualAmount: item.people * originalUnitAmount,
            deductionInfo: null,
            hasError: hasFixedError,
          };
        } else {
          // 浮动项：原价 - 每人扣除金额（允许负数）
          const actualUnitAmount = Math.floor(originalUnitAmount - perPersonDeduction);
          const totalActualAmount = actualUnitAmount * item.people;
          const actualDeduction = originalUnitAmount - actualUnitAmount;
          const deductionPercent =
            originalUnitAmount > 0 ? ((actualDeduction / originalUnitAmount) * 100).toFixed(1) : 0;
          const isNegative = actualUnitAmount < 0;
          return {
            ...item,
            actualUnitAmount,
            totalActualAmount,
            deductionInfo:
              actualDeduction !== 0
                ? `${isNegative ? "负补贴" : "扣除"}${Math.abs(actualDeduction)}，${deductionPercent}%`
                : null,
            hasError: hasFixedError,
          };
        }
      });
    }
  }, [subsidyItems, totalAmount, maxSubsidy, calculateMode]);

  // 获取计算后的数据
  const calculatedItems = calculateActualAmounts();

  // 计算总计
  const totalPeopleCount = calculatedItems.reduce((sum, item) => sum + item.people, 0);
  const totalExpectedAmount = calculatedItems.reduce((sum, item) => sum + item.people * item.expectedAmount, 0);
  const totalActualSubsidy = calculatedItems.reduce((sum, item) => sum + item.totalActualAmount, 0);

  // 更新补贴项
  const updateSubsidyItem = (id, field, value) => {
    setSubsidyItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // 删除补贴项
  const deleteSubsidyItem = (id) => {
    setSubsidyItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 切换固定状态
  const toggleFixedStatus = (id) => {
    setSubsidyItems((prev) => prev.map((item) => (item.id === id ? { ...item, isFixed: !item.isFixed } : item)));
  };

  // 直接添加新补贴项
  const handleAddNewItem = () => {
    const newItem = {
      id: `custom-${customItemCounter}`,
      name: "新补贴",
      people: 1,
      expectedAmount: 1000,
      isFixed: false,
      isDeletable: true,
    };
    setSubsidyItems((prev) => [...prev, newItem]);
    setCustomItemCounter((prev) => prev + 1);
  };

  // 保存配置到本地存储
  const handleSaveConfig = () => {
    const config = {
      subsidyItems: subsidyItems.map((item) => ({
        ...item,
        // 只保存人数和应补金额，其他保持默认
        people: item.people,
        expectedAmount: item.expectedAmount,
        isFixed: item.isFixed,
      })),
      customItemCounter,
      totalAmount: totalAmount || "",
    };
    localStorage.setItem("subsidy-calculator-v3-config", JSON.stringify(config));
    message.success("配置已保存到本地");
  };

  // 从本地存储加载配置
  const handleLoadConfig = () => {
    try {
      const savedConfig = localStorage.getItem("subsidy-calculator-v3-config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.subsidyItems) {
          setSubsidyItems(config.subsidyItems);
        }
        if (config.customItemCounter) {
          setCustomItemCounter(config.customItemCounter);
        }
        if (config.totalAmount) {
          setTotalAmount(config.totalAmount);
        }
        message.success("配置已从本地加载");
      } else {
        message.info("未找到已保存的配置");
      }
    } catch (error) {
      message.error("加载配置失败");
    }
  };

  // 恢复默认配置
  const handleRestoreDefault = () => {
    setSubsidyItems([...DEFAULT_ITEMS]);
    setTotalAmount("");
    setCustomItemCounter(1);
    message.success("已恢复默认配置");
  };

  // 清空数据
  const handleClearData = () => {
    setSubsidyItems([]);
    setTotalAmount("");
    message.success("已清空所有数据");
  };

  // 表格列定义
  const columns = [
    {
      title: "补贴项",
      dataIndex: "name",
      key: "name",
      width: 120,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateSubsidyItem(record.id, "name", e.target.value)}
          style={{ border: "none", padding: 0, background: "transparent" }}
        />
      ),
    },
    {
      title: "人数",
      dataIndex: "people",
      key: "people",
      width: 80,
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(val) => updateSubsidyItem(record.id, "people", val || 0)}
          min={0}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "应补金额",
      dataIndex: "expectedAmount",
      key: "expectedAmount",
      width: 100,
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(val) => updateSubsidyItem(record.id, "expectedAmount", val || 0)}
          min={0}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "实补金额",
      dataIndex: "actualUnitAmount",
      key: "actualUnitAmount",
      width: 150,
      render: (value, record) => (
        <div>
          <Text strong style={{ color: value > 0 ? "#52c41a" : "#ff4d4f" }}>
            {value}
          </Text>
          {record.deductionInfo && (
            <div style={{ fontSize: "11px", color: "#ff7875", lineHeight: 1.2 }}>（{record.deductionInfo}）</div>
          )}
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={record.isFixed ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={() => toggleFixedStatus(record.id)}
            title={record.isFixed ? "取消固定金额" : "固定金额"}
            style={{ color: record.isFixed ? "#ff7875" : "#d9d9d9" }}
          />
          <Popconfirm
            title="确定删除这项补贴吗？"
            onConfirm={() => deleteSubsidyItem(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "12px", height: "100%" }}>
      <Title level={4} style={{ margin: "0 0 16px 0" }}>
        补贴计算器V3
      </Title>

      {/* 头部控制区域 */}
      <div style={{ marginBottom: "16px" }}>
        {/* 第一行：总金团和最大补贴 */}
        <Row gutter={[16, 8]} align="middle" style={{ marginBottom: "8px" }}>
          <Col>
            <Text>总金团：</Text>
            <InputNumber
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="输入总金团"
              style={{ width: "150px" }}
              min={0}
            />
          </Col>
          <Col>
            <Text>最大补贴 20%：</Text>
            <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
              {maxSubsidy}
            </Text>
          </Col>
          <Col>
            <Text style={{ marginRight: 8 }}>补贴模式：</Text>
            <Switch
              checked={calculateMode === "equal"}
              onChange={(checked) => setCalculateMode(checked ? "equal" : "proportion")}
              checkedChildren="等金额"
              unCheckedChildren="等比例"
            />
          </Col>
        </Row>

        {/* 第二行：便捷按钮 */}
        <Row gutter={[8, 8]}>
          <Col>
            <Button icon={<SaveOutlined />} onClick={handleSaveConfig}>
              保存配置
            </Button>
          </Col>
          <Col>
            <Button icon={<UploadOutlined />} onClick={handleLoadConfig}>
              加载配置
            </Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleRestoreDefault}>
              恢复默认
            </Button>
          </Col>
          <Col>
            <Popconfirm title="确定清空所有数据吗？" onConfirm={handleClearData} okText="确定" cancelText="取消">
              <Button icon={<ClearOutlined />} danger>
                清空数据
              </Button>
            </Popconfirm>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNewItem}>
              新增补贴
            </Button>
          </Col>
        </Row>
      </div>

      {/* 主表格 */}
      <div style={{ height: "calc(100% - 200px)" }}>
        <Table
          columns={columns}
          dataSource={calculatedItems}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ y: "calc(100% - 120px)" }}
        />

        {/* 统计信息 */}
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#f6f6f6",
            borderRadius: "6px",
            border: "1px solid #d9d9d9",
          }}
        >
          <Row gutter={[24, 8]}>
            <Col>
              <Text strong>总人数：</Text>
              <Text style={{ color: "#1890ff", fontSize: "16px" }}>{totalPeopleCount}</Text>
            </Col>
            <Col>
              <Text strong>总应补金额：</Text>
              <Text style={{ color: "#1890ff", fontSize: "16px" }}>{totalExpectedAmount}</Text>
              <Text style={{ fontSize: "12px", color: "#666" }}>（人数×应补）</Text>
            </Col>
            <Col>
              <Text strong>实际补贴总计：</Text>
              <Text style={{ color: "#52c41a", fontSize: "16px", fontWeight: "bold" }}>{totalActualSubsidy}</Text>
            </Col>
            {totalExpectedAmount > maxSubsidy && maxSubsidy > 0 && (
              <Col>
                <Text style={{ color: "#ff7875" }}>应补超出最大补贴：{totalExpectedAmount - maxSubsidy}</Text>
              </Col>
            )}
            {calculatedItems.some((item) => item.hasError) && (
              <Col span={24}>
                <Text style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: "14px" }}>
                  ⚠️ 错误：固定项总补贴超出最大补贴限额！请调整固定项设置。
                </Text>
              </Col>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default SubsidyCalculatorV3;
