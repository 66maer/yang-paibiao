import { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";
import { format } from "date-fns";

/**
 * 金团总额变化趋势图
 * @param {array} data - 金团记录数据
 */
export default function GoldTrendChart({ data = [] }) {
  const chartRef = useRef(null);

  /**
   * 计算统计数据（剔除异常值后）
   */
  const calculateStats = (records) => {
    if (records.length === 0) {
      return { mean: 0, stdDev: 0, high: 0, low: 0 };
    }

    // 1. 计算初始均值和标准差
    const values = records.map((r) => r.total_gold);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 2. 剔除3倍标准差以上的异常值
    const filteredValues = values.filter((val) => Math.abs(val - mean) <= 3 * stdDev);

    if (filteredValues.length === 0) {
      return { mean, stdDev, high: mean, low: mean };
    }

    // 3. 重新计算均值和标准差
    const filteredMean = filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length;
    const filteredVariance =
      filteredValues.reduce((sum, val) => sum + Math.pow(val - filteredMean, 2), 0) / filteredValues.length;
    const filteredStdDev = Math.sqrt(filteredVariance);

    // 4. 计算高低收益线（均值 ± 1.5 标准差）
    return {
      mean: filteredMean,
      stdDev: filteredStdDev,
      high: filteredMean + 1.5 * filteredStdDev,
      low: Math.max(0, filteredMean - 1.5 * filteredStdDev)
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
    if (data.length === 0) {
      return null;
    }

    // 按日期排序
    const sortedData = [...data].sort((a, b) => new Date(a.run_date) - new Date(b.run_date));

    // 计算统计数据
    const stats = calculateStats(sortedData);

    return {
      title: {
        text: "金团总额变化趋势",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold"
        }
      },
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const date = params[0].name;
          let html = `${date}<br/>`;
          params.forEach((p) => {
            const value = (p.value / 10000).toFixed(2);
            html += `${p.marker}${p.seriesName}: ${value}砖<br/>`;
          });
          return html;
        }
      },
      legend: {
        data: ["实际收益", "平均线", "高收益线", "低收益线"],
        top: 35
      },
      xAxis: {
        type: "category",
        data: sortedData.map((r) => format(new Date(r.run_date), "MM-dd")),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: "value",
        name: "金额",
        axisLabel: {
          formatter: (value) => `${formatGold(value)}砖`
        }
      },
      series: [
        {
          name: "实际收益",
          type: "line",
          data: sortedData.map((r) => r.total_gold),
          smooth: true,
          itemStyle: { color: "#3b82f6" },
          lineStyle: { width: 2 }
        },
        {
          name: "平均线",
          type: "line",
          data: Array(sortedData.length).fill(stats.mean),
          lineStyle: { color: "#facc15", type: "dashed", width: 2 },
          itemStyle: { color: "#facc15" },
          symbol: "none"
        },
        {
          name: "高收益线",
          type: "line",
          data: Array(sortedData.length).fill(stats.high),
          lineStyle: { color: "#22c55e", type: "dashed", width: 2 },
          itemStyle: { color: "#22c55e" },
          symbol: "none"
        },
        {
          name: "低收益线",
          type: "line",
          data: Array(sortedData.length).fill(stats.low),
          lineStyle: { color: "#ef4444", type: "dashed", width: 2 },
          itemStyle: { color: "#ef4444" },
          symbol: "none"
        }
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true
      }
    };
  }, [data]);

  /**
   * 初始化和更新图表
   */
  useEffect(() => {
    if (!chartRef.current || !option) return;

    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom);

    myChart.setOption(option);

    // 响应式处理
    const handleResize = () => myChart.resize();
    window.addEventListener("resize", handleResize);

    // 清理
    return () => {
      window.removeEventListener("resize", handleResize);
      myChart.dispose();
    };
  }, [option]);

  // 空状态
  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📈</div>
        <p className="text-default-500">暂无数据</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
