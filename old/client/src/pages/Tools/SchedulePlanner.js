import { useState } from "react";
import { Typography, Input, Button, Card, Space, message, Divider, Row, Col, Tag, Empty } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const SchedulePlanner = () => {
  // 状态管理
  const [constraints, setConstraints] = useState([]); // 约束条件列表
  const [memberName, setMemberName] = useState(""); // 当前成员名字
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]); // 选中的天数，默认全选
  const [unavailableReasons, setUnavailableReasons] = useState({}); // 不能来的原因，key是dayIndex，value是原因
  const [results, setResults] = useState(null); // 规划结果

  // 一周的天数
  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  // 周几的颜色映射
  const dayColors = ["#2db7f5", "#87d068", "#108ee9", "#f50", "#faad14", "#722ed1", "#eb2f96"];

  // 切换选中的天数
  const handleToggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
      // 如果重新选中，删除该天的不能来原因
      const newReasons = { ...unavailableReasons };
      delete newReasons[dayIndex];
      setUnavailableReasons(newReasons);
    }
  };

  // 更新不能来的原因
  const handleReasonChange = (dayIndex, reason) => {
    setUnavailableReasons({
      ...unavailableReasons,
      [dayIndex]: reason,
    });
  };

  // 获取未选中的天数
  const getUnavailableDays = () => {
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !selectedDays.includes(d));
  };

  // 添加约束条件
  const handleAddConstraint = () => {
    if (!memberName.trim()) {
      message.warning("请输入成员名字");
      return;
    }

    if (selectedDays.length === 0) {
      message.warning("请至少选择一天能来");
      return;
    }

    const unavailableDays = getUnavailableDays();
    const newConstraints = [];

    // 生成"能来"的约束
    if (selectedDays.length < 7) {
      // 如果不是全选，生成"只有...能来"的约束
      const availableDaysText = selectedDays
        .sort((a, b) => a - b)
        .map((d) => weekDays[d])
        .join(" ");

      newConstraints.push({
        id: Date.now(),
        text: `${memberName} 只有 ${availableDaysText} 能来`,
        parsed: {
          member: memberName,
          type: "available",
          days: selectedDays,
          reason: null,
        },
      });
    }

    // 为每个不能来的天生成约束（如果有填写原因）
    unavailableDays.forEach((dayIndex) => {
      const reason = unavailableReasons[dayIndex];
      if (reason && reason.trim()) {
        newConstraints.push({
          id: Date.now() + dayIndex + 1,
          text: `${memberName} ${weekDays[dayIndex]} 有事 ${reason.trim()} 不能来`,
          parsed: {
            member: memberName,
            type: "unavailable",
            days: [dayIndex],
            reason: reason.trim(),
          },
        });
      }
    });

    if (newConstraints.length === 0) {
      message.info(`${memberName} 全周都可以来`);
    }

    setConstraints([...constraints, ...newConstraints]);

    // 重置输入
    setMemberName("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // 重置为全选
    setUnavailableReasons({});
    setResults(null);
  };

  // 删除约束条件
  const handleDeleteConstraint = (id) => {
    setConstraints(constraints.filter((c) => c.id !== id));
    setResults(null);
  };

  // 执行规划
  const handlePlan = () => {
    if (constraints.length === 0) {
      message.warning("请先添加约束条件");
      return;
    }

    const planResults = calculateSchedule();
    setResults(planResults);
  };

  // 计算排班方案
  const calculateSchedule = () => {
    // 获取所有成员
    const allMembers = [...new Set(constraints.map((c) => c.parsed.member))];

    // 对每一天进行规划
    const dailyPlans = weekDays.map((day, dayIndex) => {
      const available = [];
      const unavailable = [];

      allMembers.forEach((member) => {
        const memberConstraints = constraints.filter((c) => c.parsed.member === member);

        // 检查该成员在这一天是否可用
        let canCome = true;
        let unavailableReasons = [];

        memberConstraints.forEach((constraint) => {
          const { type, days, reason } = constraint.parsed;

          if (type === "available") {
            // "只有...能来" - 如果这天不在列表中，则不能来
            if (!days.includes(dayIndex)) {
              canCome = false;
              unavailableReasons.push("不在可用时间");
            }
          } else if (type === "unavailable") {
            // "...有事...不能来" - 如果这天在列表中，则不能来
            if (days.includes(dayIndex)) {
              canCome = false;
              unavailableReasons.push(reason);
            }
          }
        });

        if (canCome) {
          available.push(member);
        } else {
          unavailable.push({
            member,
            reasons: unavailableReasons,
          });
        }
      });

      return {
        day,
        dayIndex,
        available,
        unavailable,
        count: available.length,
        isFullAttendance: available.length === allMembers.length,
      };
    });

    // 按能来的人数排序（降序）
    const sortedPlans = [...dailyPlans].sort((a, b) => b.count - a.count);

    // 如果有全员到齐的方案，只返回这些方案
    const fullAttendancePlans = sortedPlans.filter((p) => p.isFullAttendance);
    if (fullAttendancePlans.length > 0) {
      return fullAttendancePlans;
    }

    return sortedPlans;
  };

  // 清空所有
  const handleClear = () => {
    setConstraints([]);
    setMemberName("");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // 重置为全选
    setUnavailableReasons({});
    setResults(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Title level={2}>排坑规划器</Title>
      <Text type="secondary">根据成员的时间约束，自动生成最优排班方案</Text>

      <Divider />

      {/* 输入区域 */}
      <Card title="添加约束条件" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* 成员名字输入 */}
          <div>
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              成员名字：
            </Text>
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="请输入成员名字，例如：张三"
              style={{ width: 300 }}
            />
          </div>

          {/* 周几选择 */}
          <div>
            <Text strong style={{ marginBottom: 8, display: "block" }}>
              可以来的日期（默认全选，取消表示不能来）：
            </Text>
            <Space wrap>
              {weekDays.map((day, index) => (
                <Tag.CheckableTag
                  key={index}
                  checked={selectedDays.includes(index)}
                  onChange={() => handleToggleDay(index)}
                  style={{
                    fontSize: 14,
                    padding: "6px 16px",
                    borderRadius: 4,
                    cursor: "pointer",
                    border: selectedDays.includes(index) ? `2px solid ${dayColors[index]}` : "2px solid #d9d9d9",
                    backgroundColor: selectedDays.includes(index) ? dayColors[index] : "#fafafa",
                    color: selectedDays.includes(index) ? "#fff" : "#000",
                    fontWeight: selectedDays.includes(index) ? "bold" : "normal",
                  }}
                >
                  {day}
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>

          {/* 不能来的原因输入（仅在有未选中的天时显示） */}
          {getUnavailableDays().length > 0 && (
            <div>
              <Text strong style={{ marginBottom: 8, display: "block" }}>
                不能来的原因（可选）：
              </Text>
              <Space direction="vertical" style={{ width: "100%" }}>
                {getUnavailableDays().map((dayIndex) => (
                  <div key={dayIndex}>
                    <Text type="secondary" style={{ display: "inline-block", width: 60 }}>
                      {weekDays[dayIndex]}：
                    </Text>
                    <Input
                      value={unavailableReasons[dayIndex] || ""}
                      onChange={(e) => handleReasonChange(dayIndex, e.target.value)}
                      placeholder="例如：出差、攻防、请假等"
                      style={{ width: 240 }}
                    />
                  </div>
                ))}
              </Space>
            </div>
          )}

          {/* 操作按钮 */}
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddConstraint}>
              添加约束
            </Button>
            <Button icon={<ThunderboltOutlined />} onClick={handlePlan} disabled={constraints.length === 0}>
              开始规划
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleClear} disabled={constraints.length === 0}>
              清空全部
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 约束条件列表 */}
      {constraints.length > 0 && (
        <Card title={`约束条件列表（共 ${constraints.length} 条）`} style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {constraints.map((constraint) => (
              <Card
                key={constraint.id}
                size="small"
                style={{ backgroundColor: "#fafafa" }}
                extra={
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteConstraint(constraint.id)}
                  />
                }
              >
                <Space>
                  <Tag color="blue">{constraint.parsed.member}</Tag>
                  <Text>{constraint.text}</Text>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* 规划结果 */}
      {results && (
        <Card
          title={
            <Space>
              <span>规划结果</span>
              {results.some((r) => r.isFullAttendance) && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  找到全员到齐方案
                </Tag>
              )}
            </Space>
          }
        >
          {results.length === 0 ? (
            <Empty description="没有可行的排班方案" />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {results.map((plan, index) => (
                <Card
                  key={plan.dayIndex}
                  type="inner"
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 16 }}>
                        方案 {index + 1}：{plan.day}
                      </Text>
                      {plan.isFullAttendance ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          全员到齐
                        </Tag>
                      ) : (
                        <Tag color="warning">部分到齐</Tag>
                      )}
                      <Tag color="blue">{plan.count} 人</Tag>
                    </Space>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {/* 能来的人 */}
                    <Col span={12}>
                      <Text strong style={{ color: "#52c41a" }}>
                        <CheckCircleOutlined /> 能来的人（{plan.available.length}人）：
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        {plan.available.length > 0 ? (
                          <Space wrap>
                            {plan.available.map((member) => (
                              <Tag key={member} color="success">
                                {member}
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">无</Text>
                        )}
                      </div>
                    </Col>

                    {/* 不能来的人 */}
                    <Col span={12}>
                      <Text strong style={{ color: "#ff4d4f" }}>
                        <CloseCircleOutlined /> 不能来的人（{plan.unavailable.length}人）：
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        {plan.unavailable.length > 0 ? (
                          <Space direction="vertical">
                            {plan.unavailable.map((item) => (
                              <div key={item.member}>
                                <Tag color="error">{item.member}</Tag>
                                <Text type="secondary">原因：{item.reasons.join("、")}</Text>
                              </div>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">无</Text>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      )}
    </div>
  );
};

export default SchedulePlanner;
