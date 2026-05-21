"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, Building2, FileText, CloudUpload, FolderTree, Share2, FileQuestion, Trash2, SlidersHorizontal } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { useFeatureStore } from "@/lib/store/features";
import { navForRole, ROLE_LABEL } from "@/lib/auth/roles";
import { BRAND } from "@/lib/config/brand";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  FileText as InvoiceIcon,
  CreditCard,
  Users as CustomersIcon,
  FileX2,
  RefreshCw,
  Truck,
  Receipt,
  LifeBuoy,
  BarChart3,
  Settings,
  Handshake,
} from "lucide-react";

const GROUPS: Array<{ key: "operations" | "finance" | "customer" | "reports" | "others"; label: string }> = [
  { key: "operations", label: "Operations" },
  { key: "finance", label: "Finance & HR" },
  { key: "customer", label: "Customer & Sales" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "others", label: "Others" },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const { isEnabled } = useFeatureStore();

  // Filter by role then by feature flags (platform owner sees all regardless)
  const items = navForRole(user?.role).filter(
    (item) => !item.featureKey || user?.isPlatformOwner || isEnabled(item.featureKey)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-brand-navy text-white transition-[width] duration-300 ease-out",
        collapsed ? "w-[78px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-teal flex items-center justify-center shadow-glow shrink-0">
            <span className="font-extrabold text-lg text-brand-navy">N</span>
          </div>
          {!collapsed && (
            <div className="leading-none">
              <div className="text-lg font-extrabold tracking-tight">
                {BRAND.name.slice(0, -1)}<span className="text-brand-teal">{BRAND.name.slice(-1)}</span>
              </div>
              <div className="text-[9px] tracking-[0.3em] text-brand-teal/90 font-semibold mt-0.5">
                {BRAND.tagline.split(" ")[0].toUpperCase()}
              </div>
            </div>
          )}
        </Link>
        <button
          onClick={toggle}
          className="p-1.5 rounded-md hover:bg-white/10 transition shrink-0"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3 space-y-4">
        {GROUPS.map((g) => {
          const groupItems = items.filter((i) => i.group === g.key);
          if (groupItems.length === 0) return null;
          return (
            <div key={g.key}>
              {!collapsed && (
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 px-3 py-2">
                  {g.label}
                </div>
              )}
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const isBilling = item.href === "/billing";
                  const isDocuments = item.href === "/documents";
                  const isClientPortal = item.href === "/client-portal";
                  const active =
                    pathname === item.href || (item.href !== "/dashboard" && !isBilling && !isDocuments && !isClientPortal && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      {isBilling ? (
                        <ExpandableNav collapsed={collapsed} pathname={pathname} item={item} childrenItems={BILLING_CHILDREN} basePath="/billing" />
                      ) : isDocuments ? (
                        <ExpandableNav collapsed={collapsed} pathname={pathname} item={item} childrenItems={DOCUMENTS_CHILDREN} basePath="/documents" />
                      ) : isClientPortal ? (
                        <ExpandableNav collapsed={collapsed} pathname={pathname} item={item} childrenItems={CLIENT_PORTAL_CHILDREN} basePath="/client-portal" />
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                            active
                              ? "bg-brand-teal text-white shadow-glow"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {active && !collapsed && (
                            <motion.div
                              layoutId="active-pill"
                              className="absolute inset-0 rounded-lg bg-brand-teal -z-0"
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                          <item.icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate relative z-10">{item.label}</span>
                              {item.preview && (
                                <Badge variant="preview" className="text-[9px] px-1.5 py-0 relative z-10">
                                  Preview
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Platform Owner — Feature Flag Manager */}
      {user?.isPlatformOwner && (
        <div className="px-3 pb-2">
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/50 px-3 py-2">
              Platform
            </div>
          )}
          <Link
            href="/platform-admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/platform-admin"
                ? "bg-amber-500/20 text-amber-300"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <SlidersHorizontal className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="flex-1 truncate">Feature Flags</span>}
          </Link>
        </div>
      )}

      {/* Company Card */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-t border-white/5"
          >
            <div className="rounded-xl bg-white/5 hover:bg-white/10 transition p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{company.name}</div>
                <div className="text-[10px] text-white/50 truncate">ID: {company.code}</div>
              </div>
            </div>
            {user && (
              <div className="mt-2 px-1 text-[10px] text-white/40 truncate">
                {ROLE_LABEL[user.role]} · {user.email}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

/* ── Expandable Sub-Nav ── */
const BILLING_CHILDREN = [
  { label: "Overview", href: "/billing", icon: LayoutGrid },
  { label: "Invoices", href: "/billing/invoices", icon: InvoiceIcon },
  { label: "Payments", href: "/billing/payments", icon: CreditCard },
  { label: "Customers", href: "/billing/customers", icon: CustomersIcon },
  { label: "Credit Notes", href: "/billing/credit-notes", icon: FileX2 },
  { label: "Recurring Invoices", href: "/billing/recurring", icon: RefreshCw },
  { label: "Subcon Payables", href: "/billing/payables", icon: Handshake },
];

const DOCUMENTS_CHILDREN = [
  { label: "All Documents", href: "/documents", icon: FileText },
  { label: "Upload Document", href: "/documents/upload", icon: CloudUpload },
  { label: "Document Categories", href: "/documents/categories", icon: FolderTree },
  { label: "Shared Documents", href: "/documents/shared", icon: Share2 },
  { label: "Document Requests", href: "/documents/requests", icon: FileQuestion },
  { label: "Recycle Bin", href: "/documents/recycle-bin", icon: Trash2 },
];

const CLIENT_PORTAL_CHILDREN = [
  { label: "Overview", href: "/client-portal/overview", icon: LayoutGrid },
  { label: "Shipments", href: "/client-portal/shipments", icon: Truck },
  { label: "Documents", href: "/client-portal/documents", icon: FileText },
  { label: "Invoices", href: "/client-portal/invoices", icon: Receipt },
  { label: "Tickets & Support", href: "/client-portal/support", icon: LifeBuoy },
  { label: "Reports", href: "/client-portal/reports", icon: BarChart3 },
];

function ExpandableNav({ collapsed, pathname, item, childrenItems, basePath }: { collapsed: boolean; pathname: string; item: any; childrenItems: any[]; basePath: string }) {
  const isOpen = pathname.startsWith(basePath);
  const [expanded, setExpanded] = useState(isOpen);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
          isOpen ? "bg-brand-teal/20 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
        )}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && !collapsed && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden ml-5 border-l border-white/10 pl-2 mt-1 space-y-0.5"
          >
            {childrenItems.map((child) => {
              const active = child.href === basePath ? pathname === basePath : pathname.startsWith(child.href);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-brand-teal text-white shadow-glow"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <child.icon className="w-[15px] h-[15px] shrink-0" />
                    <span className="truncate">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
