import type { Expense } from "@/lib/types";

export const seedExpenses: Expense[] = [
  { id: "e-001", vehicleId: "v-101", driverId: "d-001", category: "fuel", amount: 4500, liters: 65, date: "2026-05-08", vendor: "Petron" },
  { id: "e-002", vehicleId: "v-102", driverId: "d-002", category: "fuel", amount: 3800, liters: 55, date: "2026-05-08", vendor: "Shell" },
  { id: "e-003", vehicleId: "v-107", driverId: "d-007", category: "fuel", amount: 7200, liters: 105, date: "2026-05-07", vendor: "Caltex" },
  { id: "e-004", vehicleId: "v-104", driverId: "d-004", category: "repair", amount: 8500, date: "2026-05-06", vendor: "Auto Care PH", notes: "Reefer compressor inspection" },
  { id: "e-005", vehicleId: "v-101", driverId: "d-001", category: "toll", amount: 320, date: "2026-05-09", vendor: "NLEX" },
  { id: "e-006", vehicleId: "v-109", driverId: "d-009", category: "toll", amount: 580, date: "2026-05-09", vendor: "STAR Tollway" },
  { id: "e-007", driverId: "d-005", category: "cash_advance", amount: 2500, date: "2026-05-08", notes: "Per diem" },
  { id: "e-008", vehicleId: "v-105", driverId: "d-005", category: "fuel", amount: 5200, liters: 75, date: "2026-05-09", vendor: "Petron" },
  { id: "e-009", vehicleId: "v-103", driverId: "d-003", category: "fuel", amount: 2900, liters: 42, date: "2026-05-09", vendor: "Shell" },
  { id: "e-010", vehicleId: "v-108", driverId: "d-008", category: "repair", amount: 4400, date: "2026-05-05", vendor: "L300 Service" },
];
