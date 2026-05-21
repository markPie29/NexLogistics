"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Clock3, Download, FileBarChart2, Filter, Truck, Wallet, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const REPORTS = [
  { id: "r-1", name: "Shipment Performance", description: "Transit times, on-time delivery rate, and exception trends." },
  { id: "r-2", name: "Invoice Aging", description: "Outstanding receivables grouped by aging buckets." },
  { id: "r-3", name: "Document Compliance", description: "Missing and expiring document checks by shipment." },
  { id: "r-4", name: "Support SLA", description: "Ticket resolution and first response time metrics." },
];

export default function ClientPortalReportsPage() {
  const shipments = useClientPortalStore((s) => s.shipments);
  const invoices = useClientPortalStore((s) => s.invoices);
  const exports = useClientPortalStore((s) => s.exports);
  const addReportExport = useClientPortalStore((s) => s.addReportExport);
  const [range, setRange] = useState("May 16 - May 31, 2024");
  const [selected, setSelected] = useState<{ name: string; format: "CSV" | "PDF" } | null>(null);

  const totals = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === "delivered").length;
    const inTransit = shipments.filter((s) => s.status === "in_transit").length;
    const pending = shipments.filter((s) => s.status === "pending").length;
    const exception = shipments.filter((s) => s.status === "exception").length;
    const totalSpend = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const onTimeRate = total === 0 ? 0 : (delivered / total) * 100;
    return { total, delivered, inTransit, pending, exception, totalSpend, onTimeRate };
  }, [shipments, invoices]);

  const lanes = useMemo(() => {
    const map = new Map<string, { origin: string; destination: string; count: number }>();
    for (const shipment of shipments) {
      const key = `${shipment.origin}|${shipment.destination}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { origin: shipment.origin, destination: shipment.destination, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [shipments]);

  const generate = (name: string, format: "CSV" | "PDF") => {
    addReportExport(name, format);
    toast.success(`${name} generated as ${format}`);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 rounded-md border border-gray-200 px-3 text-xs">
          <option>May 16 - May 31, 2024</option>
          <option>May 1 - May 15, 2024</option>
          <option>Apr 16 - Apr 30, 2024</option>
        </select>
        <Button variant="outline" className="h-9 text-xs" onClick={() => toast.success("Filter drawer opened")}>
          <Filter className="w-3.5 h-3.5 mr-1.5" /> Filters
        </Button>
        <Button variant="outline" className="h-9 text-xs" onClick={() => toast.success("Preparing consolidated report export") }>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Total Shipments" value={totals.total} trend="+18.6%" icon={Truck} iconColor="text-blue-600" />
        <KpiCard title="Delivered Shipments" value={totals.delivered} trend="+22.1%" icon={Truck} iconColor="text-emerald-600" />
        <KpiCard title="On-Time Delivery" value={`${totals.onTimeRate.toFixed(1)}%`} trend="+4.7%" icon={Clock3} iconColor="text-violet-600" />
        <KpiCard title="Exception Shipments" value={totals.exception} trend="0%" icon={AlertTriangle} iconColor="text-amber-600" />
        <KpiCard title="Total Spend" value={formatCurrency(totals.totalSpend)} trend="+15.8%" icon={Wallet} iconColor="text-cyan-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1.2fr_1.2fr] gap-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold">Shipments Trend</CardTitle>
            <select className="h-8 rounded-md border border-gray-200 px-2 text-xs" onChange={() => toast.success("Trend interval changed") }>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </CardHeader>
          <CardContent className="p-4">
            <TrendChart />
          </CardContent>
        </Card>

        <DonutCard
          title="Shipments by Status"
          segments={[
            { label: "Delivered", value: totals.delivered, color: "#059669" },
            { label: "In Transit", value: totals.inTransit, color: "#3B82F6" },
            { label: "Pending", value: totals.pending, color: "#7C3AED" },
            { label: "Exception", value: totals.exception, color: "#DC2626" },
          ]}
          total={totals.total}
        />

        <DonutCard
          title="Shipments by Mode"
          segments={[
            { label: "Ground", value: Math.max(1, Math.round(totals.total * 0.68)), color: "#1E3A8A" },
            { label: "Air", value: Math.max(1, Math.round(totals.total * 0.17)), color: "#0F766E" },
            { label: "Ocean", value: Math.max(1, Math.round(totals.total * 0.15)), color: "#F59E0B" },
          ]}
          total={totals.total}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr_1.4fr] gap-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold">Top Lanes (by Shipments)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-gray-100 text-gray-600">
                  <th className="py-3 px-4">Origin</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Shipments</th>
                  <th className="py-3 px-4">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {lanes.map((lane, idx) => (
                  <tr key={`${lane.origin}-${lane.destination}`} className="border-b border-gray-50">
                    <td className="py-3 px-4 text-gray-700 font-medium">{lane.origin}</td>
                    <td className="py-3 px-4 text-gray-700">{lane.destination}</td>
                    <td className="py-3 px-4 text-gray-700">{lane.count}</td>
                    <td className="py-3 px-4 text-gray-700">{((lane.count / Math.max(1, totals.total)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {lanes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-gray-500">No lane data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100">
              <button className="text-xs font-semibold text-[#0E7490] hover:underline" onClick={() => toast.success("Opening full lane report")}>View all lanes report</button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold">On-Time Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#059669 ${totals.onTimeRate}%, #E5E7EB ${totals.onTimeRate}% 100%)` }}>
              <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-extrabold text-[#0B1220] tracking-tight">{totals.onTimeRate.toFixed(1)}%</div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium px-2 leading-tight mt-1">On-Time Delivery</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="On-Time" value={`${totals.delivered}`} />
              <Row label="Late" value={`${Math.max(0, totals.total - totals.delivered)}`} />
              <Row label="On-Time Goal" value="90.0%" />
            </div>
            <button className="text-xs font-semibold text-[#0E7490] hover:underline" onClick={() => toast.success("Opening performance report")}>View performance report</button>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {REPORTS.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-50">
                <div>
                  <div className="text-xs font-semibold text-[#0B1220]">{r.name}</div>
                  <div className="text-[11px] text-gray-500">{r.description}</div>
                </div>
                <Button variant="ghost" className="h-8 px-2" onClick={() => setSelected({ name: r.name, format: "PDF" })}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {exports.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-50">
                <div>
                  <div className="text-xs font-semibold text-[#0B1220]">{e.reportName}</div>
                  <div className="text-[11px] text-gray-500">Generated {new Date(e.generatedAt).toLocaleString()}</div>
                </div>
                <Button variant="ghost" className="h-8 px-2" onClick={() => toast.success(`Downloading ${e.reportName}`)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1220]">Generate Report</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-xs text-gray-600">Generate <span className="font-semibold text-[#0B1220]">{selected.name}</span> as <span className="font-semibold text-[#0B1220]">{selected.format}</span> and add it to export history?</div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setSelected(null)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={() => generate(selected.name, selected.format)}><FileBarChart2 className="w-3.5 h-3.5 mr-1.5" />Generate</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, trend, icon: Icon, iconColor }: { title: string; value: string | number; trend: string; icon: React.ComponentType<{ className?: string }>; iconColor: string }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-[#0B1220] mt-1">{value}</div>
        <div className="text-[11px] text-emerald-600 font-semibold mt-1">{trend}</div>
      </CardContent>
    </Card>
  );
}

function TrendChart() {
  return (
    <svg viewBox="0 0 760 220" className="w-full h-[220px]">
      <line x1="20" y1="200" x2="740" y2="200" stroke="#E5E7EB" />
      <line x1="20" y1="20" x2="20" y2="200" stroke="#E5E7EB" />
      <polyline fill="none" stroke="#2563EB" strokeWidth="3" points="20,150 80,120 140,140 200,110 260,90 320,105 380,100 440,92 500,84 560,115 620,130 700,105" />
      <polyline fill="none" stroke="#059669" strokeWidth="3" points="20,175 80,160 140,150 200,140 260,125 320,130 380,124 440,118 500,132 560,120 620,140 700,125" />
      <polyline fill="none" stroke="#DC2626" strokeWidth="3" points="20,190 80,185 140,188 200,180 260,184 320,179 380,182 440,176 500,178 560,181 620,175 700,180" />
    </svg>
  );
}

function DonutCard({ title, segments, total }: { title: string; segments: Array<{ label: string; value: number; color: string }>; total: number }) {
  const circle = useMemo(() => {
    let progress = 0;
    const pieces: string[] = [];
    for (const segment of segments) {
      const ratio = total === 0 ? 0 : (segment.value / total) * 100;
      pieces.push(`${segment.color} ${progress}% ${progress + ratio}%`);
      progress += ratio;
    }
    if (progress < 100) pieces.push(`#E5E7EB ${progress}% 100%`);
    return `conic-gradient(${pieces.join(", ")})`;
  }, [segments, total]);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center" style={{ background: circle }}>
          <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
            <div className="text-3xl font-extrabold text-[#0B1220] tracking-tight">{total}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Total</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: segment.color }} />{segment.label}</div>
              <div className="font-semibold text-[#0B1220]">{segment.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#0B1220]">{value}</span>
    </div>
  );
}
