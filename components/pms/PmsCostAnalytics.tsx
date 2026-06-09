"use client";

/**
 * PMS Cost Analytics
 *
 * Collapsible section with cost charts (monthly bar chart, service type breakdown,
 * month-over-month comparison) using recharts.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 12.2
 */

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeMonthlyCosts,
  computeServiceTypeCosts,
  computeMonthOverMonth,
} from "@/lib/services/pms-utils";
import { formatCurrency } from "@/lib/utils";
import type { MaintenanceRecord } from "@/lib/services/pms-types";

interface PmsCostAnalyticsProps {
  records: MaintenanceRecord[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Brand teal for primary chart fill */
const BRAND_TEAL = "#66B2B2";

/** Pie chart color palette with good dark mode contrast */
const PIE_COLORS = [
  "#66B2B2", // brand teal
  "#0EA5E9", // sky
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EF4444", // red
  "#10B981", // emerald
  "#EC4899", // pink
  "#6366F1", // indigo
];

export function PmsCostAnalytics({
  records,
  collapsed,
  onToggleCollapse,
}: PmsCostAnalyticsProps) {
  // Compute monthly costs for bar chart (6 months)
  const monthlyCosts = useMemo(() => computeMonthlyCosts(records, 6), [records]);

  // Compute service type breakdown (6 months)
  const serviceTypeCosts = useMemo(
    () => computeServiceTypeCosts(records, 6),
    [records]
  );

  // Compute month-over-month comparison
  const monthOverMonth = useMemo(() => computeMonthOverMonth(records), [records]);

  // Determine if there's any cost data in the 6-month window
  const hasData = useMemo(
    () => monthlyCosts.some((m) => m.total > 0),
    [monthlyCosts]
  );

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={onToggleCollapse}
        role="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand cost analytics" : "Collapse cost analytics"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
      >
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-500" />
          Cost Analytics
        </CardTitle>
        {collapsed ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </CardHeader>

      {!collapsed && (
        <CardContent>
          {!hasData ? (
            <div className="text-center py-8 text-muted-foreground">
              No cost data available for the past 6 months
            </div>
          ) : (
            <div className="space-y-6">
              {/* Month-over-Month Comparison */}
              <MonthOverMonthSection
                current={monthOverMonth.current}
                previous={monthOverMonth.previous}
                percentageChange={monthOverMonth.percentageChange}
              />

              {/* Monthly Cost Bar Chart */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Monthly Maintenance Cost (Last 6 Months)
                </h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyCosts}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        axisLine={{ stroke: "currentColor", opacity: 0.2 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "currentColor", fontSize: 12 }}
                        axisLine={{ stroke: "currentColor", opacity: 0.2 }}
                        tickLine={false}
                        tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={<CostTooltip />}
                        cursor={{ fill: "rgba(102, 178, 178, 0.1)" }}
                      />
                      <Bar
                        dataKey="total"
                        fill={BRAND_TEAL}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Service Type Breakdown */}
              {serviceTypeCosts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">
                    Cost by Service Type
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Pie Chart — clean donut, no labels (hover shows tooltip) */}
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceTypeCosts}
                            dataKey="total"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            innerRadius={45}
                            paddingAngle={2}
                            label={false}
                            labelLine={false}
                          >
                            {serviceTypeCosts.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<ServiceTypeTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Service type legend list */}
                    <div className="space-y-2.5">
                      {serviceTypeCosts.map((item, index) => (
                        <div
                          key={item.type}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span className="text-foreground truncate">
                              {item.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {item.percentage.toFixed(1)}%
                            </span>
                            <span className="font-medium text-foreground w-24 text-right">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MonthOverMonthSectionProps {
  current: number;
  previous: number;
  percentageChange: number | null;
}

function MonthOverMonthSection({
  current,
  previous,
  percentageChange,
}: MonthOverMonthSectionProps) {
  const isIncrease = percentageChange !== null && percentageChange > 0;
  const isDecrease = percentageChange !== null && percentageChange < 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-muted/50">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1">This Month</p>
        <p className="text-2xl font-bold text-foreground">
          {formatCurrency(current)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {percentageChange === null ? (
          <span className="text-sm font-medium text-muted-foreground px-3 py-1 rounded-md bg-muted">
            N/A
          </span>
        ) : (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${
              isIncrease
                ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950"
                : "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950"
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{Math.abs(percentageChange).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 text-right">
        <p className="text-xs text-muted-foreground mb-1">Last Month</p>
        <p className="text-lg font-medium text-foreground">
          {formatCurrency(previous)}
        </p>
      </div>
    </div>
  );
}

// ─── Custom Tooltips ─────────────────────────────────────────────────────────

function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-teal-600 dark:text-teal-400">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function ServiceTypeTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium text-foreground">{data.type}</p>
      <p className="text-sm text-muted-foreground">
        {formatCurrency(data.total)} ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}
