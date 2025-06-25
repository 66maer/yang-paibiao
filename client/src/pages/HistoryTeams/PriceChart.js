import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  LabelList,
} from "recharts";
import { Divider, Radio, Empty, Card, Typography, Tag } from "antd";
import dayjs from "dayjs";

// 导入特殊掉落颜色定义
import { specialDropsColors } from ".";

const { Title, Text } = Typography;

const PriceChart = ({ teams }) => {
  const [selectedDungeon, setSelectedDungeon] = useState(null);

  // 获取所有副本类型
  const dungeonTypes = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    const types = [...new Set(teams.map((team) => team.dungeons))];
    return types;
  }, [teams]);

  // 当没有选中副本时，自动选择第一个副本
  useMemo(() => {
    if (dungeonTypes.length > 0 && !selectedDungeon) {
      setSelectedDungeon(dungeonTypes[0]);
    }
  }, [dungeonTypes, selectedDungeon]);

  // 处理数据，根据选定的副本类型过滤并格式化数据
  const chartData = useMemo(() => {
    if (!teams || teams.length === 0 || !selectedDungeon) return [];

    // 按照选定的副本过滤团队
    const filteredTeams = teams.filter((team) => team.dungeons === selectedDungeon);

    // 过滤有效的金团记录（有人均薪资的记录）
    const validTeams = filteredTeams.filter((team) => {
      try {
        const parsedSummary = JSON.parse(team.summary || "{}");
        return parsedSummary.perPersonSalary && !isNaN(parsedSummary.perPersonSalary);
      } catch (e) {
        return false;
      }
    });

    // 按照关闭时间排序
    const sortedTeams = [...validTeams].sort((a, b) => dayjs(a.closeTime).valueOf() - dayjs(b.closeTime).valueOf());

    // 对每个日期添加序号
    const dateCount = {};

    // 格式化数据用于图表
    const formattedData = sortedTeams.map((team, index) => {
      const parsedSummary = JSON.parse(team.summary || "{}");
      const totalSalary = parsedSummary.salary || 0; // 使用总金团
      const perPersonSalary = parsedSummary.perPersonSalary || 0; // 保留人均金币用于提示框显示
      const blacklist = parsedSummary.blacklist || "无";

      // 仅使用MM-DD格式的日期
      const dateOnly = dayjs(team.closeTime).format("MM-DD");

      // 为相同日期添加序号
      dateCount[dateOnly] = (dateCount[dateOnly] || 0) + 1;
      const dateWithIndex = dateCount[dateOnly] > 1 ? `${dateOnly}-${dateCount[dateOnly]}` : dateOnly;

      return {
        id: team.teamId,
        name: team.title,
        date: dateWithIndex,
        displayDate: dayjs(team.closeTime).format("MM-DD HH:mm"),
        timestamp: dayjs(team.closeTime).valueOf(),
        salary: totalSalary, // 更改为使用总金团
        perPersonSalary: perPersonSalary, // 保留人均金币
        blacklist: blacklist,
        hasBlacklist: blacklist !== "无",
        blacklistLabel: blacklist !== "无" ? blacklist : undefined,
        specialDrops: parsedSummary.specialDrops || [],
        index: index, // 添加索引，用于后续确定最高最低值
      };
    });

    // 如果有多个数据，找出最高和最低值
    if (formattedData.length > 1) {
      let maxVal = -Infinity;
      let minVal = Infinity;
      let maxIdx = 0;
      let minIdx = 0;

      formattedData.forEach((item, idx) => {
        if (item.salary > maxVal) {
          maxVal = item.salary;
          maxIdx = idx;
        }
        if (item.salary < minVal) {
          minVal = item.salary;
          minIdx = idx;
        }
      });

      // 标记最高和最低值
      formattedData[maxIdx].isMaxValue = true;
      formattedData[minIdx].isMinValue = true;
    }

    return formattedData;
  }, [teams, selectedDungeon]);

  // 计算平均值和阈值,以及最高/最低值
  const { avgSalary, highThreshold, lowThreshold, maxValue, minValue, maxIndex, minIndex } = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgSalary: 0,
        highThreshold: 0,
        lowThreshold: 0,
        maxValue: 0,
        minValue: 0,
        maxIndex: -1,
        minIndex: -1,
      };
    }

    const totalSalary = chartData.reduce((sum, item) => sum + item.salary, 0);
    const avg = totalSalary / chartData.length;
    const deviationThreshold = avg * 0.34; // 定义偏差阈值，与列表页面相同

    // 找出最大和最小值的索引
    let maxIdx = 0;
    let minIdx = 0;
    let maxVal = chartData[0].salary;
    let minVal = chartData[0].salary;

    // 如果有多个记录,找出最大最小值
    if (chartData.length > 1) {
      chartData.forEach((item, index) => {
        if (item.salary > maxVal) {
          maxVal = item.salary;
          maxIdx = index;
        }
        if (item.salary < minVal) {
          minVal = item.salary;
          minIdx = index;
        }
      });
    }

    return {
      avgSalary: avg,
      highThreshold: avg + deviationThreshold,
      lowThreshold: avg - deviationThreshold,
      maxValue: maxVal,
      minValue: minVal,
      maxIndex: maxIdx,
      minIndex: minIdx,
    };
  }, [chartData]);

  // 自定义提示框内容
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card size="small" style={{ width: 200 }}>
          <p>
            <strong>{data.name}</strong>
          </p>
          <p>日期: {data.displayDate}</p>
          <p>总金团: {data.salary} 金</p>
          <p>人均收入: {data.perPersonSalary} 金</p>
          <p>黑本人: {data.blacklist}</p>
          {data.specialDrops && data.specialDrops.length > 0 && (
            <div>
              <p>特殊掉落:</p>
              <div>
                {data.specialDrops.map((drop, i) => (
                  <Tag key={i} color={specialDropsColors[drop] || "blue"} style={{ marginBottom: "5px" }}>
                    {drop}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Card>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%" }}>
      <Title level={4}>副本金团价格走势</Title>
      <Divider style={{ margin: "12px 0" }} />

      <div style={{ marginBottom: 16 }}>
        <Text strong>选择副本类型：</Text>
        <Radio.Group
          value={selectedDungeon}
          onChange={(e) => setSelectedDungeon(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {dungeonTypes.map((type) => (
            <Radio.Button key={type} value={type}>
              {type}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" label={{ value: "日期", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "总金团(金)", angle: -90, position: "insideLeft" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* 平均线 */}
            <ReferenceLine
              y={avgSalary}
              stroke="#888"
              strokeWidth={2}
              label={{
                value: `${avgSalary.toFixed(0)}金`,
                position: "left",
                fill: "#333",
                fontSize: 12,
              }}
            />

            {/* 小红手阈值线 */}
            <ReferenceLine
              y={highThreshold}
              stroke="#ff7875"
              strokeDasharray="5 5"
              label={{
                value: `${highThreshold.toFixed(0)}金`,
                position: "left",
                fill: "#ff7875",
                fontSize: 12,
              }}
            />

            {/* 小黑手阈值线 */}
            <ReferenceLine
              y={lowThreshold}
              stroke="#722ed1"
              strokeDasharray="5 5"
              label={{
                value: `${lowThreshold.toFixed(0)}金`,
                position: "left",
                fill: "#722ed1",
                fontSize: 12,
              }}
            />

            {/* 价格线 */}
            <Line
              type="monotone"
              dataKey="salary"
              stroke="#1677ff"
              name="总金团"
              dot={(props) => {
                const { cx, cy, payload } = props;

                // 最高值点，红色五角星
                if (payload.isMaxValue) {
                  return (
                    <g>
                      <svg x={cx - 12} y={cy - 12} width={24} height={24} viewBox="0 0 24 24">
                        <path
                          d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                          fill="#ff4d4f"
                        />
                      </svg>
                    </g>
                  );
                }

                // 最低值点，绿色五角星
                if (payload.isMinValue) {
                  return (
                    <g>
                      <svg x={cx - 12} y={cy - 12} width={24} height={24} viewBox="0 0 24 24">
                        <path
                          d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                          fill="#52c41a"
                        />
                      </svg>
                    </g>
                  );
                }

                // 黑本人点
                if (payload.hasBlacklist) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={5} stroke="#1677ff" strokeWidth={1} fill="#ff7875" />
                    </g>
                  );
                }

                // 普通点
                return <circle cx={cx} cy={cy} r={4} stroke="#1677ff" strokeWidth={1} fill="#1677ff" />;
              }}
            >
              <LabelList
                dataKey="blacklistLabel"
                position="top"
                fill="#f50"
                fontSize={12}
                fontWeight="bold"
                offset={10}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="暂无价格数据" />
      )}
    </div>
  );
};

export default PriceChart;
