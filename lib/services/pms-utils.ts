/**
 * PMS (Preventive Maintenance Schedule) utility functions.
 *
 * Pure computation functions for KPI metrics, sparklines, cost analytics,
 * and vehicle statistics used by the PMS dashboard components.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5, 8.2
 */

import type {
  MaintenanceRecord,
  MaintenanceStatus,
  MonthlyCost,
  ServiceTypeCost,
} from "@/lib/services/pms-types";

// ─── Status Counts ───────────────────────────────────────────────────────────

/** Count of records by status category. */
export interface StatusCounts {
  overdue: number;
  due_soon: number;
  upcoming: number;
  completed: number;
}

/**
 * Compute the count of records for each maintenance status.
 *
 * Requirements: 2.2, 2.9
 */
export function computeStatusCounts(records: MaintenanceRecord[]): StatusCounts {
  const counts: StatusCounts = {
    overdue: 0,
    due_soon: 0,
    upcoming: 0,
    completed: 0,
  };

  for (const record of records) {
    if (record.status in counts) {
      counts[record.status]++;
    }
  }

  return counts;
}

// ─── Weekly Sparkline ────────────────────────────────────────────────────────

/**
 * Get the ISO week start (Monday) for a given date.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust: Monday = 0, Sunday = 6
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Compute weekly count data for sparkline visualization.
 *
 * Returns an array of counts (one per week) for the given status,
 * looking back `weeks` calendar weeks from the current week.
 *
 * Requirements: 2.3, 2.4
 */
export function computeWeeklySparkline(
  records: MaintenanceRecord[],
  status: MaintenanceStatus,
  weeks: number = 8
): number[] {
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  // Build array of week start timestamps (oldest first)
  const weekStarts: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStarts.push(weekStart.getTime());
  }

  // Initialize counts
  const counts = new Array<number>(weeks).fill(0);

  // Filter records by status and bucket by week
  for (const record of records) {
    if (record.status !== status) continue;

    const dueDate = new Date(record.dueDate);
    if (isNaN(dueDate.getTime())) continue;

    const recordWeekStart = getWeekStart(dueDate).getTime();

    for (let i = 0; i < weekStarts.length; i++) {
      if (recordWeekStart === weekStarts[i]) {
        counts[i]++;
        break;
      }
    }
  }

  return counts;
}

// ─── Monthly Costs ───────────────────────────────────────────────────────────

/**
 * Get short month label from a YYYY-MM string.
 */
function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en", { month: "short" });
}

/**
 * Compute monthly cost aggregation for the past N months.
 *
 * Aggregates the `cost` field from records whose `completedAt` or `dueDate`
 * falls within each calendar month. Records without a cost are treated as 0.
 *
 * Requirements: 2.5, 9.1
 */
export function computeMonthlyCosts(
  records: MaintenanceRecord[],
  months: number = 6
): MonthlyCost[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Build array of YYYY-MM keys (oldest first)
  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
  }

  // Initialize totals map
  const totals = new Map<string, number>();
  for (const key of monthKeys) {
    totals.set(key, 0);
  }

  // Aggregate costs
  for (const record of records) {
    const dateStr = record.completedAt || record.dueDate;
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (totals.has(key)) {
      totals.set(key, totals.get(key)! + (record.cost ?? 0));
    }
  }

  // Build result array
  return monthKeys.map((key) => ({
    month: key,
    label: getMonthLabel(key),
    total: totals.get(key)!,
  }));
}

// ─── Month-over-Month Comparison ─────────────────────────────────────────────

/** Month-over-month cost comparison result. */
export interface MonthOverMonthResult {
  current: number;
  previous: number;
  percentageChange: number | null;
}

/**
 * Compute month-over-month cost comparison.
 *
 * Returns current and previous month totals, and percentage change.
 * If previous month total is 0, percentageChange is null (represents "N/A").
 *
 * Requirements: 9.3, 9.4
 */
export function computeMonthOverMonth(
  records: MaintenanceRecord[]
): MonthOverMonthResult {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const previousKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  let current = 0;
  let previous = 0;

  for (const record of records) {
    const dateStr = record.completedAt || record.dueDate;
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const cost = record.cost ?? 0;

    if (key === currentKey) {
      current += cost;
    } else if (key === previousKey) {
      previous += cost;
    }
  }

  const percentageChange =
    previous === 0 ? null : ((current - previous) / previous) * 100;

  return { current, previous, percentageChange };
}

// ─── Service Type Costs ──────────────────────────────────────────────────────

/**
 * Compute cost breakdown by service type for the past N months.
 *
 * Returns one entry per distinct service type with total cost and percentage
 * of overall spend. Sum of all percentages equals 100% (within floating-point
 * tolerance).
 *
 * Requirements: 9.2
 */
export function computeServiceTypeCosts(
  records: MaintenanceRecord[],
  months: number = 6
): ServiceTypeCost[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Aggregate costs by type within the time window
  const typeTotals = new Map<string, number>();
  let grandTotal = 0;

  for (const record of records) {
    const dateStr = record.completedAt || record.dueDate;
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    if (date < cutoffDate) continue;

    const cost = record.cost ?? 0;
    if (cost <= 0) continue;

    const current = typeTotals.get(record.type) ?? 0;
    typeTotals.set(record.type, current + cost);
    grandTotal += cost;
  }

  // Build result with percentages
  const result: ServiceTypeCost[] = [];
  for (const [type, total] of typeTotals.entries()) {
    result.push({
      type,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    });
  }

  // Sort by total descending for consistent output
  result.sort((a, b) => b.total - a.total);

  return result;
}

// ─── Vehicle Stats ───────────────────────────────────────────────────────────

/** Vehicle lifetime maintenance statistics. */
export interface VehicleStats {
  lifetimeCost: number;
  completedCount: number;
}

/**
 * Compute lifetime cost and completed service count for a set of records
 * (typically filtered to a single vehicle).
 *
 * Requirements: 6.3 (via Property 14)
 */
export function computeVehicleStats(records: MaintenanceRecord[]): VehicleStats {
  let lifetimeCost = 0;
  let completedCount = 0;

  for (const record of records) {
    lifetimeCost += record.cost ?? 0;
    if (record.status === "completed") {
      completedCount++;
    }
  }

  return { lifetimeCost, completedCount };
}

// ─── Most Overdue ────────────────────────────────────────────────────────────

/**
 * Find the most overdue record (the overdue record with the earliest dueDate).
 *
 * Returns null if no records have status "overdue".
 *
 * Requirements: 8.2
 */
export function findMostOverdue(
  records: MaintenanceRecord[]
): MaintenanceRecord | null {
  let mostOverdue: MaintenanceRecord | null = null;
  let earliestTime = Infinity;

  for (const record of records) {
    if (record.status !== "overdue") continue;

    const dueTime = new Date(record.dueDate).getTime();
    if (isNaN(dueTime)) continue;

    if (dueTime < earliestTime) {
      earliestTime = dueTime;
      mostOverdue = record;
    }
  }

  return mostOverdue;
}
