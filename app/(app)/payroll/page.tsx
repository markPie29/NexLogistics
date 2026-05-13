"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Wallet, AlertCircle, CheckCircle2, Plus, Plug, Users, Receipt,
  PiggyBank, BadgePercent, Truck, ArrowRight, Eye, Trash2, Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useDriverStore,
  useTripStore,
  useTripRateStore,
  useDriverPayrollProfileStore,
  useIncentiveStore,
  useDeductionStore,
  usePayrollPeriodStore,
} from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { toast } from "sonner";
import type { PayrollMode, RateType, IncentiveType, DeductionType, DistanceTier } from "@/lib/types";

const PAYROLL_MODE_LABEL: Record<PayrollMode, string> = {
  fixed_salary: "Fixed Salary",
  fixed_plus_trip: "Hybrid (Base + Trip)",
  per_trip: "Per Trip Only",
  per_delivery: "Per Delivery",
  percentage: "Commission %",
};
const RATE_TYPE_LABEL: Record<RateType, string> = {
  fixed: "Fixed Route Rate",
  per_km: "Per Kilometer",
  per_delivery: "Per Delivery",
  percentage: "Commission %",
  per_ton: "Per Ton",
  per_unit: "Per Unit",
};
const INCENTIVE_LABEL: Record<IncentiveType, string> = {
  on_time_delivery: "On-Time Delivery",
  fuel_efficiency: "Fuel Efficiency",
  extra_stop: "Extra Stop",
  holiday_trip: "Holiday Trip",
  excellent_rating: "Excellent Rating",
  safety_bonus: "Safety Bonus",
  other: "Other",
};
const DEDUCTION_LABEL: Record<DeductionType, string> = {
  cash_advance: "Cash Advance",
  fuel_shortage: "Fuel Shortage",
  late_delivery: "Late Delivery",
  vehicle_damage: "Vehicle Damage",
  violation: "Violation",
  uniform: "Uniform",
  sss: "SSS",
  philhealth: "PhilHealth",
  pagibig: "Pag-IBIG",
  tax: "Withholding Tax",
  other: "Other",
};
const PERIOD_STATUS_VARIANT: Record<string, any> = {
  draft: "neutral",
  computing: "info",
  ready_for_review: "warning",
  approved: "info",
  paid: "success",
  closed: "neutral",
};

