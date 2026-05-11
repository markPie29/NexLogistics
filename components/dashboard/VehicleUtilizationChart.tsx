"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

const vehicleData = [
  { plate: "NEX-101", utilization: 92 },
  { plate: "NEX-102", utilization: 78 },
  { plate: "NEX-103", utilization: 85 },
  { plate: "NEX-104", utilization: 45 },
  { plate: "NEX-105", utilization: 88 },
  { plate: "NEX-106", utilization: 62 },
  { plate: "NEX-107", utilization: 95 },
  { plate: "NEX-108", utilization: 55 },
  { plate: "NEX-109", utilization: 90 },
  { plate: "NEX-110", utilization: 70 },
];

function getBarColor(value: number) {
  if (value >= 80) return "#10B981";
  if (value >= 60) return "#66B2B2";
  if (value >= 40) return "#F59E0B";
  return "#EF4444";
}

export function VehicleUtilizationChart() {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={vehicleData}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
        >
          <CartesianGrid stroke="#F1F5F9" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            dataKey="plate"
            type="category"
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            }}
            formatter={(v: number) => [`${v}%`, "Utilization"]}
          />
          <Bar dataKey="utilization" radius={[0, 6, 6, 0]} barSize={14}>
            {vehicleData.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
