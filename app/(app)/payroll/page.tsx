"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Plus, RotateCcw, Settings, FileText, Receipt, Wallet, Search,
  CheckCircle2, Clock, ShieldCheck, Archive, Eye, ChevronRight,
  Truck, HardHat, Building2, AlertCircle, DollarSign, Lock,
  Plug, BadgePercent, PiggyBank, Users, Pencil, Trash2,
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
  useDriverStore, useTripStore, useTripRateStore,
  useDriverPayrollProfileStore, useIncentiveStore, useDeductionStore,
  usePayrollPeriodStore, useHelperStore, useOfficeStaffStore,
  computeOfficeDeductions,
} from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type {
  PayrollMode, RateType, IncentiveType, DeductionType, DistanceTier,
  OfficeEmployee, OfficeDepartment, PayrollPeriodStatus,
} from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────
const STATUS_VARIANT: Record<string, any> = {
  draft: "neutral", computing: "info", ready_for_review: "warning",
  approved: "info", paid: "success", closed: "neutral",
};

const WORKFLOW_STEPS = [
  { key: "run", label: "Run Payroll", desc: "Compute earnings for the cutoff period", icon: DollarSign, color: "text-brand-teal" },
  { key: "review", label: "Review & Lock", desc: "Verify payslips and lock the run", icon: Lock, color: "text-amber-600" },
  { key: "approve", label: "Approve", desc: "Super Admin confirms amounts", icon: ShieldCheck, color: "text-blue-600" },
  { key: "pay", label: "Record Payment", desc: "Mark as paid with reference", icon: Wallet, color: "text-emerald-600" },
  { key: "close", label: "Close & Archive", desc: "Finalize for compliance", icon: Archive, color: "text-gray-500" },
];

const PAYROLL_MODE_LABEL: Record<PayrollMode, string> = {
  fixed_salary: "Fixed Salary", fixed_plus_trip: "Hybrid (Base + Trip)",
  per_trip: "Per Trip Only", per_delivery: "Per Delivery", percentage: "Commission %",
};

const RATE_TYPE_LABEL: Record<RateType, string> = {
  fixed: "Fixed Route Rate", per_km: "Per Kilometer", per_delivery: "Per Delivery",
  percentage: "Commission %", per_ton: "Per Ton", per_unit: "Per Unit",
};

const INCENTIVE_LABEL: Record<IncentiveType, string> = {
  on_time_delivery: "On-Time Delivery", fuel_efficiency: "Fuel Efficiency",
  extra_stop: "Extra Stop", holiday_trip: "Holiday Trip",
  excellent_rating: "Excellent Rating", safety_bonus: "Safety Bonus", other: "Other",
};

const DEDUCTION_LABEL: Record<DeductionType, string> = {
  cash_advance: "Cash Advance", fuel_shortage: "Fuel Shortage",
  late_delivery: "Late Delivery", vehicle_damage: "Vehicle Damage",
  violation: "Violation", uniform: "Uniform", sss: "SSS",
  philhealth: "PhilHealth", pagibig: "Pag-IBIG", tax: "Withholding Tax", other: "Other",
};

const DEPT_LABEL: Record<OfficeDepartment, string> = {
  admin: "Admin", hr: "HR", operations: "Operations",
  accounting: "Accounting", sales: "Sales", it: "IT", maintenance: "Maintenance",
};