export default function PayrollHubPage() {
  const trips = useTripStore((s) => s.trips);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const deletePeriod = usePayrollPeriodStore((s) => s.deletePeriod);
  const incentives = useIncentiveStore((s) => s.incentives);
  const deductions = useDeductionStore((s) => s.deductions);
  const allDrivers = useDriverStore((s) => s.drivers);

  const kpi = useMemo(() => {
    const paid = summaries.filter((s) => s.status === "paid").reduce((a, b) => a + b.netPay, 0);
    const pendingApproval = trips.filter((t) => (t.status === "completed" || t.status === "delivered") && (!t.approvalStatus || t.approvalStatus === "pending")).length;
    const activePeriod = periods.find((p) => p.status === "draft" || p.status === "ready_for_review");
    const driversPaid = new Set(summaries.filter((s) => s.status === "paid").map((s) => s.driverId)).size;
    const tripEarnings = summaries.reduce((a, b) => a + b.tripEarnings, 0);
    const totalIncentives = incentives.reduce((a, b) => a + b.amount, 0);
    const totalDeductions = deductions.filter((d) => d.status === "applied").reduce((a, b) => a + b.amount, 0);
    return { paid, pendingApproval, activePeriod, driversPaid, tripEarnings, totalIncentives, totalDeductions };
  }, [summaries, trips, periods, incentives, deductions]);

  // Top earners from paid summaries
  const topEarners = useMemo(() => {
    const byDriver: Record<string, number> = {};
    summaries.filter((s) => s.status === "paid").forEach((s) => {
      byDriver[s.driverId] = (byDriver[s.driverId] ?? 0) + s.netPay;
    });
    return Object.entries(byDriver)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([driverId, total]) => ({ driver: allDrivers.find((d) => d.id === driverId), total }));
  }, [summaries, allDrivers]);

  const maxEarning = topEarners[0]?.total ?? 1;

  // Incentive distribution by type
  const incentiveDistro = useMemo(() => {
    const byType: Record<string, number> = {};
    incentives.forEach((i) => { byType[i.type] = (byType[i.type] ?? 0) + i.amount; });
    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxAmt = sorted[0]?.[1] ?? 1;
    return sorted.map(([type, amount]) => ({ type, amount, pct: (amount / maxAmt) * 100 }));
  }, [incentives]);

  // Most expensive routes from trip payrolls
  const tripPayrolls = usePayrollPeriodStore((s) => s.tripPayrolls);
  const expensiveRoutes = useMemo(() => {
    const byRoute: Record<string, { total: number; count: number }> = {};
    tripPayrolls.forEach((tp) => {
      const t = trips.find((x) => x.id === tp.tripId);
      if (!t) return;
      const key = `${t.pickup.address.split(",")[0]} → ${t.dropoff.address.split(",")[0]}`;
      byRoute[key] = { total: (byRoute[key]?.total ?? 0) + tp.finalAmount, count: (byRoute[key]?.count ?? 0) + 1 };
    });
    const sorted = Object.entries(byRoute).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
    const maxAmt = sorted[0]?.[1].total ?? 1;
    return sorted.map(([route, { total, count }]) => ({ route, total, count, pct: (total / maxAmt) * 100 }));
  }, [tripPayrolls, trips]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Philippine logistics per-trip payroll · trips · incentives · deductions · payslips"
        breadcrumbs={[{ label: "Finance" }, { label: "Payroll" }]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/payroll/run"><Plus className="w-4 h-4" /> New Payroll Run</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Payroll" value={formatCurrency(kpi.paid)} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineColor="#10B981" sparklineData={[8, 10, 12, 14, 16, 18, 20, 22]} />
        <KpiCard label="Pending Approval" value={kpi.pendingApproval} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineColor="#F59E0B" sparklineData={[2, 3, 3, 4, 5, 6, 7, kpi.pendingApproval]} />
        <KpiCard label="Drivers Paid" value={kpi.driversPaid} icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50" sparklineColor="#7C3AED" sparklineData={[2, 3, 4, 4, 5, 5, 6, kpi.driversPaid]} />
        <KpiCard label="Trip Earnings" value={formatCurrency(kpi.tripEarnings)} icon={Truck} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineColor="#0EA5E9" sparklineData={[3, 5, 6, 8, 10, 11, 12, 14]} />
        <KpiCard label="Total Incentives" value={formatCurrency(kpi.totalIncentives)} icon={BadgePercent} iconColor="text-teal-600" iconBg="bg-teal-50" sparklineColor="#0D9488" sparklineData={[1, 2, 2, 3, 4, 4, 5, 6]} />
        <KpiCard label="Total Deductions" value={formatCurrency(kpi.totalDeductions)} icon={PiggyBank} iconColor="text-rose-600" iconBg="bg-rose-50" sparklineColor="#F43F5E" sparklineData={[1, 2, 2, 3, 3, 4, 4, 5]} />
      </div>

      {kpi.activePeriod && (
        <Card className="border-brand-teal/40 bg-gradient-to-r from-brand-teal-light/40 to-transparent">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-brand-teal" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-brand-teal font-bold">Active Payroll Period</div>
              <div className="font-bold text-brand-navy">{kpi.activePeriod.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                Pay Date: {kpi.activePeriod.payDate ? new Date(kpi.activePeriod.payDate).toLocaleDateString() : "TBD"} ·
                <Badge variant={PERIOD_STATUS_VARIANT[kpi.activePeriod.status]}>{kpi.activePeriod.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/payroll/${kpi.activePeriod.id}`}>Open Period <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Analytics: 4 Charts per spec ── */}
      {(topEarners.length > 0 || incentiveDistro.length > 0 || expensiveRoutes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Highest Earning Drivers */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-brand-navy mb-4">Highest Earning Drivers</h3>
              {topEarners.length > 0 ? (
                <div className="space-y-3">
                  {topEarners.map(({ driver, total }, idx) => (
                    <div key={driver?.id ?? idx} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{driver?.name ?? "Unknown"}</span>
                          <span className="font-bold text-brand-navy">{formatCurrency(total)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-teal rounded-full" style={{ width: `${(total / maxEarning) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground py-4 text-center">No paid payroll yet.</p>}
            </CardContent>
          </Card>

          {/* Chart 2: Payroll Trend */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-brand-navy mb-4">Payroll Trend</h3>
              <div className="space-y-2">
                {periods.slice(0, 5).map((p) => {
                  const ps = summaries.filter((s) => s.payrollPeriodId === p.id);
                  const net = ps.reduce((a, b) => a + b.netPay, 0);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-brand-border/60 last:border-0">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{ps.length} driver{ps.length !== 1 ? "s" : ""}</div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="font-bold text-brand-navy text-sm">{formatCurrency(net)}</div>
                        <Badge variant={PERIOD_STATUS_VARIANT[p.status]} className="text-[10px]">{p.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  );
                })}
                {periods.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No periods yet.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: Most Expensive Routes */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-brand-navy mb-4">Most Expensive Routes</h3>
              {expensiveRoutes.length > 0 ? (
                <div className="space-y-3">
                  {expensiveRoutes.map(({ route, total, count, pct }, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate text-xs">{route}</span>
                          <span className="font-bold text-brand-navy shrink-0 ml-2">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{count} trip{count !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground py-4 text-center">No trip payroll data yet.</p>}
            </CardContent>
          </Card>

          {/* Chart 4: Incentive Distribution */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-brand-navy mb-4">Incentive Distribution</h3>
              {incentiveDistro.length > 0 ? (
                <div className="space-y-3">
                  {incentiveDistro.map(({ type, amount, pct }) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-xs capitalize">{type.replace(/_/g, " ")}</span>
                          <span className="font-bold text-emerald-700">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground py-4 text-center">No incentives recorded yet.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="periods">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="periods"><Receipt className="w-4 h-4 mr-1.5" />Periods</TabsTrigger>
          <TabsTrigger value="rates"><Plug className="w-4 h-4 mr-1.5" />Trip Rates</TabsTrigger>
          <TabsTrigger value="profiles"><Users className="w-4 h-4 mr-1.5" />Driver Profiles</TabsTrigger>
          <TabsTrigger value="incentives"><BadgePercent className="w-4 h-4 mr-1.5" />Incentives</TabsTrigger>
          <TabsTrigger value="deductions"><PiggyBank className="w-4 h-4 mr-1.5" />Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                    <th className="py-3 px-4 font-medium">Period</th>
                    <th className="py-3 px-4 font-medium">Range</th>
                    <th className="py-3 px-4 font-medium text-right">Drivers</th>
                    <th className="py-3 px-4 font-medium text-right">Net Total</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => {
                    const ps = summaries.filter((x) => x.payrollPeriodId === p.id);
                    return (
                      <tr key={p.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-brand-navy">{p.name}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">{ps.length}</td>
                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(ps.reduce((a, b) => a + b.netPay, 0))}</td>
                        <td className="py-3 px-4"><Badge variant={PERIOD_STATUS_VARIANT[p.status]}>{p.status.replace("_", " ")}</Badge></td>
                        <td className="py-3 px-4 flex gap-1.5">
                          <Button size="sm" variant="ghost" asChild><Link href={`/payroll/${p.id}`}><Eye className="w-4 h-4" /></Link></Button>
                          {p.status === "draft" && (
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete period "${p.name}"?`)) deletePeriod(p.id); }}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {periods.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No payroll periods. Click "New Payroll Run" to start.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="mt-4"><TripRatesPanel /></TabsContent>
        <TabsContent value="profiles" className="mt-4"><DriverProfilesPanel /></TabsContent>
        <TabsContent value="incentives" className="mt-4"><IncentivesPanel /></TabsContent>
        <TabsContent value="deductions" className="mt-4"><DeductionsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function TripRatesPanel() {
  const rates = useTripRateStore((s) => s.rates);
  const addRate = useTripRateStore((s) => s.addRate);
  const updateRate = useTripRateStore((s) => s.updateRate);
  const deleteRate = useTripRateStore((s) => s.deleteRate);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", vehicleType: "Truck", routeOrigin: "*", routeDestination: "*",
    rateType: "fixed" as RateType, fixedRate: 2500, ratePerKm: 0, ratePerDelivery: 0, commissionPercent: 0,
    extraStopFee: 0, nightDifferentialPercent: 0, holidayMultiplier: 1.5,
    ratePerTon: 0, ratePerUnit: 0, dropoffZone: "", distanceTiers: [] as DistanceTier[],
  });

  const startNew = () => {
    setEditing(null);
    setForm({ name: "", vehicleType: "Truck", routeOrigin: "*", routeDestination: "*", rateType: "fixed", fixedRate: 2500, ratePerKm: 0, ratePerDelivery: 0, commissionPercent: 0, extraStopFee: 0, nightDifferentialPercent: 0, holidayMultiplier: 1.5, ratePerTon: 0, ratePerUnit: 0, dropoffZone: "", distanceTiers: [] });
    setOpen(true);
  };
  const startEdit = (id: string) => {
    const r = rates.find((x) => x.id === id);
    if (!r) return;
    setEditing(id);
    setForm({
      name: r.name, vehicleType: r.vehicleType, routeOrigin: r.routeOrigin, routeDestination: r.routeDestination,
      rateType: r.rateType, fixedRate: r.fixedRate ?? 0, ratePerKm: r.ratePerKm ?? 0, ratePerDelivery: r.ratePerDelivery ?? 0,
      commissionPercent: r.commissionPercent ?? 0, extraStopFee: r.extraStopFee ?? 0,
      nightDifferentialPercent: r.nightDifferentialPercent ?? 0, holidayMultiplier: r.holidayMultiplier ?? 1.5,
      ratePerTon: r.ratePerTon ?? 0, ratePerUnit: r.ratePerUnit ?? 0,
      dropoffZone: r.dropoffZone ?? "", distanceTiers: r.distanceTiers ?? [],
    });
    setOpen(true);
  };
  const save = () => {
    if (!form.name.trim()) { toast.error("Rate name is required"); return; }
    const payload = { ...form, active: true };
    const distanceTiers = form.distanceTiers.filter((t: DistanceTier) => t.maxKm > t.minKm);
    const finalPayload = { ...payload, distanceTiers: distanceTiers.length ? distanceTiers : undefined, dropoffZone: form.dropoffZone.trim() || undefined };
    if (editing) { updateRate(editing, finalPayload); toast.success("Trip rate updated"); }
    else { addRate(finalPayload); toast.success("Trip rate added"); }
    setOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-muted-foreground">Configure how drivers are paid per route, vehicle, and rate model.</p>
        <Button size="sm" onClick={startNew}><Plus className="w-4 h-4" /> Add Rate</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Rate Name</th>
                <th className="py-3 px-4 font-medium">Vehicle</th>
                <th className="py-3 px-4 font-medium">Route</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium w-28"></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4">{r.vehicleType}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{r.routeOrigin} → {r.routeDestination}</td>
                  <td className="py-3 px-4"><Badge variant="info">{RATE_TYPE_LABEL[r.rateType]}</Badge></td>
                  <td className="py-3 px-4 text-right font-bold">
                    {r.rateType === "fixed" && formatCurrency(r.fixedRate ?? 0)}
                    {r.rateType === "per_km" && `${formatCurrency(r.ratePerKm ?? 0)}/km`}
                    {r.rateType === "per_delivery" && `${formatCurrency(r.ratePerDelivery ?? 0)}/drop`}
                    {r.rateType === "percentage" && `${r.commissionPercent ?? 0}%`}
                    {r.rateType === "per_ton" && `${formatCurrency(r.ratePerTon ?? 0)}/ton`}
                    {r.rateType === "per_unit" && `${formatCurrency(r.ratePerUnit ?? 0)}/unit`}
                  </td>
                  <td className="py-3 px-4 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(r.id)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete rate?")) deleteRate(r.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Trip Rate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Rate Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Manila → Cebu · 10W" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Vehicle Type</Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Pickup">Pickup</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Trailer">Trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Origin</Label><Input value={form.routeOrigin} onChange={(e) => setForm({ ...form, routeOrigin: e.target.value })} /></div>
              <div><Label>Destination</Label><Input value={form.routeDestination} onChange={(e) => setForm({ ...form, routeDestination: e.target.value })} /></div>
            </div>
            <div><Label>Rate Type</Label>
              <Select value={form.rateType} onValueChange={(v: any) => setForm({ ...form, rateType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Route Rate</SelectItem>
                  <SelectItem value="per_km">Per Kilometer</SelectItem>
                  <SelectItem value="per_delivery">Per Delivery</SelectItem>
                  <SelectItem value="percentage">Commission % of Fare</SelectItem>                    <SelectItem value="per_ton">Per Ton</SelectItem>
                    <SelectItem value="per_unit">Per Unit</SelectItem>                </SelectContent>
              </Select>
            </div>
            {form.rateType === "fixed" && <div><Label>Fixed Rate (₱)</Label><Input type="number" value={form.fixedRate} onChange={(e) => setForm({ ...form, fixedRate: +e.target.value })} /></div>}
            {form.rateType === "per_km" && <div><Label>Rate per KM (₱)</Label><Input type="number" value={form.ratePerKm} onChange={(e) => setForm({ ...form, ratePerKm: +e.target.value })} /></div>}
            {form.rateType === "per_delivery" && <div><Label>Rate per Delivery (₱)</Label><Input type="number" value={form.ratePerDelivery} onChange={(e) => setForm({ ...form, ratePerDelivery: +e.target.value })} /></div>}
            {form.rateType === "percentage" && <div><Label>Commission %</Label><Input type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: +e.target.value })} /></div>}
            {form.rateType === "per_ton" && <div><Label>Rate per Ton (₱)</Label><Input type="number" value={form.ratePerTon} onChange={(e) => setForm({ ...form, ratePerTon: +e.target.value })} /></div>}
            {form.rateType === "per_unit" && <div><Label>Rate per Unit (₱)</Label><Input type="number" value={form.ratePerUnit} onChange={(e) => setForm({ ...form, ratePerUnit: +e.target.value })} /></div>}
            <div><Label>Dropoff Zone (optional)</Label><Input value={form.dropoffZone} onChange={(e) => setForm({ ...form, dropoffZone: e.target.value })} placeholder="e.g. Zone A, NCR, Cebu" /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Distance Tiers</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, distanceTiers: [...form.distanceTiers, { minKm: 0, maxKm: 0, multiplier: 1 }] })}><Plus className="w-3.5 h-3.5" /> Add Tier</Button>
              </div>
              {form.distanceTiers.map((tier: DistanceTier, i: number) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-end">
                  <div><Label className="text-[10px]">Min km</Label><Input type="number" value={tier.minKm} onChange={(e) => { const t = [...form.distanceTiers]; t[i] = { ...t[i], minKm: +e.target.value }; setForm({ ...form, distanceTiers: t }); }} /></div>
                  <div><Label className="text-[10px]">Max km</Label><Input type="number" value={tier.maxKm} onChange={(e) => { const t = [...form.distanceTiers]; t[i] = { ...t[i], maxKm: +e.target.value }; setForm({ ...form, distanceTiers: t }); }} /></div>
                  <div><Label className="text-[10px]">Multiplier</Label><Input type="number" step="0.01" value={tier.multiplier} onChange={(e) => { const t = [...form.distanceTiers]; t[i] = { ...t[i], multiplier: +e.target.value }; setForm({ ...form, distanceTiers: t }); }} /></div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { const t = form.distanceTiers.filter((_: any, j: number) => j !== i); setForm({ ...form, distanceTiers: t }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
              {form.distanceTiers.length === 0 && <p className="text-xs text-muted-foreground">No tiers — flat rate applies.</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Extra Stop (₱)</Label><Input type="number" value={form.extraStopFee} onChange={(e) => setForm({ ...form, extraStopFee: +e.target.value })} /></div>
              <div><Label>Night Diff %</Label><Input type="number" value={form.nightDifferentialPercent} onChange={(e) => setForm({ ...form, nightDifferentialPercent: +e.target.value })} /></div>
              <div><Label>Holiday ×</Label><Input type="number" step="0.1" value={form.holidayMultiplier} onChange={(e) => setForm({ ...form, holidayMultiplier: +e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Add"} Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DriverProfilesPanel() {
  const drivers = useDriverStore((s) => s.drivers);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);
  const upsertByDriver = useDriverPayrollProfileStore((s) => s.upsertByDriver);
  const rates = useTripRateStore((s) => s.rates);
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);

  const startEdit = (driverId: string) => {
    const p = profiles.find((x) => x.driverId === driverId);
    setEditingDriver(driverId);
    setForm(p ? { ...p } : {
      payrollMode: "fixed_plus_trip" as PayrollMode, baseSalary: 10000, monthlyAllowance: 0,
      perTripFlatRate: 0, perDeliveryRate: 0, commissionPercent: 0, defaultTripRateId: rates[0]?.id ?? "",
      sssEnabled: true, philhealthEnabled: true, pagibigEnabled: true, taxEnabled: false,
      overtimeEnabled: true, allowanceEnabled: false, active: true,
    });
  };
  const save = () => {
    if (!editingDriver || !form) return;
    upsertByDriver(editingDriver, form);
    toast.success("Driver payroll profile saved");
    setEditingDriver(null);
  };

  return (
    <>
      <p className="text-xs text-muted-foreground mb-3">Each driver's payroll mode, base salary, and government deduction setup.</p>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium">Payroll Mode</th>
                <th className="py-3 px-4 font-medium text-right">Base Salary</th>
                <th className="py-3 px-4 font-medium text-right">Allowance</th>
                <th className="py-3 px-4 font-medium">Gov't Deductions</th>
                <th className="py-3 px-4 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const p = profiles.find((x) => x.driverId === d.id);
                return (
                  <tr key={d.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{d.name}</td>
                    <td className="py-3 px-4">
                      {p ? <Badge variant="info">{PAYROLL_MODE_LABEL[p.payrollMode]}</Badge> : <Badge variant="warning">Not configured</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">{p ? formatCurrency(p.baseSalary) : "—"}</td>
                    <td className="py-3 px-4 text-right">{p?.allowanceEnabled ? formatCurrency(p.monthlyAllowance ?? 0) : "—"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {p ? [p.sssEnabled && "SSS", p.philhealthEnabled && "PhilHealth", p.pagibigEnabled && "Pag-IBIG", p.taxEnabled && "Tax"].filter(Boolean).join(" · ") || "None" : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(d.id)}><Pencil className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={!!editingDriver} onOpenChange={(o) => !o && setEditingDriver(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Payroll Profile · {drivers.find((d) => d.id === editingDriver)?.name}</SheetTitle></SheetHeader>
          {form && (
            <div className="space-y-4 mt-6">
              <div>
                <Label>Payroll Mode</Label>
                <Select value={form.payrollMode} onValueChange={(v) => setForm({ ...form, payrollMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYROLL_MODE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(form.payrollMode === "fixed_salary" || form.payrollMode === "fixed_plus_trip") && (
                <div><Label>Monthly Base Salary (₱)</Label><Input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: +e.target.value })} /></div>
              )}
              {form.payrollMode === "per_trip" && (
                <div><Label>Default Per-Trip Rate (₱)</Label><Input type="number" value={form.perTripFlatRate ?? 0} onChange={(e) => setForm({ ...form, perTripFlatRate: +e.target.value })} /></div>
              )}
              {form.payrollMode === "per_delivery" && (
                <div><Label>Per-Delivery Rate (₱)</Label><Input type="number" value={form.perDeliveryRate ?? 0} onChange={(e) => setForm({ ...form, perDeliveryRate: +e.target.value })} /></div>
              )}
              {form.payrollMode === "percentage" && (
                <div><Label>Commission %</Label><Input type="number" value={form.commissionPercent ?? 0} onChange={(e) => setForm({ ...form, commissionPercent: +e.target.value })} /></div>
              )}
              <div>
                <Label>Default Trip Rate</Label>
                <Select value={form.defaultTripRateId ?? ""} onValueChange={(v) => setForm({ ...form, defaultTripRateId: v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>{rates.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2 border-t border-brand-border">
                <p className="text-xs font-bold text-muted-foreground uppercase">Government Deductions</p>
                {[["sssEnabled", "SSS"], ["philhealthEnabled", "PhilHealth"], ["pagibigEnabled", "Pag-IBIG"], ["taxEnabled", "Withholding Tax"]].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form[k as string]} onChange={(e) => setForm({ ...form, [k as string]: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-brand-border">
                <p className="text-xs font-bold text-muted-foreground uppercase">Other</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.overtimeEnabled} onChange={(e) => setForm({ ...form, overtimeEnabled: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">Overtime Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.allowanceEnabled} onChange={(e) => setForm({ ...form, allowanceEnabled: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">Monthly Allowance Enabled</span>
                </label>
                {form.allowanceEnabled && (
                  <div><Label>Monthly Allowance (₱)</Label><Input type="number" value={form.monthlyAllowance ?? 0} onChange={(e) => setForm({ ...form, monthlyAllowance: +e.target.value })} /></div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" onClick={() => setEditingDriver(null)}>Cancel</Button>
                <Button onClick={save}>Save Profile</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function IncentivesPanel() {
  const incentives = useIncentiveStore((s) => s.incentives);
  const addIncentive = useIncentiveStore((s) => s.addIncentive);
  const deleteIncentive = useIncentiveStore((s) => s.deleteIncentive);
  const drivers = useDriverStore((s) => s.drivers);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ driverId: "", type: "on_time_delivery" as IncentiveType, amount: 0, notes: "" });
  const save = () => {
    if (!form.driverId) { toast.error("Select a driver"); return; }
    if (form.amount <= 0) { toast.error("Amount must be > 0"); return; }
    addIncentive({ ...form, createdBy: user?.name ?? "admin" });
    toast.success("Incentive added");
    setOpen(false);
    setForm({ driverId: "", type: "on_time_delivery", amount: 0, notes: "" });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-muted-foreground">Reward drivers for on-time delivery, fuel efficiency, and excellent service.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Incentive</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium">Notes</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {incentives.map((i) => (
                <tr key={i.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{drivers.find((d) => d.id === i.driverId)?.name ?? i.driverId}</td>
                  <td className="py-3 px-4"><Badge variant="success">{INCENTIVE_LABEL[i.type]}</Badge></td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">+{formatCurrency(i.amount)}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{i.notes ?? "—"}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{i.payrollPeriodId ? <Badge variant="info">Locked</Badge> : <Badge variant="neutral">Pending</Badge>}</td>
                  <td className="py-3 px-4">
                    {!i.payrollPeriodId && <Button size="sm" variant="ghost" onClick={() => deleteIncentive(i.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                  </td>
                </tr>
              ))}
              {incentives.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No incentives yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Incentive</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCENTIVE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₱)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
            <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeductionsPanel() {
  const deductions = useDeductionStore((s) => s.deductions);
  const addDeduction = useDeductionStore((s) => s.addDeduction);
  const deleteDeduction = useDeductionStore((s) => s.deleteDeduction);
  const drivers = useDriverStore((s) => s.drivers);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ driverId: "", type: "cash_advance" as DeductionType, amount: 0, reason: "" });
  const save = () => {
    if (!form.driverId) { toast.error("Select a driver"); return; }
    if (form.amount <= 0) { toast.error("Amount must be > 0"); return; }
    if (!form.reason.trim()) { toast.error("Reason is required (legally)"); return; }
    addDeduction({ ...form, status: "pending", createdBy: user?.name ?? "admin" });
    toast.success("Deduction recorded");
    setOpen(false);
    setForm({ driverId: "", type: "cash_advance", amount: 0, reason: "" });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-muted-foreground">Cash advances, fuel shortages, damages — every deduction must have a reason.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Deduction</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium">Reason</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d) => (
                <tr key={d.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{drivers.find((x) => x.id === d.driverId)?.name ?? d.driverId}</td>
                  <td className="py-3 px-4"><Badge variant="warning">{DEDUCTION_LABEL[d.type]}</Badge></td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">−{formatCurrency(d.amount)}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">{d.reason}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><Badge variant={d.status === "applied" ? "success" : d.status === "waived" ? "neutral" : "warning"}>{d.status}</Badge></td>
                  <td className="py-3 px-4">
                    {d.status === "pending" && !d.payrollPeriodId && (
                      <Button size="sm" variant="ghost" onClick={() => deleteDeduction(d.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    )}
                  </td>
                </tr>
              ))}
              {deductions.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No deductions yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Deduction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DEDUCTION_LABEL).filter(([k]) => !["sss", "philhealth", "pagibig", "tax"].includes(k)).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₱)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
            <div><Label>Reason <span className="text-red-500">*</span></Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Legally required — describe deduction" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
