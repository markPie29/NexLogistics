/**
 * Smart Payroll Wizard — Pure utility functions
 *
 * Extracted from the wizard page for testability.
 * These functions have NO store dependency and operate on plain data.
 */
import type {
  PayrollPeriod,
  PayrollSummary,
  Driver,
  Helper,
  DriverPayrollProfile,
  Trip,
  Incentive,
  Deduction,
  PayrollMode,
} from "@/lib/types";

// ─── Period Detection ─────────────────────────────────────────

export interface PeriodConfig {
  name: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string;
  payDate: string;
  cutoff: "A" | "B";
}

/**
 * Detect next payroll period from current date.
 * Cutoff A = 1st–15th, Cutoff B = 16th–last day of month.
 */
export function detectPeriodFromDate(date: Date): PeriodConfig {
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  const isA = day <= 15;
  const startDate = new Date(year, month, isA ? 1 : 16);
  const endDate = isA
    ? new Date(year, month, 15)
    : new Date(year, month + 1, 0); // last day of month

  const cutoff: "A" | "B" = isA ? "A" : "B";
  const name = formatPeriodName(fmt(startDate), fmt(endDate));
  const payDate = computePayDate(fmt(endDate));

  return { name, startDate: fmt(startDate), endDate: fmt(endDate), payDate, cutoff };
}

/**
 * Detect next sequential period based on the most recently closed/paid period.
 * If last closed is Cutoff A (ends on 15th) → next is Cutoff B of same month.
 * If last closed is Cutoff B (ends on last day) → next is Cutoff A of next month.
 * Falls back to detectPeriodFromDate if no closed periods exist.
 */
export function detectNextPeriodFromHistory(periods: PayrollPeriod[]): PeriodConfig {
  const closedOrPaid = periods
    .filter((p) => p.status === "closed" || p.status === "paid")
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  if (closedOrPaid.length === 0) {
    return detectPeriodFromDate(new Date());
  }

  const last = closedOrPaid[0];
  const lastEnd = new Date(last.endDate);
  const lastEndDay = lastEnd.getDate();
  const lastMonth = lastEnd.getMonth();
  const lastYear = lastEnd.getFullYear();

  // If last ended on 15th → it was Cutoff A → next is Cutoff B (16th–last day of same month)
  if (lastEndDay === 15) {
    const nextStart = new Date(lastYear, lastMonth, 16);
    const nextEnd = new Date(lastYear, lastMonth + 1, 0); // last day
    return {
      name: formatPeriodName(fmt(nextStart), fmt(nextEnd)),
      startDate: fmt(nextStart),
      endDate: fmt(nextEnd),
      payDate: computePayDate(fmt(nextEnd)),
      cutoff: "B",
    };
  }

  // Otherwise it was Cutoff B → next is Cutoff A of next month
  const nextMonth = lastMonth + 1;
  const nextYear = nextMonth > 11 ? lastYear + 1 : lastYear;
  const adjMonth = nextMonth > 11 ? 0 : nextMonth;
  const nextStart = new Date(nextYear, adjMonth, 1);
  const nextEnd = new Date(nextYear, adjMonth, 15);
  return {
    name: formatPeriodName(fmt(nextStart), fmt(nextEnd)),
    startDate: fmt(nextStart),
    endDate: fmt(nextEnd),
    payDate: computePayDate(fmt(nextEnd)),
    cutoff: "A",
  };
}

/**
 * Format period name: "{Month} {startDay}-{endDay}, {year} · Cut-off {A|B}"
 */
export function formatPeriodName(startDate: string, endDate: string): string {
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  const month = s.toLocaleString("en-US", { month: "long" });
  const year = s.getFullYear();
  const startDay = s.getDate();
  const endDay = e.getDate();
  const half = startDay <= 15 ? "A" : "B";
  return `${month} ${startDay}-${endDay}, ${year} · Cut-off ${half}`;
}

/**
 * Compute pay date: endDate + 5 calendar days.
 */
export function computePayDate(endDate: string): string {
  const d = new Date(endDate + "T00:00:00");
  d.setDate(d.getDate() + 5);
  return fmt(d);
}

// ─── Overlap Detection ────────────────────────────────────────

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingPeriod?: PayrollPeriod;
  isExactMatch: boolean;
  isBlocking: boolean; // true if overlapping period is "paid" or "closed"
}

/**
 * Check if candidate period overlaps any existing period.
 */
export function detectPeriodOverlap(
  startDate: string,
  endDate: string,
  existingPeriods: PayrollPeriod[]
): OverlapResult {
  const candidateStart = new Date(startDate).getTime();
  const candidateEnd = new Date(endDate + "T23:59:59").getTime();

  for (const p of existingPeriods) {
    const pStart = new Date(p.startDate).getTime();
    const pEnd = new Date(p.endDate + "T23:59:59").getTime();

    // Overlap: start1 <= end2 && start2 <= end1
    if (candidateStart <= pEnd && pStart <= candidateEnd) {
      const isExactMatch = startDate === p.startDate && endDate === p.endDate;
      const isBlocking = p.status === "paid" || p.status === "closed";
      return { hasOverlap: true, overlappingPeriod: p, isExactMatch, isBlocking };
    }
  }

  return { hasOverlap: false, isExactMatch: false, isBlocking: false };
}

