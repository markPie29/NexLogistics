"use client";
import { useState, useMemo } from "react";
import { Handshake, Search, Download, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePartnerStore, useTripStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/utils/csv";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { toast } from "sonner";
import type { PartnerPayoutStatus } from "@/lib/types";

const PAYOUT_VARIANT: Record<PartnerPayoutStatus, any> = {
  pending: "warning",
  paid: "success",
};

export default function PayablesPage() {
  const partners = usePartnerStore((s) => s.partners);
  const trips = useTripStore((s) => s.trips);
  const updateTrip = useTripStore((s) => s.updateTrip);

  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [payoutFilter, setPayoutFilter] = useState<"all" | PartnerPayoutStatus>("all");

  // Only trips with a partnerId that are completed/delivered
  const partnerTrips = useMemo(() =>
    trips.filter((t) => t.partnerId && (t.status === "completed" || t.status === "delivered" || t.status === "in_transit" || t.status === "loaded")),
    [trips]
  );

  const filtered = useMemo(() => {
    return partnerTrips.filter((t) => {
      if (partnerFilter !== "all" && t.partnerId !== partnerFilter) return false;
      if (payoutFilter !== "all" && t.partnerPayoutStatus !== payoutFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const partner = partners.find((p) => p.id === t.partnerId);
        if (!t.id.toLowerCase().includes(q) &&
          !(t.documentNo?.toLowerCase().includes(q)) &&
          !(partner?.name.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [partnerTrips, partnerFilter, payoutFilter, search, partners]);

  const kpi = useMemo(() => {
    const pending = partnerTrips.filter((t) => t.partnerPayoutStatus === "pending");
    const paid = partnerTrips.filter((t) => t.partnerPayoutStatus === "paid");
    const pendingAmt = pending.reduce((a, t) => {
      const p = partners.find((x) => x.id === t.partnerId);
      return a + computePayout(t.distanceKm, p?.defaultRate, p?.ratePerKm);
    }, 0);
    const paidAmt = paid.reduce((a, t) => {
      const p = partners.find((x) => x.id === t.partnerId);
      return a + computePayout(t.distanceKm, p?.defaultRate, p?.ratePerKm);
    }, 0);
    return { total: partnerTrips.length, pending: pending.length, pendingAmt, paid: paid.length, paidAmt };
  }, [partnerTrips, partners]);

  const markPaid = (tripId: string) => {
    updateTrip(tripId, { partnerPayoutStatus: "paid", partnerPayoutAt: new Date().toISOString() });
    toast.success("Marked as paid");
  };

  const exportPartnerStatement = (partnerId: string) => {
    const p = partners.find((x) => x.id === partnerId);
    if (!p) return;
    const rows = partnerTrips
      .filter((t) => t.partnerId === partnerId)
      .map((t) => ({
        "Trip ID": t.id,
        "DR#": t.documentNo ?? "",
        "Date": new Date(t.createdAt).toLocaleDateString(),
        "Route": `${t.pickup.address} → ${t.dropoff.address}`,
        "Distance (km)": t.distanceKm,
        "Status": t.status,
        "Payout Amount": computePayout(t.distanceKm, p.defaultRate, p.ratePerKm),
        "Payout Status": t.partnerPayoutStatus ?? "pending",
        "Paid At": t.partnerPayoutAt ? new Date(t.partnerPayoutAt).toLocaleDateString() : "",
      }));
    exportToCsv(`payables-${p.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported statement for ${p.name}`);
  };

  const exportAll = () => {
    const rows = filtered.map((t) => {
      const p = partners.find((x) => x.id === t.partnerId);
      return {
        "Partner": p?.name ?? "—",
        "Trip ID": t.id,
        "DR#": t.documentNo ?? "",
        "Date": new Date(t.createdAt).toLocaleDateString(),
        "Route": `${t.pickup.address} → ${t.dropoff.address}`,
        "Distance (km)": t.distanceKm,
        "Trip Status": t.status,
        "Payout Amount": computePayout(t.distanceKm, p?.defaultRate, p?.ratePerKm),
        "Payout Status": t.partnerPayoutStatus ?? "pending",
        "Paid At": t.partnerPayoutAt ? new Date(t.partnerPayoutAt).toLocaleDateString() : "",
      };
    });
    exportToCsv(`subcon-payables-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success("Exported all payables");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcon Payables"
        subtitle="Track and manage payments owed to subcontractor partners"
        breadcrumbs={[{ label: "Finance" }, { label: "Billing & Invoices", href: "/billing" }, { label: "Subcon Payables" }]}
        actions={
          <Button size="sm" variant="outline" onClick={exportAll}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Partner Trips" value={kpi.total} icon={Handshake} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" />
        <KpiCard label="Pending Payout" value={kpi.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel={formatCurrency(kpi.pendingAmt)} />
        <KpiCard label="Paid Out" value={kpi.paid} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" footerLabel={formatCurrency(kpi.paidAmt)} />
        <KpiCard label="Total Payable" value={formatCurrency(kpi.pendingAmt + kpi.paidAmt)} icon={DollarSign} iconColor="text-sky-600" iconBg="bg-sky-50" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by trip ID, DR#, partner…" className="pl-10" />
          </div>
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All Partners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={payoutFilter} onValueChange={(v: any) => setPayoutFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Per-partner sections */}
      {partners
        .filter((p) => partnerFilter === "all" || p.id === partnerFilter)
        .map((p) => {
          const pRows = filtered.filter((t) => t.partnerId === p.id);
          if (pRows.length === 0) return null;
          const pendingAmt = pRows
            .filter((t) => t.partnerPayoutStatus === "pending")
            .reduce((a, t) => a + computePayout(t.distanceKm, p.defaultRate, p.ratePerKm), 0);
          return (
            <Card key={p.id} className="border-brand-border">
              <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border/60 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-brand-teal" />
                  <span className="font-bold text-brand-navy">{p.name}</span>
                  {pendingAmt > 0 && (
                    <Badge variant="warning">{formatCurrency(pendingAmt)} pending</Badge>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => exportPartnerStatement(p.id)}>
                  <Download className="w-3.5 h-3.5" /> Statement
                </Button>
              </div>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                      <th className="py-3 px-4 font-medium">Trip ID</th>
                      <th className="py-3 px-4 font-medium">DR#</th>
                      <th className="py-3 px-4 font-medium">Route</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Dist.</th>
                      <th className="py-3 px-4 font-medium text-right">Payout</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium w-28"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pRows.map((t) => {
                      const payout = computePayout(t.distanceKm, p.defaultRate, p.ratePerKm);
                      return (
                        <tr key={t.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-brand-teal">{t.id}</td>
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{t.documentNo ?? "—"}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground max-w-[180px] truncate">
                            {t.pickup.address.split(",")[0]} → {t.dropoff.address.split(",")[0]}
                          </td>
                          <td className="py-3 px-4 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-xs">{t.distanceKm} km</td>
                          <td className="py-3 px-4 text-right font-bold">{formatCurrency(payout)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={PAYOUT_VARIANT[t.partnerPayoutStatus ?? "pending"]}>
                              {t.partnerPayoutStatus ?? "pending"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {t.partnerPayoutStatus !== "paid" && (t.status === "completed" || t.status === "delivered") && (
                              <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => markPaid(t.id)}>
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Handshake className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          No payable records found
        </div>
      )}
    </div>
  );
}

function computePayout(distanceKm: number, defaultRate?: number, ratePerKm?: number): number {
  if (defaultRate && defaultRate > 0) return defaultRate;
  if (ratePerKm && ratePerKm > 0) return Math.round(distanceKm * ratePerKm);
  return 0;
}
