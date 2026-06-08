/**
 * Helper & Office Staff & Partner Payroll Builders
 * Extends the main payroll.ts with additional computation functions.
 */
import type { Trip, PayrollSummary, TripPayroll, PayrollPeriod, Helper, OfficeEmployee } from "@/lib/types";
import { computeOfficeDeductions } from "./office-staff";

// ─── Helper Payroll ──────────────────────────────────────────────

/** Get trips assigned to a helper within [start, end]. */
export function getEligibleTripsForHelper(
  trips: Trip[],
  helperId: string,
  startDate: string,
  endDate: string
): Trip[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59").getTime();
  return trips.filter((t) => {
    if (t.helperId !== helperId) return false;
    if (t.status !== "completed") return false;
    if (t.approvalStatus !== "approved") return false;
    if (t.payrollProcessed) return false;
    const ts = new Date(t.dropoff.scheduledAt).getTime();
    return ts >= start && ts <= end;
  });
}

/** Build payroll summary for a helper (flat per-trip rate). */
export function buildHelperSummary(opts: {
  helper: Helper;
  trips: Trip[];
  period: PayrollPeriod;
}): { summary: PayrollSummary; tripPayrolls: TripPayroll[] } {
  const { helper, trips, period } = opts;
  const perTripRate = helper.baseRatePerTrip ?? 500;
  const baseSalary = helper.monthlyBaseSalary ?? 0;

  const eligible = getEligibleTripsForHelper(trips, helper.id, period.startDate, period.endDate);

  const tripPayrolls: TripPayroll[] = eligible.map((t) => ({
    id: `tp-h-${t.id}-${Date.now().toString(36)}`,
    tripId: t.id,
    driverId: helper.id, // reuse field for helper
    tripRateId: undefined,
    rateType: "fixed" as const,
    baseTripAmount: perTripRate,
    distanceAmount: 0,
    deliveryAmount: 0,
    tonAmount: 0,
    unitAmount: 0,
    commissionAmount: 0,
    extraStopAmount: 0,
    nightDifferential: 0,
    holidayBonus: 0,
    tierMultiplier: 1,
    finalAmount: perTripRate,
    payrollPeriodId: period.id,
    createdAt: new Date().toISOString(),
  }));

  const tripEarnings = tripPayrolls.reduce((s, x) => s + x.finalAmount, 0);
  const baseSalaryForPeriod = baseSalary / 2; // bi-monthly
  const grossPay = baseSalaryForPeriod + tripEarnings;

  // PH government deductions — BIR 2026 compliant
  const sss = Math.min(1350, Math.round(grossPay * 0.045));
  const philhealth = Math.min(2500, Math.round(grossPay * 0.025));
  const pagibig = grossPay > 1500 ? Math.min(200, Math.round(grossPay * 0.02)) : 0;
  const tax = 0; // Helpers typically below tax threshold
  const totalDeductions = sss + philhealth + pagibig + tax;
  const netPay = grossPay - totalDeductions;

  const summary: PayrollSummary = {
    id: `ps-h-${helper.id}-${period.id}`,
    driverId: helper.id,
    payrollPeriodId: period.id,
    payrollMode: baseSalary > 0 ? "fixed_plus_trip" : "per_trip",
    tripsCount: eligible.length,
    baseSalary: baseSalaryForPeriod,
    tripEarnings,
    incentives: 0,
    allowances: 0,
    overtimeAmount: 0,
    sssDeduction: sss,
    philhealthDeduction: philhealth,
    pagibigDeduction: pagibig,
    taxDeduction: tax,
    cashAdvanceDeduction: 0,
    otherDeductions: 0,
    totalDeductions,
    grossPay,
    netPay,
    status: "draft",
  };

  return { summary, tripPayrolls };
}

// ─── Office Staff Payroll ────────────────────────────────────────

export interface OfficePayrollResult {
  employee: OfficeEmployee;
  grossPay: number;
  allowances: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  tax: number;
  totalDeductions: number;
  netPay: number;
}

/** Compute monthly payroll for all active office employees. */
export function computeOfficeStaffPayroll(employees: OfficeEmployee[]): OfficePayrollResult[] {
  return employees
    .filter((e) => e.status === "active")
    .map((e) => {
      const ded = computeOfficeDeductions(e.monthlySalary, e);
      return {
        employee: e,
        grossPay: e.monthlySalary,
        allowances: e.monthlyAllowance ?? 0,
        sss: ded.sss,
        philhealth: ded.philhealth,
        pagibig: ded.pagibig,
        tax: ded.tax,
        totalDeductions: ded.totalDeductions,
        netPay: ded.netPay,
      };
    });
}

// ─── Subcon Partner Payout ───────────────────────────────────────

export interface PartnerPayoutResult {
  partnerId: string;
  partnerName: string;
  trips: { tripId: string; route: string; fare: number; partnerRate: number }[];
  totalPayout: number;
}

/** Compute partner payouts for completed trips in the period. */
export function computePartnerPayouts(
  trips: Trip[],
  partners: { id: string; name: string }[],
  startDate: string,
  endDate: string
): PartnerPayoutResult[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59").getTime();

  const partnerTrips = trips.filter((t) => {
    if (!t.partnerId) return false;
    if (t.status !== "completed") return false;
    if (t.partnerPayoutStatus === "paid") return false;
    const ts = new Date(t.dropoff.scheduledAt).getTime();
    return ts >= start && ts <= end;
  });

  const byPartner: Record<string, PartnerPayoutResult> = {};
  partnerTrips.forEach((t) => {
    if (!byPartner[t.partnerId!]) {
      const partner = partners.find((p) => p.id === t.partnerId);
      byPartner[t.partnerId!] = {
        partnerId: t.partnerId!,
        partnerName: partner?.name ?? "Unknown",
        trips: [],
        totalPayout: 0,
      };
    }
    const rate = t.partnerRate ?? t.fare * 0.7; // default: 70% of fare
    byPartner[t.partnerId!].trips.push({
      tripId: t.id,
      route: `${t.pickup.address.split(",")[0]} → ${t.dropoff.address.split(",")[0]}`,
      fare: t.fare,
      partnerRate: rate,
    });
    byPartner[t.partnerId!].totalPayout += rate;
  });

  return Object.values(byPartner);
}