// ─── Employee Eligibility ─────────────────────────────────────

export interface EmployeeEligibility {
  employeeId: string;
  employeeName: string;
  employeeType: "driver" | "helper" | "office";
  approvedTrips: number;
  pendingTrips: number;
  rejectedTrips: number;
  totalTrips: number;
  payrollMode: PayrollMode | null;
  isFixedSalary: boolean;
}

/**
 * Filter and aggregate employee eligibility for the period.
 * Returns only employees who will receive pay (approved trips > 0 OR fixed/hybrid profile).
 */
export function filterEligibleEmployees(
  drivers: Driver[],
  helpers: Helper[],
  profiles: DriverPayrollProfile[],
  trips: Trip[],
  startDate: string,
  endDate: string
): EmployeeEligibility[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59").getTime();
  const results: EmployeeEligibility[] = [];

  // Drivers
  for (const d of drivers) {
    const profile = profiles.find((p) => p.driverId === d.id && p.active);
    const driverTrips = trips.filter(
      (t) =>
        t.driverId === d.id &&
        (t.status === "completed" || t.status === "delivered") &&
        !t.payrollProcessed &&
        new Date(t.dropoff.scheduledAt).getTime() >= start &&
        new Date(t.dropoff.scheduledAt).getTime() <= end
    );
    const approved = driverTrips.filter((t) => t.approvalStatus === "approved").length;
    const pending = driverTrips.filter((t) => !t.approvalStatus || t.approvalStatus === "pending").length;
    const rejected = driverTrips.filter((t) => t.approvalStatus === "rejected").length;
    const isFixed = profile?.payrollMode === "fixed_salary" || profile?.payrollMode === "fixed_plus_trip";

    if (approved > 0 || isFixed) {
      results.push({
        employeeId: d.id,
        employeeName: d.name,
        employeeType: "driver",
        approvedTrips: approved,
        pendingTrips: pending,
        rejectedTrips: rejected,
        totalTrips: driverTrips.length,
        payrollMode: profile?.payrollMode ?? null,
        isFixedSalary: !!isFixed,
      });
    }
  }

  // Helpers
  for (const h of helpers) {
    if (h.status !== "active") continue;
    const helperTrips = trips.filter(
      (t) =>
        t.helperId === h.id &&
        (t.status === "completed" || t.status === "delivered") &&
        !t.payrollProcessed &&
        new Date(t.dropoff.scheduledAt).getTime() >= start &&
        new Date(t.dropoff.scheduledAt).getTime() <= end
    );
    const approved = helperTrips.filter((t) => t.approvalStatus === "approved").length;
    const pending = helperTrips.filter((t) => !t.approvalStatus || t.approvalStatus === "pending").length;
    const rejected = helperTrips.filter((t) => t.approvalStatus === "rejected").length;
    const isFixed = h.employmentType === "monthly" || h.employmentType === "hybrid";

    if (approved > 0 || isFixed) {
      results.push({
        employeeId: h.id,
        employeeName: h.name,
        employeeType: "helper",
        approvedTrips: approved,
        pendingTrips: pending,
        rejectedTrips: rejected,
        totalTrips: helperTrips.length,
        payrollMode: isFixed ? "fixed_salary" : "per_trip",
        isFixedSalary: !!isFixed,
      });
    }
  }

  return results;
}

// ─── Blocking Threshold ───────────────────────────────────────

/**
 * Determine if pending trip count exceeds threshold.
 */
export function isBlockedByPendingTrips(
  pendingCount: number,
  threshold: number
): boolean {
  return pendingCount > threshold;
}

// ─── Adjustment Impact ────────────────────────────────────────

export interface AdjustmentImpact {
  totalIncentives: number;
  totalDeductions: number;
  netImpact: number; // incentives - deductions
  itemCount: number;
}

/**
 * Compute net impact of unlocked adjustments within period range.
 */
export function computeAdjustmentImpact(
  incentives: Incentive[],
  deductions: Deduction[],
  startDate: string,
  endDate: string
): AdjustmentImpact {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59").getTime();

  const activeIncentives = incentives.filter(
    (i) =>
      !i.payrollPeriodId &&
      new Date(i.createdAt).getTime() >= start &&
      new Date(i.createdAt).getTime() <= end
  );

  const activeDeductions = deductions.filter(
    (d) =>
      !d.payrollPeriodId &&
      d.status !== "waived" &&
      new Date(d.createdAt).getTime() >= start &&
      new Date(d.createdAt).getTime() <= end
  );

  const totalIncentives = activeIncentives.reduce((s, i) => s + i.amount, 0);
  const totalDeductions = activeDeductions.reduce((s, d) => s + d.amount, 0);

  return {
    totalIncentives,
    totalDeductions,
    netImpact: totalIncentives - totalDeductions,
    itemCount: activeIncentives.length + activeDeductions.length,
  };
}

// ─── Smart Warnings ───────────────────────────────────────────

