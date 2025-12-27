import { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

/**
 * 可复用的掉落分布饼图组件
 * @param {string} title - 图表标题
 * @param {array} data - 数据数组 [{name, value}, ...]
 */
export default function DropPieChart({ title, data = [] }) {
  const chartRef = useRef(null);

  /**
   * 生成图表配置
   */
  const option = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    return {
      title: {
        text: title,
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: "bold"
        }
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)"
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        left: "center",
        type: "scroll"
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2
          },
          label: {
            show: false,
            position: "center"
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold"
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  }, [title, data]);

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
      <div className="text-center py-10">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-sm font-medium text-default-600">{title}</p>
        <p className="text-xs text-default-500 mt-1">暂无数据</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: "100%", height: "300px" }} />;
}
