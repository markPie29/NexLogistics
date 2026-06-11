// ─── Profit Center Local Types ───────────────────────────────────────────────

export type PeriodPreset = "this_week" | "this_month" | "this_quarter" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface VehicleProfitability {
  vehicleId: string;
  plate: string;
  type: string;
  brand: string;
  model: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  driverPay: number;
  helperFees: number;
  otherCosts: number;
  totalExpenses: number;
  netProfit: number;
  margin: number | null; // null when revenue === 0
  tripCount: number;
  totalDistanceKm: number;
  fuelLiters: number;
  costPerKm: number | null; // null when distance === 0
  litersPerTrip: number | null; // null when tripCount === 0
}

export interface FleetKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number | null;
  activeVehicleCount: number;
  revenueDelta: number | null;
  expenseDelta: number | null;
  profitDelta: number | null;
  marginDelta: number | null;
}

export interface ChartDataPoint {
  label: string;
  startDate: Date;
  endDate: Date;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface CostCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export type SortColumn =
  | "plate"
  | "revenue"
  | "fuelCost"
  | "maintenanceCost"
  | "driverPay"
  | "helperFees"
  | "otherCosts"
  | "totalExpenses"
  | "netProfit"
  | "margin";

export type SortDirection = "asc" | "desc";