export type WarningSeverity = "error" | "warning" | "info";

export interface PayrollWarning {
  severity: WarningSeverity;
  message: string;
  employeeId?: string;
}

/**
 * Generate categorized warnings from computed results.
 * Sorted: errors first, then warnings, then info.
 */
export function generateSmartWarnings(
  computed: { driverId: string; driverName: string; summary: { grossPay: number; netPay: number; taxDeduction: number; baseSalary: number; tripEarnings: number } }[],
  allTrips: Trip[],
  profiles: DriverPayrollProfile[],
  drivers: Driver[]
): PayrollWarning[] {
  const warnings: PayrollWarning[] = [];

  // Zero or negative net pay → error
  for (const c of computed) {
    if (c.summary.netPay <= 0) {
      warnings.push({
        severity: "error",
        message: `${c.driverName}: Net pay is ₱0 or negative (₱${c.summary.netPay.toLocaleString()})`,
        employeeId: c.driverId,
      });
    }
  }

  // Duplicate entries → error
  const ids = computed.map((c) => c.driverId);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const uniqueDupes = [...new Set(dupes)];
  for (const id of uniqueDupes) {
    const name = computed.find((c) => c.driverId === id)?.driverName;
    warnings.push({
      severity: "error",
      message: `Duplicate entry detected: ${name} appears more than once`,
      employeeId: id,
    });
  }

  // Zero gross pay with active profile → warning
  for (const c of computed) {
    if (c.summary.grossPay === 0 && c.summary.baseSalary === 0 && c.summary.tripEarnings === 0) {
      warnings.push({
        severity: "warning",
        message: `${c.driverName}: Zero gross pay — no trips and no base salary in this period`,
        employeeId: c.driverId,
      });
    }
  }

  // Drivers with trips but no profile → info
  const computedDriverIds = new Set(computed.map((c) => c.driverId));
  const driversWithTripsNoProfile = drivers.filter(
    (d) =>
      !computedDriverIds.has(d.id) &&
      !profiles.find((p) => p.driverId === d.id) &&
      allTrips.some(
        (t) => t.driverId === d.id && (t.status === "completed" || t.status === "delivered")
      )
  );
  for (const d of driversWithTripsNoProfile) {
    warnings.push({
      severity: "info",
      message: `${d.name}: Has completed trips but no payroll profile configured`,
      employeeId: d.id,
    });
  }

  // BIR compliance note when tax computed
  if (computed.some((c) => c.summary.taxDeduction > 0)) {
    warnings.push({
      severity: "info",
      message: "BIR 2026: Withholding tax computed per TRAIN Law monthly brackets. Ensure BIR Form 1601-C is filed.",
    });
  }

  // Sort: errors first, warnings, then info
  const severityOrder: Record<WarningSeverity, number> = { error: 0, warning: 1, info: 2 };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return warnings;
}

// ─── Cross-Period Duplicate Detection ─────────────────────────

export interface DuplicateFlag {
  employeeId: string;
  employeeName: string;
  conflictingPeriodName: string;
}

/**
 * Detect employees who appear in existing periods with overlapping dates.
 */
export function detectCrossPeriodDuplicates(
  currentStartDate: string,
  currentEndDate: string,
  computedEmployeeIds: string[],
  existingPeriods: PayrollPeriod[],
  existingSummaries: PayrollSummary[],
  employeeNameMap: Record<string, string>
): DuplicateFlag[] {
  const flags: DuplicateFlag[] = [];
  const candidateStart = new Date(currentStartDate).getTime();
  const candidateEnd = new Date(currentEndDate + "T23:59:59").getTime();

  for (const period of existingPeriods) {
    const pStart = new Date(period.startDate).getTime();
    const pEnd = new Date(period.endDate + "T23:59:59").getTime();

    // Check overlap
    if (candidateStart <= pEnd && pStart <= candidateEnd) {
      // Find employees in this overlapping period
      const periodSummaries = existingSummaries.filter((s) => s.payrollPeriodId === period.id);
      for (const summary of periodSummaries) {
        if (computedEmployeeIds.includes(summary.driverId)) {
          flags.push({
            employeeId: summary.driverId,
            employeeName: employeeNameMap[summary.driverId] || summary.driverId,
            conflictingPeriodName: period.name,
          });
        }
      }
    }
  }

  return flags;
}

// ─── Grand Total ──────────────────────────────────────────────

/**
 * Sum net pay across all categories.
 */
export function computeGrandTotal(
  driverSummaries: { netPay: number }[],
  helperSummaries: { netPay: number }[],
  officeResults: { netPay: number }[],
  partnerResults: { totalPayout: number }[]
): number {
  const driverTotal = driverSummaries.reduce((a, b) => a + b.netPay, 0);
  const helperTotal = helperSummaries.reduce((a, b) => a + b.netPay, 0);
  const officeTotal = officeResults.reduce((a, b) => a + b.netPay, 0);
  const partnerTotal = partnerResults.reduce((a, b) => a + b.totalPayout, 0);
  return driverTotal + helperTotal + officeTotal + partnerTotal;
}

// ─── Helpers ──────────────────────────────────────────────────

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
