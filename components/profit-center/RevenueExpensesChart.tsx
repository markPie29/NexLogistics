"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ChartDataPoint } from "@/lib/profit-center/types";

interface RevenueExpensesChartProps {
  data: ChartDataPoint[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`;
  return `₱${value}`;
}

export function RevenueExpensesChart({ data }: RevenueExpensesChartProps) {
  if (data.length < 2) {
    return (
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
            Revenue vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-sm text-muted-foreground">Not enough data to show trends</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-border shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
          Revenue vs Expenses
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fleet-wide income and costs over time
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "revenue" ? "Revenue" : "Expenses",
                ]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend
                formatter={(value) => (value === "revenue" ? "Revenue" : "Expenses")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#14B8A6" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="expenses" fill="#F87171" radius={[4, 4, 0, 0]} name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Bar chart showing fleet revenue versus expenses over time. Revenue is shown in teal and expenses in red.
        </p>
      </CardContent>
    </Card>
  );
}
