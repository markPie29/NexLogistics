import type { CalendarEvent } from "@/lib/types";

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

function iso(year: number, month: number, day: number, hour = 9, min = 0): string {
  return new Date(year, month, day, hour, min, 0, 0).toISOString();
}

export const seedCalendarEvents: CalendarEvent[] = [
  // ── Admin ──
  {
    id: "cal-001",
    title: "Quarterly Board Meeting",
    start: iso(y, m, Math.min(today.getDate() + 3, 28), 9),
    end:   iso(y, m, Math.min(today.getDate() + 3, 28), 12),
    department: "admin",
    location: "HQ Conference Room",
    notes: "Q2 review with all department heads.",
    createdBy: "Super Admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-002",
    title: "Permit Renewal — Mayor's Office",
    start: iso(y, m, Math.min(today.getDate() + 7, 28), 0),
    end:   iso(y, m, Math.min(today.getDate() + 7, 28), 23, 59),
    allDay: true,
    department: "admin",
    location: "Pasig City Hall",
    createdBy: "Admin Staff",
    createdAt: new Date().toISOString(),
  },

  // ── HR ──
  {
    id: "cal-003",
    title: "New Driver Orientation",
    start: iso(y, m, Math.min(today.getDate() + 1, 28), 8),
    end:   iso(y, m, Math.min(today.getDate() + 1, 28), 11),
    department: "hr",
    location: "Training Room A",
    createdBy: "HR Manager",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-004",
    title: "Payroll Cut-off",
    start: iso(y, m, 15, 0),
    end:   iso(y, m, 15, 23, 59),
    allDay: true,
    department: "hr",
    createdBy: "HR Manager",
    createdAt: new Date().toISOString(),
  },

  // ── Operation ──
  {
    id: "cal-005",
    title: "Fleet Inspection — Wing Vans",
    start: iso(y, m, Math.min(today.getDate() + 2, 28), 7),
    end:   iso(y, m, Math.min(today.getDate() + 2, 28), 10),
    department: "operation",
    location: "Motor Pool",
    createdBy: "Dispatcher",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-006",
    title: "Big Trip Day — 12 Deliveries to Cebu",
    start: iso(y, m, Math.min(today.getDate() + 4, 28), 5),
    end:   iso(y, m, Math.min(today.getDate() + 4, 28), 22),
    department: "operation",
    createdBy: "Dispatcher",
    createdAt: new Date().toISOString(),
  },

  // ── Accounting ──
  {
    id: "cal-007",
    title: "BIR Filing — 2550M",
    start: iso(y, m, 20, 0),
    end:   iso(y, m, 20, 23, 59),
    allDay: true,
    department: "accounting",
    notes: "Monthly VAT return.",
    createdBy: "Accounting Lead",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-008",
    title: "Client Invoice Review",
    start: iso(y, m, Math.min(today.getDate() + 5, 28), 14),
    end:   iso(y, m, Math.min(today.getDate() + 5, 28), 16),
    department: "accounting",
    createdBy: "Accounting Lead",
    createdAt: new Date().toISOString(),
  },

  // ── Sales ──
  {
    id: "cal-009",
    title: "Client Pitch — XYZ Manufacturing",
    start: iso(y, m, Math.min(today.getDate() + 6, 28), 10),
    end:   iso(y, m, Math.min(today.getDate() + 6, 28), 11, 30),
    department: "sales",
    location: "Makati CBD",
    createdBy: "Sales Lead",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-010",
    title: "Sales Pipeline Review",
    start: iso(y, m, Math.min(today.getDate() + 8, 28), 13),
    end:   iso(y, m, Math.min(today.getDate() + 8, 28), 14),
    department: "sales",
    createdBy: "Sales Lead",
    createdAt: new Date().toISOString(),
  },

  // ── Subcon ──
  {
    id: "cal-011",
    title: "Subcon Payout — Cycle 1",
    start: iso(y, m, 16, 0),
    end:   iso(y, m, 16, 23, 59),
    allDay: true,
    department: "subcon",
    notes: "Bank transfer to all active partners.",
    createdBy: "Accounting Lead",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cal-012",
    title: "Partner Onboarding — RMS Trucking",
    start: iso(y, m, Math.min(today.getDate() + 9, 28), 9),
    end:   iso(y, m, Math.min(today.getDate() + 9, 28), 11),
    department: "subcon",
    location: "HQ",
    createdBy: "Operations Manager",
    createdAt: new Date().toISOString(),
  },
];
