"use client";
import { useMemo, useState } from "react";
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, RotateCcw, Clock, AlertCircle,
  Search, Download, X, MoreHorizontal, Eye, Calendar, Building2,
  CheckCircle2, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useBillingPaymentStore, useClientStore, useInvoiceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { PaymentType, PaymentStatus } from "@/lib/types";
import { RecordPaymentModal } from "@/components/billing/RecordPaymentModal";

const TYPE_VARIANT: Record<PaymentType, string> = { received: "success", sent: "info", refund: "warning" };
const STATUS_VARIANT: Record<PaymentStatus, string> = { completed: "success", pending: "warning", failed: "danger" };
const METHOD_ICONS: Record<string, string> = {
  bank_transfer: "🏦", credit_card: "💳", gcash: "📱", cash: "💵", check: "🧾",
};

type TabKey = "all" | PaymentType | "upcoming" | "failed";
const TAB_FILTERS: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All Payments" },
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
  { key: "refund", label: "Refunds" },
  { key: "upcoming", label: "Upcoming" },
  { key: "failed", label: "Failed" },
];

export default function PaymentsPage() {
  const payments = useBillingPaymentStore((s) => s.payments);
  const clients = useClientStore((s) => s.clients);
  const invoices = useInvoiceStore((s) => s.invoices);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clientMap = useMemo(() => {
    const m: Record<string, typeof clients[0]> = {};
    clients.forEach((c) => (m[c.id] = c));
    return m;
  }, [clients]);

  const invoiceMap = useMemo(() => {
    const m: Record<string, typeof invoices[0]> = {};
    invoices.forEach((i) => (m[i.id] = i));
    return m;
  }, [invoices]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (tab === "upcoming") return p.status === "pending";
      if (tab === "failed") return p.status === "failed";
      if (tab !== "all" && p.type !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.paymentId.toLowerCase().includes(q) ||
          (clientMap[p.clientId]?.name || "").toLowerCase().includes(q) ||
          p.invoiceId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, tab, search, clientMap]);

  const stats = useMemo(() => {
    const received = payments.filter((p) => p.type === "received" && p.status === "completed").reduce((s, p) => s + Math.abs(p.amount), 0);
    const sent = payments.filter((p) => p.type === "sent" && p.status === "completed").reduce((s, p) => s + Math.abs(p.amount), 0);
    const refunds = payments.filter((p) => p.type === "refund").reduce((s, p) => s + Math.abs(p.amount), 0);
    const pending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Math.abs(p.amount), 0);
    return { received, sent, net: received - sent, refunds, pending };
  }, [payments]);

  const selected = selectedId ? payments.find((p) => p.id === selectedId) : null;
  const selectedClient = selected ? clientMap[selected.clientId] : null;
  const selectedInvoice = selected ? invoiceMap[selected.invoiceId] : null;

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <RecordPaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />

      <PageHeader
        title="Payments"
        subtitle="Track and manage all incoming and outgoing payments."
        breadcrumbs={[{ label: "Finance" }, { label: "Billing & Invoices", href: "/billing" }, { label: "Payments" }]}
        actions={
          <Button onClick={() => setPaymentModalOpen(true)} className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-3 text-xs font-semibold">
            <CreditCard className="w-4 h-4 mr-1.5" /> Record Payment
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Received" value={formatCurrency(stats.received)} icon={ArrowDownLeft} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={9.3} trendLabel="MoM" />
        <KpiCard label="Total Sent" value={formatCurrency(stats.sent)} icon={ArrowUpRight} iconColor="text-sky-600" iconBg="bg-sky-50" trend={6.8} trendLabel="MoM" />
        <KpiCard label="Net Cash Flow" value={formatCurrency(stats.net)} icon={CreditCard} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" trend={11.2} trendLabel="MoM" />
        <KpiCard label="Refunds" value={formatCurrency(stats.refunds)} icon={RotateCcw} iconColor="text-amber-600" iconBg="bg-amber-50" trend={3.4} trendLabel="MoM" />
        <KpiCard label="Pending Receipts" value={formatCurrency(stats.pending)} icon={Clock} iconColor="text-red-500" iconBg="bg-red-50" trend={4.7} trendLabel="MoM" />
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        {/* Payments Table */}
        <Card className="border-brand-border shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center gap-1 p-4 pb-0 flex-wrap border-b border-brand-border">
              {TAB_FILTERS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${tab === t.key ? "border-brand-teal text-brand-teal" : "border-transparent text-muted-foreground hover:text-brand-navy"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 flex gap-3 border-b border-brand-border">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference, customer, or invoice..." className="pl-10" />
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success("CSV export started")}><Download className="w-4 h-4" /> Export</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                    <th className="py-3 px-4 font-medium w-8"><input type="checkbox" className="accent-brand-teal" /></th>
                    <th className="py-3 px-4 font-medium">Payment ID</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Invoice / Reference</th>
                    <th className="py-3 px-4 font-medium">Payment Date</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const inv = invoiceMap[p.invoiceId];
                    return (
                      <tr key={p.id}
                        className={`border-b border-brand-border/60 hover:bg-gray-50 transition-colors cursor-pointer ${selectedId === p.id ? "bg-brand-teal-light/30" : ""}`}
                        onClick={() => setSelectedId(p.id)}>
                        <td className="py-3 px-4"><input type="checkbox" className="accent-brand-teal" onClick={(e) => e.stopPropagation()} /></td>
                        <td className="py-3 px-4 font-bold text-brand-teal">{p.paymentId}</td>
                        <td className="py-3 px-4"><Badge variant={TYPE_VARIANT[p.type] as any}>{p.type}</Badge></td>
                        <td className="py-3 px-4 font-medium text-brand-navy">{clientMap[p.clientId]?.name || "—"}</td>
                        <td className="py-3 px-4 text-brand-teal font-medium">{inv?.invoiceNumber || p.invoiceId}</td>
                        <td className="py-3 px-4">
                          <div className="text-brand-navy">{new Date(p.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span>{METHOD_ICONS[p.method] || "💰"}</span>
                            <span className="capitalize text-muted-foreground">{p.method.replace(/_/g, " ")}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[p.status] as any}>{p.status}</Badge></td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={p.amount >= 0 ? "text-emerald-600" : "text-red-500"}>
                            {p.amount >= 0 ? "" : "−"}{formatCurrency(Math.abs(p.amount))}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); }}>
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={10} className="py-16 text-center text-muted-foreground"><CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />No payments found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-brand-border flex items-center justify-between text-xs text-muted-foreground">
              <div>Showing 1 to {filtered.length} of {payments.length} payments</div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selected && selectedClient && (
          <Card className="border-brand-border shadow-sm sticky top-6 h-fit">
            <CardHeader className="pb-3 border-b border-brand-border">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={STATUS_VARIANT[selected.status] as any} className="mb-2">{selected.status}</Badge>
                  <div className="text-2xl font-extrabold text-brand-navy dark:text-white">{formatCurrency(Math.abs(selected.amount))}</div>
                  <div className="text-sm text-brand-teal font-semibold capitalize">{selected.type}</div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-md hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Payment ID" value={selected.paymentId} />
                <DetailRow label="Payment Date" value={new Date(selected.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + new Date(selected.paymentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} />
                <DetailRow label="Customer" value={selectedClient.name} />
                <DetailRow label="Invoice" value={selectedInvoice?.invoiceNumber || selected.invoiceId} />
                <DetailRow label="Payment Method" value={selected.method.replace(/_/g, " ")} />
                <DetailRow label="Reference No." value={selected.referenceNo} />
              </div>

              {selected.bank && (
                <div className="border-t border-brand-border pt-3 space-y-2 text-sm">
                  <DetailRow label="Bank" value={selected.bank} />
                  {selected.accountNo && <DetailRow label="Account No." value={selected.accountNo} />}
                </div>
              )}

              {selected.notes && (
                <div className="border-t border-brand-border pt-3 text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="text-brand-navy dark:text-white">{selected.notes}</div>
                </div>
              )}

              {/* Payment Timeline */}
              <div className="border-t border-brand-border pt-4">
                <h4 className="font-bold text-brand-navy dark:text-white text-sm mb-3">Payment Timeline</h4>
                <ol className="space-y-3">
                  {[
                    { label: "Payment Initiated", time: selected.paymentDate, icon: CreditCard, color: "text-brand-teal" },
                    { label: "Payment Processing", time: selected.paymentDate, icon: Loader2, color: "text-amber-500" },
                    { label: selected.status === "completed" ? "Payment Completed" : selected.status === "pending" ? "Awaiting Confirmation" : "Payment Failed",
                      time: selected.paymentDate, icon: selected.status === "completed" ? CheckCircle2 : selected.status === "pending" ? Clock : AlertCircle,
                      color: selected.status === "completed" ? "text-emerald-500" : selected.status === "pending" ? "text-amber-500" : "text-red-500" },
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shrink-0 ${step.color === "text-emerald-500" ? "border-emerald-500" : step.color === "text-amber-500" ? "border-amber-500" : step.color === "text-red-500" ? "border-red-500" : "border-brand-teal"}`}>
                        <step.icon className={`w-3.5 h-3.5 ${step.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-brand-navy dark:text-white">{step.label}</div>
                        <div className="text-xs text-muted-foreground">{new Date(step.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {new Date(step.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Viewing invoice...")}><Eye className="w-4 h-4" /> View Invoice</Button>
                <Button variant="outline" size="sm" onClick={() => toast.success("Downloading receipt...")}><Download className="w-4 h-4" /> Download Receipt</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-brand-navy dark:text-white capitalize">{value}</div>
    </div>
  );
}
