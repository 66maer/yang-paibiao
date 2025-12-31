import { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";
import { format } from "date-fns";

/**
 * 金团总额变化趋势图
 * @param {array} data - 金团记录数据（已排序）
 */
export default function GoldTrendChart({ data = [] }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

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
   * 生成图表配置
   */
  const option = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // 数据已在父组件排序，直接使用
    const sortedData = data;

    // 计算统计数据
    const stats = calculateStats(sortedData);

    return {
      title: {
        text: "金团变化图",
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
          itemStyle: { color: "#3b82f6" },
          lineStyle: { width: 2 },
          label: {
            show: true,
            position: "top",
            fontSize: 10,
            color: "#666",
            formatter: (params) => {
              const record = sortedData[params.dataIndex];
              if (record.heibenren_info) {
                return record.heibenren_info.user_name || record.heibenren_info.character_name || "";
              }
              return "";
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

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
