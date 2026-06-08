import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type {
  TripRate,
  DriverPayrollProfile,
  Incentive,
  Deduction,
  PayrollPeriod,
  PayrollSummary,
  TripPayroll,
  Trip,
  Driver,
} from "@/lib/types";
import {
  seedTripRates,
  seedDriverPayrollProfiles,
  seedIncentives,
  seedDeductions,
  seedPayrollPeriods,
  seedPayrollSummaries,
  seedTripPayroll,
} from "@/lib/data/payroll-config";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Trip Rates
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface TripRateState {
  rates: TripRate[];
  addRate: (r: Omit<TripRate, "id">) => TripRate;
  updateRate: (id: string, patch: Partial<TripRate>) => void;
  deleteRate: (id: string) => void;
  reset: () => void;
}
export const useTripRateStore = create<TripRateState>()(
  persist(
    (set) => ({
      rates: seedTripRates,
      addRate: (r) => {
        const nr: TripRate = { ...r, id: `tr-${Date.now().toString(36)}` };
        set((s) => ({ rates: [nr, ...s.rates] }));
        return nr;
      },
      updateRate: (id, patch) =>
        set((s) => ({ rates: s.rates.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteRate: (id) => set((s) => ({ rates: s.rates.filter((x) => x.id !== id) })),
      reset: () => set({ rates: seedTripRates }),
    }),
    { name: `${BRAND.storeKey}-trip-rates` }
  )
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Driver Payroll Profiles
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface DriverPayrollProfileState {
  profiles: DriverPayrollProfile[];
  addProfile: (p: Omit<DriverPayrollProfile, "id">) => DriverPayrollProfile;
  updateProfile: (id: string, patch: Partial<DriverPayrollProfile>) => void;
  upsertByDriver: (driverId: string, patch: Partial<DriverPayrollProfile>) => void;
  reset: () => void;
}
export const useDriverPayrollProfileStore = create<DriverPayrollProfileState>()(
  persist(
    (set, get) => ({
      profiles: seedDriverPayrollProfiles,
      addProfile: (p) => {
        const np: DriverPayrollProfile = { ...p, id: `dp-${Date.now().toString(36)}` };
        set((s) => ({ profiles: [np, ...s.profiles] }));
        return np;
      },
      updateProfile: (id, patch) =>
        set((s) => ({ profiles: s.profiles.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      upsertByDriver: (driverId, patch) => {
        const existing = get().profiles.find((p) => p.driverId === driverId);
        if (existing) {
          set((s) => ({ profiles: s.profiles.map((x) => (x.id === existing.id ? { ...x, ...patch } : x)) }));
        } else {
          const np: DriverPayrollProfile = {
            id: `dp-${Date.now().toString(36)}`,
            driverId,
            payrollMode: "fixed_plus_trip",
            baseSalary: 10000,
            sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
            overtimeEnabled: true, allowanceEnabled: false,
            active: true,
            ...patch,
          };
          set((s) => ({ profiles: [np, ...s.profiles] }));
        }
      },
      reset: () => set({ profiles: seedDriverPayrollProfiles }),
    }),
    { name: `${BRAND.storeKey}-driver-payroll-profiles` }
  )
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Incentives
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface IncentiveState {
  incentives: Incentive[];
  addIncentive: (i: Omit<Incentive, "id" | "createdAt"> & { createdAt?: string }) => Incentive;
  deleteIncentive: (id: string) => void;
  lockToPeriod: (ids: string[], payrollPeriodId: string) => void;
  reset: () => void;
  clearAll: () => void;
}
export const useIncentiveStore = create<IncentiveState>()(
  persist(
    (set) => ({
      incentives: seedIncentives,
      addIncentive: (i) => {
        const ni: Incentive = { ...i, id: `in-${Date.now().toString(36)}`, createdAt: i.createdAt ?? new Date().toISOString() };
        set((s) => ({ incentives: [ni, ...s.incentives] }));
        return ni;
      },
      deleteIncentive: (id) => set((s) => ({ incentives: s.incentives.filter((x) => x.id !== id) })),
      lockToPeriod: (ids, payrollPeriodId) =>
        set((s) => ({ incentives: s.incentives.map((x) => (ids.includes(x.id) ? { ...x, payrollPeriodId } : x)) })),
      reset: () => set({ incentives: seedIncentives }),
      clearAll: () => set({ incentives: [] }),
    }),
    { name: `${BRAND.storeKey}-incentives` }
  )
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Deductions
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface DeductionState {
  deductions: Deduction[];
  addDeduction: (d: Omit<Deduction, "id" | "createdAt">) => Deduction;
  updateDeduction: (id: string, patch: Partial<Deduction>) => void;
  deleteDeduction: (id: string) => void;
  lockToPeriod: (ids: string[], payrollPeriodId: string) => void;
  reset: () => void;
  clearAll: () => void;
}
export const useDeductionStore = create<DeductionState>()(
  persist(
    (set) => ({
      deductions: seedDeductions,
      addDeduction: (d) => {
        const nd: Deduction = { ...d, id: `dd-${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
        set((s) => ({ deductions: [nd, ...s.deductions] }));
        return nd;
      },
      updateDeduction: (id, patch) =>
        set((s) => ({ deductions: s.deductions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteDeduction: (id) => set((s) => ({ deductions: s.deductions.filter((x) => x.id !== id) })),
      lockToPeriod: (ids, payrollPeriodId) =>
        set((s) => ({ deductions: s.deductions.map((x) => (ids.includes(x.id) ? { ...x, payrollPeriodId, status: "applied" as const } : x)) })),
      reset: () => set({ deductions: seedDeductions }),
      clearAll: () => set({ deductions: [] }),
    }),
    { name: `${BRAND.storeKey}-deductions` }
  )
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Payroll Periods + Summaries + TripPayroll (combined for atomic ops)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PayrollPeriodState {
  periods: PayrollPeriod[];
  summaries: PayrollSummary[];
  tripPayrolls: TripPayroll[];
  addPeriod: (p: Omit<PayrollPeriod, "id">) => PayrollPeriod;
  updatePeriod: (id: string, patch: Partial<PayrollPeriod>) => void;
  deletePeriod: (id: string) => void;
  setSummariesForPeriod: (periodId: string, summaries: PayrollSummary[], tripPayrolls: TripPayroll[]) => void;
  approvePeriod: (id: string, by: string, notes?: string) => void;
  payPeriod: (id: string, by: string, paymentMethod?: string, paymentRef?: string, actualPayDate?: string, notes?: string) => void;
  closePeriod: (id: string, by: string) => void;
  reset: () => void;
  clearAll: () => void;
}
export const usePayrollPeriodStore = create<PayrollPeriodState>()(
  persist(
    (set) => ({
      periods: seedPayrollPeriods,
      summaries: seedPayrollSummaries,
      tripPayrolls: seedTripPayroll,
      addPeriod: (p) => {
        const np: PayrollPeriod = { ...p, id: `pp-${Date.now().toString(36)}` };
        set((s) => ({ periods: [np, ...s.periods] }));
        return np;
      },
      updatePeriod: (id, patch) =>
        set((s) => ({ periods: s.periods.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deletePeriod: (id) =>
        set((s) => ({
          periods: s.periods.filter((x) => x.id !== id),
          summaries: s.summaries.filter((x) => x.payrollPeriodId !== id),
          tripPayrolls: s.tripPayrolls.filter((x) => x.payrollPeriodId !== id),
        })),
      setSummariesForPeriod: (periodId, summaries, tripPayrolls) =>
        set((s) => ({
          summaries: [...s.summaries.filter((x) => x.payrollPeriodId !== periodId), ...summaries],
          tripPayrolls: [...s.tripPayrolls.filter((x) => x.payrollPeriodId !== periodId), ...tripPayrolls],
        })),
      approvePeriod: (id, by, notes) =>
        set((s) => ({
          periods: s.periods.map((p) => (p.id === id ? { ...p, status: "approved", approvedBy: by, approvedAt: new Date().toISOString(), ...(notes ? { notes } : {}) } : p)),
          summaries: s.summaries.map((sm) => (sm.payrollPeriodId === id ? { ...sm, status: "approved" } : sm)),
        })),
      payPeriod: (id, by, paymentMethod, paymentRef, actualPayDate, notes) =>
        set((s) => ({
          periods: s.periods.map((p) => (p.id === id ? {
            ...p, status: "paid", paidBy: by, paidAt: new Date().toISOString(),
            ...(paymentMethod ? { paymentMethod } : {}),
            ...(paymentRef ? { paymentRef } : {}),
            ...(actualPayDate ? { payDate: actualPayDate } : {}),
            ...(notes ? { notes } : {}),
          } : p)),
          summaries: s.summaries.map((sm) => (sm.payrollPeriodId === id ? { ...sm, status: "paid", paidAt: new Date().toISOString() } : sm)),
        })),
      closePeriod: (id, by) =>
        set((s) => ({
          periods: s.periods.map((p) => (p.id === id ? { ...p, status: "closed", closedBy: by, closedAt: new Date().toISOString() } : p)),
        })),
      reset: () =>
        set({ periods: seedPayrollPeriods, summaries: seedPayrollSummaries, tripPayrolls: seedTripPayroll }),
      clearAll: () =>
        set({ periods: [], summaries: [], tripPayrolls: [] }),
    }),
    { name: `${BRAND.storeKey}-payroll-periods` }
  )
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Computation Engine â€” Pure functions
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Match best trip rate for a given trip + driver profile. */
export function findBestRate(
  trip: Trip,
  vehicleType: string | undefined,
  rates: TripRate[],
  defaultRateId?: string
): TripRate | undefined {
  const active = rates.filter((r) => r.active);
  const origin = trip.pickup.address.toLowerCase();
  const dest = trip.dropoff.address.toLowerCase();

  // 1) Route + vehicle + dropoff zone match (highest specificity)
  const exactZone = active.find(
    (r) =>
      r.vehicleType === vehicleType &&
      r.routeOrigin !== "*" &&
      r.routeDestination !== "*" &&
      r.dropoffZone &&
      origin.includes(r.routeOrigin.toLowerCase()) &&
      dest.includes(r.routeDestination.toLowerCase()) &&
      dest.includes(r.dropoffZone.toLowerCase())
  );
  if (exactZone) return exactZone;

  // 2) Exact route + vehicle match
  const exact = active.find(
    (r) =>
      r.vehicleType === vehicleType &&
      r.routeOrigin !== "*" &&
      r.routeDestination !== "*" &&
      origin.includes(r.routeOrigin.toLowerCase()) &&
      dest.includes(r.routeDestination.toLowerCase())
  );
  if (exact) return exact;

  // 3) Vehicle type match (any route)
  const byType = active.find(
    (r) => r.vehicleType === vehicleType && (r.routeOrigin === "*" || r.routeDestination === "*")
  );
  if (byType) return byType;

  // 4) Driver default
  if (defaultRateId) {
    const def = active.find((r) => r.id === defaultRateId);
    if (def) return def;
  }
  // 5) First active fallback
  return active[0];
}

/** Resolve the distance-tier multiplier for a trip's km against a rate's tiers. */
function resolveTierMultiplier(rate: TripRate | undefined, distanceKm: number): number {
  if (!rate?.distanceTiers?.length) return 1;
  const hit = rate.distanceTiers.find((t) => distanceKm >= t.minKm && distanceKm <= t.maxKm);
  return hit?.multiplier ?? 1;
}

/** Compute a single trip's payroll amount based on the matched rate. */
export function computeTripPayroll(
  trip: Trip,
  rate: TripRate | undefined,
  profile: DriverPayrollProfile,
  payrollPeriodId: string
): TripPayroll {
  let baseTripAmount = 0;
  let distanceAmount = 0;
  let deliveryAmount = 0;
  let tonAmount = 0;
  let unitAmount = 0;
  let commissionAmount = 0;
  const extraStopAmount = 0; // future: count POD drops
  const nightDifferential = 0;
  const holidayBonus = 0;

  const rateType = rate?.rateType ?? "fixed";
  const tons = (trip.cargo?.weightKg ?? 0) / 1000;
  const units = trip.cargo?.units ?? 0;

  switch (profile.payrollMode) {
    case "fixed_salary":
      // No per-trip earnings; base salary handled at summary level.
      break;

    case "per_trip":
      baseTripAmount = profile.perTripFlatRate ?? rate?.fixedRate ?? 1000;
      break;

    case "per_delivery":
      deliveryAmount = profile.perDeliveryRate ?? rate?.ratePerDelivery ?? 100;
      break;

    case "percentage": {
      const pct = profile.commissionPercent ?? rate?.commissionPercent ?? 10;
      commissionAmount = (trip.fare * pct) / 100;
      break;
    }

    case "fixed_plus_trip":
    default:
      // Use rate engine
      if (rate) {
        switch (rate.rateType) {
          case "fixed":
            baseTripAmount = rate.fixedRate ?? 0;
            break;
          case "per_km":
            distanceAmount = (rate.ratePerKm ?? 0) * trip.distanceKm;
            break;
          case "per_delivery":
            deliveryAmount = rate.ratePerDelivery ?? 0;
            break;
          case "percentage":
            commissionAmount = (trip.fare * (rate.commissionPercent ?? 0)) / 100;
            break;
          case "per_ton":
            tonAmount = (rate.ratePerTon ?? 0) * tons;
            break;
          case "per_unit":
            unitAmount = (rate.ratePerUnit ?? 0) * units;
            break;
        }
      } else {
        baseTripAmount = 1000;
      }
      break;
  }

  const tierMultiplier = resolveTierMultiplier(rate, trip.distanceKm);
  const subtotal =
    baseTripAmount +
    distanceAmount +
    deliveryAmount +
    tonAmount +
    unitAmount +
    commissionAmount +
    extraStopAmount +
    nightDifferential +
    holidayBonus;
  const finalAmount = Math.round(subtotal * tierMultiplier);

  return {
    id: `tp-${trip.id}-${Date.now().toString(36)}`,
    tripId: trip.id,
    driverId: trip.driverId!,
    tripRateId: rate?.id,
    rateType,
    baseTripAmount,
    distanceAmount,
    deliveryAmount,
    tonAmount,
    unitAmount,
    commissionAmount,
    extraStopAmount,
    nightDifferential,
    holidayBonus,
    tierMultiplier,
    finalAmount,
    payrollPeriodId,
    createdAt: new Date().toISOString(),
  };
}

/** 
 * Philippine Government Deductions — BIR 2026 Compliant (TRAIN Law)
 * 
 * SSS 2024 Schedule: Employee share = 4.5% of Monthly Salary Credit, max ₱1,350
 * PhilHealth 2025-2026: 5% total premium rate, employee share = 2.5%, max contribution ₱2,500/employee
 * Pag-IBIG: 2% for salary > ₱1,500, max employee contribution ₱200
 * 
 * Withholding Tax (BIR TRAIN Law, monthly):
 *   ₱0 – ₱20,833          → 0%
 *   ₱20,833 – ₱33,333     → 15% of excess over ₱20,833
 *   ₱33,333 – ₱66,667     → ₱1,875 + 20% of excess over ₱33,333
 *   ₱66,667 – ₱166,667    → ₱8,542 + 25% of excess over ₱66,667
 *   ₱166,667 – ₱666,667   → ₱33,542 + 30% of excess over ₱166,667
 *   Over ₱666,667          → ₱183,542 + 35% of excess over ₱666,667
 */
export function computeGovernmentDeductions(grossPay: number, profile: DriverPayrollProfile) {
  // SSS: 4.5% employee share, max ₱1,350
  const sss = profile.sssEnabled ? Math.min(1350, Math.round(grossPay * 0.045)) : 0;

  // PhilHealth: 2.5% employee share (half of 5% total), max ₱2,500
  const philhealth = profile.philhealthEnabled ? Math.min(2500, Math.round(grossPay * 0.025)) : 0;

  // Pag-IBIG: 2% for salary > ₱1,500, max ₱200
  const pagibig = profile.pagibigEnabled ? (grossPay > 1500 ? Math.min(200, Math.round(grossPay * 0.02)) : 0) : 0;

  // Withholding Tax (TRAIN Law 2026 monthly brackets)
  let tax = 0;
  if (profile.taxEnabled) {
    const taxable = grossPay - sss - philhealth - pagibig;
    if (taxable > 666667) {
      tax = Math.round(183542 + (taxable - 666667) * 0.35);
    } else if (taxable > 166667) {
      tax = Math.round(33542 + (taxable - 166667) * 0.30);
    } else if (taxable > 66667) {
      tax = Math.round(8542 + (taxable - 66667) * 0.25);
    } else if (taxable > 33333) {
      tax = Math.round(1875 + (taxable - 33333) * 0.20);
    } else if (taxable > 20833) {
      tax = Math.round((taxable - 20833) * 0.15);
    }
  }
  return { sss, philhealth, pagibig, tax };
}

/** Trips eligible for payroll within [start, end] for a driver. */
export function getEligibleTripsForDriver(
  trips: Trip[],
  driverId: string,
  startDate: string,
  endDate: string
): Trip[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate + "T23:59:59").getTime();
  return trips.filter((t) => {
    if (t.driverId !== driverId) return false;
    if (t.status !== "completed") return false;
    if (t.approvalStatus !== "approved") return false;
    if (t.payrollProcessed) return false;
    const ts = new Date(t.dropoff.scheduledAt).getTime();
    return ts >= start && ts <= end;
  });
}

/** Build full payroll summary for a driver in a period. */
export function buildDriverSummary(opts: {
  driver: Driver;
  profile: DriverPayrollProfile;
  trips: Trip[];
  rates: TripRate[];
  incentives: Incentive[];
  deductions: Deduction[];
  period: PayrollPeriod;
  vehicleTypeByVehicleId: Record<string, string | undefined>;
}): { summary: PayrollSummary; tripPayrolls: TripPayroll[] } {
  const { driver, profile, trips, rates, incentives, deductions, period, vehicleTypeByVehicleId } = opts;

  const eligible = getEligibleTripsForDriver(trips, driver.id, period.startDate, period.endDate);

  const tripPayrolls = eligible.map((t) => {
    const vt = t.vehicleId ? vehicleTypeByVehicleId[t.vehicleId] : undefined;
    const rate = findBestRate(t, vt, rates, profile.defaultTripRateId);
    return computeTripPayroll(t, rate, profile, period.id);
  });

  const tripEarnings = tripPayrolls.reduce((s, x) => s + x.finalAmount, 0);

  const periodIncentives = incentives.filter(
    (i) =>
      i.driverId === driver.id &&
      (!i.payrollPeriodId || i.payrollPeriodId === period.id) &&
      new Date(i.createdAt) >= new Date(period.startDate) &&
      new Date(i.createdAt) <= new Date(period.endDate + "T23:59:59")
  );
  const incentiveTotal = periodIncentives.reduce((s, x) => s + x.amount, 0);

  const periodDeductions = deductions.filter(
    (d) =>
      d.driverId === driver.id &&
      d.status !== "waived" &&
      (!d.payrollPeriodId || d.payrollPeriodId === period.id) &&
      new Date(d.createdAt) >= new Date(period.startDate + "T00:00:00") &&
      new Date(d.createdAt) <= new Date(period.endDate + "T23:59:59")
  );

  const cashAdvanceDeduction = periodDeductions.filter((d) => d.type === "cash_advance").reduce((s, x) => s + x.amount, 0);
  const otherDeductions = periodDeductions
    .filter((d) => !["cash_advance", "sss", "philhealth", "pagibig", "tax"].includes(d.type))
    .reduce((s, x) => s + x.amount, 0);

  const allowances = profile.allowanceEnabled ? profile.monthlyAllowance ?? 0 : 0;
  const baseSalaryForPeriod = ["fixed_salary", "fixed_plus_trip"].includes(profile.payrollMode)
    ? profile.baseSalary / 2 // bi-monthly cut-off
    : 0;

  const overtimeAmount = 0; // future: tie to attendance hours

  const grossPay = baseSalaryForPeriod + tripEarnings + incentiveTotal + allowances + overtimeAmount;

  const { sss, philhealth, pagibig, tax } = computeGovernmentDeductions(grossPay, profile);
  const totalDeductions = sss + philhealth + pagibig + tax + cashAdvanceDeduction + otherDeductions;
  const netPay = grossPay - totalDeductions;

  const summary: PayrollSummary = {
    id: `ps-${driver.id}-${period.id}`,
    driverId: driver.id,
    payrollPeriodId: period.id,
    payrollMode: profile.payrollMode,
    tripsCount: eligible.length,
    baseSalary: baseSalaryForPeriod,
    tripEarnings,
    incentives: incentiveTotal,
    allowances,
    overtimeAmount,
    sssDeduction: sss,
    philhealthDeduction: philhealth,
    pagibigDeduction: pagibig,
    taxDeduction: tax,
    cashAdvanceDeduction,
    otherDeductions,
    totalDeductions,
    grossPay,
    netPay,
    status: "draft",
  };

  return { summary, tripPayrolls };
}

// â”€â”€â”€ Reset key list (extend the global reset helper) â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PAYROLL_STORAGE_KEYS = [
  "nex-trip-rates",
  "nex-driver-payroll-profiles",
  "nex-incentives",
  "nex-deductions",
  "nex-payroll-periods",
];
