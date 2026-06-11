"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  Wallet, ChevronLeft, TrendingUp, Truck, Sparkles, AlertCircle,
  CheckCircle2, Clock, Receipt, FileText, ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import {
  useDriverStore, useTripStore, useFleetStore,
  useTripRateStore, useDriverPayrollProfileStore,
  useIncentiveStore, useDeductionStore, usePayrollPeriodStore,
  buildDriverSummary,
} from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, any> = {
  draft: "neutral", computing: "info", ready_for_review: "warning",
  approved: "info", paid: "success", closed: "neutral",
};

export default function DriverEarningsPage() {
  const user = useAuthStore((s) => s.user);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);
  const fleet = useFleetStore((s) => s.vehicles);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);
  const rates = useTripRateStore((s) => s.rates);
  const incentives = useIncentiveStore((s) => s.incentives);
  const deductions = useDeductionStore((s) => s.deductions);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);

  // Resolve current driver
  const driverId = (user as any)?.driverId ?? drivers[0]?.id;
  const driver = drivers.find((d) => d.id === driverId);
  const profile = profiles.find((p) => p.driverId === driverId);

  const vehicleTypeByVehicleId = useMemo(
    () => Object.fromEntries(fleet.map((v) => [v.id, v.type])),
    [fleet]
  );

  // Active period (non-paid most recent draft/review/approved)
  const activePeriod = useMemo(() => {
    const candidates = periods.filter((p) => p.status !== "paid" && p.status !== "closed");
    return candidates[0] ?? periods[0];
  }, [periods]);

  // Live preview of earnings for active period
  const livePreview = useMemo(() => {
    if (!driver || !profile || !activePeriod) return null;
    return buildDriverSummary({
      driver, profile, trips, rates, incentives, deductions,
      period: activePeriod, vehicleTypeByVehicleId,
    });
  }, [driver, profile, activePeriod, trips, rates, incentives, deductions, vehicleTypeByVehicleId]);

  // Driver's historical payslips
  const myHistory = summaries
    .filter((s) => s.driverId === driverId)
    .sort((a, b) => {
      const pa = periods.find((p) => p.id === a.payrollPeriodId);
      const pb = periods.find((p) => p.id === b.payrollPeriodId);
      return (pb ? new Date(pb.endDate).getTime() : 0) - (pa ? new Date(pa.endDate).getTime() : 0);
    });

  const ytdNet = myHistory.filter((s) => s.status === "paid").reduce((a, b) => a + b.netPay, 0);

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28 overscroll-none">
      {/* Sticky Navy Header */}
      <header className="sticky top-0 z-30 bg-[#0B1C2E] text-white shadow-md">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/driver" className="p-1.5 -ml-1.5 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="text-xs text-white/60 uppercase tracking-wider">My Earnings</div>
            <div className="font-bold text-base">{driver?.name ?? "Driver"}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-teal flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {!driver || !profile ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold text-amber-900">Payroll profile not configured</div>
              <p className="text-amber-700 text-xs mt-1">Ask your dispatcher or admin to set up your payroll mode.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Hero: Active Period Estimate */}
            {activePeriod && livePreview && (
              <div className="bg-gradient-to-br from-brand-teal to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs uppercase tracking-wider text-white/80">Current Period · Estimate</div>
                  <Badge variant="neutral" className="bg-white/20 text-white border-0">{activePeriod.status.replace("_", " ")}</Badge>
                </div>
                <div className="text-xs text-white/80">{activePeriod.name}</div>
                <div className="text-2xl sm:text-4xl font-bold mt-2">{formatCurrency(livePreview.summary.netPay)}</div>
                <div className="text-xs text-white/80 mt-1">
                  {livePreview.summary.tripsCount} trip{livePreview.summary.tripsCount === 1 ? "" : "s"} ·
                  Pay date: {activePeriod.payDate ? new Date(activePeriod.payDate).toLocaleDateString() : "TBD"}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <div className="text-[10px] text-white/70 uppercase">Trip Earnings</div>
                    <div className="font-bold">{formatCurrency(livePreview.summary.tripEarnings)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/70 uppercase">Incentives</div>
                    <div className="font-bold">+{formatCurrency(livePreview.summary.incentives)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/70 uppercase">Deductions</div>
                    <div className="font-bold">−{formatCurrency(livePreview.summary.totalDeductions)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* YTD Stat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-brand-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">YTD Paid</div>
                </div>
                <div className="text-lg font-bold text-brand-navy">{formatCurrency(ytdNet)}</div>
              </div>
              <div className="bg-white border border-brand-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">Mode</div>
                </div>
                <div className="text-sm font-bold text-brand-navy">{profile.payrollMode.replace(/_/g, " ")}</div>
              </div>
            </div>

            {/* Trip Breakdown for current period */}
            {livePreview && livePreview.tripPayrolls.length > 0 && (
              <div className="bg-white border border-brand-border rounded-xl p-4">
                <h3 className="font-bold text-brand-navy text-sm mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Trips This Period ({livePreview.tripPayrolls.length})
                </h3>
                <div className="space-y-2">
                  {livePreview.tripPayrolls.map((tp) => {
                    const t = trips.find((x) => x.id === tp.tripId);
                    return (
                      <div key={tp.id} className="flex items-center justify-between border-b border-brand-border/60 pb-2 last:border-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{t ? `${t.pickup.address.split(",")[0]} → ${t.dropoff.address.split(",")[0]}` : tp.tripId}</div>
                          <div className="text-[10px] text-muted-foreground">{tp.tripId} · {t ? `${t.distanceKm}km` : ""}</div>
                        </div>
                        <div className="font-bold text-brand-teal text-sm">{formatCurrency(tp.finalAmount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Incentives this period */}
            {livePreview && livePreview.summary.incentives > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Incentives Earned
                </h3>
                <div className="space-y-1.5 text-xs">
                  {incentives.filter((i) => i.driverId === driverId && (!i.payrollPeriodId || i.payrollPeriodId === activePeriod?.id)).map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span>{i.type.replace(/_/g, " ")}</span>
                      <span className="font-bold text-emerald-700">+{formatCurrency(i.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deductions this period */}
            {livePreview && livePreview.summary.totalDeductions > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h3 className="font-bold text-rose-900 text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Deductions
                </h3>
                <div className="space-y-1.5 text-xs">
                  {livePreview.summary.sssDeduction > 0 && <div className="flex justify-between"><span>SSS</span><span className="font-bold text-red-600">−{formatCurrency(livePreview.summary.sssDeduction)}</span></div>}
                  {livePreview.summary.philhealthDeduction > 0 && <div className="flex justify-between"><span>PhilHealth</span><span className="font-bold text-red-600">−{formatCurrency(livePreview.summary.philhealthDeduction)}</span></div>}
                  {livePreview.summary.pagibigDeduction > 0 && <div className="flex justify-between"><span>Pag-IBIG</span><span className="font-bold text-red-600">−{formatCurrency(livePreview.summary.pagibigDeduction)}</span></div>}
                  {livePreview.summary.taxDeduction > 0 && <div className="flex justify-between"><span>Tax</span><span className="font-bold text-red-600">−{formatCurrency(livePreview.summary.taxDeduction)}</span></div>}
                  {deductions.filter((d) => d.driverId === driverId && d.status !== "waived" && (!d.payrollPeriodId || d.payrollPeriodId === activePeriod?.id)).map((d) => (
                    <div key={d.id} className="flex justify-between">
                      <span>{d.type.replace(/_/g, " ")} · {d.reason}</span>
                      <span className="font-bold text-red-600">−{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payslip History */}
            <div className="bg-white border border-brand-border rounded-xl p-4">
              <h3 className="font-bold text-brand-navy text-sm mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Payslip History
              </h3>
              {myHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No previous payslips yet.</p>
              ) : (
                <div className="space-y-2">
                  {myHistory.map((s) => {
                    const p = periods.find((x) => x.id === s.payrollPeriodId);
                    return (
                      <Link key={s.id} href={`/payroll/${s.payrollPeriodId}`} className="flex items-center justify-between border border-brand-border rounded-lg p-3 hover:border-brand-teal hover:bg-brand-teal/5 transition-colors">
                        <div>
                          <div className="font-medium text-sm text-brand-navy">{p?.name ?? "—"}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            {s.tripsCount} trip{s.tripsCount === 1 ? "" : "s"} ·
                            <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-teal">{formatCurrency(s.netPay)}</div>
                          <ArrowRight className="w-3 h-3 text-muted-foreground inline" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom nav (matches /driver pattern) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <Link href="/driver" className="flex flex-col items-center py-2.5 text-muted-foreground hover:text-brand-teal">
            <Truck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Trip</span>
          </Link>
          <Link href="/pod" className="flex flex-col items-center py-2.5 text-muted-foreground hover:text-brand-teal">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">POD</span>
          </Link>
          <Link href="/driver/earnings" className="flex flex-col items-center py-2.5 text-brand-teal">
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Earnings</span>
          </Link>
          <Link href="/gps" className="flex flex-col items-center py-2.5 text-muted-foreground hover:text-brand-teal">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">GPS</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
