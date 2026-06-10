"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { VehicleProfitability } from "@/lib/profit-center/types";

interface FuelEfficiencyChartProps {
  data: VehicleProfitability[];
}

export function FuelEfficiencyChart({ data }: FuelEfficiencyChartProps) {
  // Only vehicles with a valid costPerKm
  const vehiclesWithData = data
    .filter((v) => v.costPerKm !== null && v.costPerKm > 0)
    .sort((a, b) => (b.costPerKm ?? 0) - (a.costPerKm ?? 0))
    .slice(0, 15); // Top 15 for readability

  if (vehiclesWithData.length === 0) {
    return (
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
            Fuel Efficiency (Cost/km)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-sm text-muted-foreground">No fuel data available for this period</p>
        </CardContent>
      </Card>
    );
  }

  const fleetAvg =
    vehiclesWithData.reduce((s, v) => s + (v.costPerKm ?? 0), 0) / vehiclesWithData.length;

  const chartData = vehiclesWithData.map((v) => ({
    plate: v.plate,
    costPerKm: Number((v.costPerKm ?? 0).toFixed(2)),
    aboveAvg: (v.costPerKm ?? 0) > fleetAvg,
  }));

  return (
    <Card className="border-brand-border shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
          Fuel Efficiency (Cost/km)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Per-vehicle fuel cost per kilometer • Fleet avg: {formatCurrency(fleetAvg)}/km
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px]" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `₱${v}`}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="plate"
                tick={{ fontSize: 10 }}
                tickLine={false}
                width={55}
              />
              <Tooltip
                formatter={(value: number) => [`${formatCurrency(value)}/km`, "Cost per km"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <ReferenceLine
                x={Number(fleetAvg.toFixed(2))}
                stroke="#6366F1"
                strokeDasharray="4 4"
                label={{ value: "Avg", position: "top", fontSize: 10, fill: "#6366F1" }}
              />
              <Bar dataKey="costPerKm" radius={[0, 4, 4, 0]} name="Cost/km">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.aboveAvg ? "#EF4444" : "#10B981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Horizontal bar chart showing fuel cost per kilometer for each vehicle. Red bars indicate vehicles above fleet average, green bars indicate below average.
        </p>
      </CardContent>
    </Card>
  );
}
