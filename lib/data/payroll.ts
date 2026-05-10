import type { PayrollRecord } from "@/lib/types";

const period = { start: "2026-04-16", end: "2026-04-30" };

export const seedPayroll: PayrollRecord[] = [
  { id: "p-001", driverId: "d-001", periodStart: period.start, periodEnd: period.end, baseSalary: 22000, incentives: 4500, overtime: 1800, deductions: 1200, net: 27100, status: "paid", paidAt: "2026-05-02" },
  { id: "p-002", driverId: "d-002", periodStart: period.start, periodEnd: period.end, baseSalary: 22000, incentives: 3800, overtime: 1500, deductions: 1100, net: 26200, status: "paid", paidAt: "2026-05-02" },
  { id: "p-003", driverId: "d-003", periodStart: period.start, periodEnd: period.end, baseSalary: 20000, incentives: 3500, overtime: 1200, deductions: 950, net: 23750, status: "paid", paidAt: "2026-05-02" },
  { id: "p-004", driverId: "d-004", periodStart: period.start, periodEnd: period.end, baseSalary: 21000, incentives: 3000, overtime: 1100, deductions: 1000, net: 24100, status: "approved" },
  { id: "p-005", driverId: "d-005", periodStart: period.start, periodEnd: period.end, baseSalary: 20000, incentives: 2800, overtime: 950, deductions: 850, net: 22900, status: "approved" },
  { id: "p-006", driverId: "d-006", periodStart: period.start, periodEnd: period.end, baseSalary: 19000, incentives: 2200, overtime: 800, deductions: 800, net: 21200, status: "draft" },
  { id: "p-007", driverId: "d-007", periodStart: period.start, periodEnd: period.end, baseSalary: 24000, incentives: 5000, overtime: 2200, deductions: 1300, net: 29900, status: "draft" },
];
