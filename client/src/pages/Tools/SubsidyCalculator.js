import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  Typography,
  Form,
  Checkbox,
  Card,
  Row,
  Col,
  Avatar,
  Modal,
  message,
  Tooltip,
} from "antd";
import { PlusOutlined, MinusCircleOutlined, EditOutlined, UserAddOutlined } from "@ant-design/icons";
import { xinfaInfoTable } from "@/utils/xinfa";

const SubsidyCalculator = () => {
  // 定义表格列的初始状态
  const initialColumns = [
    {
      title: "人员",
      dataIndex: "person",
      key: "person",
      removable: false,
      width: 120,
      render: (text, record) => {
        // 检查是否是默认成员
        if (record.isDefaultMember && record.personKey) {
          // 使用键值渲染默认成员的头像和名称
          return (
            <Space>
              <Avatar src={`/xinfa/${xinfaInfoTable[record.personKey].icon}`} />
              <span>{xinfaInfoTable[record.personKey].nickname[0]}</span>
            </Space>
          );
        }

        // 非默认成员使用可编辑文本
        return (
          <Typography.Text
            editable={{
              onChange: (newValue) => handleCellChange(record.key, "person", newValue),
            }}
          >
            {record.person || `队员${record.key + 1}`}
          </Typography.Text>
        );
      },
    },
    {
      title: "T/奶补",
      dataIndex: "tankHealBonus",
      key: "tankHealBonus",
      editable: true,
      removable: true,
      amount: 2000, // 默认补贴金额
      width: 120,
      render: (_, record) => (
        <div
          style={{ width: "100%", cursor: "pointer", textAlign: "center" }}
          onClick={() => handleCheckboxChange(record.key, "tankHealBonus", !record.tankHealBonus)}
        >
          <Checkbox checked={record.tankHealBonus} indeterminate={false} />
        </div>
      ),
    },
    {
      title: "控补",
      dataIndex: "controlBonus",
      key: "controlBonus",
      editable: true,
      removable: true,
      amount: 3000, // 默认补贴金额
      width: 120,
      render: (_, record) => (
        <div
          style={{ width: "100%", cursor: "pointer", textAlign: "center" }}
          onClick={() => handleCheckboxChange(record.key, "controlBonus", !record.controlBonus)}
        >
          <Checkbox checked={record.controlBonus} indeterminate={false} />
        </div>
      ),
    },
    {
      title: "金额",
      dataIndex: "totalAmount",
      key: "totalAmount",
      removable: false,
      width: 120,
      render: (_, record) => {
        // 记录并显示已计算好的金额
        return record.calculatedAmount || 0;
      },
    },
  ];

  // 默认的行数据（9行）
  const generateInitialData = () => {
    const defaultNames = ["butian", "yunchang", "lijing", "xiangzhi", "lingsu", "tielao", "mingzun", "xisui", "tiegu"];
    return Array(defaultNames.length)
      .fill()
      .map((_, index) => ({
        key: index,
        personKey: defaultNames[index], // 存储键值而不是React组件
        isDefaultMember: true, // 标记为默认成员，不可编辑
        tankHealBonus: true, // 默认勾选
        controlBonus: true, // 默认勾选
      }));
  };

  const [columns, setColumns] = useState(initialColumns);
  const [data, setData] = useState(generateInitialData());
  const [editingColumn, setEditingColumn] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [batchAddModalVisible, setBatchAddModalVisible] = useState(false);
  const [batchAddText, setBatchAddText] = useState("");

  // 处理复选框变化
  const handleCheckboxChange = (key, dataIndex, checked) => {
    setData((prevData) => {
      const newData = [...prevData];
      const targetIndex = newData.findIndex((item) => item.key === key);
      if (targetIndex >= 0) {
        const item = { ...newData[targetIndex] };
        item[dataIndex] = checked;
        newData[targetIndex] = item;
        return newData;
      }
      return prevData;
    });
  };

  // 处理单元格文本变化
  const handleCellChange = (key, dataIndex, value) => {
    setData((prevData) => {
      const newData = [...prevData];
      const targetIndex = newData.findIndex((item) => item.key === key);
      if (targetIndex >= 0) {
        const item = { ...newData[targetIndex] };
        item[dataIndex] = value;
        newData[targetIndex] = item;
        return newData;
      }
      return prevData;
    });
  };

  // 计算行总金额
  // 使用 memoization 避免不必要的重计算
  const calculateRowTotal = React.useCallback(
    (record) => {
      let total = 0;
      columns.forEach((column) => {
        if (
          column.key !== "person" &&
          column.key !== "totalAmount" &&
          column.key !== "action" &&
          record[column.dataIndex]
        ) {
          total += column.amount || 0;
        }
      });
      console.log(`计算行 ${record.key} 的总金额: ￥${total}`);
      return total;
    },
    [columns]
  );

  // 计算总金额和每行金额
  useEffect(() => {
    let sum = 0;
    const updatedData = data.map((record) => {
      // 为每行计算金额并保存
      const rowAmount = calculateRowTotal(record);
      sum += rowAmount;
      return { ...record, calculatedAmount: rowAmount };
    });

    // 更新总金额
    setTotalAmount(sum);

    // 如果金额有变化，更新数据
    if (JSON.stringify(updatedData) !== JSON.stringify(data)) {
      setData(updatedData);
    }
  }, [data, columns, calculateRowTotal]);

  // 添加新行
  const handleAddRow = () => {
    const newKey = data.length > 0 ? Math.max(...data.map((item) => item.key)) + 1 : 0;
    const newRow = {
      key: newKey,
      person: `队员${newKey + 1}`,
      isDefaultMember: false, // 标记为非默认成员，可以编辑
    };

    // 为新行添加所有列的默认值
    columns.forEach((column) => {
      if (column.dataIndex !== "person" && column.dataIndex !== "totalAmount") {
        newRow[column.dataIndex] = true; // 默认勾选
      }
    });

    setData([...data, newRow]);
  };

  // 解析方括号包围的人名
  const parseNames = (text) => {
    const nameRegex = /\[(.*?)\]/g;
    const names = [];
    let match;

    while ((match = nameRegex.exec(text)) !== null) {
      if (match[1].trim() !== "") {
        names.push(match[1].trim());
      }
    }

    return names;
  };

  // 批量添加人员
  const handleBatchAddPeople = () => {
    if (!batchAddText) {
      message.warning("请输入人员名单");
      return;
    }

    const names = parseNames(batchAddText);

    if (names.length === 0) {
      message.warning("未能识别任何人员，请检查格式是否正确（例如：[张三][李四][王五]）");
      return;
    }

    const newData = [...data];
    let lastKey = data.length > 0 ? Math.max(...data.map((item) => item.key)) : -1;

    const newRows = names.map((name) => {
      lastKey++;
      const newRow = {
        key: lastKey,
        person: name,
        isDefaultMember: false, // 标记为非默认成员，可以编辑
      };

      // 为新行添加所有列的默认值
      columns.forEach((column) => {
        if (column.dataIndex !== "person" && column.dataIndex !== "totalAmount") {
          newRow[column.dataIndex] = true; // 默认勾选
        }
      });

      return newRow;
    });

    setData([...newData, ...newRows]);
    message.success(`已成功添加 ${names.length} 名人员`);
    setBatchAddModalVisible(false);
    setBatchAddText("");
  };

  // 删除行
  const handleDeleteRow = (key) => {
    setData(data.filter((item) => item.key !== key));
  };

  // 添加新列
  const handleAddColumn = () => {
    const newColumnKey = `customColumn${columns.length}`;
    const newColumn = {
      title: `自定义补贴${columns.length - 3}`,
      dataIndex: newColumnKey,
      key: newColumnKey,
      editable: true,
      removable: true,
      amount: 1000, // 默认补贴金额
      width: 120,
      render: (_, record) => (
        <div
          style={{ width: "100%", cursor: "pointer", textAlign: "center" }}
          onClick={() => handleCheckboxChange(record.key, newColumnKey, !record[newColumnKey])}
        >
          <Checkbox checked={record[newColumnKey]} indeterminate={false} />
        </div>
      ),
    };

    // 在倒数第二个位置插入新列（金额列之前）
    const newColumns = [...columns];
    newColumns.splice(newColumns.length - 1, 0, newColumn);
    setColumns(newColumns);

    // 为所有行添加新列的数据
    setData(data.map((item) => ({ ...item, [newColumnKey]: true })));
  };

  // 删除列
  const handleDeleteColumn = (key) => {
    setColumns(columns.filter((column) => column.key !== key));
  };

  // 处理列标题编辑
  const handleColumnTitleEdit = (columnKey, newTitle) => {
    setColumns(columns.map((column) => (column.key === columnKey ? { ...column, title: newTitle } : column)));
    setEditingColumn(null);
  };

  // 处理补贴金额变更
  const handleAmountChange = (columnKey, amount) => {
    // 更新列数据
    setColumns((prevColumns) =>
      prevColumns.map((column) => (column.key === columnKey ? { ...column, amount: amount } : column))
    );

    // 强制触发行数据更新
    setData((prevData) =>
      prevData.map((record) => ({
        ...record,
        _forceUpdate: Date.now(), // 添加一个时间戳来强制数据更新
      }))
    );
  };

  // 自定义表头渲染
  const renderColumnTitle = (column) => {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
          {editingColumn === column.key ? (
            <Input
              size="small"
              defaultValue={column.title}
              onPressEnter={(e) => handleColumnTitleEdit(column.key, e.target.value)}
              onBlur={(e) => handleColumnTitleEdit(column.key, e.target.value)}
              autoFocus
            />
          ) : (
            <>
              <Typography.Text>{column.title}</Typography.Text>
              {column.editable && (
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingColumn(column.key)} />
              )}
            </>
          )}
          {column.removable && (
            <Popconfirm
              title="确定要删除此列吗？"
              onConfirm={() => handleDeleteColumn(column.key)}
              okText="是"
              cancelText="否"
            >
              <Button type="text" size="small" icon={<MinusCircleOutlined />} danger />
            </Popconfirm>
          )}
        </div>
        {column.key !== "person" && column.key !== "totalAmount" && (
          <InputNumber
            size="small"
            min={0}
            value={column.amount}
            onChange={(value) => handleAmountChange(column.key, value)}
            onStep={(value) => handleAmountChange(column.key, value)}
            step={100}
            style={{ width: "100%" }}
          />
        )}
      </div>
    );
  };

  // 生成最终的表格列配置
  const tableColumns = columns.map((col) => ({
    ...col,
    title: renderColumnTitle(col),
  }));

  // 添加操作列
  const actionColumn = {
    title: "操作",
    key: "action",
    fixed: "right",
    width: 60,
    render: (_, record) => (
      <Popconfirm title="确定要删除此行吗？" onConfirm={() => handleDeleteRow(record.key)} okText="是" cancelText="否">
        <Button type="text" danger icon={<MinusCircleOutlined />} style={{ padding: "0 8px" }} />
      </Popconfirm>
    ),
  };

  const finalColumns = [...tableColumns, actionColumn];

  return (
    <div>
      <Card title="补贴计算器" bordered={false} style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
            添加人员
          </Button>
          <Tooltip title="从游戏中复制带方括号的人名列表，例如：[丐箩箩][扯秧秧][幸福会长大]">
            <Button icon={<UserAddOutlined />} onClick={() => setBatchAddModalVisible(true)}>
              批量添加人员
            </Button>
          </Tooltip>
          <Button icon={<PlusOutlined />} onClick={handleAddColumn}>
            添加补贴类型
          </Button>
        </Space>

        {/* 批量添加人员的模态框 */}
        <Modal
          title="批量添加人员"
          open={batchAddModalVisible}
          onOk={handleBatchAddPeople}
          onCancel={() => {
            setBatchAddModalVisible(false);
            setBatchAddText("");
          }}
          okText="添加"
          cancelText="取消"
        >
          <p>请粘贴从游戏中复制的人员列表，格式为：[丐箩箩][扯秧秧][幸福会长大]</p>
          <Input.TextArea
            rows={4}
            placeholder="例如：[丐箩箩][扯秧秧][幸福会长大]"
            value={batchAddText}
            onChange={(e) => setBatchAddText(e.target.value)}
          />
        </Modal>

        <Table
          columns={finalColumns}
          dataSource={data}
          pagination={false}
          bordered
          scroll={{ x: "max-content" }}
          rowKey="key" // 确保每行有唯一标识
        />

        <Row justify="end" style={{ marginTop: 16 }}>
          <Col>
            <Typography.Title level={4}>总补贴：{totalAmount}</Typography.Title>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SubsidyCalculator;
