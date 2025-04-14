import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { useEffect, useRef, useMemo, useState } from "react";

// 注册Chart.js所需的组件
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// 定义从MessageRender接收的数据格式
type ChartData = Array<{
  key: string;
  value: number;
}>;

// 定义雷达图组件的属性接口
interface RadarChartProps {
  data: ChartData;
  options?: any;
}

export const RadarChart = ({ data, options }: RadarChartProps) => {
  const chartRef = useRef<ChartJS>(null);
  // 添加状态来跟踪组件是否已挂载
  const [mounted, setMounted] = useState(false);

  // 使用useMemo缓存转换后的数据，避免不必要的重新计算
  const chartData = useMemo(() => {
    // 确保数据存在且是数组
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    try {
      return {
        labels: data.map((item) => item.key || ""),
        datasets: [
          {
            label: "Data Analysis",
            data: data.map((item) =>
              typeof item.value === "number" ? item.value : 0
            ),
            backgroundColor: "rgba(54, 162, 235, 0.4)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(54, 162, 235, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(54, 162, 235, 1)",
          },
        ],
      };
    } catch (error) {
      console.error("雷达图数据转换错误:", error);
      return {
        labels: [],
        datasets: [],
      };
    }
  }, [data]);

  // 默认配置选项 - 适合白色背景
  const defaultOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        pointLabels: {
          color: "#333",
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          color: "#666",
          backdropColor: "transparent",
          beginAtZero: true,
          font: {
            size: 10
          }
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#333",
          font: {
            weight: 'bold'
          }
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1
      }
    },
    maintainAspectRatio: false,
  };

  // 合并默认选项和用户提供的选项
  const chartOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    // 当组件挂载后设置 mounted 状态为 true
    setMounted(true);
    
    return () => {
      // 清理函数
      const chart = chartRef.current;
      if (chart) {
        chart.destroy();
      }
      // 组件卸载时设置 mounted 状态为 false
      setMounted(false);
    };
  }, []);  // 只在组件挂载和卸载时执行
  
  // 当数据变化时的处理
  useEffect(() => {
    if (mounted && chartRef.current) {
      // 如果需要对数据变化进行特殊处理，可以在这里添加代码
    }
  }, [data, mounted]);

  // 检查数据是否有效
  if (
    !data ||
    !Array.isArray(data) ||
    data.length === 0 ||
    !chartData.labels.length
  ) {
    return (
      <div
        style={{
          width: "100%",
          height: "300px",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ color: "#333" }}>无数据可显示</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "300px", position: "relative" }}>
      {/* 只在组件挂载后才渲染雷达图 */}
      {mounted && <Radar ref={chartRef} data={chartData} options={chartOptions} />}
    </div>
  );
};
