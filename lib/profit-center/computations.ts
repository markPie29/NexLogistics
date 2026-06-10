import type { Vehicle, Trip, Expense, MaintenanceRecord } from "@/lib/types";
import type {
  PeriodPreset,
  DateRange,
  VehicleProfitability,
  FleetKPIs,
  ChartDataPoint,
  CostCategory,
  SortColumn,
  SortDirection,
} from "./types";

// ─── Date Helpers ────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const result = new Date(d);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function resolveDateRange(preset: PeriodPreset, custom: DateRange | null): DateRange {
  const now = new Date();
  switch (preset) {
    case "this_week": {
      const start = startOfWeek(now);
      const end = endOfDay(now);
      return { start, end };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = endOfDay(now);
      return { start, end };
    }
    case "this_quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qMonth, 1);
      start.setHours(0, 0, 0, 0);
      const end = endOfDay(now);
      return { start, end };
    }
    case "custom": {
      if (custom) return { start: startOfDay(custom.start), end: endOfDay(custom.end) };
      // Fallback to this month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfDay(now) };
    }
  }
}

export function getPreviousPeriod(dateRange: DateRange): DateRange {
  const durationMs = dateRange.end.getTime() - dateRange.start.getTime();
  const prevEnd = new Date(dateRange.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
}

export function getAggregationGranularity(dateRange: DateRange): "weekly" | "monthly" {
  const days = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 31 ? "weekly" : "monthly";
}

function isWithinRange(dateStr: string | undefined, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}

// ─── Core Computation ────────────────────────────────────────────────────────

export function computeVehicleProfitability(
  vehicles: Vehicle[],
  trips: Trip[],
  expenses: Expense[],
  maintenance: MaintenanceRecord[],
  dateRange: DateRange
): VehicleProfitability[] {
  // Filter trips in range with qualifying status
  const qualifyingTrips = trips.filter(
    (t) =>
      (t.status === "delivered" || t.status === "completed") &&
      isWithinRange(t.createdAt, dateRange)
  );

  // Filter expenses in range
  const rangeExpenses = expenses.filter((e) => isWithinRange(e.date, dateRange));

  // Filter maintenance in range
  const rangeMaintenance = maintenance.filter(
    (m) => m.status === "completed" && isWithinRange(m.completedAt, dateRange)
  );

  // Determine eligible vehicles
  const vehicleIdsWithTrips = new Set(qualifyingTrips.map((t) => t.vehicleId).filter(Boolean));
  const eligibleVehicles = vehicles.filter(
    (v) =>
      ["available", "in_trip", "maintenance"].includes(v.status) ||
      vehicleIdsWithTrips.has(v.id)
  );

  return eligibleVehicles.map((vehicle) => {
    const vTrips = qualifyingTrips.filter((t) => t.vehicleId === vehicle.id);
    const vExpenses = rangeExpenses.filter((e) => e.vehicleId === vehicle.id);
    const vMaint = rangeMaintenance.filter((m) => m.vehicleId === vehicle.id);

    const revenue = vTrips.reduce((sum, t) => sum + (t.fare || 0), 0);
    const fuelCost = vExpenses
      .filter((e) => e.category === "fuel")
      .reduce((sum, e) => sum + e.amount, 0);
    const maintenanceCost = vMaint.reduce((sum, m) => sum + (m.cost ?? 0), 0);
    const driverPay = vTrips.reduce((sum, t) => sum + (t.driverRate ?? 0), 0);
    const helperFees = vTrips.reduce((sum, t) => sum + (t.helperFee ?? 0), 0);

    // Other costs: tolls + cash_advance + other expenses + trip otherFees
    const otherExpenses = vExpenses
      .filter((e) => e.category === "toll" || e.category === "cash_advance" || e.category === "other")
      .reduce((sum, e) => sum + e.amount, 0);
    const tripOtherFees = vTrips.reduce(
      (sum, t) => sum + (t.otherFees?.reduce((s, f) => s + (f.amount || 0), 0) ?? 0),
      0
    );
    const otherCosts = otherExpenses + tripOtherFees;

    const totalExpenses = fuelCost + maintenanceCost + driverPay + helperFees + otherCosts;
    const netProfit = revenue - totalExpenses;
    const margin = revenue > 0 ? Math.round(((netProfit / revenue) * 100) * 10) / 10 : null;

    const tripCount = vTrips.length;
    const totalDistanceKm = vTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
    const fuelLiters = vExpenses
      .filter((e) => e.category === "fuel" && e.liters != null)
      .reduce((sum, e) => sum + (e.liters ?? 0), 0);
    const costPerKm = totalDistanceKm > 0 ? fuelCost / totalDistanceKm : null;
    const litersPerTrip = tripCount > 0 ? fuelLiters / tripCount : null;

    return {
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      revenue,
      fuelCost,
      maintenanceCost,
      driverPay,
      helperFees,
      otherCosts,
      totalExpenses,
      netProfit,
      margin,
      tripCount,
      totalDistanceKm,
      fuelLiters,
      costPerKm,
      litersPerTrip,
    };
  });
}

// ─── Fleet KPIs ──────────────────────────────────────────────────────────────

export function computeFleetKPIs(
  vehicleData: VehicleProfitability[],
  previousPeriodData?: VehicleProfitability[]
): FleetKPIs {
  const totalRevenue = vehicleData.reduce((s, v) => s + v.revenue, 0);
  const totalExpenses = vehicleData.reduce((s, v) => s + v.totalExpenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round(((netProfit / totalRevenue) * 100) * 10) / 10 : null;
  const activeVehicleCount = vehicleData.filter((v) => v.tripCount > 0).length;

  let revenueDelta: number | null = null;
  let expenseDelta: number | null = null;
  let profitDelta: number | null = null;
  let marginDelta: number | null = null;

  if (previousPeriodData && previousPeriodData.length > 0) {
    const prevRevenue = previousPeriodData.reduce((s, v) => s + v.revenue, 0);
    const prevExpenses = previousPeriodData.reduce((s, v) => s + v.totalExpenses, 0);
    const prevProfit = prevRevenue - prevExpenses;
    const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue) * 100 : null;

    revenueDelta = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
    expenseDelta = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : null;
    profitDelta = prevProfit !== 0 ? ((netProfit - prevProfit) / Math.abs(prevProfit)) * 100 : null;
    marginDelta = prevMargin !== null && profitMargin !== null ? profitMargin - prevMargin : null;
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    activeVehicleCount,
    revenueDelta,
    expenseDelta,
    profitDelta,
    marginDelta,
  };
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

export function computeChartData(
  trips: Trip[],
  expenses: Expense[],
  maintenance: MaintenanceRecord[],
  dateRange: DateRange
): ChartDataPoint[] {
  const granularity = getAggregationGranularity(dateRange);
  const buckets: { start: Date; end: Date; label: string }[] = [];

  if (granularity === "weekly") {
    let current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const end = weekEnd > dateRange.end ? new Date(dateRange.end) : weekEnd;
      const label = `${current.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-PH", { day: "numeric" })}`;
      buckets.push({ start: new Date(current), end: endOfDay(end), label });
      current = new Date(end);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  } else {
    let current = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 1);
    while (current <= dateRange.end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const end = monthEnd > dateRange.end ? new Date(dateRange.end) : monthEnd;
      const label = current.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
      buckets.push({ start: new Date(current), end: endOfDay(end), label });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  return buckets.map((bucket) => {
    const bucketRange: DateRange = { start: bucket.start, end: bucket.end };

    const bucketTrips = trips.filter(
      (t) =>
        (t.status === "delivered" || t.status === "completed") &&
        isWithinRange(t.createdAt, bucketRange)
    );
    const bucketExpenses = expenses.filter((e) => isWithinRange(e.date, bucketRange));
    const bucketMaint = maintenance.filter(
      (m) => m.status === "completed" && isWithinRange(m.completedAt, bucketRange)
    );

    const revenue = bucketTrips.reduce((s, t) => s + (t.fare || 0), 0);
    const expenseTotal =
      bucketExpenses.reduce((s, e) => s + e.amount, 0) +
      bucketMaint.reduce((s, m) => s + (m.cost ?? 0), 0) +
      bucketTrips.reduce((s, t) => s + (t.driverRate ?? 0) + (t.helperFee ?? 0), 0) +
      bucketTrips.reduce(
        (s, t) => s + (t.otherFees?.reduce((fs, f) => fs + (f.amount || 0), 0) ?? 0),
        0
      );

    return {
      label: bucket.label,
      startDate: bucket.start,
      endDate: bucket.end,
      revenue,
      expenses: expenseTotal,
      netProfit: revenue - expenseTotal,
    };
  });
}

// ─── Cost Distribution ───────────────────────────────────────────────────────

const COST_COLORS: Record<string, string> = {
  Fuel: "#F59E0B",
  Maintenance: "#6366F1",
  "Driver Pay": "#0EA5E9",
  "Helper Fees": "#8B5CF6",
  Tolls: "#EF4444",
  Other: "#64748B",
};

export function computeCostDistribution(vehicleData: VehicleProfitability[]): CostCategory[] {
  const fuel = vehicleData.reduce((s, v) => s + v.fuelCost, 0);
  const maint = vehicleData.reduce((s, v) => s + v.maintenanceCost, 0);
  const driver = vehicleData.reduce((s, v) => s + v.driverPay, 0);
  const helper = vehicleData.reduce((s, v) => s + v.helperFees, 0);
  const other = vehicleData.reduce((s, v) => s + v.otherCosts, 0);
  const total = fuel + maint + driver + helper + other;

  if (total === 0) return [];

  const pct = (v: number) => Math.round((v / total) * 1000) / 10;

  return [
    { name: "Fuel", amount: fuel, percentage: pct(fuel), color: COST_COLORS["Fuel"] },
    { name: "Maintenance", amount: maint, percentage: pct(maint), color: COST_COLORS["Maintenance"] },
    { name: "Driver Pay", amount: driver, percentage: pct(driver), color: COST_COLORS["Driver Pay"] },
    { name: "Helper Fees", amount: helper, percentage: pct(helper), color: COST_COLORS["Helper Fees"] },
    { name: "Tolls", amount: other, percentage: pct(other), color: COST_COLORS["Tolls"] },
  ].filter((c) => c.amount > 0);
}

// ─── Sort / Search / Pagination ──────────────────────────────────────────────

export function sortVehicleData(
  data: VehicleProfitability[],
  column: SortColumn,
  direction: SortDirection
): VehicleProfitability[] {
  return [...data].sort((a, b) => {
    const aVal = a[column] ?? -Infinity;
    const bVal = b[column] ?? -Infinity;
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function searchVehicleData(
  data: VehicleProfitability[],
  query: string
): VehicleProfitability[] {
  if (!query.trim()) return data;
  const q = query.toLowerCase();
  return data.filter((v) => v.plate.toLowerCase().includes(q));
}

export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
  return data.slice(page * pageSize, (page + 1) * pageSize);
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

export function formatPeriodLabel(range: DateRange): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${range.start.toLocaleDateString("en-PH", opts)} – ${range.end.toLocaleDateString("en-PH", opts)}`;
}
