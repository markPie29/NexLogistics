import type {
  TripRate,
  DriverPayrollProfile,
  Incentive,
  Deduction,
  PayrollPeriod,
  PayrollSummary,
  TripPayroll,
} from "@/lib/types";

// ─── Trip Rates (Driver-side rates per route × vehicle) ───────
export const seedTripRates: TripRate[] = [
  {
    id: "tr-001",
    name: "Manila → Pampanga · 6-Wheeler",
    vehicleType: "Truck",
    routeOrigin: "Manila",
    routeDestination: "Pampanga",
    rateType: "fixed",
    fixedRate: 2500,
    extraStopFee: 250,
    nightDifferentialPercent: 10,
    holidayMultiplier: 1.5,
    active: true,
  },
  {
    id: "tr-002",
    name: "Manila → Bicol · 10-Wheeler",
    vehicleType: "Truck",
    routeOrigin: "Manila",
    routeDestination: "Bicol",
    rateType: "fixed",
    fixedRate: 8000,
    extraStopFee: 400,
    nightDifferentialPercent: 10,
    holidayMultiplier: 1.5,
    active: true,
  },
  {
    id: "tr-003",
    name: "Cavite → Laguna · Van",
    vehicleType: "Van",
    routeOrigin: "Cavite",
    routeDestination: "Laguna",
    rateType: "fixed",
    fixedRate: 1800,
    extraStopFee: 200,
    holidayMultiplier: 1.5,
    active: true,
  },
  {
    id: "tr-004",
    name: "Metro Manila · Per KM (Van)",
    vehicleType: "Van",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "per_km",
    ratePerKm: 6,
    extraStopFee: 150,
    active: true,
  },
  {
    id: "tr-005",
    name: "Metro Manila · Per KM (Truck)",
    vehicleType: "Truck",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "per_km",
    ratePerKm: 12,
    extraStopFee: 250,
    nightDifferentialPercent: 10,
    active: true,
  },
  {
    id: "tr-006",
    name: "Last-Mile Delivery (Motorcycle)",
    vehicleType: "Motorcycle",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "per_delivery",
    ratePerDelivery: 120,
    active: true,
  },
  {
    id: "tr-007",
    name: "Commission · Heavy Cargo",
    vehicleType: "Truck",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "percentage",
    commissionPercent: 15,
    holidayMultiplier: 1.3,
    active: true,
  },
  {
    id: "tr-008",
    name: "Heavy Cargo · Mindanao (Per Ton)",
    vehicleType: "10-Wheeler",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "per_ton",
    ratePerTon: 500,
    fixedRate: 0,
    nightDifferentialPercent: 10,
    holidayMultiplier: 1.5,
    active: true,
  },
  {
    id: "tr-009",
    name: "Last-Mile Metro Manila (Per Unit)",
    vehicleType: "Van",
    routeOrigin: "Metro Manila",
    routeDestination: "*",
    rateType: "per_unit",
    ratePerUnit: 85,
    fixedRate: 0,
    extraStopFee: 100,
    active: true,
  },
  {
    id: "tr-010",
    name: "Distance Tier · NCR-Luzon",
    vehicleType: "Truck",
    routeOrigin: "*",
    routeDestination: "*",
    rateType: "fixed",
    fixedRate: 8000,
    distanceTiers: [
      { minKm: 0, maxKm: 50, multiplier: 1.0 },
      { minKm: 50, maxKm: 150, multiplier: 1.15 },
      { minKm: 150, maxKm: 999, multiplier: 1.3 },
    ],
    nightDifferentialPercent: 10,
    holidayMultiplier: 1.5,
    active: true,
  },
];

