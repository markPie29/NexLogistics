"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, FileText, LifeBuoy, Receipt, Truck, X, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { formatCurrency } from "@/lib/utils";

export default function ClientPortalOverviewPage() {
  const shipments = useClientPortalStore((s) => s.shipments);
  const documents = useClientPortalStore((s) => s.documents);
  const invoices = useClientPortalStore((s) => s.invoices);
  const tickets = useClientPortalStore((s) => s.tickets);
  const [detailOpen, setDetailOpen] = useState<null | { type: "shipment" | "invoice" | "ticket" | "document"; id: string }>(null);

  const stats = useMemo(() => {
    const inTransit = shipments.filter((s) => s.status === "in_transit").length;
    const delivered = shipments.filter((s) => s.status === "delivered").length;
    const pending = shipments.filter((s) => s.status === "pending").length;
    const outstanding = invoices.filter((i) => i.balance > 0).reduce((sum, i) => sum + i.balance, 0);
    return { inTransit, delivered, pending, outstanding };
  }, [shipments, invoices]);

  const detailData = useMemo(() => {
    if (!detailOpen) return null;
    if (detailOpen.type === "shipment") return shipments.find((x) => x.id === detailOpen.id);
    if (detailOpen.type === "invoice") return invoices.find((x) => x.id === detailOpen.id);
    if (detailOpen.type === "ticket") return tickets.find((x) => x.id === detailOpen.id);
    return documents.find((x) => x.id === detailOpen.id);
  }, [detailOpen, shipments, invoices, tickets, documents]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Kpi title="Total Shipments" value={shipments.length} color="text-blue-600" />
        <Kpi title="In Transit" value={stats.inTransit} color="text-emerald-600" />
        <Kpi title="Delivered" value={stats.delivered} color="text-amber-600" />
        <Kpi title="Pending" value={stats.pending} color="text-violet-600" />
        <Kpi title="Outstanding" value={formatCurrency(stats.outstanding, "PHP")} color="text-[#0B1220]" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Recent Shipments</CardTitle>
            <Button asChild variant="ghost" className="h-8 text-xs"><Link href="/client-portal/shipments">View All <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-100">
                  <th className="py-3 px-4">Tracking</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">ETA</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 4).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-semibold text-[#0B1220]">{s.trackingNumber}</td>
                    <td className="py-3 px-4 text-gray-600">{s.origin}{" -> "}{s.destination}</td>
                    <td className="py-3 px-4"><StatusBadge status={s.status} /></td>
                    <td className="py-3 px-4 text-gray-600">{new Date(s.eta).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" className="h-8 px-2" onClick={() => setDetailOpen({ type: "shipment", id: s.id })}><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <QuickLink href="/client-portal/documents" icon={FileText} label="Documents" count={`${documents.length} files`} />
            <QuickLink href="/client-portal/invoices" icon={Receipt} label="Invoices" count={`${invoices.length} records`} />
            <QuickLink href="/client-portal/support" icon={LifeBuoy} label="Support" count={`${tickets.length} tickets`} />
            <QuickLink href="/client-portal/shipments" icon={Truck} label="Shipments" count={`${shipments.length} active records`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <MiniTable
          title="Documents"
          viewHref="/client-portal/documents"
          rows={documents.slice(0, 4).map((d) => ({
            id: d.id,
            primary: d.name,
            secondary: `Uploaded ${new Date(d.uploadedAt).toLocaleDateString()}`,
            badge: d.isNew ? "New" : d.type,
            badgeClass: d.isNew ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
            detailType: "document" as const,
          }))}
          onDetail={(id) => setDetailOpen({ type: "document", id })}
        />

        <MiniTable
          title="Invoices"
          viewHref="/client-portal/invoices"
          rows={invoices.slice(0, 4).map((i) => ({
            id: i.id,
            primary: i.invoiceNumber,
            secondary: `Due ${new Date(i.dueDate).toLocaleDateString()}`,
            badge: i.status,
            badgeClass: i.status === "paid" ? "bg-emerald-100 text-emerald-700" : i.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
            detailType: "invoice" as const,
          }))}
          onDetail={(id) => setDetailOpen({ type: "invoice", id })}
        />

        <MiniTable
          title="Support Tickets"
          viewHref="/client-portal/support"
          rows={tickets.slice(0, 4).map((t) => ({
            id: t.id,
            primary: t.id.toUpperCase(),
            secondary: t.subject,
            badge: t.status,
            badgeClass: t.status === "resolved" ? "bg-emerald-100 text-emerald-700" : t.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
            detailType: "ticket" as const,
          }))}
          onDetail={(id) => setDetailOpen({ type: "ticket", id })}
        />
      </div>

      {detailOpen && detailData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1220]">Detail View</h3>
              <button onClick={() => setDetailOpen(null)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-xs text-gray-700 max-h-[70vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-3">{JSON.stringify(detailData, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="text-[11px] font-semibold text-gray-500">{title}</div>
        <div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "delivered"
    ? "bg-emerald-100 text-emerald-700"
    : status === "in_transit"
      ? "bg-blue-100 text-blue-700"
      : status === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return <Badge className={`text-[10px] font-bold uppercase ${cls}`}>{status.replaceAll("_", " ")}</Badge>;
}

function QuickLink({ href, icon: Icon, label, count }: { href: string; icon: LucideIcon; label: string; count: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Icon className="w-4 h-4 text-gray-600" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-[#0B1220]">{label}</div>
        <div className="text-[11px] text-gray-500">{count}</div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
    </Link>
  );
}

function MiniTable({ title, viewHref, rows, onDetail }: {
  title: string;
  viewHref: string;
  rows: Array<{ id: string; primary: string; secondary: string; badge: string; badgeClass: string; detailType: "document" | "invoice" | "ticket" }>;
  onDetail: (id: string) => void;
}) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <Button asChild variant="ghost" className="h-8 text-xs"><Link href={viewHref}>View All <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
      </CardHeader>
      <CardContent className="p-0">
        {rows.map((row) => (
          <button key={row.id} onClick={() => onDetail(row.id)} className="w-full text-left p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#0B1220] truncate">{row.primary}</div>
                <div className="text-[11px] text-gray-500 truncate">{row.secondary}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.badgeClass}`}>{row.badge}</span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
