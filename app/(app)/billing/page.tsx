"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Receipt, DollarSign, Clock, CheckCircle2, AlertTriangle, CalendarClock,
  Search, FileText, Plus, Download, MoreHorizontal, ArrowUpRight,
  PieChart, TrendingUp, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  useInvoiceStore,
  useBillingPaymentStore,
  useClientStore,
} from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { InvoiceStatus } from "@/lib/types";

const STATUS_VARIANT: Record<InvoiceStatus, string> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  partially_paid: "warning",
  overdue: "danger",
  cancelled: "neutral",
};

const TAB_FILTERS: Array<{ key: InvoiceStatus | "all"; label: string }> = [
  { key: "all", label: "All Invoices" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "partially_paid", label: "Partially Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BillingOverviewPage() {
  const invoices = useInvoiceStore((s) => s.invoices);
  const payments = useBillingPaymentStore((s) => s.payments);
  const clients = useClientStore((s) => s.clients);
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (tab !== "all" && inv.status !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (clientMap[inv.clientId] || "").toLowerCase().includes(q) ||
          inv.referenceNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, tab, search, clientMap]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const outstanding = invoices.filter((i) => ["sent", "partially_paid"].includes(i.status)).reduce((s, i) => s + i.balance, 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0);
    const dueThisMonth = invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .filter((i) => {
        const due = new Date(i.dueDate);
        const now = new Date();
        return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
      })
      .reduce((s, i) => s + i.balance, 0);
    return { totalInvoiced, totalPaid, outstanding, overdue, dueThisMonth };
  }, [invoices]);

  // Aging buckets
  const aging = useMemo(() => {
    const now = new Date();
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    invoices.filter((i) => i.balance > 0 && i.status !== "cancelled").forEach((i) => {
      const days = Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / 86400000);
      if (days <= 30) buckets["0-30"] += i.balance;
      else if (days <= 60) buckets["31-60"] += i.balance;
      else if (days <= 90) buckets["61-90"] += i.balance;
      else buckets["90+"] += i.balance;
    });
    return buckets;
  }, [invoices]);
  const agingTotal = Object.values(aging).reduce((s, v) => s + v, 0);

  // Status counts for donut
  const statusCounts = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {};
    invoices.forEach((inv) => {
      if (!counts[inv.status]) counts[inv.status] = { count: 0, amount: 0 };
      counts[inv.status].count++;
      counts[inv.status].amount += inv.totalAmount;
    });
    return counts;
  }, [invoices]);

  // Top customers by outstanding
  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter((i) => i.balance > 0).forEach((i) => {
      map[i.clientId] = (map[i.clientId] || 0) + i.balance;
    });
    return Object.entries(map)
      .map(([id, amount]) => ({ name: clientMap[id] || id, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices, clientMap]);

  // Recent payments
  const recentPayments = payments
    .filter((p) => p.amount > 0)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoices"
        subtitle="Manage your invoices, payments and billing overview."
        breadcrumbs={[{ label: "Finance" }, { label: "Billing & Invoices" }]}
        actions={
          <Button size="sm" asChild>
            <Link href="/billing/invoices"><Plus className="w-4 h-4" /> Create Invoice</Link>
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Invoiced" value={formatCurrency(stats.totalInvoiced)} icon={Receipt} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" trend={12.6} trendLabel="MoM" />
        <KpiCard label="Total Paid" value={formatCurrency(stats.totalPaid)} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={9.3} trendLabel="MoM" />
        <KpiCard label="Outstanding Amount" value={formatCurrency(stats.outstanding)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" trend={-4.8} trendLabel="MoM" />
        <KpiCard label="Overdue Amount" value={formatCurrency(stats.overdue)} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" trend={6.2} trendLabel="MoM" />
        <KpiCard label="Due This Month" value={formatCurrency(stats.dueThisMonth)} icon={CalendarClock} iconColor="text-sky-600" iconBg="bg-sky-50" trend={7.4} trendLabel="MoM" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Invoice Table */}
        <Card className="border-brand-border shadow-sm">
          <CardContent className="p-0">
            {/* Tab Filters */}
            <div className="flex items-center gap-1 p-4 pb-0 flex-wrap border-b border-brand-border">
              {TAB_FILTERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                    tab === t.key
                      ? "border-brand-teal text-brand-teal"
                      : "border-transparent text-muted-foreground hover:text-brand-navy"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search / Filters Bar */}
            <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-brand-border">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, or reference..." className="pl-10" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                    <th className="py-3 px-4 font-medium">Invoice #</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Reference / PO #</th>
                    <th className="py-3 px-4 font-medium">Invoice Date</th>
                    <th className="py-3 px-4 font-medium">Due Date</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 font-medium text-right">Paid Amount</th>
                    <th className="py-3 px-4 font-medium text-right">Balance</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-brand-border/60 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/billing/invoices?id=${inv.id}`} className="font-bold text-brand-teal hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-brand-navy">{clientMap[inv.clientId] || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{inv.referenceNo}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[inv.status] as any}>{inv.status.replace(/_/g, " ")}</Badge></td>
                      <td className="py-3 px-4 text-right font-semibold text-brand-navy">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-3 px-4 text-right text-brand-teal font-semibold">{formatCurrency(inv.paidAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-brand-navy">{formatCurrency(inv.balance)}</td>
                      <td className="py-3 px-4">
                        <button className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center" onClick={() => toast.info(`Actions for ${inv.invoiceNumber}`)}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="py-16 text-center text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />No invoices found
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-brand-border flex items-center justify-between text-xs text-muted-foreground">
              <div>Showing 1 to {filtered.length} of {filtered.length} invoices</div>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Invoice Summary Donut */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-3">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      const colors: Record<string, string> = {
                        paid: "#10B981", sent: "#0EA5E9", partially_paid: "#F59E0B", overdue: "#EF4444", draft: "#9CA3AF", cancelled: "#D1D5DB",
                      };
                      const total = stats.totalInvoiced || 1;
                      let offset = 0;
                      return Object.entries(statusCounts).map(([status, data]) => {
                        const pct = (data.amount / total) * 100;
                        const dashArray = `${pct * 2.512} ${251.2 - pct * 2.512}`;
                        const dashOffset = -offset * 2.512;
                        offset += pct;
                        return (
                          <circle key={status} cx="50" cy="50" r="40" fill="none"
                            stroke={colors[status] || "#ccc"} strokeWidth="12"
                            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-base font-extrabold text-brand-navy dark:text-white">{formatCurrency(stats.totalInvoiced)}</div>
                    <div className="text-[10px] text-muted-foreground">Total Invoiced</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                {Object.entries(statusCounts).map(([status, data]) => {
                  const colors: Record<string, string> = {
                    paid: "bg-emerald-500", sent: "bg-sky-500", partially_paid: "bg-amber-500", overdue: "bg-red-500", draft: "bg-gray-400", cancelled: "bg-gray-300",
                  };
                  const pct = ((data.amount / (stats.totalInvoiced || 1)) * 100).toFixed(1);
                  return (
                    <div key={status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-300"}`} />
                        <span className="capitalize text-muted-foreground">{status.replace(/_/g, " ")}</span>
                      </div>
                      <div className="font-semibold text-brand-navy dark:text-white">{formatCurrency(data.amount)} <span className="text-muted-foreground font-normal">({pct}%)</span></div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Aging of Outstanding */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Aging of Outstanding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {([["0 - 30 days", aging["0-30"], "bg-emerald-500"], ["31 - 60 days", aging["31-60"], "bg-sky-500"], ["61 - 90 days", aging["61-90"], "bg-amber-500"], ["90+ days", aging["90+"], "bg-red-500"]] as const).map(([label, amount, color]) => (
                <div key={label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${agingTotal ? (amount / agingTotal) * 100 : 0}%` }} />
                  </div>
                  <span className="font-bold text-brand-navy dark:text-white w-24 text-right">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="border-t border-brand-border pt-2 flex justify-between text-sm font-bold">
                <span className="text-brand-navy dark:text-white">Total</span>
                <span className="text-brand-navy dark:text-white">{formatCurrency(agingTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { label: "Create Invoice", href: "/billing/invoices", icon: Plus, color: "text-brand-teal" },
                { label: "Record Payment", href: "/billing/payments", icon: DollarSign, color: "text-emerald-600" },
                { label: "Create Credit Note", href: "/billing/credit-notes", icon: FileText, color: "text-amber-600" },
                { label: "Manage Customers", href: "/billing/customers", icon: Receipt, color: "text-sky-600" },
                { label: "Download Reports", href: "/reports", icon: Download, color: "text-purple-600" },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm group">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="font-medium text-brand-navy dark:text-white group-hover:text-brand-teal transition">{action.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Top Customers + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers by Outstanding */}
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Top Customers by Outstanding</CardTitle>
            <Link href="/billing/customers" className="text-xs text-brand-teal font-semibold hover:underline">View Report</Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b bg-gray-50/50">
                  <th className="py-2.5 px-4 font-medium">Customer</th>
                  <th className="py-2.5 px-4 font-medium text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.name} className="border-b border-brand-border/40 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-brand-navy">{c.name}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-500">{formatCurrency(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Recent Payments</CardTitle>
            <Link href="/billing/payments" className="text-xs text-brand-teal font-semibold hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-brand-navy dark:text-white text-sm">{clientMap[p.clientId] || "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
                <div className="text-right font-bold text-brand-teal">{formatCurrency(p.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
