"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Calendar,
  Truck, Calculator, Plus, Trash2, Wallet, ArrowLeft, Sparkles,
  Settings, ExternalLink, RefreshCw, Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useDriverStore, useTripStore, useFleetStore,
  useTripRateStore, useDriverPayrollProfileStore,
  useIncentiveStore, useDeductionStore, usePayrollPeriodStore,
  buildDriverSummary, getEligibleTripsForDriver,
  useHelperStore, useOfficeStaffStore, usePartnerStore,
  buildHelperSummary, computeOfficeStaffPayroll, computePartnerPayouts,
} from "@/lib/store";
import type { OfficePayrollResult, PartnerPayoutResult } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { Driver, IncentiveType, DeductionType, PayrollSummary, TripPayroll } from "@/lib/types";
import {
  detectNextPeriodFromHistory,
  detectPeriodFromDate,
  formatPeriodName,
  computePayDate,
  detectPeriodOverlap,
  isBlockedByPendingTrips,
  computeAdjustmentImpact,
  generateSmartWarnings,
  detectCrossPeriodDuplicates,
  computeGrandTotal,
} from "@/lib/payroll/wizard-utils";

const STEPS = [
  { id: 1, label: "Period", icon: Calendar },
  { id: 2, label: "Eligible Trips", icon: Truck },
  { id: 3, label: "Compute Earnings", icon: Calculator },
  { id: 4, label: "Adjustments", icon: Plus },
  { id: 5, label: "Review & Generate", icon: CheckCircle2 },
];

const INCENTIVE_LABEL: Record<IncentiveType, string> = {
  on_time_delivery: "On-Time Delivery", fuel_efficiency: "Fuel Efficiency", extra_stop: "Extra Stop",
  holiday_trip: "Holiday Trip", excellent_rating: "Excellent Rating", safety_bonus: "Safety Bonus", other: "Other",
};

const DEDUCTION_LABEL: Record<DeductionType, string> = {
  cash_advance: "Cash Advance", fuel_shortage: "Fuel Shortage", late_delivery: "Late Delivery",
  vehicle_damage: "Vehicle Damage", violation: "Violation", uniform: "Uniform",
  sss: "SSS", philhealth: "PhilHealth", pagibig: "Pag-IBIG", tax: "Withholding Tax", other: "Other",
};

