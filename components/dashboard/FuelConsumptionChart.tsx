"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUiStore } from "@/lib/store";

const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const data = months.map((month, i) => ({
  month,
  diesel: Math.round(3200 + Math.sin(i * 0.8) * 800 + Math.random() * 400),
  gasoline: Math.round(850 + Math.cos(i * 0.6) * 250 + Math.random() * 150),
}));

export function FuelConsumptionChart() {
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
        :is(.dark) .fuel-chart .recharts-tooltip-cursor {
          fill: #3a4a5f !important;
        }
        :is(.dark) .fuel-chart .recharts-default-tooltip {
          background-color: #3a4a5f !important;
          border-color: #4a5a6f !important;
          color: #f3f5f7 !important;
        }
        :is(.dark) .fuel-chart .recharts-tooltip-wrapper {
          background-color: #3a4a5f !important;
        }
        :is(.dark) .fuel-chart .recharts-tooltip-label {
          color: #f3f5f7 !important;
        }
      `}</style>
      <div className="fuel-chart h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}L`}
            width={50}
          />
          <Tooltip
            wrapperStyle={{
              borderRadius: "12px",
              overflow: "hidden",
            }}
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string) => [`${v.toLocaleString()} L`, name === "diesel" ? "Diesel" : "Gasoline"]}
          />
          <Bar dataKey="diesel" fill="#66B2B2" radius={[6, 6, 0, 0]} barSize={18} name="diesel" />
          <Bar dataKey="gasoline" fill="#FFA500" radius={[6, 6, 0, 0]} barSize={18} name="gasoline" />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}