// ─── Driver Payroll Profiles ──────────────────────────────────
// Mix of payroll modes across the fleet (typical PH logistics setup)
export const seedDriverPayrollProfiles: DriverPayrollProfile[] = [
  // Mark Santos — Hybrid (most common: base + per trip)
  {
    id: "dp-001", driverId: "d-001", payrollMode: "fixed_plus_trip",
    baseSalary: 12000, defaultTripRateId: "tr-005",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: true,
    overtimeEnabled: true, allowanceEnabled: true, monthlyAllowance: 2500, active: true,
  },
  // John Cruz — Hybrid
  {
    id: "dp-002", driverId: "d-002", payrollMode: "fixed_plus_trip",
    baseSalary: 12000, defaultTripRateId: "tr-005",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: true, allowanceEnabled: true, monthlyAllowance: 2500, active: true,
  },
  // Allan Reyes — Per Trip Only
  {
    id: "dp-003", driverId: "d-003", payrollMode: "per_trip",
    baseSalary: 0, perTripFlatRate: 1500, defaultTripRateId: "tr-005",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: false, allowanceEnabled: false, active: true,
  },
  // Carlo Mendoza — Hybrid
  {
    id: "dp-004", driverId: "d-004", payrollMode: "fixed_plus_trip",
    baseSalary: 11000, defaultTripRateId: "tr-005",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: true, allowanceEnabled: true, monthlyAllowance: 2000, active: true,
  },
  // Ryan Garcia — Percentage commission
  {
    id: "dp-005", driverId: "d-005", payrollMode: "percentage",
    baseSalary: 0, commissionPercent: 18, defaultTripRateId: "tr-007",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: false, allowanceEnabled: false, active: true,
  },
  // Joseph Tan — Per Delivery
  {
    id: "dp-006", driverId: "d-006", payrollMode: "per_delivery",
    baseSalary: 0, perDeliveryRate: 350, defaultTripRateId: "tr-006",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: false, allowanceEnabled: false, active: true,
  },
  // Miguel Dela Cruz — Hybrid Heavy
  {
    id: "dp-007", driverId: "d-007", payrollMode: "fixed_plus_trip",
    baseSalary: 14000, defaultTripRateId: "tr-005",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: true,
    overtimeEnabled: true, allowanceEnabled: true, monthlyAllowance: 3000, active: true,
  },
  // Ronnie Bautista — Per Trip
  {
    id: "dp-008", driverId: "d-008", payrollMode: "per_trip",
    baseSalary: 0, perTripFlatRate: 1300, defaultTripRateId: "tr-004",
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
    overtimeEnabled: false, allowanceEnabled: false, active: true,
  },
  // Edwin Ramos — Fixed Salary (rare, office-style)
  {
    id: "dp-009", driverId: "d-009", payrollMode: "fixed_salary",
    baseSalary: 18000,
    sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: true,
    overtimeEnabled: true, allowanceEnabled: true, monthlyAllowance: 3500, active: true,
  },
];

// ─── Incentives (sample for the active May 1-15 period) ──────
export const seedIncentives: Incentive[] = [
  { id: "in-001", driverId: "d-001", type: "on_time_delivery", amount: 300, notes: "5 consecutive on-time", createdBy: "dispatcher", createdAt: "2026-05-05T10:00:00Z" },
  { id: "in-002", driverId: "d-001", type: "fuel_efficiency", amount: 500, notes: "Fuel report top 3", createdBy: "accounting", createdAt: "2026-05-07T14:00:00Z" },
  { id: "in-003", driverId: "d-002", type: "on_time_delivery", amount: 300, createdBy: "dispatcher", createdAt: "2026-05-06T11:00:00Z" },
  { id: "in-004", driverId: "d-003", type: "extra_stop", amount: 250, notes: "Added 2 stops in Bulacan", createdBy: "dispatcher", createdAt: "2026-05-04T16:00:00Z" },
  { id: "in-005", driverId: "d-004", type: "excellent_rating", amount: 200, notes: "5★ from Coca-Cola PH", createdBy: "dispatcher", createdAt: "2026-05-08T09:00:00Z" },
  { id: "in-006", driverId: "d-005", type: "safety_bonus", amount: 400, createdBy: "accounting", createdAt: "2026-05-08T15:00:00Z" },
  { id: "in-007", driverId: "d-007", type: "holiday_trip", amount: 1000, notes: "Labor Day trip", createdBy: "accounting", createdAt: "2026-05-01T20:00:00Z" },
];

// ─── Deductions (sample for the active May 1-15 period) ──────
export const seedDeductions: Deduction[] = [
  { id: "dd-001", driverId: "d-001", type: "cash_advance", amount: 2000, reason: "Cash advance request 04/28", status: "pending", createdBy: "accounting", createdAt: "2026-04-28T10:00:00Z" },
  { id: "dd-002", driverId: "d-002", type: "fuel_shortage", amount: 500, reason: "Fuel reading mismatch trip TRP-2024-167", status: "pending", createdBy: "dispatcher", createdAt: "2026-05-03T18:00:00Z" },
  { id: "dd-003", driverId: "d-003", type: "late_delivery", amount: 300, reason: "Late delivery to client c-005, TRP-2024-168", status: "pending", createdBy: "dispatcher", createdAt: "2026-05-05T12:00:00Z" },
  { id: "dd-004", driverId: "d-004", type: "uniform", amount: 450, reason: "New uniform set", status: "pending", createdBy: "accounting", createdAt: "2026-05-02T09:00:00Z" },
  { id: "dd-005", driverId: "d-007", type: "violation", amount: 200, reason: "Traffic violation citation", status: "pending", createdBy: "accounting", createdAt: "2026-05-06T14:00:00Z" },
];