export default function PayrollRunWizard() {
  const router = useRouter();

  const drivers = useDriverStore((s) => s.drivers);
  const allTrips = useTripStore((s) => s.trips);
  const approveTrip = useTripStore((s) => s.approveTrip);
  const lockTripsToPeriod = useTripStore((s) => s.lockTripsToPeriod);
  const fleet = useFleetStore((s) => s.vehicles);

  const helpers = useHelperStore((s) => s.helpers);
  const officeStaff = useOfficeStaffStore((s) => s.employees);
  const partners = usePartnerStore((s) => s.partners);

  const rates = useTripRateStore((s) => s.rates);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);
  const incentives = useIncentiveStore((s) => s.incentives);
  const addIncentive = useIncentiveStore((s) => s.addIncentive);
  const lockIncentivesToPeriod = useIncentiveStore((s) => s.lockToPeriod);
  const deductions = useDeductionStore((s) => s.deductions);
  const addDeduction = useDeductionStore((s) => s.addDeduction);
  const lockDeductionsToPeriod = useDeductionStore((s) => s.lockToPeriod);

  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const addPeriod = usePayrollPeriodStore((s) => s.addPeriod);
  const setSummariesForPeriod = usePayrollPeriodStore((s) => s.setSummariesForPeriod);
  const user = useAuthStore((s) => s.user);

  const vehicleTypeByVehicleId = useMemo(
    () => Object.fromEntries(fleet.map((v) => [v.id, v.type])),
    [fleet]
  );

  // ── Smart period detection ──
  const smartDefault = useMemo(() => {
    try {
      return detectNextPeriodFromHistory(periods);
    } catch {
      return detectPeriodFromDate(new Date());
    }
  }, [periods]);

  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState(smartDefault);
  const [blockingThreshold, setBlockingThreshold] = useState(5);
  const [computed, setComputed] = useState<{ summary: PayrollSummary; tripPayrolls: TripPayroll[]; driver: Driver }[]>([]);
  const [helperComputed, setHelperComputed] = useState<{ summary: PayrollSummary; tripPayrolls: TripPayroll[]; helperName: string }[]>([]);
  const [officeComputed, setOfficeComputed] = useState<OfficePayrollResult[]>([]);
  const [partnerComputed, setPartnerComputed] = useState<PartnerPayoutResult[]>([]);
  const [showIncentiveDialog, setShowIncentiveDialog] = useState(false);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [incentiveForm, setIncentiveForm] = useState({ driverId: "", type: "on_time_delivery" as IncentiveType, amount: 0, notes: "" });
  const [deductionForm, setDeductionForm] = useState({ driverId: "", type: "cash_advance" as DeductionType, amount: 0, reason: "" });
  const [generating, setGenerating] = useState(false);
  const [netPayOverrides, setNetPayOverrides] = useState<Record<string, number>>({});
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // ── Overlap detection ──
  const overlapResult = useMemo(
    () => detectPeriodOverlap(period.startDate, period.endDate, periods),
    [period.startDate, period.endDate, periods]
  );

  // ── Derived: eligible trips per driver ──
  const driverEligibility = useMemo(() => {
    return drivers.map((d) => {
      const profile = profiles.find((p) => p.driverId === d.id);
      const driverTrips = allTrips.filter((t) =>
        t.driverId === d.id &&
        (t.status === "completed" || t.status === "delivered") &&
        new Date(t.dropoff.scheduledAt) >= new Date(period.startDate) &&
        new Date(t.dropoff.scheduledAt) <= new Date(period.endDate + "T23:59:59") &&
        !t.payrollProcessed
      );
      const approved = driverTrips.filter((t) => t.approvalStatus === "approved");
      const pending = driverTrips.filter((t) => !t.approvalStatus || t.approvalStatus === "pending");
      const rejected = driverTrips.filter((t) => t.approvalStatus === "rejected");
      return { driver: d, profile, approved, pending, rejected, total: driverTrips.length };
    });
  }, [drivers, allTrips, profiles, period.startDate, period.endDate]);

  const totalPendingTrips = useMemo(
    () => driverEligibility.reduce((sum, x) => sum + x.pending.length, 0),
    [driverEligibility]
  );

  const driversWithProfilesAndWork = driverEligibility.filter((x) => x.profile && (x.approved.length > 0 || x.profile.payrollMode === "fixed_salary" || x.profile.payrollMode === "fixed_plus_trip"));

  // ── Step 1: validate period ──
  const canProceedStep1 = period.name.trim() && period.startDate && period.endDate && new Date(period.startDate) <= new Date(period.endDate) && !overlapResult.isBlocking;

  // ── Step 2: validate blocking threshold ──
  const canProceedStep2 = !isBlockedByPendingTrips(totalPendingTrips, blockingThreshold) && driversWithProfilesAndWork.length > 0;

  // ── Step 3: compute earnings ──
  const computeAll = () => {
    const tempPeriod = { id: "tmp", ...period, status: "draft" as const };

    // Drivers
    const results = driversWithProfilesAndWork.map(({ driver, profile }) => {
      const r = buildDriverSummary({
        driver,
        profile: profile!,
        trips: allTrips,
        rates,
        incentives,
        deductions,
        period: tempPeriod as any,
        vehicleTypeByVehicleId,
      });
      return { ...r, driver };
    });
    setComputed(results);

    // Helpers
    const helperResults = helpers
      .filter((h) => h.status === "active")
      .map((h) => {
        const r = buildHelperSummary({ helper: h, trips: allTrips, period: tempPeriod as any });
        return { ...r, helperName: h.name };
      })
      .filter((r) => r.summary.tripsCount > 0 || (r.summary.baseSalary > 0));
    setHelperComputed(helperResults);

    // Office Staff
    const officeResults = computeOfficeStaffPayroll(officeStaff);
    setOfficeComputed(officeResults);

    // Partner Payouts
    const partnerResults = computePartnerPayouts(allTrips, partners, period.startDate, period.endDate);
    setPartnerComputed(partnerResults);

    // Reset overrides on re-compute
    setNetPayOverrides({});
  };

  // ── Smart warnings (Step 3) ──
  const smartWarnings = useMemo(() => {
    if (computed.length === 0) return [];
    return generateSmartWarnings(
      computed.map((c) => ({
        driverId: c.driver.id,
        driverName: c.driver.name,
        summary: c.summary,
      })),
      allTrips,
      profiles,
      drivers
    );
  }, [computed, allTrips, profiles, drivers]);

  // ── Adjustment impact (Step 4) ──
  const adjustmentImpact = useMemo(
    () => computeAdjustmentImpact(incentives, deductions, period.startDate, period.endDate),
    [incentives, deductions, period.startDate, period.endDate]
  );

  // ── Cross-period duplicates (Step 5) ──
  const crossPeriodDuplicates = useMemo(() => {
    if (computed.length === 0) return [];
    const computedIds = [
      ...computed.map((c) => c.driver.id),
      ...helperComputed.map((h) => h.summary.driverId),
      ...officeComputed.map((o) => o.employee.id),
    ];
    const nameMap: Record<string, string> = {};
    computed.forEach((c) => { nameMap[c.driver.id] = c.driver.name; });
    helperComputed.forEach((h) => { nameMap[h.summary.driverId] = h.helperName; });
    officeComputed.forEach((o) => { nameMap[o.employee.id] = o.employee.name; });

    return detectCrossPeriodDuplicates(
      period.startDate, period.endDate, computedIds, periods, summaries, nameMap
    );
  }, [computed, helperComputed, officeComputed, period.startDate, period.endDate, periods, summaries]);

  // ── Grand total ──
  const grandTotal = useMemo(
    () => computeGrandTotal(
      computed.map((c) => c.summary),
      helperComputed.map((h) => h.summary),
      officeComputed,
      partnerComputed
    ),
    [computed, helperComputed, officeComputed, partnerComputed]
  );

  // ── Step 5: generate payroll ──
  const generate = async () => {
    setGenerating(true);
    try {
      const employeeCount = computed.length + helperComputed.length + officeComputed.length;
      const auditNotes = `${computed.length} drivers, ${helperComputed.length} helpers, ${officeComputed.length} office, ${partnerComputed.length} partners. Grand total: ₱${grandTotal.toLocaleString()}`;

      const newPeriod = addPeriod({
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        payDate: period.payDate,
        status: "ready_for_review",
        generatedBy: user?.name ?? "admin",
        generatedAt: new Date().toISOString(),
        notes: auditNotes,
      });

      // Re-compute drivers against the real period id
      const realResults = driversWithProfilesAndWork.map(({ driver, profile }) => {
        const r = buildDriverSummary({
          driver, profile: profile!, trips: allTrips, rates, incentives, deductions,
          period: newPeriod, vehicleTypeByVehicleId,
        });
        return { ...r, driver };
      });

      // Re-compute helpers against the real period id
      const realHelperResults = helpers
        .filter((h) => h.status === "active")
        .map((h) => buildHelperSummary({ helper: h, trips: allTrips, period: newPeriod }))
        .filter((r) => r.summary.tripsCount > 0 || r.summary.baseSalary > 0);

      const allSummaries = [
        ...realResults.map((r) => {
          // Apply net pay override if exists
          const override = netPayOverrides[r.driver.id];
          if (override !== undefined) {
            return { ...r.summary, netPay: override };
          }
          return r.summary;
        }),
        ...realHelperResults.map((r) => r.summary),
        ...officeComputed.map((oc): PayrollSummary => ({
          id: `ps-oe-${oc.employee.id}-${newPeriod.id}`,
          driverId: oc.employee.id,
          payrollPeriodId: newPeriod.id,
          payrollMode: "fixed_salary",
          tripsCount: 0,
          baseSalary: oc.grossPay,
          tripEarnings: 0,
          incentives: 0,
          allowances: oc.allowances,
          overtimeAmount: 0,
          sssDeduction: oc.sss,
          philhealthDeduction: oc.philhealth,
          pagibigDeduction: oc.pagibig,
          taxDeduction: oc.tax,
          cashAdvanceDeduction: 0,
          otherDeductions: 0,
          totalDeductions: oc.totalDeductions,
          grossPay: oc.grossPay,
          netPay: oc.netPay,
          status: "draft",
        })),
      ];
      const allTripPayrolls = [
        ...realResults.flatMap((r) => r.tripPayrolls),
        ...realHelperResults.flatMap((r) => r.tripPayrolls),
      ];
      setSummariesForPeriod(newPeriod.id, allSummaries, allTripPayrolls);

      // Lock trips
      const tripIds = allTripPayrolls.map((tp) => tp.tripId);
      lockTripsToPeriod(tripIds, newPeriod.id);

      // Lock incentives & deductions used (within date range, not already locked)
      const activeIncentiveIds = incentives.filter((i) =>
        !i.payrollPeriodId &&
        new Date(i.createdAt) >= new Date(period.startDate) &&
        new Date(i.createdAt) <= new Date(period.endDate + "T23:59:59")
      ).map((i) => i.id);
      if (activeIncentiveIds.length) lockIncentivesToPeriod(activeIncentiveIds, newPeriod.id);

      const activeDeductionIds = deductions.filter((d) =>
        d.status !== "waived" && !d.payrollPeriodId &&
        new Date(d.createdAt) >= new Date(period.startDate) &&
        new Date(d.createdAt) <= new Date(period.endDate + "T23:59:59")
      ).map((d) => d.id);
      if (activeDeductionIds.length) lockDeductionsToPeriod(activeDeductionIds, newPeriod.id);

      toast.success(`Payroll generated — ${realResults.length} drivers, ${realHelperResults.length} helpers, ${officeComputed.length} office, ${partnerComputed.length} partners — ₱${grandTotal.toLocaleString()}`);
      router.push(`/payroll/${newPeriod.id}`);
    } catch (e) {
      toast.error("Failed to generate payroll");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // ── All employees for adjustment dialogs ──
  const allEmployeesForSelect = useMemo(() => {
    const list: { id: string; name: string; type: string }[] = [];
    drivers.forEach((d) => list.push({ id: d.id, name: d.name, type: "Driver" }));
    helpers.filter((h) => h.status === "active").forEach((h) => list.push({ id: h.id, name: h.name, type: "Helper" }));
    officeStaff.filter((o) => o.status === "active").forEach((o) => list.push({ id: o.id, name: o.name, type: "Office" }));
    return list;
  }, [drivers, helpers, officeStaff]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Payroll Run"
        subtitle="Step-by-step wizard · validate trips · compute earnings · review & generate payslips"
        breadcrumbs={[{ label: "Finance" }, { label: "Payroll", href: "/payroll" }, { label: "New Run" }]}
        actions={
          <Button variant="outline" size="sm" asChild><Link href="/payroll"><ArrowLeft className="w-4 h-4" /> Cancel</Link></Button>
        }
      />

      {/* Stepper */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1.5 min-w-[80px]`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isDone ? "bg-emerald-500 text-white" : isActive ? "bg-brand-navy dark:bg-brand-navy-light text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className={`text-xs font-medium ${isActive ? "text-brand-navy dark:text-white" : isDone ? "text-emerald-600" : "text-gray-400"}`}>
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 lg:w-16 h-0.5 ${step > s.id ? "bg-emerald-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── STEP 1: PERIOD ─── */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-brand-navy dark:text-white text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> Define Payroll Period</h3>
              <p className="text-sm text-muted-foreground">Standard PH semi-monthly cut-off (1-15 / 16-end). Pay date is typically 5 days after cut-off.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Period Name</Label>
                <Input value={period.name} onChange={(e) => setPeriod({ ...period, name: e.target.value })} placeholder="e.g. June 1-15, 2026 · Cut-off A" />
                <p className="text-[10px] text-muted-foreground mt-1">Auto-generated from dates. You can override manually.</p>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={period.startDate} onChange={(e) => {
                const newStart = e.target.value;
                const endVal = period.endDate || newStart;
                const autoName = formatPeriodName(newStart, endVal);
                const autoPayDate = computePayDate(endVal);
                setPeriod({ ...period, startDate: newStart, name: autoName, payDate: autoPayDate });
              }} /></div>
              <div><Label>End Date</Label><Input type="date" value={period.endDate} onChange={(e) => {
                const newEnd = e.target.value;
                const startVal = period.startDate || newEnd;
                const autoName = formatPeriodName(startVal, newEnd);
                const autoPayDate = computePayDate(newEnd);
                setPeriod({ ...period, endDate: newEnd, name: autoName, payDate: autoPayDate });
              }} /></div>
              <div><Label>Pay Date</Label><Input type="date" value={period.payDate} onChange={(e) => setPeriod({ ...period, payDate: e.target.value })} /></div>
            </div>

            {/* Overlap Warning */}
            {overlapResult.hasOverlap && overlapResult.overlappingPeriod && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
                overlapResult.isBlocking
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {overlapResult.isBlocking ? "Blocking overlap detected" : "Overlap warning"}
                  </p>
                  <p className="text-xs mt-0.5">
                    Period &quot;{overlapResult.overlappingPeriod.name}&quot; ({overlapResult.overlappingPeriod.status}) has overlapping dates.
                    {overlapResult.isBlocking && " Select a different date range to proceed."}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>The wizard will automatically pull all <b>completed trips</b> in this date range for review and computation. Philippine semi-monthly standard: Cutoff A (1st–15th) and Cutoff B (16th–last day). Pay date is computed as 5 days after the cutoff end date.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: ELIGIBLE TRIPS ─── */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-brand-navy dark:text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5" /> Review & Approve Trips</h3>
                <p className="text-sm text-muted-foreground">Only <b>approved</b> trips will be paid. Approve pending ones now.</p>
              </div>
              {/* Blocking threshold settings */}
              <div className="flex items-center gap-2 text-xs">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Block at:</span>
                <Input
                  type="number"
                  min={0}
                  className="w-16 h-7 text-xs"
                  value={blockingThreshold}
                  onChange={(e) => setBlockingThreshold(Math.max(0, +e.target.value))}
                />
                <span className="text-muted-foreground">pending</span>
              </div>
            </div>

            {/* Pending trips banner */}
            {totalPendingTrips > 0 && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                isBlockedByPendingTrips(totalPendingTrips, blockingThreshold)
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <b>{totalPendingTrips}</b> pending trip{totalPendingTrips !== 1 ? "s" : ""} across all employees.
                    {isBlockedByPendingTrips(totalPendingTrips, blockingThreshold) && " Exceeds threshold — resolve before proceeding."}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/approvals"><ExternalLink className="w-3 h-3" /> Go to Trip Approvals</Link>
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {driverEligibility.filter((x) => x.total > 0 || (x.profile && (x.profile.payrollMode === "fixed_salary" || x.profile.payrollMode === "fixed_plus_trip"))).map(({ driver, profile, approved, pending, total }) => (
                <div key={driver.id} className="border border-brand-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-brand-navy dark:text-white">{driver.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {profile ? <Badge variant="info">{profile.payrollMode.replace(/_/g, " ")}</Badge> : <Badge variant="warning">No payroll profile</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="text-center"><div className="font-bold text-emerald-600 text-lg">{approved.length}</div><div className="text-muted-foreground">Approved</div></div>
                      <div className="text-center"><div className="font-bold text-amber-600 text-lg">{pending.length}</div><div className="text-muted-foreground">Pending</div></div>
                      <div className="text-center"><div className="font-bold text-gray-700 text-lg">{total}</div><div className="text-muted-foreground">Total</div></div>
                    </div>
                  </div>
                  {pending.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {pending.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs">
                          <div>
                            <div className="font-medium">{t.id} · {t.pickup.address.split(",")[0]} → {t.dropoff.address.split(",")[0]}</div>
                            <div className="text-muted-foreground">{t.distanceKm}km · ₱{t.fare.toLocaleString()} fare · {new Date(t.dropoff.scheduledAt).toLocaleDateString()}</div>
                          </div>
                          <Button size="sm" onClick={() => { approveTrip(t.id, user?.name ?? "admin"); toast.success(`Trip ${t.id} approved`); }}>
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {driverEligibility.every((x) => x.total === 0) && driversWithProfilesAndWork.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No employees qualify for payroll in this period range.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: COMPUTE EARNINGS ─── */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-brand-navy dark:text-white text-lg flex items-center gap-2"><Calculator className="w-5 h-5" /> Compute Earnings Per Driver</h3>
                <p className="text-sm text-muted-foreground">Apply trip rates × payroll modes to each approved trip.</p>
              </div>
              <Button onClick={computeAll} disabled={driversWithProfilesAndWork.length === 0}>
                <RefreshCw className="w-4 h-4" /> {computed.length ? "Re-compute" : "Compute Now"}
              </Button>
            </div>

            {computed.length > 0 ? (
              <div className="space-y-6">
                {/* Drivers */}
                <div>
                  <h4 className="font-bold text-brand-navy dark:text-white mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> Drivers ({computed.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border">
                          <th className="py-2 px-3 font-medium">Driver</th>
                          <th className="py-2 px-3 font-medium text-right">Trips</th>
                          <th className="py-2 px-3 font-medium text-right">Base</th>
                          <th className="py-2 px-3 font-medium text-right">Trip Earnings</th>
                          <th className="py-2 px-3 font-medium text-right">Gross</th>
                          <th className="py-2 px-3 font-medium text-right">Deductions</th>
                          <th className="py-2 px-3 font-medium text-right">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {computed.map(({ driver, summary }) => (
                          <tr key={driver.id} className={`border-b border-brand-border/60 ${summary.netPay <= 0 ? "bg-red-50" : ""}`}>
                            <td className="py-2 px-3 font-medium">{driver.name}</td>
                            <td className="py-2 px-3 text-right">{summary.tripsCount}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(summary.baseSalary)}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(summary.tripEarnings)}</td>
                            <td className="py-2 px-3 text-right font-bold">{formatCurrency(summary.grossPay)}</td>
                            <td className="py-2 px-3 text-right text-red-600">{summary.totalDeductions > 0 ? `−${formatCurrency(summary.totalDeductions)}` : "—"}</td>
                            <td className="py-2 px-3 text-right font-bold text-brand-teal">{formatCurrency(summary.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Helpers */}
                {helperComputed.length > 0 && (
                  <div>
                    <h4 className="font-bold text-brand-navy dark:text-white mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Helpers ({helperComputed.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border">
                            <th className="py-2 px-3 font-medium">Helper</th>
                            <th className="py-2 px-3 font-medium text-right">Trips</th>
                            <th className="py-2 px-3 font-medium text-right">Base</th>
                            <th className="py-2 px-3 font-medium text-right">Trip Earnings</th>
                            <th className="py-2 px-3 font-medium text-right">Net Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {helperComputed.map(({ helperName, summary }) => (
                            <tr key={summary.id} className="border-b border-brand-border/60">
                              <td className="py-2 px-3 font-medium">{helperName}</td>
                              <td className="py-2 px-3 text-right">{summary.tripsCount}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(summary.baseSalary)}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(summary.tripEarnings)}</td>
                              <td className="py-2 px-3 text-right font-bold text-brand-teal">{formatCurrency(summary.netPay)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Office Staff */}
                {officeComputed.length > 0 && (
                  <div>
                    <h4 className="font-bold text-brand-navy dark:text-white mb-2 flex items-center gap-2"><Wallet className="w-4 h-4" /> Office Staff ({officeComputed.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border">
                            <th className="py-2 px-3 font-medium">Employee</th>
                            <th className="py-2 px-3 font-medium">Position</th>
                            <th className="py-2 px-3 font-medium text-right">Gross</th>
                            <th className="py-2 px-3 font-medium text-right">Deductions</th>
                            <th className="py-2 px-3 font-medium text-right">Net Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {officeComputed.map((r) => (
                            <tr key={r.employee.id} className="border-b border-brand-border/60">
                              <td className="py-2 px-3 font-medium">{r.employee.name}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{r.employee.position}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(r.grossPay)}</td>
                              <td className="py-2 px-3 text-right text-red-600">{r.totalDeductions > 0 ? `−${formatCurrency(r.totalDeductions)}` : "—"}</td>
                              <td className="py-2 px-3 text-right font-bold text-brand-teal">{formatCurrency(r.netPay)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Partner Payouts */}
                {partnerComputed.length > 0 && (
                  <div>
                    <h4 className="font-bold text-brand-navy dark:text-white mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> Subcon Partner Payouts ({partnerComputed.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border">
                            <th className="py-2 px-3 font-medium">Partner</th>
                            <th className="py-2 px-3 font-medium text-right">Trips</th>
                            <th className="py-2 px-3 font-medium text-right">Total Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {partnerComputed.map((r) => (
                            <tr key={r.partnerId} className="border-b border-brand-border/60">
                              <td className="py-2 px-3 font-medium">{r.partnerName}</td>
                              <td className="py-2 px-3 text-right">{r.trips.length}</td>
                              <td className="py-2 px-3 text-right font-bold text-brand-teal">{formatCurrency(r.totalPayout)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-brand-teal/5 border border-brand-teal/30 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-bold text-brand-navy dark:text-white">GRAND TOTAL (All Categories)</span>
                  <span className="font-bold text-brand-teal text-xl">{formatCurrency(grandTotal)}</span>
                </div>

                {/* ── Smart Payroll Warnings ── */}
                {smartWarnings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Smart Payroll Checks ({smartWarnings.length})
                    </h4>
                    {smartWarnings.map((w, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                        w.severity === "error" ? "bg-red-50 border-red-200 text-red-800" :
                        w.severity === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
                        "bg-sky-50 border-sky-200 text-sky-800"
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-brand-border rounded-lg">
                <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-muted-foreground">Click &quot;Compute Now&quot; to calculate earnings.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 4: ADJUSTMENTS ─── */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-brand-navy dark:text-white text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Add Period Incentives & Deductions</h3>
              <p className="text-sm text-muted-foreground">Add rewards or deductions that apply to this period only.</p>
            </div>

            {/* Adjustment impact summary */}
            {adjustmentImpact.itemCount > 0 && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 border border-brand-border rounded-lg text-sm">
                <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Incentives</div>
                    <div className="font-bold text-emerald-600">+{formatCurrency(adjustmentImpact.totalIncentives)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Deductions</div>
                    <div className="font-bold text-red-600">−{formatCurrency(adjustmentImpact.totalDeductions)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Net Impact</div>
                    <div className={`font-bold ${adjustmentImpact.netImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {adjustmentImpact.netImpact >= 0 ? "+" : ""}{formatCurrency(adjustmentImpact.netImpact)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incentives */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-brand-navy dark:text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-500" /> Incentives</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowIncentiveDialog(true)}><Plus className="w-3 h-3" /> Add</Button>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {incentives.filter((i) => !i.payrollPeriodId && new Date(i.createdAt) >= new Date(period.startDate) && new Date(i.createdAt) <= new Date(period.endDate + "T23:59:59")).map((i) => {
                    const emp = allEmployeesForSelect.find((e) => e.id === i.driverId);
                    return (
                      <div key={i.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-xs">
                        <div>
                          <div className="font-medium">{emp?.name ?? i.driverId}</div>
                          <div className="text-muted-foreground">{INCENTIVE_LABEL[i.type]}{i.notes ? ` · ${i.notes}` : ""}</div>
                        </div>
                        <div className="font-bold text-emerald-600">+{formatCurrency(i.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Deductions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-brand-navy dark:text-white flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-500" /> Deductions</h4>
                  <Button size="sm" variant="outline" onClick={() => setShowDeductionDialog(true)}><Plus className="w-3 h-3" /> Add</Button>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {deductions.filter((d) => !d.payrollPeriodId && d.status !== "waived" && new Date(d.createdAt) >= new Date(period.startDate) && new Date(d.createdAt) <= new Date(period.endDate + "T23:59:59")).map((d) => {
                    const emp = allEmployeesForSelect.find((e) => e.id === d.driverId);
                    return (
                      <div key={d.id} className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-md px-3 py-2 text-xs">
                        <div>
                          <div className="font-medium">{emp?.name ?? d.driverId}</div>
                          <div className="text-muted-foreground">{DEDUCTION_LABEL[d.type]} · {d.reason}</div>
                        </div>
                        <div className="font-bold text-red-600">−{formatCurrency(d.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex gap-2">
              <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>If you added new items, go back to <b>Step 3</b> and click <b>Re-compute</b> so updated totals reflect in the final review.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 5: REVIEW & GENERATE ─── */}
      {step === 5 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-brand-navy dark:text-white text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Final Review</h3>
              <p className="text-sm text-muted-foreground">Once generated, trips will be locked to this period and payslips become available.</p>
            </div>

            {/* BIR Compliance Badge */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-800">BIR 2026 Compliant</p>
                <p className="text-[10px] text-emerald-700">SSS (4.5%, max ₱1,350) · PhilHealth (2.5%, max ₱2,500) · Pag-IBIG (2%, max ₱200) · TRAIN Law Tax Brackets</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-brand-border rounded-lg p-3">
                <div className="text-xs uppercase text-muted-foreground">Period</div>
                <div className="font-bold text-brand-navy  text-sm">{period.name}</div>
              </div>
              <div className="bg-gray-50 border border-brand-border rounded-lg p-3">
                <div className="text-xs uppercase text-muted-foreground">Drivers / Helpers</div>
                <div className="font-bold text-brand-navy">{computed.length} / {helperComputed.length}</div>
              </div>
              <div className="bg-gray-50 border border-brand-border rounded-lg p-3">
                <div className="text-xs uppercase text-muted-foreground">Office / Partners</div>
                <div className="font-bold text-brand-navy">{officeComputed.length} / {partnerComputed.length}</div>
              </div>
              <div className="bg-brand-teal/10 border border-brand-teal/40 rounded-lg p-3">
                <div className="text-xs uppercase text-brand-teal">Grand Total</div>
                <div className="font-bold text-brand-teal text-xl">{formatCurrency(grandTotal)}</div>
              </div>
            </div>

            {/* Cross-period duplicate warnings */}
            {crossPeriodDuplicates.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Cross-Period Duplicate Flags ({crossPeriodDuplicates.length})
                </h4>
                {crossPeriodDuplicates.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-amber-50 border-amber-200 text-xs text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span><b>{d.employeeName}</b> also appears in &quot;{d.conflictingPeriodName}&quot;</span>
                  </div>
                ))}
              </div>
            )}

            {/* Employee list with override capability */}
            {computed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Employee Breakdown (click to override)</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {computed.map(({ driver, summary }) => (
                    <div key={driver.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-brand-border/60 text-xs hover:bg-gray-50 cursor-pointer" onClick={() => setEditingEmployeeId(editingEmployeeId === driver.id ? null : driver.id)}>
                      <span className="font-medium">{driver.name}</span>
                      {editingEmployeeId === driver.id ? (
                        <Input
                          type="number"
                          className="w-28 h-6 text-xs text-right"
                          defaultValue={netPayOverrides[driver.id] ?? summary.netPay}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const val = +e.target.value;
                            if (val !== summary.netPay) {
                              setNetPayOverrides((prev) => ({ ...prev, [driver.id]: val }));
                            } else {
                              setNetPayOverrides((prev) => { const n = { ...prev }; delete n[driver.id]; return n; });
                            }
                            setEditingEmployeeId(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          autoFocus
                        />
                      ) : (
                        <span className={`font-bold ${netPayOverrides[driver.id] !== undefined ? "text-amber-600" : "text-brand-teal"}`}>
                          {formatCurrency(netPayOverrides[driver.id] ?? summary.netPay)}
                          {netPayOverrides[driver.id] !== undefined && <span className="ml-1 text-[10px]">(overridden)</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {computed.length === 0 ? (
              <div className="text-center py-8 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                Go back to Step 3 and click <b>Compute Now</b> first.
              </div>
            ) : (
              <Button onClick={generate} disabled={generating} className="w-full" size="lg">
                <Wallet className="w-5 h-5" />
                {generating ? "Generating..." : `Approve & Generate Payroll (${computed.length + helperComputed.length + officeComputed.length} employees + ${partnerComputed.length} partners)`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer Nav */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</div>
        {step < 5 ? (
          <Button
            onClick={() => {
              if (step === 1 && !canProceedStep1) {
                if (overlapResult.isBlocking) { toast.error("Blocking overlap — select a different date range"); return; }
                toast.error("Set a valid period"); return;
              }
              if (step === 2 && !canProceedStep2) {
                if (isBlockedByPendingTrips(totalPendingTrips, blockingThreshold)) { toast.error(`Too many pending trips (${totalPendingTrips}) — resolve before proceeding`); return; }
                if (driversWithProfilesAndWork.length === 0) { toast.error("No employees qualify for payroll in this period"); return; }
                return;
              }
              if (step === 3 && computed.length === 0) { toast.error("Compute earnings first"); return; }
              if (step === 3) {
                const hasErrors = smartWarnings.some((w) => w.severity === "error");
                if (hasErrors) {
                  const hasDupes = smartWarnings.some((w) => w.message.includes("Duplicate"));
                  if (hasDupes) { toast.error("Duplicate employees detected — cannot proceed. Fix payroll profiles first."); return; }
                  toast.error("Critical issues found — review Smart Payroll Checks before proceeding."); return;
                }
              }
              setStep(step + 1);
            }}
            disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : <div className="w-20" />}
      </div>

      {/* Inline incentive dialog */}
      <Dialog open={showIncentiveDialog} onOpenChange={setShowIncentiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Incentive</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employee</Label>
              <Select value={incentiveForm.driverId} onValueChange={(v) => setIncentiveForm({ ...incentiveForm, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{allEmployeesForSelect.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={incentiveForm.type} onValueChange={(v: any) => setIncentiveForm({ ...incentiveForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCENTIVE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₱)</Label><Input type="number" value={incentiveForm.amount} onChange={(e) => setIncentiveForm({ ...incentiveForm, amount: +e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={incentiveForm.notes} onChange={(e) => setIncentiveForm({ ...incentiveForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIncentiveDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!incentiveForm.driverId || incentiveForm.amount <= 0) { toast.error("Employee and amount required"); return; }
              addIncentive({
                ...incentiveForm,
                createdBy: user?.name ?? "admin",
                createdAt: period.endDate + "T12:00:00.000Z",
              });
              toast.success("Incentive added");
              setShowIncentiveDialog(false);
              setIncentiveForm({ driverId: "", type: "on_time_delivery", amount: 0, notes: "" });
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Deduction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Employee</Label>
              <Select value={deductionForm.driverId} onValueChange={(v) => setDeductionForm({ ...deductionForm, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{allEmployeesForSelect.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={deductionForm.type} onValueChange={(v: any) => setDeductionForm({ ...deductionForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DEDUCTION_LABEL).filter(([k]) => !["sss", "philhealth", "pagibig", "tax"].includes(k)).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₱)</Label><Input type="number" value={deductionForm.amount} onChange={(e) => setDeductionForm({ ...deductionForm, amount: +e.target.value })} /></div>
            <div><Label>Reason <span className="text-red-500">*</span></Label><Input value={deductionForm.reason} onChange={(e) => setDeductionForm({ ...deductionForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeductionDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!deductionForm.driverId || deductionForm.amount <= 0 || !deductionForm.reason.trim()) { toast.error("Employee, amount and reason required"); return; }
              addDeduction({ ...deductionForm, status: "pending", createdBy: user?.name ?? "admin" });
              toast.success("Deduction added");
              setShowDeductionDialog(false);
              setDeductionForm({ driverId: "", type: "cash_advance", amount: 0, reason: "" });
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
