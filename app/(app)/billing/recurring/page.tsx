"use client";
import { useMemo, useState } from "react";
import {
  RefreshCw, Search, Plus, MoreHorizontal, Play, Pause, ChevronDown,
  Calendar, DollarSign, Download, SlidersHorizontal, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useRecurringInvoiceStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { RecurringStatus, RecurringFrequency } from "@/lib/types";

import { CreateRecurringModal } from "@/components/billing/CreateRecurringModal";

const TAB_FILTERS: Array<{ key: RecurringStatus | "all"; label: string }> = [
  { key: "all", label: "All Schedules" },
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
  
  const [modalOpen, setModalOpen] = useState(false);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    return recurring.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (clientMap[r.clientId] || "").toLowerCase().includes(q) || r.templateItems.some((t) => t.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [recurring, tab, search, clientMap]);

  const stats = useMemo(() => ({
    total: recurring.length,
    active: recurring.filter((r) => r.status === "active").length,
    monthlyRevenue: recurring.filter((r) => r.status === "active").reduce((s, r) => {
      const multiplier = r.frequency === "weekly" ? 4 : r.frequency === "monthly" ? 1 : r.frequency === "quarterly" ? 1 / 3 : 1 / 12;
      return s + r.amount * multiplier;
    }, 0),
    totalGenerated: recurring.reduce((s, r) => s + r.totalGenerated, 0),
  }), [recurring]);

  const toggleStatus = (id: string, current: RecurringStatus) => {
    const next = current === "active" ? "paused" : "active";
    updateRecurring(id, { status: next });
    toast.success(`Recurring schedule ${next}`);
  };

  return (
    <div className="space-y-6">
      <CreateRecurringModal open={modalOpen} onOpenChange={setModalOpen} />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Recurring Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Automate invoice generation on a recurring schedule.</p>
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
          <Button onClick={() => setModalOpen(true)} className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-3 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> New Recurring <ChevronDown className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Schedules" value={stats.total} icon={RefreshCw} iconColor="text-blue-500" iconBg="bg-blue-50" trend={10.2} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Active" value={stats.active} icon={Play} iconColor="text-emerald-500" iconBg="bg-emerald-50" trend={5.5} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Est. Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={DollarSign} iconColor="text-amber-500" iconBg="bg-amber-50" trend={8.1} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Total Generated" value={stats.totalGenerated} icon={Calendar} iconColor="text-purple-500" iconBg="bg-purple-50" trend={14.3} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="flex items-center gap-6 px-5 pt-3 flex-wrap border-b border-gray-100">
            {TAB_FILTERS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`pb-3 text-xs font-semibold border-b-2 transition-all ${tab === t.key ? "border-[#008A56] text-[#008A56]" : "border-transparent text-gray-500 hover:text-[#0B1220]"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer or description..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
              </div>
              <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                All Customers <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
              </Button>
              <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                All Frequency <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
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

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-gray-50/30">
            {filtered.map((r) => (
              <Card key={r.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl bg-white overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-extrabold text-gray-900 text-sm mb-1">{clientMap[r.clientId] || "—"}</div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                          {FREQ_LABEL[r.frequency]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#008A56]">{formatCurrency(r.amount)}</div>
                      <div className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wide">per {r.frequency === "weekly" ? "week" : r.frequency}</div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-5">
                    {r.templateItems.map((item, i) => (
                      <div key={i} className="text-xs flex justify-between">
                        <span className="text-gray-600 truncate max-w-[65%]">{item.description}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-gray-100 mb-4" />

                  <div className="grid grid-cols-3 gap-3 text-[11px] mb-5">
                    <div>
                      <div className="text-gray-500 font-medium mb-1">Next Invoice</div>
                      <div className="font-semibold text-gray-900">{new Date(r.nextDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium mb-1">Last Generated</div>
                      <div className="font-semibold text-gray-900">{r.lastGenerated ? new Date(r.lastGenerated).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium mb-1">Generated</div>
                      <div className="font-semibold text-gray-900">{r.totalGenerated} <span className="font-normal text-gray-500">inv.</span></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {r.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className={`flex-1 h-8 text-xs font-semibold shadow-sm border-gray-200 ${r.status === "active" ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-[#008A56] hover:text-[#007045] hover:bg-emerald-50"}`}
                        onClick={() => toggleStatus(r.id, r.status)}>
                        {r.status === "active" ? <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume</>}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="w-8 h-8 p-0 border-gray-200 text-gray-500 shadow-sm" onClick={() => toast.info("View details")}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-1 md:col-span-2 xl:col-span-3 py-16 text-center text-gray-500">
                <RefreshCw className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                No recurring schedules found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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

