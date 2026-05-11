"use client";
import { useMemo, useState } from "react";
import {
  FileText, CheckCircle2, Hourglass, AlertCircle, Calendar,
  Search, Plus, Download, MoreVertical, X, Eye,
  MapPin, Phone, Mail, ChevronDown, Filter, SlidersHorizontal,
  FileCheck2, CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useInvoiceStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { InvoiceStatus } from "@/lib/types";

import { CreateInvoiceModal } from "@/components/billing/CreateInvoiceModal";
import { RecordPaymentModal } from "@/components/billing/RecordPaymentModal";

const TAB_FILTERS: Array<{ key: InvoiceStatus | "all"; label: string }> = [
  { key: "all", label: "All Invoices" }, { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" }, { key: "paid", label: "Paid" },
  { key: "partially_paid", label: "Partially Paid" },
  { key: "overdue", label: "Overdue" }, { key: "cancelled", label: "Cancelled" },
];

export default function InvoicesPage() {
  const invoices = useInvoiceStore((s) => s.invoices);
  const clients = useClientStore((s) => s.clients);
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | undefined>();

  const clientMap = useMemo(() => {
    const m: Record<string, typeof clients[0]> = {};
    clients.forEach((c) => (m[c.id] = c));
    return m;
  }, [clients]);

  // Use dummy data from the screenshot if no invoices match the exact look
  // To keep it simple, we just use the real store data but formatted nicely
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (tab !== "all" && inv.status !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.invoiceNumber.toLowerCase().includes(q) || (clientMap[inv.clientId]?.name || "").toLowerCase().includes(q) || inv.referenceNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, tab, search, clientMap]);

  const stats = useMemo(() => ({
    totalInvoiced: invoices.reduce((s, i) => s + i.totalAmount, 0),
    totalPaid: invoices.reduce((s, i) => s + i.paidAmount, 0),
    outstanding: invoices.filter((i) => ["sent", "partially_paid", "draft"].includes(i.status)).reduce((s, i) => s + i.balance, 0),
    overdue: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0),
    dueThisMonth: invoices.filter((i) => !["paid", "cancelled"].includes(i.status)).reduce((s, i) => s + i.balance, 0),
  }), [invoices]);

  const selected = selectedId ? invoices.find((i) => i.id === selectedId) : null;
  const selectedClient = selected ? clientMap[selected.clientId] : null;

  return (
    <div className="space-y-6">
      <CreateInvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} />
      <RecordPaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} defaultInvoiceId={paymentInvoiceId} />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, send and manage all your invoices.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white shadow-sm border-gray-200 h-9 px-3 text-xs font-semibold text-[#0B1220]">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" /> May 16 - May 31, 2024 <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
            </Button>
            <Button variant="outline" className="bg-white shadow-sm border-gray-200 h-9 px-3 text-xs font-semibold text-[#0B1220]">
              <Filter className="w-4 h-4 mr-2 text-gray-500" /> Filters
            </Button>
          </div>
          <Button onClick={() => setInvoiceModalOpen(true)} className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-3 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Create Invoice <ChevronDown className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard label="Total Invoiced" value={formatCurrency(stats.totalInvoiced)} icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50" trend={12.6} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Total Paid" value={formatCurrency(stats.totalPaid)} icon={FileCheck2} iconColor="text-emerald-500" iconBg="bg-emerald-50" trend={9.3} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Outstanding Amount" value={formatCurrency(stats.outstanding)} icon={Hourglass} iconColor="text-amber-500" iconBg="bg-amber-50" trend={-4.8} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Overdue Amount" value={formatCurrency(stats.overdue)} icon={AlertCircle} iconColor="text-red-500" iconBg="bg-red-50" trend={-6.2} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Due This Month" value={formatCurrency(stats.dueThisMonth)} icon={Calendar} iconColor="text-purple-500" iconBg="bg-purple-50" trend={7.4} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex items-center gap-6 px-5 pt-3 flex-wrap border-b border-gray-100">
              {TAB_FILTERS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`pb-3 text-xs font-semibold border-b-2 transition-all ${tab === t.key ? "border-[#008A56] text-[#008A56]" : "border-transparent text-gray-500 hover:text-[#0B1220]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters Bar */}
            <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, or reference..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
                </div>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  All Customers <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  All Status <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  All Date <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> More Filters
                </Button>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-[#008A56] rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-2" /> Export
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left font-bold text-gray-700 border-b border-gray-100 bg-white">
                    <th className="py-3 px-5 w-10"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" /></th>
                    <th className="py-3 px-2">Invoice #</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Reference / PO #</th>
                    <th className="py-3 px-2">Invoice Date</th>
                    <th className="py-3 px-2">Due Date</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-5 text-right">Balance</th>
                    <th className="py-3 px-4 text-center w-14">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((inv) => (
                    <tr key={inv.id}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedId === inv.id ? "bg-green-50/30" : ""}`}
                      onClick={() => setSelectedId(inv.id)}>
                      <td className="py-4 px-5"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                      <td className="py-4 px-2 font-semibold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="py-4 px-2 font-medium text-gray-800">{clientMap[inv.clientId]?.name || "—"}</td>
                      <td className="py-4 px-2 text-gray-600">{inv.referenceNo}</td>
                      <td className="py-4 px-2 text-gray-600">{new Date(inv.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-4 px-2 text-gray-600">{new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-4 px-2">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-gray-800">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-4 px-5 text-right font-semibold text-gray-800">{formatCurrency(inv.balance)}</td>
                      <td className="py-4 px-4 text-center">
                        <button className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto" onClick={(e) => { e.stopPropagation(); toast.info("More actions"); }}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={10} className="py-16 text-center text-gray-500"><FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />No invoices found</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
              <div>Showing 1 to {Math.min(10, filtered.length)} of {invoices.length} invoices</div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1 items-center">
                  <button className="w-7 h-7 rounded-md flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-400">&lt;</button>
                  {[1, 2, 3, 4, 5, "...", 6].map((p, i) => (
                    <button key={i} className={`w-7 h-7 rounded-md font-semibold ${p === 1 ? "bg-[#008A56] text-white" : "text-gray-600 hover:bg-gray-50"}`}>{p}</button>
                  ))}
                  <button className="w-7 h-7 rounded-md flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-600">&gt;</button>
                </div>
                <Button variant="outline" className="h-8 px-2.5 text-xs border-gray-200 font-medium text-gray-600">
                  10 / page <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selected && selectedClient && (
          <Card className="border-gray-200 shadow-xl rounded-xl sticky top-6 h-fit overflow-hidden bg-white">
            <CardHeader className="flex-row items-center justify-between pb-4 pt-5 px-6 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Invoice Details</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Header section */}
              <div className="flex justify-between items-end">
                <StatusBadge status={selected.status} />
                <div className="text-right">
                  <div className="text-[11px] text-gray-500 font-medium mb-1">Invoice #</div>
                  <div className="text-sm font-bold text-blue-600">{selected.invoiceNumber}</div>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2">
                <div className="font-extrabold text-gray-900 text-sm">{selectedClient.name}</div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.address}
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.email}
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedClient.phone}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Detail Grid */}
              <div className="space-y-3">
                <DetailRow label="Invoice Date" value={new Date(selected.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <DetailRow label="Due Date" value={new Date(selected.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <DetailRow label="Reference / PO #" value={selected.referenceNo} />
                <DetailRow label="Payment Terms" value={selected.paymentTerms} />
                <DetailRow label="Salesperson" value={selected.salesperson || "Juan Dela Cruz"} />
              </div>

              <hr className="border-gray-100" />

              {/* Amounts */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs"><span className="text-gray-600 font-medium">Subtotal</span><span className="font-semibold text-gray-900">{formatCurrency(selected.subtotal)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-600 font-medium">VAT ({selected.vatRate}%)</span><span className="font-semibold text-gray-900">{formatCurrency(selected.vatAmount)}</span></div>
                <div className="flex justify-between text-sm font-extrabold pt-2"><span className="text-gray-900">Total Amount</span><span className="text-gray-900">{formatCurrency(selected.totalAmount)}</span></div>
              </div>

              {/* Paid / Balance Highlight */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs bg-emerald-50/80 px-3 py-2 rounded-md">
                  <span className="text-emerald-700 font-bold">Paid Amount</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selected.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs px-3">
                  <span className="text-gray-800 font-bold">Balance</span>
                  <span className="font-extrabold text-gray-900">{formatCurrency(selected.balance)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="text-xs h-9 font-semibold text-gray-700 border-gray-200 shadow-sm" onClick={() => toast.success("Viewing invoice...")}>
                    <Eye className="w-3.5 h-3.5 mr-2" /> View Invoice
                  </Button>
                  <Button variant="outline" className="text-xs h-9 font-semibold text-gray-700 border-gray-200 shadow-sm" onClick={() => toast.success(`Downloading ${selected.invoiceNumber}...`)}>
                    <Download className="w-3.5 h-3.5 mr-2" /> Download
                  </Button>
                </div>
                {selected.status !== "paid" && selected.status !== "cancelled" && (
                  <Button className="w-full bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-10 font-semibold text-xs flex items-center justify-center gap-2" 
                    onClick={() => {
                      setPaymentInvoiceId(selected.id);
                      setPaymentModalOpen(true);
                    }}>
                    <CreditCard className="w-4 h-4" /> Record Payment <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-70" />
                  </Button>
                )}
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
    <div className="flex justify-between text-[11px]">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  let style = "bg-gray-100 text-gray-600";
  let label = status.replace(/_/g, " ");

  if (status === "paid") style = "bg-emerald-100/60 text-emerald-700";
  else if (status === "partially_paid") style = "bg-orange-100/60 text-orange-700";
  else if (status === "sent") style = "bg-blue-100/60 text-blue-700";
  else if (status === "overdue") style = "bg-red-100/60 text-red-700";
  else if (status === "draft") style = "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${style}`}>
      {label}
    </span>
  );
}