// ─── Main Page ───────────────────────────────────────────────
export default function PayrollHubPage() {
  const trips = useTripStore((s) => s.trips);
  const resetTripsPayroll = useTripStore((s) => s.unlockAllPayroll);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const deletePeriod = usePayrollPeriodStore((s) => s.deletePeriod);
  const resetPayrollPeriods = usePayrollPeriodStore((s) => s.clearAll);
  const incentives = useIncentiveStore((s) => s.incentives);
  const resetIncentives = useIncentiveStore((s) => s.clearAll);
  const deductions = useDeductionStore((s) => s.deductions);
  const resetDeductions = useDeductionStore((s) => s.clearAll);
  const resetTripRates = useTripRateStore((s) => s.reset);
  const resetDriverProfiles = useDriverPayrollProfileStore((s) => s.reset);
  const allDrivers = useDriverStore((s) => s.drivers);
  const allHelpers = useHelperStore((s) => s.helpers);
  const officeStaff = useOfficeStaffStore((s) => s.employees);
  const resetOfficeStaff = useOfficeStaffStore((s) => s.reset);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PayrollPeriodStatus>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [payFrequency, setPayFrequency] = useState<"semi_monthly" | "monthly" | "weekly">("semi_monthly");
  const [cutoffDay1, setCutoffDay1] = useState("15");
  const [cutoffDay2, setCutoffDay2] = useState("30");

  // ─── Computed KPIs ─────────────────────────────────────────
  const stats = useMemo(() => {
    const draft = periods.filter((p) => p.status === "draft" || p.status === "computing" || p.status === "ready_for_review").length;
    const approved = periods.filter((p) => p.status === "approved").length;
    const paid = periods.filter((p) => p.status === "paid").length;
    const closed = periods.filter((p) => p.status === "closed").length;
    const totalNet = summaries.reduce((a, b) => a + b.netPay, 0);
    const totalPayslips = summaries.length;
    return { draft, approved, paid, closed, totalNet, totalPayslips };
  }, [periods, summaries]);

  // ─── Filtered periods ──────────────────────────────────────
  const filteredPeriods = useMemo(() => {
    let result = periods;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [periods, statusFilter, searchQuery]);

  // ─── Current workflow step ─────────────────────────────────
  const currentWorkflowStep = useMemo(() => {
    if (periods.length === 0) return 0;
    const latest = periods[0];
    if (!latest) return 0;
    if (latest.status === "draft" || latest.status === "computing") return 0;
    if (latest.status === "ready_for_review") return 1;
    if (latest.status === "approved") return 2;
    if (latest.status === "paid") return 3;
    if (latest.status === "closed") return 4;
    return 0;
  }, [periods]);

  // ─── Monthly payroll status ────────────────────────────────
  const monthlyStatus = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthPeriods = periods.filter((p) => p.startDate.startsWith(currentMonth));
    const completedThisMonth = thisMonthPeriods.filter((p) => ["paid", "closed"].includes(p.status)).length;
    const expectedCutoffs = payFrequency === "semi_monthly" ? 2 : payFrequency === "weekly" ? 4 : 1;
    const allDone = completedThisMonth >= expectedCutoffs;
    const nextCutoff = completedThisMonth === 0 ? "1st" : completedThisMonth === 1 ? "2nd" : null;
    return { completedThisMonth, expectedCutoffs, allDone, nextCutoff, currentMonth };
  }, [periods, payFrequency]);

  function handleResetPayroll() {
    if (!confirm("Reset ALL payroll data?\n\nThis will:\n• Delete all payroll periods & summaries\n• Clear all incentives & deductions\n• Unlock all trips\n• Reset configurations to defaults\n\nThis cannot be undone.")) return;
    resetPayrollPeriods();
    resetTripRates();
    resetDriverProfiles();
    resetIncentives();
    resetDeductions();
    resetOfficeStaff();
    resetTripsPayroll();
    toast.success("Payroll data reset — reloading...");
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy tracking-tight">Payroll Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.totalPayslips} payslips · {periods.length} periods</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleResetPayroll} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-3.5 h-3.5" /> Payroll Settings
          </Button>
          <Button size="sm" asChild>
            <Link href="/payroll/run"><Plus className="w-3.5 h-3.5" /> Run Payroll</Link>
          </Button>
        </div>
      </div>

      {/* ═══ TABBED NAVIGATION ═══ */}
      <Tabs defaultValue="payslips">
        <TabsList className="h-10 bg-white border border-brand-border shadow-sm">
          <TabsTrigger value="payslips" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Payslips</TabsTrigger>
          <TabsTrigger value="deductions" className="gap-1.5"><PiggyBank className="w-3.5 h-3.5" />Deductions</TabsTrigger>
          <TabsTrigger value="rates" className="gap-1.5"><Plug className="w-3.5 h-3.5" />Trip Rates</TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1.5"><Users className="w-3.5 h-3.5" />Pay Profiles</TabsTrigger>
          <TabsTrigger value="office" className="gap-1.5"><Building2 className="w-3.5 h-3.5" />Office Staff</TabsTrigger>
        </TabsList>

        {/* ━━━ TAB: PAYSLIPS (PRIMARY) ━━━ */}
        <TabsContent value="payslips" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            {/* LEFT: Main content */}
            <div className="space-y-4">
              {/* Status Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatusCard label="DRAFT / REVIEW" value={stats.draft} color="text-amber-600" bg="bg-amber-50" />
                <StatusCard label="APPROVED" value={stats.approved} color="text-blue-600" bg="bg-blue-50" />
                <StatusCard label="PAID" value={stats.paid} color="text-emerald-600" bg="bg-emerald-50" />
                <StatusCard label="CLOSED" value={stats.closed} color="text-gray-500" bg="bg-gray-50" />
              </div>

              {/* Search + Filter Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search period name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredPeriods.length} results</span>
              </div>

              {/* Periods Table */}
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                        <th className="py-3 px-4 font-medium">Period</th>
                        <th className="py-3 px-4 font-medium">Date Range</th>
                        <th className="py-3 px-4 font-medium text-right">Employees</th>
                        <th className="py-3 px-4 font-medium text-right">Net Total</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeriods.map((p) => {
                        const ps = summaries.filter((x) => x.payrollPeriodId === p.id);
                        const net = ps.reduce((a, b) => a + b.netPay, 0);
                        return (
                          <tr key={p.id} className="border-b border-brand-border/50 hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-brand-navy">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground">Pay: {p.payDate ? new Date(p.payDate).toLocaleDateString() : "TBD"}</div>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {new Date(p.startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – {new Date(p.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">{ps.length}</td>
                            <td className="py-3 px-4 text-right font-bold text-brand-navy">{formatCurrency(net)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={STATUS_VARIANT[p.status]}>{p.status.replace(/_/g, " ")}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                                  <Link href={`/payroll/${p.id}`}><Eye className="w-3.5 h-3.5" /></Link>
                                </Button>
                                {p.status === "draft" && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePeriod(p.id); }}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPeriods.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                          <Receipt className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                          <p className="font-medium">No payroll periods</p>
                          <p className="text-xs mt-1">Click "Run Payroll" to create your first payroll run.</p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Workflow Panel */}
            <div className="space-y-4">
              {/* Monthly Progress */}
              <Card className={monthlyStatus.allDone ? "border-emerald-200 bg-emerald-50/50" : "border-brand-teal/30"}>
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} Payroll
                  </h3>
                  {monthlyStatus.allDone ? (
                    <div className="text-center py-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">All Cutoffs Complete</p>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        {monthlyStatus.completedThisMonth}/{monthlyStatus.expectedCutoffs} periods processed. Wait for next month.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-brand-navy">{monthlyStatus.completedThisMonth}/{monthlyStatus.expectedCutoffs}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${(monthlyStatus.completedThisMonth / monthlyStatus.expectedCutoffs) * 100}%` }} />
                      </div>
                      {monthlyStatus.nextCutoff && (
                        <p className="text-[11px] text-brand-teal font-medium">
                          → {monthlyStatus.nextCutoff} cutoff {monthlyStatus.completedThisMonth > 0 ? "pending" : "ready to run"}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workflow Steps */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Payroll Workflow</h3>
                  <div className="space-y-1">
                    {WORKFLOW_STEPS.map((step, i) => {
                      const isActive = i === currentWorkflowStep && periods.length > 0;
                      const isDone = i < currentWorkflowStep && periods.length > 0;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isActive ? "bg-brand-teal/5 ring-1 ring-brand-teal/30" : isDone ? "bg-gray-50" : ""
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isDone ? "bg-emerald-100" : isActive ? "bg-brand-teal/10" : "bg-gray-100"
                          }`}>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Icon className={`w-4 h-4 ${isActive ? step.color : "text-gray-400"}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? "text-brand-navy" : isDone ? "text-emerald-700" : "text-gray-400"}`}>
                                {step.label}
                              </span>
                              {isActive && <Badge variant="info" className="text-[9px] px-1.5 py-0">NOW</Badge>}
                              {isDone && <Badge variant="success" className="text-[9px] px-1.5 py-0">DONE</Badge>}
                            </div>
                            <p className={`text-[11px] leading-relaxed mt-0.5 ${isActive || isDone ? "text-muted-foreground" : "text-gray-300"}`}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Summary</h3>
                  <div className="space-y-2">
                    <QuickStat label="Total Payslips" value={String(stats.totalPayslips)} />
                    <QuickStat label="Total Net Released" value={formatCurrency(stats.totalNet)} highlight />
                    <QuickStat label="Active Drivers" value={String(allDrivers.filter((d) => d.status === "active").length)} />
                    <QuickStat label="Active Helpers" value={String(allHelpers.filter((h) => h.status === "active").length)} />
                    <QuickStat label="Office Staff" value={String(officeStaff.filter((e) => e.status === "active").length)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ━━━ TAB: DEDUCTIONS ━━━ */}
        <TabsContent value="deductions" className="mt-4"><DeductionsTab /></TabsContent>

        {/* ━━━ TAB: TRIP RATES ━━━ */}
        <TabsContent value="rates" className="mt-4"><TripRatesTab /></TabsContent>

        {/* ━━━ TAB: PAY PROFILES ━━━ */}
        <TabsContent value="profiles" className="mt-4"><PayProfilesTab /></TabsContent>

        {/* ━━━ TAB: OFFICE STAFF ━━━ */}
        <TabsContent value="office" className="mt-4"><OfficeStaffTab /></TabsContent>
      </Tabs>

      {/* ═══ PAYROLL SETTINGS MODAL ═══ */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-teal" /> Payroll Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pay Frequency</Label>
              <Select value={payFrequency} onValueChange={(v: any) => setPayFrequency(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semi_monthly">Semi-Monthly (1st-15th & 16th-end)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st-end)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Philippine standard: Semi-monthly (PH Labor Code Art. 103)</p>
            </div>
            {payFrequency === "semi_monthly" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>1st Cutoff Day</Label>
                  <Input type="number" min="1" max="15" value={cutoffDay1} onChange={(e) => setCutoffDay1(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>2nd Cutoff Day</Label>
                  <Input type="number" min="16" max="31" value={cutoffDay2} onChange={(e) => setCutoffDay2(e.target.value)} className="mt-1" />
                </div>
              </div>
            )}
            <div className="border-t border-brand-border pt-3 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Government Contribution Rates (BIR 2026)</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-bold text-brand-navy">SSS</div>
                  <div className="text-muted-foreground">4.5% employee share</div>
                  <div className="text-muted-foreground">Max ₱1,350/mo</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-bold text-brand-navy">PhilHealth</div>
                  <div className="text-muted-foreground">2.5% employee share</div>
                  <div className="text-muted-foreground">Max ₱2,500/mo</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-bold text-brand-navy">Pag-IBIG</div>
                  <div className="text-muted-foreground">2% for salary &gt;₱1,500</div>
                  <div className="text-muted-foreground">Max ₱200/mo</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border">
                  <div className="font-bold text-brand-navy">Withholding Tax</div>
                  <div className="text-muted-foreground">TRAIN Law brackets</div>
                  <div className="text-muted-foreground">0-35% progressive</div>
                </div>
              </div>
            </div>
            <div className="border-t border-brand-border pt-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Pay Schedule</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Cutoff A: Day 1 – Day {cutoffDay1} → Pay on Day {parseInt(cutoffDay1) + 5}</p>
                <p>• Cutoff B: Day {parseInt(cutoffDay1) + 1} – Day {cutoffDay2} → Pay on Day 5 (next month)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Close</Button>
            <Button onClick={() => { toast.success("Settings saved"); setShowSettings(false); }}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────

function StatusCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <Card className="border-brand-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${value > 0 ? color : "text-gray-300"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-brand-teal" : "text-brand-navy"}`}>{value}</span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// DEDUCTIONS TAB
// ═══════════════════════════════════════════════════════════════
function DeductionsTab() {
  const deductions = useDeductionStore((s) => s.deductions);
  const addDeduction = useDeductionStore((s) => s.addDeduction);
  const deleteDeduction = useDeductionStore((s) => s.deleteDeduction);
  const incentives = useIncentiveStore((s) => s.incentives);
  const addIncentive = useIncentiveStore((s) => s.addIncentive);
  const deleteIncentive = useIncentiveStore((s) => s.deleteIncentive);
  const drivers = useDriverStore((s) => s.drivers);
  const user = useAuthStore((s) => s.user);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"incentive" | "deduction">("deduction");
  const [form, setForm] = useState({ driverId: "", type: "cash_advance", amount: 0, reason: "" });

  function save() {
    if (!form.driverId || form.amount <= 0) { toast.error("Driver and amount required"); return; }
    if (addType === "deduction") {
      if (!form.reason.trim()) { toast.error("Reason is legally required"); return; }
      addDeduction({ driverId: form.driverId, type: form.type as any, amount: form.amount, reason: form.reason, status: "pending", createdBy: user?.name ?? "admin" });
    } else {
      addIncentive({ driverId: form.driverId, type: form.type as any, amount: form.amount, notes: form.reason, createdBy: user?.name ?? "admin" });
    }
    toast.success(`${addType === "deduction" ? "Deduction" : "Incentive"} added`);
    setShowAdd(false);
    setForm({ driverId: "", type: "cash_advance", amount: 0, reason: "" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brand-navy">Deductions & Incentives</h3>
          <p className="text-xs text-muted-foreground">Track cash advances, penalties, bonuses, and rewards.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setAddType("incentive"); setForm({ ...form, type: "on_time_delivery" }); setShowAdd(true); }}>
            <Plus className="w-3.5 h-3.5" /> Incentive
          </Button>
          <Button size="sm" onClick={() => { setAddType("deduction"); setForm({ ...form, type: "cash_advance" }); setShowAdd(true); }}>
            <Plus className="w-3.5 h-3.5" /> Deduction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deductions */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-red-700 mb-3">Deductions ({deductions.length})</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {deductions.slice(0, 20).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100 text-xs">
                  <div>
                    <div className="font-medium text-brand-navy">{drivers.find((x) => x.id === d.driverId)?.name ?? d.driverId}</div>
                    <div className="text-muted-foreground">{DEDUCTION_LABEL[d.type] ?? d.type} · {d.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">−{formatCurrency(d.amount)}</div>
                    <Badge variant={d.status === "applied" ? "success" : "warning"} className="text-[9px]">{d.status}</Badge>
                  </div>
                </div>
              ))}
              {deductions.length === 0 && <p className="text-center text-muted-foreground py-6 text-xs">No deductions</p>}
            </div>
          </CardContent>
        </Card>

        {/* Incentives */}
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-emerald-700 mb-3">Incentives ({incentives.length})</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {incentives.slice(0, 20).map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
                  <div>
                    <div className="font-medium text-brand-navy">{drivers.find((x) => x.id === i.driverId)?.name ?? i.driverId}</div>
                    <div className="text-muted-foreground">{INCENTIVE_LABEL[i.type] ?? i.type}{i.notes ? ` · ${i.notes}` : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+{formatCurrency(i.amount)}</div>
                    <span className="text-[9px] text-muted-foreground">{i.payrollPeriodId ? "Locked" : "Pending"}</span>
                  </div>
                </div>
              ))}
              {incentives.length === 0 && <p className="text-center text-muted-foreground py-6 text-xs">No incentives</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add {addType === "deduction" ? "Deduction" : "Incentive"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(addType === "deduction" ? DEDUCTION_LABEL : INCENTIVE_LABEL)
                    .filter(([k]) => !["sss", "philhealth", "pagibig", "tax"].includes(k))
                    .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₱)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
            <div><Label>{addType === "deduction" ? "Reason *" : "Notes"}</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={save}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRIP RATES TAB
// ═══════════════════════════════════════════════════════════════
function TripRatesTab() {
  const rates = useTripRateStore((s) => s.rates);
  const addRate = useTripRateStore((s) => s.addRate);
  const deleteRate = useTripRateStore((s) => s.deleteRate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brand-navy">Trip Rate Matrix</h3>
          <p className="text-xs text-muted-foreground">Configure how drivers/helpers are paid per route, vehicle, and rate model.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                <th className="py-3 px-4 font-medium">Rate Name</th>
                <th className="py-3 px-4 font-medium">Vehicle</th>
                <th className="py-3 px-4 font-medium">Route</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-brand-border/50 hover:bg-gray-50/80">
                  <td className="py-2.5 px-4 font-medium text-brand-navy">{r.name}</td>
                  <td className="py-2.5 px-4 text-xs">{r.vehicleType}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">{r.routeOrigin} → {r.routeDestination}</td>
                  <td className="py-2.5 px-4"><Badge variant="info" className="text-[10px]">{RATE_TYPE_LABEL[r.rateType]}</Badge></td>
                  <td className="py-2.5 px-4 text-right font-bold">
                    {r.rateType === "fixed" && formatCurrency(r.fixedRate ?? 0)}
                    {r.rateType === "per_km" && `${formatCurrency(r.ratePerKm ?? 0)}/km`}
                    {r.rateType === "per_delivery" && `${formatCurrency(r.ratePerDelivery ?? 0)}/drop`}
                    {r.rateType === "percentage" && `${r.commissionPercent ?? 0}%`}
                    {r.rateType === "per_ton" && `${formatCurrency(r.ratePerTon ?? 0)}/ton`}
                    {r.rateType === "per_unit" && `${formatCurrency(r.ratePerUnit ?? 0)}/unit`}
                  </td>
                  <td className="py-2.5 px-4">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { if (confirm("Delete?")) deleteRate(r.id); }}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">No trip rates configured.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAY PROFILES TAB
// ═══════════════════════════════════════════════════════════════
function PayProfilesTab() {
  const drivers = useDriverStore((s) => s.drivers);
  const helpers = useHelperStore((s) => s.helpers);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "helper">("all");

  const items = useMemo(() => {
    const driverItems = drivers.map((d) => ({
      id: d.id, name: d.name, role: "Driver" as const,
      profile: profiles.find((p) => p.driverId === d.id),
      baseSalary: profiles.find((p) => p.driverId === d.id)?.baseSalary ?? 0,
    }));
    const helperItems = helpers.map((h) => ({
      id: h.id, name: h.name, role: "Helper" as const,
      profile: null,
      baseSalary: h.monthlyBaseSalary ?? 0,
    }));
    let all = [...driverItems, ...helperItems];
    if (roleFilter === "driver") all = driverItems;
    if (roleFilter === "helper") all = helperItems;
    return all;
  }, [drivers, helpers, profiles, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brand-navy">Pay Profiles</h3>
          <p className="text-xs text-muted-foreground">Payroll mode, base salary, and deduction settings per employee.</p>
        </div>
        <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="driver">Drivers</SelectItem>
            <SelectItem value="helper">Helpers</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                <th className="py-3 px-4 font-medium">Employee</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Payroll Mode</th>
                <th className="py-3 px-4 font-medium text-right">Base Salary</th>
                <th className="py-3 px-4 font-medium">Gov Deductions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-brand-border/50 hover:bg-gray-50/80">
                  <td className="py-2.5 px-4 font-medium text-brand-navy">{item.name}</td>
                  <td className="py-2.5 px-4"><Badge variant={item.role === "Helper" ? "purple" : "info"} className="text-[10px]">{item.role}</Badge></td>
                  <td className="py-2.5 px-4">
                    {item.profile ? (
                      <Badge variant="neutral" className="text-[10px]">{PAYROLL_MODE_LABEL[item.profile.payrollMode]}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.baseSalary > 0 ? "Monthly + Trip" : "Per Trip"}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{item.baseSalary > 0 ? formatCurrency(item.baseSalary) : "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">
                    {item.profile ? [item.profile.sssEnabled && "SSS", item.profile.philhealthEnabled && "PhilHealth", item.profile.pagibigEnabled && "Pag-IBIG"].filter(Boolean).join(" · ") || "None" : "SSS · PhilHealth · Pag-IBIG"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OFFICE STAFF TAB
// ═══════════════════════════════════════════════════════════════
function OfficeStaffTab() {
  const employees = useOfficeStaffStore((s) => s.employees);
  const addEmployee = useOfficeStaffStore((s) => s.addEmployee);
  const deleteEmployee = useOfficeStaffStore((s) => s.deleteEmployee);

  const activeStaff = employees.filter((e) => e.status === "active");
  const totalGross = activeStaff.reduce((a, e) => a + e.monthlySalary, 0);
  const totalNet = activeStaff.reduce((a, e) => a + computeOfficeDeductions(e.monthlySalary, e).netPay, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-brand-navy">Office Staff Payroll</h3>
          <p className="text-xs text-muted-foreground">Fixed monthly-salary employees (admin, HR, accounting, etc.)</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="text-center px-3 py-1.5 bg-gray-50 rounded-lg border">
            <div className="font-bold text-brand-navy">{activeStaff.length}</div>
            <div className="text-muted-foreground">Active</div>
          </div>
          <div className="text-center px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="font-bold text-emerald-700">{formatCurrency(totalNet)}</div>
            <div className="text-emerald-600">Monthly Net</div>
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                <th className="py-3 px-4 font-medium">Employee</th>
                <th className="py-3 px-4 font-medium">Department</th>
                <th className="py-3 px-4 font-medium">Position</th>
                <th className="py-3 px-4 font-medium text-right">Gross</th>
                <th className="py-3 px-4 font-medium text-right">Deductions</th>
                <th className="py-3 px-4 font-medium text-right">Net Pay</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const ded = computeOfficeDeductions(e.monthlySalary, e);
                return (
                  <tr key={e.id} className="border-b border-brand-border/50 hover:bg-gray-50/80">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-brand-navy">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">{e.email}</div>
                    </td>
                    <td className="py-2.5 px-4"><Badge variant="info" className="text-[10px]">{DEPT_LABEL[e.department]}</Badge></td>
                    <td className="py-2.5 px-4 text-xs">{e.position}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(e.monthlySalary)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-red-600">−{formatCurrency(ded.totalDeductions)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-brand-teal">{formatCurrency(ded.netPay)}</td>
                    <td className="py-2.5 px-4"><Badge variant={e.status === "active" ? "success" : "neutral"} className="text-[10px]">{e.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
