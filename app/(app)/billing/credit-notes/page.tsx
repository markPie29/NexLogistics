"use client";
import { useMemo, useState } from "react";
import {
  FileX2, Search, Plus, MoreVertical, Download, CheckCircle2, RotateCcw,
  FileText, Eye, ChevronDown, SlidersHorizontal, Filter, Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useCreditNoteStore, useClientStore, useInvoiceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { CreditNoteStatus } from "@/lib/types";

export default function CreditNotesPage() {
  const creditNotes = useCreditNoteStore((s) => s.creditNotes);
  const clients = useClientStore((s) => s.clients);
  const invoices = useInvoiceStore((s) => s.invoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CreditNoteStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [clients]);

  const invoiceMap = useMemo(() => {
    const m: Record<string, string> = {};
    invoices.forEach((i) => (m[i.id] = i.invoiceNumber));
    return m;
  }, [invoices]);

  const filtered = useMemo(() => {
    return creditNotes.filter((cn) => {
      if (statusFilter !== "all" && cn.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return cn.creditNoteNumber.toLowerCase().includes(q) || (clientMap[cn.clientId] || "").toLowerCase().includes(q) || cn.reason.toLowerCase().includes(q);
      }
      return true;
    });
  }, [creditNotes, statusFilter, search, clientMap]);

  const stats = useMemo(() => ({
    total: creditNotes.length,
    totalAmount: creditNotes.reduce((s, cn) => s + cn.amount, 0),
    draft: creditNotes.filter((cn) => cn.status === "draft").length,
    applied: creditNotes.filter((cn) => cn.status === "applied").reduce((s, cn) => s + cn.amount, 0),
    refunded: creditNotes.filter((cn) => cn.status === "refunded").reduce((s, cn) => s + cn.amount, 0),
  }), [creditNotes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Credit Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage credit notes, adjustments, and refund records.</p>
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
          <Button onClick={() => toast.info("Create credit note — coming soon")} className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-3 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> New Credit Note <ChevronDown className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Credit Notes" value={stats.total} icon={FileX2} iconColor="text-blue-500" iconBg="bg-blue-50" trend={2.1} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={FileText} iconColor="text-purple-500" iconBg="bg-purple-50" trend={-1.5} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Applied" value={formatCurrency(stats.applied)} icon={CheckCircle2} iconColor="text-emerald-500" iconBg="bg-emerald-50" trend={4.8} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Refunded" value={formatCurrency(stats.refunded)} icon={RotateCcw} iconColor="text-amber-500" iconBg="bg-amber-50" trend={0.0} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <div className={`grid gap-6 ${selectedId ? "grid-cols-1 xl:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
      <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="flex items-center gap-6 px-5 pt-3 flex-wrap border-b border-gray-100">
            {(["all", "draft", "applied", "refunded"] as const).map((key) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`pb-3 text-xs font-semibold border-b-2 capitalize transition-all ${statusFilter === key ? "border-[#008A56] text-[#008A56]" : "border-transparent text-gray-500 hover:text-[#0B1220]"}`}>
                {key === "all" ? "All" : key}
              </button>
            ))}
          </div>

          <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credit note, customer, or reason..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
              </div>
              <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                All Customers <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
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
                  <th className="py-3 px-2">Credit Note #</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Related Invoice</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2 max-w-[200px]">Reason</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-4 text-center w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((cn) => (
                  <tr key={cn.id} 
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedId === cn.id ? "bg-green-50/30" : ""}`}
                      onClick={() => setSelectedId(cn.id)}>
                    <td className="py-4 px-5"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="py-4 px-2 font-semibold text-blue-600">{cn.creditNoteNumber}</td>
                    <td className="py-4 px-2 font-medium text-gray-800">{clientMap[cn.clientId] || "—"}</td>
                    <td className="py-4 px-2 font-medium text-gray-600">{cn.invoiceId ? invoiceMap[cn.invoiceId] || cn.invoiceId : "—"}</td>
                    <td className="py-4 px-2 text-gray-600">{new Date(cn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="py-4 px-2 text-gray-600 truncate max-w-[200px]" title={cn.reason}>{cn.reason}</td>
                    <td className="py-4 px-2">
                      <StatusBadge status={cn.status} />
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-gray-800">{formatCurrency(cn.amount)}</td>
                    <td className="py-4 px-4 text-center">
                      <button className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto" onClick={(e) => { e.stopPropagation(); toast.info("More actions"); }}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="py-16 text-center text-gray-500"><FileX2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />No credit notes found</td></tr>}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
            <div>Showing 1 to {filtered.length} of {creditNotes.length} credit notes</div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {selectedId && (() => {
        const selected = creditNotes.find(c => c.id === selectedId);
        if (!selected) return null;
        const selectedClient = clients.find(c => c.id === selected.clientId);
        return (
          <Card className="border-gray-200 shadow-xl rounded-xl sticky top-6 h-fit overflow-hidden bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[11px] text-gray-500 font-medium mb-1">Credit Note #</div>
                  <div className="text-sm font-bold text-blue-600 mb-2">{selected.creditNoteNumber}</div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-gray-900">{formatCurrency(selected.amount)}</div>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold text-gray-900">{selectedClient?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Related Invoice</span><span className="font-semibold text-gray-900">{selected.invoiceId ? invoiceMap[selected.invoiceId] || selected.invoiceId : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-900">{new Date(selected.date).toLocaleDateString()}</span></div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-xs">
                <div className="text-gray-500 font-medium mb-1">Reason for Credit</div>
                <div className="text-gray-900">{selected.reason}</div>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-10 font-semibold text-xs flex items-center justify-center gap-2" onClick={() => toast.success("Applying credit note...")}>
                  Apply Credit Note
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CreditNoteStatus }) {
  let style = "bg-gray-100 text-gray-600";
  let label = status.replace(/_/g, " ");

  if (status === "applied") style = "bg-emerald-100/60 text-emerald-700";
  else if (status === "refunded") style = "bg-blue-100/60 text-blue-700";
  else if (status === "draft") style = "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wide ${style}`}>
      {label}
    </span>
  );
}
