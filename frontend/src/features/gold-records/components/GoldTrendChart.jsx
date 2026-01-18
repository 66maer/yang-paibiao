import { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";
import { format, startOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Tabs, Tab } from "@heroui/react";

/**
 * 金团总额变化趋势图
 * @param {array} data - 金团记录数据（已排序）
 */
export default function GoldTrendChart({ data = [] }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [viewType, setViewType] = useState("daily");

  /**
   * 将数字转换为带圈数字符号
   */
  const getCircledNumber = (num) => {
    const circledNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
    if (num >= 1 && num <= 10) {
      return circledNumbers[num - 1];
    }
    return `(${num})`;
  };

  /**
   * 计算统计数据（剔除异常值后）
   */
  const calculateStats = (records) => {
    if (records.length === 0) {
      return { mean: 0, stdDev: 0, high: 0, low: 0 };
    }

    let values = records.map((r) => r.total_gold);

    // 数据点>=10时，过滤前后10%的异常值
    if (records.length >= 10) {
      // 按金额排序
      const sortedValues = [...values].sort((a, b) => a - b);

      // 计算过滤数量（向下取整）
      const filterCount = Math.floor(records.length * 0.1);

      // 过滤掉前后各10%的数据
      values = sortedValues.slice(filterCount, sortedValues.length - filterCount);
    }

    // 计算均值
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // 计算标准差
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 计算高低收益线（均值 ± 标准差）
    return {
      mean: mean,
      stdDev: stdDev,
      high: mean + stdDev,
      low: Math.max(0, mean - stdDev),
    };
  };

  /**
   * 格式化金额为"X砖"
   */
  const formatGold = (copper) => {
    return (copper / 10000).toFixed(0);
  };

  /**
   * 按周聚合数据，用于K线图
   * 返回格式: [{ week, open, close, low, high, count }]
   * 注：从第二周开始，开盘价使用上周收盘价，使K线更连贯
   */
  const aggregateByWeek = (records) => {
    if (records.length === 0) return [];

    const weekMap = new Map();

    records.forEach((r) => {
      const date = new Date(r.run_date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1, locale: zhCN });
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart,
          weekKey,
          records: [],
        });
      }
      weekMap.get(weekKey).records.push(r);
    });

    // 按周排序
    const weeks = Array.from(weekMap.values()).sort((a, b) => a.weekStart - b.weekStart);

    return weeks.map((w, index) => {
      const golds = w.records.map((r) => r.total_gold);
      const close = w.records[w.records.length - 1].total_gold;
      // 第一周使用自己的第一条数据作为开盘价，之后使用上周收盘价
      const open =
        index === 0
          ? w.records[0].total_gold
          : weeks[index - 1].records[weeks[index - 1].records.length - 1].total_gold;

      return {
        weekKey: w.weekKey,
        weekLabel: format(w.weekStart, "MM-dd"),
        open,
        close,
        low: Math.min(...golds),
        high: Math.max(...golds),
        count: w.records.length,
        records: w.records,
      };
    });
  };

  /**
   * 生成日视图图表配置
   */
  const dailyOption = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // 数据已在父组件排序，直接使用
    const sortedData = data;

    // 计算统计数据
    const stats = calculateStats(sortedData);

    return {
      title: {
        text: "金团变化图 - 日视图",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const date = params[0].name;
          const dataIndex = params[0].dataIndex;
          const record = sortedData[dataIndex];

          let html = `${date}<br/>`;

          // 显示黑本人和角色
          if (record.heibenren_info) {
            const { user_name, character_name } = record.heibenren_info;
            if (user_name) {
              html += `黑本人: ${user_name}`;
              if (character_name) {
                html += ` (${character_name})`;
              }
              html += `<br/>`;
            } else if (character_name) {
              html += `角色: ${character_name}<br/>`;
            }
          }

          // 显示各项数据
          params.forEach((p) => {
            const value = (p.value / 10000).toFixed(2);
            html += `${p.marker}${p.seriesName}: ${value}砖<br/>`;
          });

          return html;
        },
      },
      legend: {
        data: ["金团", "平均线", "小红手线", "黑鬼线"],
        top: 35,
      },
      xAxis: {
        type: "category",
        data: sortedData.map((r) => {
          const dateStr = format(new Date(r.run_date), "MM-dd");
          // 如果同一天有多条记录，添加序号
          if (r.dailyTotal > 1) {
            return `${dateStr}${getCircledNumber(r.dailySequence)}`;
          }
          return dateStr;
        }),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: "value",
        name: "金额",
        axisLabel: {
          formatter: (value) => `${formatGold(value)}砖`,
        },
      },
      series: [
        {
          name: "金团",
          type: "line",
          data: sortedData.map((r) => r.total_gold),
          smooth: true,
          itemStyle: {
            color: (params) => {
              const value = params.data;
              // 小红手线之上的点标记为红色
              if (value >= stats.high) {
                return "#ef4444";
              }
              // 黑鬼线之下的点标记为绿色
              if (value <= stats.low) {
                return "#22c55e";
              }
              // 其他点保持默认蓝色
              return "#3b82f6";
            },
          },
          lineStyle: { width: 2, color: "#3b82f6" },
          symbol: (value, params) => {
            const dataIndex = params.dataIndex;
            // 找出最高值和最低值的索引
            const values = sortedData.map((r) => r.total_gold);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const maxIndex = values.indexOf(maxValue);
            const minIndex = values.indexOf(minValue);

            // 最高值和最低值显示为五角星
            if (dataIndex === maxIndex || dataIndex === minIndex) {
              return "path://M512 0L629.866667 350.933333H1024L705.066667 569.6L823.466667 920.533333L512 701.866667L200.533333 920.533333L318.933333 569.6L0 350.933333H394.133333z";
            }
            return "circle";
          },
          symbolSize: (value, params) => {
            const dataIndex = params.dataIndex;
            const values = sortedData.map((r) => r.total_gold);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const maxIndex = values.indexOf(maxValue);
            const minIndex = values.indexOf(minValue);

            // 五角星稍微大一点
            if (dataIndex === maxIndex || dataIndex === minIndex) {
              return 16;
            }
            return 8;
          },
          label: {
            show: true,
            position: "top",
            fontSize: 10,
            color: "#666",
            formatter: (params) => {
              const record = sortedData[params.dataIndex];
              if (record.heibenren_info) {
                return record.heibenren_info.user_name || record.heibenren_info.character_name || "野人";
              }
              return "野人";
            },
          },
        },
        {
          name: "平均线",
          type: "line",
          data: Array(sortedData.length).fill(stats.mean),
          lineStyle: { color: "#facc15", type: "dashed", width: 2 },
          itemStyle: { color: "#facc15" },
          symbol: "none",
        },
        {
          name: "小红手线",
          type: "line",
          data: Array(sortedData.length).fill(stats.high),
          lineStyle: { color: "#ef4444", type: "dashed", width: 2 },
          itemStyle: { color: "#ef4444" },
          symbol: "none",
        },
        {
          name: "黑鬼线",
          type: "line",
          data: Array(sortedData.length).fill(stats.low),
          lineStyle: { color: "#22c55e", type: "dashed", width: 2 },
          itemStyle: { color: "#22c55e" },
          symbol: "none",
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
      dataZoom: [
        {
          type: "slider", // 滑动条型数据区域缩放
          show: true,
          xAxisIndex: 0,
          start: 0, // 默认显示从0%开始
          end: 100, // 默认显示到100%结束
          bottom: "5%",
          height: 20,
          handleSize: "80%",
          textStyle: {
            fontSize: 10,
          },
        },
        {
          type: "inside", // 内置型数据区域缩放（鼠标滚轮）
          xAxisIndex: 0,
          start: 0,
          end: 100,
        },
      ],
    };
  }, [data]);

  /**
   * 生成周视图K线图配置
   */
  const weeklyOption = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const weeklyData = aggregateByWeek(data);
    if (weeklyData.length === 0) return null;

    // 使用原始数据计算统计数据，与日视图保持一致
    const stats = calculateStats(data);

    // K线数据格式: [open, close, low, high]
    const candlestickData = weeklyData.map((w) => [w.open, w.close, w.low, w.high]);

    return {
      title: {
        text: "金团变化图 - 周视图",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
        formatter: (params) => {
          const dataIndex = params[0].dataIndex;
          const week = weeklyData[dataIndex];
          const kData = params[0].data;

          let html = `<strong>第${dataIndex + 1}周 (${week.weekLabel}起)</strong><br/>`;
          html += `本周车数: ${week.count}车<br/>`;
          html += `开盘: ${(kData[1] / 10000).toFixed(2)}砖<br/>`;
          html += `收盘: ${(kData[2] / 10000).toFixed(2)}砖<br/>`;
          html += `最低: ${(kData[3] / 10000).toFixed(2)}砖<br/>`;
          html += `最高: ${(kData[4] / 10000).toFixed(2)}砖<br/>`;

          const change = kData[2] - kData[1];
          const changePercent = ((change / kData[1]) * 100).toFixed(1);
          const changeColor = change >= 0 ? "#ef4444" : "#22c55e";
          html += `<span style="color:${changeColor}">涨跌: ${change >= 0 ? "+" : ""}${(change / 10000).toFixed(2)}砖 (${change >= 0 ? "+" : ""}${changePercent}%)</span>`;

          return html;
        },
      },
      legend: {
        data: ["周K线", "平均线", "小红手线", "黑鬼线"],
        top: 35,
      },
      xAxis: {
        type: "category",
        data: weeklyData.map((w, i) => `第${i + 1}周\n${w.weekLabel}`),
        axisLabel: {
          rotate: 0,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        name: "金额",
        scale: true,
        axisLabel: {
          formatter: (value) => `${formatGold(value)}砖`,
        },
      },
      series: [
        {
          name: "周K线",
          type: "candlestick",
          data: candlestickData,
          itemStyle: {
            color: "#ef4444", // 阳线（涨）颜色
            color0: "#22c55e", // 阴线（跌）颜色
            borderColor: "#ef4444",
            borderColor0: "#22c55e",
          },
        },
        {
          name: "平均线",
          type: "line",
          data: Array(weeklyData.length).fill(stats.mean),
          lineStyle: { color: "#facc15", type: "dashed", width: 2 },
          itemStyle: { color: "#facc15" },
          symbol: "none",
        },
        {
          name: "小红手线",
          type: "line",
          data: Array(weeklyData.length).fill(stats.high),
          lineStyle: { color: "#ef4444", type: "dashed", width: 2 },
          itemStyle: { color: "#ef4444" },
          symbol: "none",
        },
        {
          name: "黑鬼线",
          type: "line",
          data: Array(weeklyData.length).fill(stats.low),
          lineStyle: { color: "#22c55e", type: "dashed", width: 2 },
          itemStyle: { color: "#22c55e" },
          symbol: "none",
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true,
      },
      dataZoom: [
        {
          type: "slider",
          show: true,
          xAxisIndex: 0,
          start: 0,
          end: 100,
          bottom: "5%",
          height: 20,
          handleSize: "80%",
          textStyle: {
            fontSize: 10,
          },
        },
        {
          type: "inside",
          xAxisIndex: 0,
          start: 0,
          end: 100,
        },
      ],
    };
  }, [data]);

  // 根据视图类型选择配置
  const option = viewType === "daily" ? dailyOption : weeklyOption;

  /**
   * 初始化图表实例（仅一次）
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    // 响应式处理
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    // 清理：仅在组件卸载时销毁
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  /**
   * 更新图表配置
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // 如果实例不存在，先初始化
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    if (option) {
      chartInstanceRef.current.setOption(option, true);
    } else {
      // 清空图表
      chartInstanceRef.current.clear();
    }
  }, [option]);

  // 空状态
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📈</div>
        <p className="text-default-500">暂无数据</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center mb-4">
        <Tabs selectedKey={viewType} onSelectionChange={setViewType} size="sm" variant="bordered">
          <Tab key="daily" title="日视图" />
          <Tab key="weekly" title="周视图" />
        </Tabs>
      </div>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
}
