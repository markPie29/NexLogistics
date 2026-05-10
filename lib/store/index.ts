"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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
} from "@/lib/types";
import { seedVehicles } from "@/lib/data/vehicles";
import { seedDrivers } from "@/lib/data/drivers";
import { seedTrips } from "@/lib/data/trips";
import { seedMaintenance } from "@/lib/data/maintenance";
import { seedExpenses } from "@/lib/data/expenses";
import { seedPayroll } from "@/lib/data/payroll";
import { seedClients } from "@/lib/data/clients";
import { seedNotifications, seedAiInsights } from "@/lib/data/notifications";

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
    { name: "nex-fleet" }
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
    { name: "nex-drivers" }
  )
);

interface ClientState {
  clients: Client[];
  reset: () => void;
}
export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      clients: seedClients,
      reset: () => set({ clients: seedClients }),
    }),
    { name: "nex-clients" }
  )
);

interface TripState {
  trips: Trip[];
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "statusLogs">) => Trip;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  setStatus: (id: string, status: TripStatus, by?: string, note?: string) => void;
  deleteTrip: (id: string) => void;
  reset: () => void;
}
export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: seedTrips,
      addTrip: (t) => {
        const id = `TRP-2026-${Math.floor(Math.random() * 900 + 100)}`;
        const trip: Trip = {
          ...t,
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
      deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
      reset: () => set({ trips: seedTrips }),
    }),
    { name: "nex-trips" }
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
    { name: "nex-maintenance" }
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
    { name: "nex-expenses" }
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
    { name: "nex-payroll" }
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
    { name: "nex-pods" }
  )
);

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
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
      notifications: seedNotifications,
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      insights: seedAiInsights,
    }),
    { name: "nex-ui" }
  )
);

export function resetAllDemoData() {
  if (typeof window === "undefined") return;
  [
    "nex-fleet",
    "nex-drivers",
    "nex-clients",
    "nex-trips",
    "nex-maintenance",
    "nex-expenses",
    "nex-payroll",
    "nex-pods",
    "nex-ui",
    "nex-auth",
  ].forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
