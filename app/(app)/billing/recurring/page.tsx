"use client";
import { useMemo, useState } from "react";
import {
  RefreshCw, Search, Plus, MoreHorizontal, Play, Pause, ChevronDown, X,
  Calendar, DollarSign, Download, SlidersHorizontal, Filter, MapPin, Phone
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useRecurringInvoiceStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { RecurringStatus, RecurringFrequency } from "@/lib/types";

import { CreateRecurringModal } from "@/components/billing/CreateRecurringModal";

const TAB_FILTERS: Array<{ key: RecurringStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "cancelled", label: "Cancelled" },
];

const FREQ_LABEL: Record<RecurringFrequency, string> = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };

export default function RecurringInvoicesPage() {
  const recurring = useRecurringInvoiceStore((s) => s.recurring);
  const updateRecurring = useRecurringInvoiceStore((s) => s.updateRecurring);
  const clients = useClientStore((s) => s.clients);
  const [tab, setTab] = useState<RecurringStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    return recurring.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (customerFilter !== "all" && r.clientId !== customerFilter) return false;
      if (frequencyFilter !== "all" && r.frequency !== frequencyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (clientMap[r.clientId] || "").toLowerCase().includes(q) ||
          r.templateItems.some((t) => t.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [recurring, tab, search, clientMap, customerFilter, frequencyFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const stats = useMemo(() => ({
    total: recurring.length,
    active: recurring.filter((r) => r.status === "active").length,
    paused: recurring.filter((r) => r.status === "paused").length,
    cancelled: recurring.filter((r) => r.status === "cancelled").length,
    monthlyProjected: recurring.filter((r) => r.status === "active").reduce((s, r) => {
      const multiplier = r.frequency === "weekly" ? 4 : r.frequency === "monthly" ? 1 : r.frequency === "quarterly" ? 1 / 3 : 1 / 12;
      return s + r.amount * multiplier;
    }, 0),
  }), [recurring]);

  const selected = selectedId ? recurring.find((r) => r.id === selectedId) : null;

  const toggleStatus = (id: string, current: RecurringStatus) => {
    const next = current === "active" ? "paused" : "active";
    updateRecurring(id, { status: next });
    toast.success(`Recurring schedule ${next}`);
  };

  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-6">
      <CreateRecurringModal open={modalOpen} onOpenChange={setModalOpen} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage automated recurring invoices for your customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">1</span>
          <Button variant="outline" className="h-9 px-3 text-xs border-gray-300" onClick={() => toast.info("Notification center")}>
            <span className="text-red-500 font-bold text-lg">•</span>
          </Button>
          <Button variant="outline" className="h-9 px-3 text-xs border-gray-300" onClick={() => toast.info("Messages")}>
            <span className="text-green-500 font-bold text-lg">•</span>
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Create Recurring Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Recurring Invoices" value={stats.total} icon={RefreshCw} iconColor="text-blue-500" iconBg="bg-blue-50" trend={9.1} trendLabel="↑ 9.1%" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Active" value={stats.active} icon={Play} iconColor="text-emerald-500" iconBg="bg-emerald-50" trend={8.6} trendLabel="↑ 8.6%" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Paused" value={stats.paused} icon={Pause} iconColor="text-orange-500" iconBg="bg-orange-50" trend={-14.3} trendLabel="↓ 14.3%" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Cancelled" value={stats.cancelled} icon={X} iconColor="text-purple-500" iconBg="bg-purple-50" trend={-20.0} trendLabel="↓ 20.0%" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="This Month (Projected)" value={formatCurrency(stats.monthlyProjected)} icon={DollarSign} iconColor="text-cyan-500" iconBg="bg-cyan-50" trend={11.7} trendLabel="↑ 11.7%" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main table area */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 px-6 pt-3 pb-2 border-b border-gray-200">
                {TAB_FILTERS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setCurrentPage(1); }}
                    className={`pb-3 text-xs font-semibold border-b-2 transition-all ${
                      tab === t.key
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-100">
                <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      placeholder="Search by name, customer, or reference..."
                      className="pl-9 h-9 text-xs border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-9 px-3 text-xs border-gray-300 font-medium text-gray-600 rounded-lg">
                    All Customer <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-gray-400" />
                  </Button>
                  <Button variant="outline" className="h-9 px-3 text-xs border-gray-300 font-medium text-gray-600 rounded-lg">
                    All Status <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-gray-400" />
                  </Button>
                  <Button variant="outline" className="h-9 px-3 text-xs border-gray-300 font-medium text-gray-600 rounded-lg">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> More Filters
                  </Button>
                  <Button variant="outline" className="h-9 px-3 text-xs border-gray-300 font-medium text-emerald-600 rounded-lg">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Invoice Name</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Reference</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Frequency</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Next Invoice Date</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Last Invoice Date</th>
                      <th className="text-left px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Next Amount</th>
                      <th className="text-center px-6 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedId === r.id ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-6 py-4 text-xs font-medium text-gray-900">{r.templateItems[0]?.description || "—"}</td>
                        <td className="px-6 py-4 text-xs text-gray-700">{clientMap[r.clientId] || "—"}</td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-600">{r.id}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-xs font-medium">{FREQ_LABEL[r.frequency]}</Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700">{new Date(r.nextDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-xs text-gray-700">
                          {r.lastGenerated ? new Date(r.lastGenerated).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-semibold text-gray-900">{formatCurrency(r.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("More options");
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paginated.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No recurring invoices found.
                </div>
              )}

              {filtered.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} recurring invoices</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden bg-white sticky top-6">
              <CardHeader className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Recurring Invoice Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Recurring Invoice #</div>
                  <div className="text-sm font-bold text-gray-900">{selected.id}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Invoice Template</div>
                  <div className="text-sm font-medium text-gray-900 mb-2">{selected.templateItems[0]?.description}</div>
                  <StatusBadge status={selected.status} />
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-1">Customer</div>
                  <div className="text-sm font-semibold text-gray-900">{clientMap[selected.clientId] || "—"}</div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-3">Frequency</div>
                  <div className="text-sm font-semibold text-gray-900 mb-3">{FREQ_LABEL[selected.frequency]}</div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Next Invoice Date</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(selected.nextDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Last Invoice Date</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selected.lastGenerated ? new Date(selected.lastGenerated).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-1">Start Date</div>
                    <div className="text-sm font-semibold text-gray-900">{new Date(selected.nextDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-1">End Date</div>
                    <div className="text-sm font-semibold text-gray-900">Dec 31, 2024</div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Next Amount</div>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(selected.amount)}</div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Invoice Template</div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Standard Freight Invoice</div>
                  <div className="text-xs text-gray-500">Net 15</div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Payment Terms</div>
                  <div className="text-xs font-medium text-gray-600">Net 15</div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-xs font-semibold"
                    onClick={() => {
                      toast.info("View next invoice");
                    }}
                  >
                    View Next Invoice
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-9 text-xs font-semibold">
                    Pause
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cancel Recurring Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RecurringStatus }) {
  let style = "bg-gray-100 text-gray-600";
  let label = status.replace(/_/g, " ");

  if (status === "active") style = "bg-emerald-100/60 text-emerald-700";
  else if (status === "paused") style = "bg-amber-100/60 text-amber-700";
  else if (status === "cancelled") style = "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
}

