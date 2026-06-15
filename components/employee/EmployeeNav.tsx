"use client";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, FileText, Briefcase, CreditCard, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmployeePortalType } from "@/lib/types";

export type EmployeeTab = "home" | "this-week" | "requests" | "hr-documents" | "credentials" | "trips";

interface Tab {
  id: EmployeeTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  onlyFor?: EmployeePortalType[];
}

const TABS: Tab[] = [
  { id: "home",         label: "Home",      icon: LayoutGrid,  href: "/employee-portal" },
  { id: "this-week",    label: "This Week", icon: Briefcase,   href: "/employee-portal/this-week" },
  { id: "requests",     label: "Requests",  icon: FileText,    href: "/employee-portal/requests" },
  { id: "hr-documents", label: "HR",        icon: Briefcase,   href: "/employee-portal/hr-documents" },
  { id: "credentials",  label: "My ID",     icon: CreditCard,  href: "/employee-portal/credentials" },
  { id: "trips",        label: "Trips",     icon: Truck,       href: "/employee-portal/trips", onlyFor: ["driver", "helper"] },
];

interface Props {
  employeeType?: EmployeePortalType;
}

export function EmployeeNav({ employeeType }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const visibleTabs = TABS.filter(
    (t) => !t.onlyFor || (employeeType && t.onlyFor.includes(employeeType))
  );

  const active: EmployeeTab = (() => {
    if (pathname === "/employee-portal") return "home";
    const match = visibleTabs.find((t) => t.href !== "/employee-portal" && pathname?.startsWith(t.href));
    return match?.id ?? "home";
  })();

  return (
    <nav
      className="sticky bottom-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] shrink-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto h-16 flex items-center">
        {visibleTabs.map(({ id, label, icon: Icon, href }) => (
          <button
            key={id}
            onClick={() => router.push(href)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition-colors",
              active === id ? "text-brand-teal" : "text-gray-400"
            )}
            aria-label={label}
          >
            <Icon className={cn("w-5 h-5 transition-transform", active === id && "scale-110")} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
