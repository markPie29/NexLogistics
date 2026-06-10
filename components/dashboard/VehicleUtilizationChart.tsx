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
import { useUiStore } from "@/lib/store";

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

const CustomTooltip = ({
  active,
  payload,
  label,
  darkMode,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  darkMode: boolean;
}) => {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const color = getBarColor(value);

  return (
    <div
      style={{
        background: darkMode ? "#2a3a4f" : "#ffffff",
        border: `1px solid ${darkMode ? "#3a4a5f" : "#E5E7EB"}`,
        borderRadius: 12,
        padding: "8px 10px", // similar to default Recharts
        fontSize: 12,        // same size as your old tooltip
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 4,
          color: darkMode ? "#ffffff" : "#0F172A",
          fontWeight: 600,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          color: getBarColor(value), // ← uses your existing function
        }}
      >
        Utilization : {value}%
      </p>
    </div>
  );
};

export function VehicleUtilizationChart() {
  const darkMode = useUiStore((s) => s.darkMode);

  const tooltipStyle = darkMode
    ? {
        background: "#2a3a4f",
        border: "1px solid #3a4a5f",
        borderRadius: 12,
        fontSize: 12,
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
        color: "#ffffff",
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
        :is(.dark) .vehicle-chart .recharts-tooltip-cursor {
          fill: #3a4a5f !important;
        }

        :is(.dark) .vehicle-chart .recharts-default-tooltip {
          background-color: #3a4a5f !important;
          border-color: #4a5a6f !important;
          overflow: hidden !important;
          color: #f3f5f7 !important;
        }
        :is(.dark) .vehicle-chart .recharts-default-tooltip td,
        :is(.dark) .vehicle-chart .recharts-default-tooltip span,
        :is(.dark) .vehicle-chart .recharts-default-tooltip div {
          color: #f3f5f7 !important;
        }

        :is(.dark) .vehicle-chart .recharts-tooltip-wrapper {
          background-color: #3a4a5f !important;
        }

        :is(.dark) .vehicle-chart .recharts-tooltip-label {
          color: #f3f5f7 !important;
        }
      `}</style>

      <div className="vehicle-chart h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={vehicleData}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
          >
            <CartesianGrid
              stroke={darkMode ? "#334155" : "#F1F5F9"}
              horizontal={false}
            />

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
              content={
                <CustomTooltip
                  darkMode={darkMode}
                />
              }
              wrapperStyle={{
              borderRadius: "12px",
              overflow: "hidden",
            }}
            />

            <Bar
              dataKey="utilization"
              radius={[0, 6, 6, 0]}
              barSize={14}
            >
              {vehicleData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={getBarColor(entry.utilization)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}