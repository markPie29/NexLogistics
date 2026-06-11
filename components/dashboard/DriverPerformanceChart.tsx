"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useUiStore } from "@/lib/store";

const driverData = [
  { name: "M. Santos", onTime: 96, delayed: 4, trips: 28 },
  { name: "J. Cruz", onTime: 92, delayed: 8, trips: 26 },
  { name: "A. Reyes", onTime: 90, delayed: 10, trips: 24 },
  { name: "C. Mendoza", onTime: 87, delayed: 13, trips: 22 },
  { name: "R. Garcia", onTime: 85, delayed: 15, trips: 20 },
  { name: "J. Tan", onTime: 83, delayed: 17, trips: 18 },
  { name: "M. Dela Cruz", onTime: 80, delayed: 20, trips: 16 },
  { name: "R. Bautista", onTime: 78, delayed: 22, trips: 15 },
  { name: "E. Ramos", onTime: 76, delayed: 24, trips: 12 },
  { name: "P. Lim", onTime: 74, delayed: 26, trips: 10 },
];

export function DriverPerformanceChart() {
  const darkMode = useUiStore((s) => s.darkMode);

  const tooltipStyle = darkMode
    ? {
      background: "#2a3a4f",
      border: "1px solid #3a4a5f",
      borderRadius: 12,
      fontSize: 12,
      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
      color: "#f3f5f7",
    }
    : {
      background: "white",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      fontSize: 12,
      boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
      color: "#0F172A",
    };

  return (
    <>
      <style>{`
        :is(.dark) .driver-chart .recharts-tooltip-cursor {
          fill: #3a4a5f !important;
        }

        :is(.dark) .driver-chart .recharts-default-tooltip {
          background-color: #3a4a5f !important;
          border-color: #4a5a6f !important;
          color: #f3f5f7 !important;
        }

        :is(.dark) .driver-chart .recharts-tooltip-wrapper {
          background-color: #3a4a5f !important;
        }

        :is(.dark) .driver-chart .recharts-tooltip-label {
          color: #f3f5f7 !important;
        }
      `}</style>

      <div className="driver-chart h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={driverData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke={darkMode ? "#334155" : "#F1F5F9"}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={42}
            />

            <Tooltip
              wrapperStyle={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                `${v}%`,
                name === "onTime" ? "On-Time" : "Delayed",
              ]}
            />

            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(value) =>
                value === "onTime" ? "On-Time %" : "Delayed %"
              }
            />

            <Bar
              dataKey="onTime"
              fill="#66B2B2"
              radius={[0, 0, 0, 0]}
              barSize={14}
              stackId="perf"
            />

            <Bar
              dataKey="delayed"
              fill="#E5E7EB"
              radius={[6, 6, 0, 0]}
              barSize={14}
              stackId="perf"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
} 