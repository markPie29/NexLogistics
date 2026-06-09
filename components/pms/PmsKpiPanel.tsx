"use client";

/**
 * PMS KPI Panel
 *
 * Renders 5 KPI cards (Overdue, Due Soon, Upcoming, Completed, Monthly Cost)
 * with sparkline trends and a pulsing red animation on the Overdue card when count > 0.
 *
 * Requirements: 1.2, 2.1-2.9, 11.3, 15.5
 */

import { useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { computeStatusCounts } from "@/lib/services/pms-utils";
import { computeWeeklySparkline } from "@/lib/services/pms-utils";
import { computeMonthlyCosts } from "@/lib/services/pms-utils";
import { formatCurrency } from "@/lib/utils";
import type { MaintenanceRecord } from "@/lib/services/pms-types";

interface PmsKpiPanelProps {
  records: MaintenanceRecord[];
}

/**
 * Determine a simple trend direction from sparkline data.
 * Compares the average of the last 3 points to the average of the first 3 points.
 */
function getTrendDirection(data: number[]): "increasing" | "decreasing" | "stable" {
  if (data.length < 2) return "stable";
  const firstHalf = data.slice(0, Math.ceil(data.length / 2));
  const secondHalf = data.slice(Math.ceil(data.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  if (avgSecond > avgFirst) return "increasing";
  if (avgSecond < avgFirst) return "decreasing";
  return "stable";
}

export function PmsKpiPanel({ records }: PmsKpiPanelProps) {
  const statusCounts = useMemo(() => computeStatusCounts(records), [records]);

  const sparklines = useMemo(
    () => ({
      overdue: computeWeeklySparkline(records, "overdue", 8),
      due_soon: computeWeeklySparkline(records, "due_soon", 8),
      upcoming: computeWeeklySparkline(records, "upcoming", 8),
      completed: computeWeeklySparkline(records, "completed", 8),
    }),
    [records]
  );

  const monthlyCostTotal = useMemo(() => {
    const costs = computeMonthlyCosts(records, 1);
    return costs.length > 0 ? costs[costs.length - 1].total : 0;
  }, [records]);

  // Cost sparkline: last 8 months of cost totals
  const costSparkline = useMemo(() => {
    const costs = computeMonthlyCosts(records, 8);
    return costs.map((c) => c.total);
  }, [records]);

  const overdueTrend = getTrendDirection(sparklines.overdue);
  const dueSoonTrend = getTrendDirection(sparklines.due_soon);
  const upcomingTrend = getTrendDirection(sparklines.upcoming);
  const completedTrend = getTrendDirection(sparklines.completed);
  const costTrend = getTrendDirection(costSparkline);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
      {/* Overdue */}
      <div className={statusCounts.overdue > 0 ? "animate-pulse-glow-red rounded-2xl" : ""}>
        <KpiCard
          label="Overdue"
          value={statusCounts.overdue}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-50"
          sparklineData={sparklines.overdue}
          sparklineColor="#EF4444"
        />
        <span className="sr-only">
          Overdue: {statusCounts.overdue}, trend: {overdueTrend}
        </span>
      </div>

      {/* Due Soon */}
      <div>
        <KpiCard
          label="Due Soon"
          value={statusCounts.due_soon}
          icon={Clock}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          sparklineData={sparklines.due_soon}
          sparklineColor="#F59E0B"
        />
        <span className="sr-only">
          Due Soon: {statusCounts.due_soon}, trend: {dueSoonTrend}
        </span>
      </div>

      {/* Upcoming */}
      <div>
        <KpiCard
          label="Upcoming"
          value={statusCounts.upcoming}
          icon={Wrench}
          iconColor="text-sky-500"
          iconBg="bg-sky-50"
          sparklineData={sparklines.upcoming}
          sparklineColor="#0EA5E9"
        />
        <span className="sr-only">
          Upcoming: {statusCounts.upcoming}, trend: {upcomingTrend}
        </span>
      </div>

      {/* Completed */}
      <div>
        <KpiCard
          label="Completed"
          value={statusCounts.completed}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
          sparklineData={sparklines.completed}
          sparklineColor="#10B981"
        />
        <span className="sr-only">
          Completed: {statusCounts.completed}, trend: {completedTrend}
        </span>
      </div>

      {/* Monthly Cost */}
      <div>
        <KpiCard
          label="Monthly Cost"
          value={formatCurrency(monthlyCostTotal)}
          icon={DollarSign}
          iconColor="text-teal-500"
          iconBg="bg-teal-50"
          sparklineData={costSparkline}
          sparklineColor="#14B8A6"
        />
        <span className="sr-only">
          Monthly Cost: {formatCurrency(monthlyCostTotal)}, trend: {costTrend}
        </span>
      </div>
    </div>
  );
}
