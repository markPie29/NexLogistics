import type { Role } from "@/lib/types";
import type { FeatureKey } from "@/lib/store/features";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  MapPinned,
  Wrench,
  Fuel,
  Wallet,
  CalendarClock,
  Briefcase,
  PackageCheck,
  BarChart3,
  FileText,
  Receipt,
  Warehouse,
  GitBranch,
  Sparkles,
  Settings,
  Layers,
  Calculator,
  Building2,
  Handshake,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  preview?: boolean;
  group?: "operations" | "finance" | "customer" | "reports" | "others";
  roles?: Role[]; // if undefined, all roles
  featureKey?: FeatureKey; // if set, hidden when that feature is disabled
}

export const NAV_ITEMS: NavItem[] = [
  // === Super Admin & Company Admin ===
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "operations", roles: ["super_admin", "company_admin"] },
  { label: "Company Management", href: "/company-admin", icon: Building2, group: "operations", roles: ["company_admin"], featureKey: "company_management" },

  // === Dispatcher-specific ===
  { label: "Dispatch Center", href: "/dispatcher", icon: Layers, group: "operations", roles: ["dispatcher"], featureKey: "dispatch_center" },

  // === Accounting-specific ===
  { label: "Finance Overview", href: "/accounting", icon: Calculator, group: "finance", roles: ["accounting"], featureKey: "accounting_overview" },

  // === Driver-specific ===
  { label: "My Trip", href: "/driver", icon: Truck, group: "operations", roles: ["driver"] },
  { label: "My Earnings", href: "/driver/earnings", icon: Wallet, group: "finance", roles: ["driver"] },

  // === Helper-specific ===
  { label: "My Trip", href: "/helper", icon: Truck, group: "operations", roles: ["helper"] },

  // === Client-specific ===
  { label: "Client Portal", href: "/client-portal", icon: Briefcase, group: "customer", roles: ["client"], featureKey: "client_portal" },

  // === Customer ===
  { label: "Client Management", href: "/clients", icon: Briefcase, group: "customer", roles: ["super_admin", "company_admin"], featureKey: "client_management" },

  // === Shared Operations ===
  { label: "Fleet Management", href: "/fleet", icon: Truck, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "fleet_management" },
  { label: "Driver Management", href: "/drivers", icon: Users, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "driver_management" },
  { label: "Helper Management", href: "/helpers", icon: Users, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "helper_management" },
  { label: "Trip & Dispatch", href: "/trips", icon: Route, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "trip_dispatch" },
  { label: "Trip Approvals", href: "/approvals", icon: CheckCircle2, group: "operations", roles: ["super_admin"], featureKey: "trip_approvals" },
  { label: "Subcon Partners", href: "/partners", icon: Handshake, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "accounting"], featureKey: "subcon_partners" },
  { label: "Live GPS Tracking", href: "/gps", icon: MapPinned, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "driver", "helper"], featureKey: "gps_tracking" },
  { label: "PMS / Maintenance", href: "/pms", icon: Wrench, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "pms_maintenance" },
  { label: "Proof of Delivery", href: "/pod", icon: PackageCheck, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "driver", "helper"], featureKey: "proof_of_delivery" },

  // === Finance ===
  { label: "Fuel & Expenses", href: "/expenses", icon: Fuel, group: "finance", roles: ["super_admin", "company_admin", "accounting"], featureKey: "fuel_expenses" },
  { label: "Payroll", href: "/payroll", icon: Wallet, group: "finance", roles: ["super_admin", "company_admin", "accounting"], featureKey: "payroll" },
  { label: "Attendance", href: "/attendance", icon: CalendarClock, group: "finance", roles: ["super_admin", "company_admin", "accounting"], featureKey: "attendance" },
  { label: "Department Calendar", href: "/calendar", icon: CalendarClock, group: "others", roles: ["super_admin", "company_admin", "dispatcher", "accounting"], featureKey: "department_calendar" },
  { label: "Billing & Invoices", href: "/billing", icon: Receipt, group: "finance", roles: ["super_admin", "company_admin", "accounting"], featureKey: "billing_invoices" },

  // === Reports ===
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3, group: "reports", roles: ["super_admin", "company_admin", "accounting"], featureKey: "reports_analytics" },
  { label: "AI Insights", href: "/ai-insights", icon: Sparkles, group: "reports", preview: true, roles: ["super_admin", "company_admin"], featureKey: "ai_insights" },

  // === Others / Admin ===
  { label: "Documents", href: "/documents", icon: FileText, group: "others", roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "documents" },
  { label: "Warehouse", href: "/warehouse", icon: Warehouse, group: "others", preview: true, roles: ["super_admin", "company_admin"], featureKey: "warehouse" },
  { label: "Route Optimization", href: "/routes", icon: GitBranch, group: "others", preview: true, roles: ["super_admin", "company_admin", "dispatcher"], featureKey: "route_optimization" },
  { label: "Settings", href: "/settings", icon: Settings, group: "others" },
];

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
  helper: "Helper",
  accounting: "Accounting / HR",
  client: "Client / Customer",
};

export function navForRole(role: Role | undefined) {
  if (!role) return NAV_ITEMS;
  return NAV_ITEMS.filter((n) => !n.roles || n.roles.includes(role));
}

// Default landing per role
export const DEFAULT_LANDING: Record<Role, string> = {
  super_admin: "/dashboard",
  company_admin: "/dashboard",
  dispatcher: "/dispatcher",
  driver: "/driver",
  helper: "/helper",
  accounting: "/accounting",
  client: "/client-portal/overview",
};