// ─── Payroll Periods ─────────────────────────────────────────
export const seedPayrollPeriods: PayrollPeriod[] = [
  // Closed Apr 16-30 — historical
  {
    id: "pp-2026-04b",
    name: "April 16-30, 2026",
    startDate: "2026-04-16",
    endDate: "2026-04-30",
    payDate: "2026-05-02",
    status: "paid",
    generatedBy: "accounting",
    generatedAt: "2026-04-30T18:00:00Z",
    approvedBy: "company_admin",
    approvedAt: "2026-05-01T10:00:00Z",
    paidBy: "accounting",
    paidAt: "2026-05-02T15:00:00Z",
  },
  // Active May 1-15 — currently in progress
  {
    id: "pp-2026-05a",
    name: "May 1-15, 2026",
    startDate: "2026-05-01",
    endDate: "2026-05-15",
    payDate: "2026-05-17",
    status: "draft",
    generatedBy: "accounting",
    generatedAt: "2026-05-09T08:00:00Z",
  },
];

// ─── Historical TripPayroll for Apr 16-30 (for charts/history) ──
// Generated to match the closed period summary totals approximately.
export const seedTripPayroll: TripPayroll[] = [];

// ─── Historical PayrollSummary for Apr 16-30 ─────────────────
export const seedPayrollSummaries: PayrollSummary[] = [
  {
    id: "ps-001", driverId: "d-001", payrollPeriodId: "pp-2026-04b",
    payrollMode: "fixed_plus_trip", tripsCount: 6,
    baseSalary: 12000, tripEarnings: 18000, incentives: 1200, allowances: 2500, overtimeAmount: 800,
    sssDeduction: 600, philhealthDeduction: 250, pagibigDeduction: 100, taxDeduction: 750,
    cashAdvanceDeduction: 1500, otherDeductions: 0, totalDeductions: 3200,
    grossPay: 34500, netPay: 31300, status: "paid", paidAt: "2026-05-02T15:00:00Z",
  },
  {
    id: "ps-002", driverId: "d-002", payrollPeriodId: "pp-2026-04b",
    payrollMode: "fixed_plus_trip", tripsCount: 5,
    baseSalary: 12000, tripEarnings: 15000, incentives: 900, allowances: 2500, overtimeAmount: 600,
    sssDeduction: 600, philhealthDeduction: 250, pagibigDeduction: 100, taxDeduction: 0,
    cashAdvanceDeduction: 1000, otherDeductions: 0, totalDeductions: 1950,
    grossPay: 31000, netPay: 29050, status: "paid", paidAt: "2026-05-02T15:00:00Z",
  },
  {
    id: "ps-003", driverId: "d-003", payrollPeriodId: "pp-2026-04b",
    payrollMode: "per_trip", tripsCount: 4,
    baseSalary: 0, tripEarnings: 12000, incentives: 500, allowances: 0, overtimeAmount: 0,
    sssDeduction: 600, philhealthDeduction: 250, pagibigDeduction: 100, taxDeduction: 0,
    cashAdvanceDeduction: 0, otherDeductions: 0, totalDeductions: 950,
    grossPay: 12500, netPay: 11550, status: "paid", paidAt: "2026-05-02T15:00:00Z",
  },
  {
    id: "ps-004", driverId: "d-005", payrollPeriodId: "pp-2026-04b",
    payrollMode: "percentage", tripsCount: 5,
    baseSalary: 0, tripEarnings: 19500, incentives: 700, allowances: 0, overtimeAmount: 0,
    sssDeduction: 600, philhealthDeduction: 250, pagibigDeduction: 100, taxDeduction: 0,
    cashAdvanceDeduction: 800, otherDeductions: 0, totalDeductions: 1750,
    grossPay: 20200, netPay: 18450, status: "paid", paidAt: "2026-05-02T15:00:00Z",
  },
];
