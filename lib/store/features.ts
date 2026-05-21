import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";

// ─── Feature Keys ───────────────────────────────────────────────────────────
export type FeatureKey =
  | "fleet_management"
  | "driver_management"
  | "helper_management"
  | "trip_dispatch"
  | "trip_approvals"
  | "subcon_partners"
  | "gps_tracking"
  | "pms_maintenance"
  | "proof_of_delivery"
  | "dispatch_center"
  | "fuel_expenses"
  | "payroll"
  | "attendance"
  | "billing_invoices"
  | "accounting_overview"
  | "department_calendar"
  | "client_management"
  | "client_portal"
  | "reports_analytics"
  | "ai_insights"
  | "documents"
  | "company_management"
  | "warehouse"
  | "route_optimization";

// ─── Feature Metadata (used by Platform Admin UI) ───────────────────────────
export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  description: string;
  group: "Operations" | "Finance & HR" | "Sales & Customer" | "Reports & Analytics" | "Admin";
}

export const FEATURE_META: FeatureMeta[] = [
  // Operations
  { key: "fleet_management",    label: "Fleet Management",          description: "Vehicle list, detail pages, add / edit / archive",       group: "Operations" },
  { key: "driver_management",   label: "Driver Management",         description: "Driver CRUD, detail, payroll profiles, performance",     group: "Operations" },
  { key: "helper_management",   label: "Helper Management",         description: "Loader / assistant CRUD and driver assignment",          group: "Operations" },
  { key: "trip_dispatch",       label: "Trip & Dispatch",           description: "Trips list, Kanban dispatch board, new-trip wizard",     group: "Operations" },
  { key: "trip_approvals",      label: "Trip Rate Approvals",       description: "Pending rate-approval queue (Super Admin only)",        group: "Operations" },
  { key: "subcon_partners",     label: "Subcon Partners",           description: "Subcontractor CRUD and resource requests (diesel / cash)", group: "Operations" },
  { key: "gps_tracking",        label: "Live GPS Tracking",         description: "Real-time map with vehicle location pings",             group: "Operations" },
  { key: "pms_maintenance",     label: "PMS / Maintenance",         description: "Preventive maintenance scheduling and mark-complete",   group: "Operations" },
  { key: "proof_of_delivery",   label: "Proof of Delivery",         description: "Photo + signature POD capture and admin POD list",      group: "Operations" },
  { key: "dispatch_center",     label: "Dispatch Center",           description: "Dispatcher-role live operations panel with KPIs",       group: "Operations" },

  // Finance & HR
  { key: "fuel_expenses",       label: "Fuel & Expenses",           description: "Expense log with category breakdown charts",            group: "Finance & HR" },
  { key: "payroll",             label: "Payroll",                   description: "Philippine payroll periods, trip rates, gov deductions", group: "Finance & HR" },
  { key: "attendance",          label: "Attendance",                description: "Driver attendance calendar grid",                       group: "Finance & HR" },
  { key: "billing_invoices",    label: "Billing & Invoices",        description: "AR invoices, payments, credit notes, recurring billing", group: "Finance & HR" },
  { key: "accounting_overview", label: "Finance Overview",          description: "Accounting-role landing page with KPI summary",         group: "Finance & HR" },
  { key: "department_calendar", label: "Department Calendar",       description: "Multi-department event calendar",                       group: "Finance & HR" },

  // Sales & Customer
  { key: "client_management",   label: "Client Management",         description: "Client / customer CRUD and portal access controls",     group: "Sales & Customer" },
  { key: "client_portal",       label: "Client Portal",             description: "Client-facing shipment tracking, invoices, and support", group: "Sales & Customer" },

  // Reports & Analytics
  { key: "reports_analytics",   label: "Reports & Analytics",       description: "10 report types with date filters and CSV export",      group: "Reports & Analytics" },
  { key: "ai_insights",         label: "AI Insights",               description: "Predictive insights dashboard (preview feature)",       group: "Reports & Analytics" },

  // Admin
  { key: "documents",           label: "Documents",                 description: "Document management, sharing, categories, and recycle bin", group: "Admin" },
  { key: "company_management",  label: "Company Management",        description: "Company overview, user roster, and branch list",        group: "Admin" },
  { key: "warehouse",           label: "Warehouse",                 description: "Warehouse management module (preview — coming soon)",    group: "Admin" },
  { key: "route_optimization",  label: "Route Optimization",        description: "Automated route planning module (preview — coming soon)", group: "Admin" },
];

const DEFAULT_FLAGS = Object.fromEntries(
  FEATURE_META.map((f) => [f.key, true])
) as Record<FeatureKey, boolean>;

// ─── Store ───────────────────────────────────────────────────────────────────
interface FeatureState {
  flags: Record<FeatureKey, boolean>;
  isEnabled: (key: FeatureKey) => boolean;
  toggle: (key: FeatureKey) => void;
  setFlag: (key: FeatureKey, value: boolean) => void;
  enableAll: () => void;
  resetAll: () => void;
}

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      flags: { ...DEFAULT_FLAGS },
      isEnabled: (key) => get().flags[key] ?? true,
      toggle: (key) =>
        set((s) => ({ flags: { ...s.flags, [key]: !s.flags[key] } })),
      setFlag: (key, value) =>
        set((s) => ({ flags: { ...s.flags, [key]: value } })),
      enableAll: () => set({ flags: { ...DEFAULT_FLAGS } }),
      resetAll: () => set({ flags: { ...DEFAULT_FLAGS } }),
    }),
    { name: `${BRAND.storeKey}-feature-flags` }
  )
);
