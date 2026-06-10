"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ChartDataPoint } from "@/lib/profit-center/types";

interface ProfitTrendChartProps {
  data: ChartDataPoint[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
  if (value <= -1_000_000) return `-₱${(Math.abs(value) / 1_000_000).toFixed(1)}M`;
  if (value <= -1_000) return `-₱${(Math.abs(value) / 1_000).toFixed(0)}K`;
  return `₱${value}`;
}

export function ProfitTrendChart({ data }: ProfitTrendChartProps) {
  if (data.length < 2) {
    return (
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
            Profit Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-sm text-muted-foreground">Not enough data to show trends</p>
        </CardContent>
      </Card>
    );
  }

  // Split into positive/negative for dual coloring
  const chartData = data.map((d) => ({
    label: d.label,
    netProfit: d.netProfit,
    positive: d.netProfit >= 0 ? d.netProfit : 0,
    negative: d.netProfit < 0 ? d.netProfit : 0,
  }));

  return (
    <Card className="border-brand-border shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
          Profit Trend
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Net fleet profit over time
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Net Profit"]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="positive"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.15}
                strokeWidth={2}
                name="Profit"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.15}
                strokeWidth={2}
                name="Loss"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Area chart showing net fleet profit trend over time. Green areas indicate profit, red areas indicate loss.
        </p>
      </CardContent>
    </Card>
  );
}
