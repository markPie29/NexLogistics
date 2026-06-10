"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUiStore } from "@/lib/store";

const data = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  const baseR = 250000 + Math.sin(i / 3) * 60000 + Math.random() * 80000;
  const baseE = 180000 + Math.cos(i / 4) * 40000 + Math.random() * 60000;

  return {
    day: `May ${day}`,
    revenue: Math.round(baseR + (i > 20 ? 100000 : 0)),
    expenses: Math.round(baseE),
  };
});

export function RevenueExpensesChart() {
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
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        color: "#0F172A",
      };

  return (
    <>
      <style>{`
        :is(.dark) .revenue-chart .recharts-tooltip-cursor {
          fill: #3a4a5f !important;
        }

        :is(.dark) .revenue-chart .recharts-default-tooltip {
          background-color: #3a4a5f !important;
          border-color: #4a5a6f !important;
          color: #f3f5f7 !important;
        }

        :is(.dark) .revenue-chart .recharts-tooltip-wrapper {
          background-color: #3a4a5f !important;
        }

        :is(.dark) .revenue-chart .recharts-tooltip-label {
          color: #f3f5f7 !important;
        }
      `}</style>

      <div className="revenue-chart h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#66B2B2" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#66B2B2" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={darkMode ? "#334155" : "#F1F5F9"}
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              width={50}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              wrapperStyle={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
              formatter={(v: number) => `₱${v.toLocaleString()}`}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#66B2B2"
              strokeWidth={2.5}
              fill="url(#rev)"
            />

            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={2.5}
              fill="url(#exp)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}