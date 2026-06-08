import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type { OfficeEmployee } from "@/lib/types";

// ─── Seed Data ──────────────────────────────────────────────
const seedOfficeStaff: OfficeEmployee[] = [
  {
    id: "oe-001",
    name: "Maria Santos",
    email: "maria.santos@nexlogistics.demo",
    phone: "+639171234001",
    department: "hr",
    position: "HR Manager",
    monthlySalary: 35000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: true,
    monthlyAllowance: 3000,
    status: "active",
    hireDate: "2023-06-15",
  },
  {
    id: "oe-002",
    name: "Jose Reyes",
    email: "jose.reyes@nexlogistics.demo",
    phone: "+639171234002",
    department: "accounting",
    position: "Senior Accountant",
    monthlySalary: 30000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: true,
    monthlyAllowance: 2500,
    status: "active",
    hireDate: "2022-03-01",
  },
  {
    id: "oe-003",
    name: "Ana Cruz",
    email: "ana.cruz@nexlogistics.demo",
    phone: "+639171234003",
    department: "operations",
    position: "Operations Coordinator",
    monthlySalary: 25000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    monthlyAllowance: 2000,
    status: "active",
    hireDate: "2024-01-10",
  },
  {
    id: "oe-004",
    name: "Roberto Tan",
    email: "roberto.tan@nexlogistics.demo",
    phone: "+639171234004",
    department: "admin",
    position: "Admin Officer",
    monthlySalary: 22000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    status: "active",
    hireDate: "2024-05-20",
  },
  {
    id: "oe-005",
    name: "Elena Garcia",
    email: "elena.garcia@nexlogistics.demo",
    phone: "+639171234005",
    department: "sales",
    position: "Sales Executive",
    monthlySalary: 28000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: true,
    monthlyAllowance: 5000,
    status: "active",
    hireDate: "2023-09-01",
  },
  {
    id: "oe-006",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@nexlogistics.demo",
    department: "maintenance",
    position: "Maintenance Supervisor",
    monthlySalary: 20000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    status: "active",
    hireDate: "2023-11-15",
  },
  {
    id: "oe-007",
    name: "Patricia Villanueva",
    email: "patricia.v@nexlogistics.demo",
    phone: "+639171234007",
    department: "accounting",
    position: "Finance Clerk",
    monthlySalary: 18000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    status: "active",
    hireDate: "2024-08-01",
  },
  {
    id: "oe-008",
    name: "Dennis Ramos",
    email: "dennis.ramos@nexlogistics.demo",
    phone: "+639171234008",
    department: "operations",
    position: "Dispatch Supervisor",
    monthlySalary: 26000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    monthlyAllowance: 2000,
    status: "active",
    hireDate: "2023-04-10",
  },
  {
    id: "oe-009",
    name: "Grace Aquino",
    email: "grace.aquino@nexlogistics.demo",
    phone: "+639171234009",
    department: "hr",
    position: "HR Assistant",
    monthlySalary: 18000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    status: "active",
    hireDate: "2025-01-15",
  },
  {
    id: "oe-010",
    name: "Raymond Cruz",
    email: "raymond.cruz@nexlogistics.demo",
    phone: "+639171234010",
    department: "operations",
    position: "Dispatcher",
    monthlySalary: 20000,
    sssEnabled: true,
    philhealthEnabled: true,
    pagibigEnabled: true,
    taxEnabled: false,
    monthlyAllowance: 1500,
    status: "active",
    hireDate: "2024-06-01",
  },
];

// ─── Store ──────────────────────────────────────────────────
interface OfficeStaffState {
  employees: OfficeEmployee[];
  addEmployee: (e: Omit<OfficeEmployee, "id">) => OfficeEmployee;
  updateEmployee: (id: string, patch: Partial<OfficeEmployee>) => void;
  deleteEmployee: (id: string) => void;
  reset: () => void;
}

export const useOfficeStaffStore = create<OfficeStaffState>()(
  persist(
    (set) => ({
      employees: seedOfficeStaff,
      addEmployee: (e) => {
        const ne: OfficeEmployee = { ...e, id: `oe-${Date.now().toString(36)}` };
        set((s) => ({ employees: [ne, ...s.employees] }));
        return ne;
      },
      updateEmployee: (id, patch) =>
        set((s) => ({ employees: s.employees.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteEmployee: (id) => set((s) => ({ employees: s.employees.filter((x) => x.id !== id) })),
      reset: () => set({ employees: seedOfficeStaff }),
    }),
    { name: `${BRAND.storeKey}-office-staff` }
  )
);

/** 
 * Compute monthly deductions for an office employee.
 * BIR 2026 Compliant — same logic as driver deductions.
 * SSS: 4.5% employee, max ₱1,350
 * PhilHealth: 2.5% employee, max ₱2,500
 * Pag-IBIG: 2%, max ₱200
 * Tax: TRAIN Law monthly brackets
 */
export function computeOfficeDeductions(monthlySalary: number, emp: OfficeEmployee) {
  const sss = emp.sssEnabled ? Math.min(1350, Math.round(monthlySalary * 0.045)) : 0;
  const philhealth = emp.philhealthEnabled ? Math.min(2500, Math.round(monthlySalary * 0.025)) : 0;
  const pagibig = emp.pagibigEnabled ? (monthlySalary > 1500 ? Math.min(200, Math.round(monthlySalary * 0.02)) : 0) : 0;
  let tax = 0;
  if (emp.taxEnabled) {
    const taxable = monthlySalary - sss - philhealth - pagibig;
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
  const totalDeductions = sss + philhealth + pagibig + tax;
  const netPay = monthlySalary + (emp.monthlyAllowance ?? 0) - totalDeductions;
  return { sss, philhealth, pagibig, tax, totalDeductions, netPay };
}
