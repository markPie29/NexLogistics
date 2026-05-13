import type { Role } from "@/lib/types";
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  preview?: boolean;
  group?: "operations" | "finance" | "customer" | "reports" | "others";
  roles?: Role[]; // if undefined, all roles
}

export const NAV_ITEMS: NavItem[] = [
  // === Super Admin & Company Admin ===
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "operations", roles: ["super_admin", "company_admin"] },
  { label: "Company Management", href: "/company-admin", icon: Building2, group: "operations", roles: ["company_admin"] },

  // === Dispatcher-specific ===
  { label: "Dispatch Center", href: "/dispatcher", icon: Layers, group: "operations", roles: ["dispatcher"] },

  // === Accounting-specific ===
  { label: "Finance Overview", href: "/accounting", icon: Calculator, group: "finance", roles: ["accounting"] },

  // === Driver-specific ===
  { label: "My Trip", href: "/driver", icon: Truck, group: "operations", roles: ["driver"] },
  { label: "My Earnings", href: "/driver/earnings", icon: Wallet, group: "finance", roles: ["driver"] },

  // === Client-specific ===
  { label: "Client Portal", href: "/client-portal", icon: Briefcase, group: "customer", roles: ["client"] },

  // === Customer ===
  { label: "Client Management", href: "/clients", icon: Briefcase, group: "customer", roles: ["super_admin", "company_admin"] },

  // === Shared Operations ===
  { label: "Fleet Management", href: "/fleet", icon: Truck, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Driver Management", href: "/drivers", icon: Users, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Trip & Dispatch", href: "/trips", icon: Route, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Subcon Partners", href: "/partners", icon: Handshake, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "accounting"] },
  { label: "Live GPS Tracking", href: "/gps", icon: MapPinned, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "driver"] },
  { label: "PMS / Maintenance", href: "/pms", icon: Wrench, group: "operations", roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Proof of Delivery", href: "/pod", icon: PackageCheck, group: "operations", roles: ["super_admin", "company_admin", "dispatcher", "driver"] },

  // === Finance ===
  { label: "Fuel & Expenses", href: "/expenses", icon: Fuel, group: "finance", roles: ["super_admin", "company_admin", "accounting"] },
  { label: "Payroll", href: "/payroll", icon: Wallet, group: "finance", roles: ["super_admin", "company_admin", "accounting"] },
  { label: "Attendance", href: "/attendance", icon: CalendarClock, group: "finance", roles: ["super_admin", "company_admin", "accounting"] },
  { label: "Billing & Invoices", href: "/billing", icon: Receipt, group: "finance", roles: ["super_admin", "company_admin", "accounting"] },

  // === Reports ===
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3, group: "reports", roles: ["super_admin", "company_admin", "accounting"] },
  { label: "AI Insights", href: "/ai-insights", icon: Sparkles, group: "reports", preview: true, roles: ["super_admin", "company_admin"] },

  // === Others / Admin ===
  { label: "Documents", href: "/documents", icon: FileText, group: "others", roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Warehouse", href: "/warehouse", icon: Warehouse, group: "others", preview: true, roles: ["super_admin", "company_admin"] },
  { label: "Route Optimization", href: "/routes", icon: GitBranch, group: "others", preview: true, roles: ["super_admin", "company_admin", "dispatcher"] },
  { label: "Settings", href: "/settings", icon: Settings, group: "others" },
];

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
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
  accounting: "/accounting",
  client: "/client-portal/overview",
};
