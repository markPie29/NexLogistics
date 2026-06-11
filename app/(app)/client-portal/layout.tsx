"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { useClientCompany } from "@/lib/hooks/client-portal/use-client-company";

const TABS = [
  { value: "overview", label: "Overview", href: "/client-portal/overview" },
  { value: "shipments", label: "Shipments", href: "/client-portal/shipments" },
  { value: "invoices", label: "Invoices", href: "/client-portal/invoices" },
  { value: "documents", label: "Documents", href: "/client-portal/documents" },
  { value: "reports", label: "Reports", href: "/client-portal/reports" },
  { value: "support", label: "Support", href: "/client-portal/support" },
];

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const company = useClientCompany();
  const activeTab = TABS.find((t) => pathname.startsWith(t.href))?.value ?? "overview";

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Client Portal</h1>
        {company && (
          <p className="text-sm text-muted-foreground mt-1">
            {company.name} — {company.contactPerson}
          </p>
        )}
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = TABS.find((t) => t.value === v);
          if (tab) router.push(tab.href);
        }}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="focus-visible:ring-2 focus-visible:ring-brand-teal">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
