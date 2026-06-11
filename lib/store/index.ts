import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type {
  Vehicle,
  Driver,
  Trip,
  TripStatus,
  MaintenanceRecord,
  Expense,
  PayrollRecord,
  ProofOfDelivery,
  NotificationItem,
  AiInsight,
  Client,
  Invoice,
  BillingPayment,
  CreditNote,
  RecurringInvoice,
} from "@/lib/types";
import { seedVehicles } from "@/lib/data/vehicles";
import { seedDrivers } from "@/lib/data/drivers";
import { seedTrips } from "@/lib/data/trips";
import { seedMaintenance } from "@/lib/data/maintenance";
import { seedExpenses } from "@/lib/data/expenses";
import { seedPayroll } from "@/lib/data/payroll";
import { seedClients } from "@/lib/data/clients";
import { seedNotifications, seedAiInsights } from "@/lib/data/notifications";
import { seedInvoices, seedBillingPayments, seedCreditNotes, seedRecurringInvoices } from "@/lib/data/billing";

interface FleetState {
  vehicles: Vehicle[];
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt">) => Vehicle;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  archiveVehicle: (id: string) => void;
  deleteVehicle: (id: string) => void;
  reset: () => void;
}
export const useFleetStore = create<FleetState>()(
  persist(
    (set) => ({
      vehicles: seedVehicles,
      addVehicle: (v) => {
        const newV: Vehicle = {
          ...v,
          id: `v-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ vehicles: [newV, ...s.vehicles] }));
        return newV;
      },
      updateVehicle: (id, patch) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      archiveVehicle: (id) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, status: "inactive" } : v)) })),
      deleteVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),
      reset: () => set({ vehicles: seedVehicles }),
    }),
    { name: `${BRAND.storeKey}-fleet` }
  )
);

interface DriverState {
  drivers: Driver[];
  addDriver: (d: Omit<Driver, "id">) => Driver;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  reset: () => void;
}
export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      drivers: seedDrivers,
      addDriver: (d) => {
        const nd: Driver = { ...d, id: `d-${Date.now().toString(36)}` };
        set((s) => ({ drivers: [nd, ...s.drivers] }));
        return nd;
      },
      updateDriver: (id, patch) =>
        set((s) => ({ drivers: s.drivers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((x) => x.id !== id) })),
      reset: () => set({ drivers: seedDrivers }),
    }),
    { name: `${BRAND.storeKey}-drivers` }
  )
);

interface ClientState {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  reset: () => void;
}
export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      clients: seedClients,
      addClient: (c) => {
        const nc: Client = { ...c, id: `c-${Date.now().toString(36)}` };
        set((s) => ({ clients: [nc, ...s.clients] }));
        return nc;
      },
      updateClient: (id, patch) =>
        set((s) => ({
          clients: s.clients.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((x) => x.id !== id) })),
      reset: () => set({ clients: seedClients }),
    }),
    { name: `${BRAND.storeKey}-clients` }
  )
);

interface TripState {
  trips: Trip[];
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "statusLogs">) => Trip;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  setStatus: (id: string, status: TripStatus, by?: string, note?: string) => void;
  approveTrip: (id: string, by: string) => void;
  rejectTrip: (id: string, by: string, reason?: string) => void;
  // Phase 5 — Super Admin rate-confirmation gate at trip creation
  submitForRateApproval: (id: string) => void;
  approveRates: (id: string, by: string, notes?: string) => void;
  rejectRates: (id: string, by: string, reason?: string) => void;
  lockTripsToPeriod: (ids: string[], periodId: string) => void;
  unlockAllPayroll: () => void;
  deleteTrip: (id: string) => void;
  reset: () => void;
}
export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: seedTrips,
      addTrip: (t) => {
        const id = `TRP-2026-${Math.floor(Math.random() * 900 + 100)}`;
        // Back-compat: mirror legacy consignee* fields onto customer* if caller passed only one form.
        const customerName    = t.customerName    ?? t.consigneeName;
        const customerContact = t.customerContact ?? t.consigneeContact;
        const trip: Trip = {
          ...t,
          customerName,
          customerContact,
          consigneeName:    customerName,    // mirror back for any legacy reader
          consigneeContact: customerContact,
          id,
          createdAt: new Date().toISOString(),
          statusLogs: [{ status: t.status, at: new Date().toISOString(), by: "system" }],
        };
        set((s) => ({ trips: [trip, ...s.trips] }));
        return trip;
      },
      updateTrip: (id, patch) =>
        set((s) => ({ trips: s.trips.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      setStatus: (id, status, by, note) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return;
        const log = { status, at: new Date().toISOString(), by, note };
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id ? { ...t, status, statusLogs: [...t.statusLogs, log] } : t
          ),
        }));
      },
      approveTrip: (id, by) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id
              ? { ...t, approvalStatus: "approved", approvedBy: by, approvedAt: new Date().toISOString() }
              : t
          ),
        })),
      rejectTrip: (id, by, reason) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id
              ? { ...t, approvalStatus: "rejected", approvedBy: by, approvedAt: new Date().toISOString(), statusLogs: [...t.statusLogs, { status: t.status, at: new Date().toISOString(), by, note: `Rejected: ${reason ?? ""}` }] }
              : t
          ),
        })),
      // ── Phase 5 rate-approval gate ──
      submitForRateApproval: (id) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id
              ? { ...t, approvalStatus: "pending_rate_approval" }
              : t
          ),
        })),
      approveRates: (id, by, notes) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id
              ? {
                  ...t,
                  approvalStatus: "approved",
                  rateApprovedBy: by,
                  rateApprovedAt: new Date().toISOString(),
                  rateApprovalNotes: notes,
                  statusLogs: [...t.statusLogs, { status: t.status, at: new Date().toISOString(), by, note: `Rates approved${notes ? `: ${notes}` : ""}` }],
                }
              : t
          ),
        })),
      rejectRates: (id, by, reason) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id
              ? {
                  ...t,
                  approvalStatus: "rejected",
                  rateApprovedBy: by,
                  rateApprovedAt: new Date().toISOString(),
                  rateApprovalNotes: reason,
                  statusLogs: [...t.statusLogs, { status: t.status, at: new Date().toISOString(), by, note: `Rates rejected: ${reason ?? ""}` }],
                }
              : t
          ),
        })),
      lockTripsToPeriod: (ids, periodId) =>
        set((s) => ({
          trips: s.trips.map((t) => (ids.includes(t.id) ? { ...t, payrollProcessed: true, payrollPeriodId: periodId } : t)),
        })),
      unlockAllPayroll: () =>
        set((s) => ({
          trips: s.trips.map((t) => t.payrollProcessed ? { ...t, payrollProcessed: false, payrollPeriodId: undefined } : t),
        })),
      deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
      reset: () => set({ trips: seedTrips }),
    }),
    { name: `${BRAND.storeKey}-trips` }
  )
);

interface MaintenanceState {
  records: MaintenanceRecord[];
  addRecord: (r: Omit<MaintenanceRecord, "id">) => MaintenanceRecord;
  updateRecord: (id: string, patch: Partial<MaintenanceRecord>) => void;
  deleteRecord: (id: string) => void;
  reset: () => void;
}
export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set) => ({
      records: seedMaintenance,
      addRecord: (r) => {
        const nr: MaintenanceRecord = { ...r, id: `m-${Date.now().toString(36)}` };
        set((s) => ({ records: [nr, ...s.records] }));
        return nr;
      },
      updateRecord: (id, patch) =>
        set((s) => ({ records: s.records.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteRecord: (id) => set((s) => ({ records: s.records.filter((x) => x.id !== id) })),
      reset: () => set({ records: seedMaintenance }),
    }),
    { name: `${BRAND.storeKey}-maintenance` }
  )
);

interface ExpenseState {
  expenses: Expense[];
  addExpense: (e: Omit<Expense, "id">) => Expense;
  deleteExpense: (id: string) => void;
  reset: () => void;
}
export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: seedExpenses,
      addExpense: (e) => {
        const ne: Expense = { ...e, id: `e-${Date.now().toString(36)}` };
        set((s) => ({ expenses: [ne, ...s.expenses] }));
        return ne;
      },
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      reset: () => set({ expenses: seedExpenses }),
    }),
    { name: `${BRAND.storeKey}-expenses` }
  )
);

interface PayrollState {
  records: PayrollRecord[];
  addRecord: (r: Omit<PayrollRecord, "id">) => PayrollRecord;
  updateRecord: (id: string, patch: Partial<PayrollRecord>) => void;
  reset: () => void;
}
export const usePayrollStore = create<PayrollState>()(
  persist(
    (set) => ({
      records: seedPayroll,
      addRecord: (r) => {
        const nr: PayrollRecord = { ...r, id: `p-${Date.now().toString(36)}` };
        set((s) => ({ records: [nr, ...s.records] }));
        return nr;
      },
      updateRecord: (id, patch) =>
        set((s) => ({ records: s.records.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      reset: () => set({ records: seedPayroll }),
    }),
    { name: `${BRAND.storeKey}-payroll` }
  )
);

interface PodState {
  pods: ProofOfDelivery[];
  addPod: (p: Omit<ProofOfDelivery, "id" | "timestamp">) => ProofOfDelivery;
  reset: () => void;
}
export const usePodStore = create<PodState>()(
  persist(
    (set) => ({
      pods: [],
      addPod: (p) => {
        const np: ProofOfDelivery = {
          ...p,
          id: `pod-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ pods: [np, ...s.pods] }));
        return np;
      },
      reset: () => set({ pods: [] }),
    }),
    { name: `${BRAND.storeKey}-pods` }
  )
);

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  notifications: NotificationItem[];
  markAllRead: () => void;
  insights: AiInsight[];
}
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar: (v) => set({ sidebarCollapsed: v }),
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next);
          }
          return { darkMode: next };
        }),
      notifications: seedNotifications,
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      insights: seedAiInsights,
    }),
    { name: `${BRAND.storeKey}-ui` }
  )
);
// ─── Billing Stores ──────────────────────────────────────────

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  reset: () => void;
}
export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: seedInvoices,
      addInvoice: (i) => {
        const ni: Invoice = { ...i, id: `inv-${Date.now().toString(36)}` };
        set((s) => ({ invoices: [ni, ...s.invoices] }));
        return ni;
      },
      updateInvoice: (id, patch) =>
        set((s) => ({ invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
      reset: () => set({ invoices: seedInvoices }),
    }),
    { name: `${BRAND.storeKey}-invoices` }
  )
);

