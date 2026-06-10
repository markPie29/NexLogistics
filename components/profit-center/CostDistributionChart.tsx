"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CostCategory } from "@/lib/profit-center/types";

interface CostDistributionChartProps {
  data: CostCategory[];
  totalExpenses: number;
}

export function CostDistributionChart({ data, totalExpenses }: CostDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
            Cost Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <p className="text-sm text-muted-foreground">No expense data for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-border shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
        <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">
          Cost Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          Breakdown of fleet expenses by category
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] relative" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="amount"
                nameKey="name"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend
                formatter={(value) => {
                  const item = data.find((d) => d.name === value);
                  return `${value} (${item?.percentage.toFixed(1) ?? 0}%)`;
                }}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-sm font-bold text-brand-navy dark:text-white">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
        <p className="sr-only">
          Donut chart showing expense distribution: {data.map((d) => `${d.name} ${d.percentage}%`).join(", ")}.
        </p>
      </CardContent>
    </Card>
  );
}
