"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useUiStore } from "@/lib/store";

const weeks = ["W1 Apr", "W2 Apr", "W3 Apr", "W4 Apr", "W1 May", "W2 May"];

const data = weeks.map((week, i) => ({
  week,
  onTime: Math.round(26 + Math.sin(i * 0.9) * 5 + Math.random() * 4),
  delayed: Math.round(3 + Math.cos(i * 1.1) * 2 + Math.random() * 2),
}));

export function DeliveryOnTimeChart() {
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
        :is(.dark) .delivery-chart .recharts-tooltip-cursor {
          fill: #3a4a5f !important;
        }

        :is(.dark) .delivery-chart .recharts-default-tooltip {
          background-color: #3a4a5f !important;
          border-color: #4a5a6f !important;
          color: #f3f5f7 !important;
        }

        :is(.dark) .delivery-chart .recharts-tooltip-wrapper {
          background-color: #3a4a5f !important;
        }

        :is(.dark) .delivery-chart .recharts-tooltip-label {
          color: #f3f5f7 !important;
        }
      `}</style>

      <div className="delivery-chart h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="onTimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="delayedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={darkMode ? "#334155" : "#F1F5F9"}
              vertical={false}
            />

            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />

            <Tooltip
              wrapperStyle={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                v,
                name === "onTime" ? "On-Time" : "Delayed",
              ]}
            />

            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(value) =>
                value === "onTime"
                  ? "On-Time Deliveries"
                  : "Delayed Deliveries"
              }
            />

            <Area
              type="monotone"
              dataKey="onTime"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#onTimeGrad)"
            />

            <Area
              type="monotone"
              dataKey="delayed"
              stroke="#EF4444"
              strokeWidth={2.5}
              fill="url(#delayedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}