interface BillingPaymentState {
  payments: BillingPayment[];
  addPayment: (p: Omit<BillingPayment, "id">) => BillingPayment;
  updatePayment: (id: string, patch: Partial<BillingPayment>) => void;
  deletePayment: (id: string) => void;
  reset: () => void;
}
export const useBillingPaymentStore = create<BillingPaymentState>()(
  persist(
    (set) => ({
      payments: seedBillingPayments,
      addPayment: (p) => {
        const np: BillingPayment = { ...p, id: `bp-${Date.now().toString(36)}` };
        set((s) => ({ payments: [np, ...s.payments] }));
        return np;
      },
      updatePayment: (id, patch) =>
        set((s) => ({ payments: s.payments.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((x) => x.id !== id) })),
      reset: () => set({ payments: seedBillingPayments }),
    }),
    { name: `${BRAND.storeKey}-billing-payments` }
  )
);

interface CreditNoteState {
  creditNotes: CreditNote[];
  addCreditNote: (c: Omit<CreditNote, "id">) => CreditNote;
  updateCreditNote: (id: string, patch: Partial<CreditNote>) => void;
  deleteCreditNote: (id: string) => void;
  reset: () => void;
}
export const useCreditNoteStore = create<CreditNoteState>()(
  persist(
    (set) => ({
      creditNotes: seedCreditNotes,
      addCreditNote: (c) => {
        const nc: CreditNote = { ...c, id: `cn-${Date.now().toString(36)}` };
        set((s) => ({ creditNotes: [nc, ...s.creditNotes] }));
        return nc;
      },
      updateCreditNote: (id, patch) =>
        set((s) => ({ creditNotes: s.creditNotes.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteCreditNote: (id) => set((s) => ({ creditNotes: s.creditNotes.filter((x) => x.id !== id) })),
      reset: () => set({ creditNotes: seedCreditNotes }),
    }),
    { name: `${BRAND.storeKey}-credit-notes` }
  )
);

interface RecurringInvoiceState {
  recurring: RecurringInvoice[];
  addRecurring: (r: Omit<RecurringInvoice, "id">) => RecurringInvoice;
  updateRecurring: (id: string, patch: Partial<RecurringInvoice>) => void;
  deleteRecurring: (id: string) => void;
  reset: () => void;
}
export const useRecurringInvoiceStore = create<RecurringInvoiceState>()(
  persist(
    (set) => ({
      recurring: seedRecurringInvoices,
      addRecurring: (r) => {
        const nr: RecurringInvoice = { ...r, id: `ri-${Date.now().toString(36)}` };
        set((s) => ({ recurring: [nr, ...s.recurring] }));
        return nr;
      },
      updateRecurring: (id, patch) =>
        set((s) => ({ recurring: s.recurring.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((x) => x.id !== id) })),
      reset: () => set({ recurring: seedRecurringInvoices }),
    }),
    { name: `${BRAND.storeKey}-recurring` }
  )
);

export function resetAllDemoData() {
  if (typeof window === "undefined") return;
  const p = BRAND.storeKey;
  [
    `${p}-fleet`, `${p}-drivers`, `${p}-clients`, `${p}-trips`,
    `${p}-maintenance`, `${p}-expenses`, `${p}-payroll`, `${p}-pods`,
    `${p}-ui`, `${p}-auth`, `${p}-invoices`, `${p}-billing-payments`,
    `${p}-credit-notes`, `${p}-recurring`, `${p}-trip-rates`,
    `${p}-driver-payroll-profiles`, `${p}-incentives`, `${p}-deductions`,
    `${p}-payroll-periods`, `${p}-partners`, `${p}-helpers`, `${p}-calendar`,
    `${p}-feature-flags`, `${p}-office-staff`, `${p}-vehicle-documents`,
  ].forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}

// Re-export payroll stores so callers can import from "@/lib/store"
export {
  useTripRateStore,
  useDriverPayrollProfileStore,
  useIncentiveStore,
  useDeductionStore,
  usePayrollPeriodStore,
  buildDriverSummary,
  computeGovernmentDeductions,
  findBestRate,
  getEligibleTripsForDriver,
} from "./payroll";

// Helper, Office, Partner payroll builders
export {
  buildHelperSummary,
  getEligibleTripsForHelper,
  computeOfficeStaffPayroll,
  computePartnerPayouts,
} from "./payroll-helpers";
export type { OfficePayrollResult, PartnerPayoutResult } from "./payroll-helpers";

// Subcon partners
export { usePartnerStore, usePartnerRequestStore } from "./partners";

// Helpers (Phase 1)
export { useHelperStore } from "./helpers";

// Department Calendar (Phase 6)
export { useCalendarStore } from "./calendar";

// Office Staff Payroll
export { useOfficeStaffStore, computeOfficeDeductions } from "./office-staff";

// Platform Feature Flags
export { useFeatureStore } from "./features";
export type { FeatureKey } from "./features";

// Vehicle Documents & Permits
export { useVehicleDocumentStore } from "./vehicle-documents";
