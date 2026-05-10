"use client";
import { useMemo, useState } from "react";
import {
  Receipt, Download, Send, DollarSign, Clock, CheckCircle2, AlertTriangle,
  Search, FileText, ChevronRight, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface Invoice {
  id: string;
  tripId: string;
  clientId: string;
  clientName: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

const STATUS_VARIANT: Record<InvoiceStatus, any> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
};

function generateInvoices(trips: any[], clients: any[]): Invoice[] {
  return trips.slice(0, 20).map((t, i) => {
    const client = clients.find((c) => c.id === t.clientId) || clients[i % clients.length];
    const statuses: InvoiceStatus[] = ["paid", "paid", "sent", "overdue", "draft"];
    const status = t.status === "completed" ? statuses[i % 3] : t.status === "delivered" ? "sent" : "draft";
    const issued = new Date(t.pickup.scheduledAt);
    const due = new Date(issued);
    due.setDate(due.getDate() + 30);
    return {
      id: `INV-${2026}-${String(i + 1).padStart(4, "0")}`,
      tripId: t.id,
      clientId: client?.id || "",
      clientName: client?.name || "Unknown Client",
      amount: t.fare,
      issuedDate: issued.toISOString(),
      dueDate: due.toISOString(),
      status,
    };
  });
}

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const clients = useClientStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const isClient = user?.role === "client";

  const allInvoices = useMemo(() => generateInvoices(trips, clients), [trips, clients]);
  const myInvoices = isClient
    ? allInvoices.filter((inv) => inv.clientId === user?.clientId)
    : allInvoices;

  const filtered = myInvoices.filter((inv) => {
    const matchSearch = search === "" || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = useMemo(() => ({
    total: myInvoices.reduce((s, i) => s + i.amount, 0),
    paid: myInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
    pending: myInvoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.amount, 0),
    overdue: myInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    countOverdue: myInvoices.filter((i) => i.status === "overdue").length,
  }), [myInvoices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoices"
        subtitle={isClient ? "View and download your invoices" : "Manage client invoices and track receivables"}
        breadcrumbs={[{ label: "Finance" }, { label: "Billing & Invoices" }]}
        actions={
          !isClient ? (
            <Button size="sm" onClick={() => toast.success("Invoice generation coming in full version")}>
              <Plus className="w-4 h-4" /> New Invoice
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Billed" value={formatCurrency(stats.total)} icon={Receipt} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="All invoices" />
        <KpiCard label="Collected" value={formatCurrency(stats.paid)} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" footerLabel="Paid invoices" />
        <KpiCard label="Outstanding" value={formatCurrency(stats.pending)} icon={Clock} iconColor="text-sky-600" iconBg="bg-sky-50" footerLabel="Awaiting payment" />
        <KpiCard label="Overdue" value={formatCurrency(stats.overdue)} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" footerLabel={`${stats.countOverdue} invoices`} />
      </div>

      {/* Invoice Table */}
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-brand-navy">Invoices</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {(["all", "draft", "sent", "paid", "overdue"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filterStatus === s ? "bg-brand-navy text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-5 font-semibold">Invoice #</th>
                  {!isClient && <th className="py-3 px-5 font-semibold">Client</th>}
                  <th className="py-3 px-5 font-semibold">Trip Ref</th>
                  <th className="py-3 px-5 font-semibold">Issued</th>
                  <th className="py-3 px-5 font-semibold">Due</th>
                  <th className="py-3 px-5 font-semibold text-right">Amount</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-brand-navy">{inv.id}</td>
                    {!isClient && <td className="py-3.5 px-5 font-medium text-brand-navy">{inv.clientName}</td>}
                    <td className="py-3.5 px-5 text-muted-foreground text-xs">{inv.tripId}</td>
                    <td className="py-3.5 px-5 text-muted-foreground text-xs">{new Date(inv.issuedDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5 text-muted-foreground text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-brand-navy">{formatCurrency(inv.amount)}</td>
                    <td className="py-3.5 px-5"><Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge></td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.success(`Downloading ${inv.id}…`)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        {!isClient && inv.status === "draft" && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.success(`Invoice ${inv.id} sent to client`)}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isClient ? 7 : 8} className="py-16 text-center text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


