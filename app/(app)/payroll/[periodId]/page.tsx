"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Wallet, FileText, Printer, AlertCircle, Eye,
  Lock, ChevronDown, ChevronUp, Info, Archive, ShieldCheck, DollarSign,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDriverStore, useHelperStore, useOfficeStaffStore, useTripStore, usePayrollPeriodStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { PayrollPeriodStatus } from "@/lib/types";

// ── Status config ────────────────────────────────────────────
const STEPS: { key: PayrollPeriodStatus; label: string; short: string }[] = [
  { key: "draft",            label: "Draft",            short: "Draft" },
  { key: "computing",        label: "Computing",        short: "Computing" },
  { key: "ready_for_review", label: "Ready for Review", short: "Review" },
  { key: "approved",         label: "Approved",         short: "Approved" },
  { key: "paid",             label: "Paid",             short: "Paid" },
  { key: "closed",           label: "Closed",           short: "Closed" },
];
const STEP_IDX: Record<string, number> = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

const STATUS_VARIANT: Record<string, any> = {
  draft: "neutral", computing: "info", ready_for_review: "warning",
  approved: "info", paid: "success", closed: "neutral",
};

const WORKFLOW_GUIDE = [
  {
    title: "1 · Draft",
    desc: "Period created. Dates and employee list are set. No computation yet.",
    action: "Click 'Run Payroll Computation' to process earnings.",
  },
  {
    title: "2 · Computing",
    desc: "System is processing trip earnings, rate matrices, incentives, and government deductions.",
    action: "Wait — computation is automatic.",
  },
  {
    title: "3 · Ready for Review",
    desc: "Computation complete. Review each payslip — verify base, trips, incentives, and deductions.",
    action: "Click the eye icon per employee. Then click 'Approve Payroll'.",
  },
  {
    title: "4 · Approved",
    desc: "Payroll locked by Super Admin. Data is frozen. No further edits allowed.",
    action: "Click 'Mark as Paid' after releasing funds to employees.",
  },
  {
    title: "5 · Paid",
    desc: "Funds released. Payment method, reference, and actual pay date recorded.",
    action: "Click 'Close & Archive Period' to finalize.",
  },
  {
    title: "6 · Closed",
    desc: "Permanently archived. All records preserved for compliance and audit.",
    action: "For corrections, open a new adjustment period.",
  },
];

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash",          label: "Cash" },
  { value: "check",         label: "Check" },
  { value: "gcash",         label: "GCash / e-Wallet" },
];

export default function PayrollPeriodDetailPage() {
  const params = useParams<{ periodId: string }>();
  const router = useRouter();
  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const tripPayrolls = usePayrollPeriodStore((s) => s.tripPayrolls);
  const approvePeriod = usePayrollPeriodStore((s) => s.approvePeriod);
  const payPeriod = usePayrollPeriodStore((s) => s.payPeriod);
  const closePeriod = usePayrollPeriodStore((s) => s.closePeriod);
  const drivers = useDriverStore((s) => s.drivers);
  const helpers = useHelperStore((s) => s.helpers);
  const officeStaff = useOfficeStaffStore((s) => s.employees);
  const trips = useTripStore((s) => s.trips);
  const user = useAuthStore((s) => s.user);

  const period = periods.find((p) => p.id === params.periodId);
  const periodSummaries = summaries.filter((s) => s.payrollPeriodId === params.periodId);
  const periodTripPayrolls = tripPayrolls.filter((tp) => tp.payrollPeriodId === params.periodId);

  const [openPayslip, setOpenPayslip] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "helper" | "office">("all");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState("");

  const totals = useMemo(() => ({
    gross: periodSummaries.reduce((a, b) => a + b.grossPay, 0),
    deductions: periodSummaries.reduce((a, b) => a + b.totalDeductions, 0),
    net: periodSummaries.reduce((a, b) => a + b.netPay, 0),
    trips: periodSummaries.reduce((a, b) => a + b.tripsCount, 0),
    tripEarnings: periodSummaries.reduce((a, b) => a + b.tripEarnings, 0),
    incentives: periodSummaries.reduce((a, b) => a + b.incentives, 0),
  }), [periodSummaries]);

  if (!period) {
    return (
      <Card><CardContent className="p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <p className="text-lg font-bold">Payroll Period not found</p>
        <Button asChild className="mt-4"><Link href="/payroll"><ArrowLeft className="w-4 h-4" /> Back to Payroll</Link></Button>
      </CardContent></Card>
    );
  }

  const curIdx = STEP_IDX[period.status] ?? 0;
  const isLocked = ["approved", "paid", "closed"].includes(period.status);
  const isAdmin = user?.role === "super_admin" || user?.role === "company_admin";

  const handleApprove = () => {
    approvePeriod(period.id, user?.name ?? "Admin", approveNotes || undefined);
    toast.success("Payroll approved and locked for payment");
    setShowApproveDialog(false); setApproveNotes("");
  };
  const handlePay = () => {
    if (!payRef.trim()) { toast.error("Payment reference number is required."); return; }
    payPeriod(period.id, user?.name ?? "Admin", payMethod, payRef, payDate, payNotes || undefined);
    toast.success("Payroll marked as paid · Records updated");
    setShowPayDialog(false); setPayRef(""); setPayNotes("");
  };
  const handleClose = () => {
    closePeriod(period.id, user?.name ?? "Admin");
    toast.success("Payroll period archived and closed");
    setShowCloseDialog(false);
    router.push("/payroll");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={period.name}
        subtitle={`${new Date(period.startDate).toLocaleDateString("en-PH", { dateStyle: "medium" })} – ${new Date(period.endDate).toLocaleDateString("en-PH", { dateStyle: "medium" })} · Pay date: ${period.payDate ? new Date(period.payDate).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "TBD"}`}
        breadcrumbs={[{ label: "Finance" }, { label: "Payroll", href: "/payroll" }, { label: period.name }]}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Badge variant={STATUS_VARIANT[period.status]}>{period.status.replace(/_/g, " ")}</Badge>
            {isLocked && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" /> Locked
              </span>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/payroll"><ArrowLeft className="w-4 h-4" /> Back</Link>
            </Button>
          </div>
        }
      />

      {/* ── Workflow Stepper ──────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-brand-navy">Payroll Workflow</p>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-brand-teal flex items-center gap-1 hover:underline"
            >
              <Info className="w-3.5 h-3.5" />
              {showGuide ? "Hide guide" : "Show workflow guide"}
              {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center overflow-x-auto pb-1">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center shrink-0">
                <div className={`flex flex-col items-center gap-1 px-2 ${i <= curIdx ? "opacity-100" : "opacity-35"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < curIdx  ? "bg-emerald-500 border-emerald-500 text-white" :
                    i === curIdx ? "bg-brand-teal border-brand-teal text-white ring-2 ring-brand-teal/30" :
                                   "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {i < curIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${
                    i < curIdx ? "text-emerald-600" : i === curIdx ? "text-brand-teal" : "text-gray-400"
                  }`}>{step.short}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 shrink-0 ${i < curIdx ? "bg-emerald-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {showGuide && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {WORKFLOW_GUIDE.map((ws, i) => (
                <div key={i} className={`rounded-lg border p-3 text-xs space-y-1 ${
                  i === curIdx ? "border-brand-teal/60 bg-brand-teal/5" : "border-brand-border/60 bg-gray-50/60"
                }`}>
                  <div className={`font-semibold ${i === curIdx ? "text-brand-teal" : "text-brand-navy"}`}>{ws.title}</div>
                  <p className="text-muted-foreground leading-relaxed">{ws.desc}</p>
                  <p className="font-medium text-brand-navy">→ {ws.action}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lock Banner ───────────────────────────────────── */}
      {isLocked && (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 text-sm ${
          period.status === "closed" ? "bg-slate-50 border-slate-200" :
          period.status === "paid"   ? "bg-emerald-50 border-emerald-200" :
                                       "bg-brand-teal-light border-brand-teal/40"
        }`}>
          <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${
            period.status === "closed" ? "text-slate-400" :
            period.status === "paid"   ? "text-emerald-600" : "text-brand-teal"
          }`} />
          <div>
            <p className="font-semibold text-brand-navy">
              {period.status === "closed" ? "Period Archived" :
               period.status === "paid"   ? "Payroll Released — Records Locked" :
                                            "Payroll Approved — Awaiting Payment Release"}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {period.status === "approved" && period.approvedBy &&
                `Approved by ${period.approvedBy} on ${new Date(period.approvedAt!).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}.`}
              {period.status === "paid" && period.paidBy &&
                `Marked paid by ${period.paidBy} on ${new Date(period.paidAt!).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}.`}
              {period.status === "closed" && " All records preserved for audit."}
              {" "}No edits are allowed on locked payroll data.
            </p>
          </div>
        </div>
      )}

      {/* ── Primary Action Buttons ────────────────────────── */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3">
          {period.status === "draft" && (
            <Button asChild>
              <Link href={`/payroll/run?period=${period.id}`}>
                <DollarSign className="w-4 h-4" /> Run Payroll Computation
              </Link>
            </Button>
          )}
          {period.status === "ready_for_review" && (
            <Button onClick={() => setShowApproveDialog(true)} className="bg-brand-teal hover:bg-brand-teal/90 text-white">
              <ShieldCheck className="w-4 h-4" /> Review &amp; Approve Payroll
            </Button>
          )}
          {period.status === "approved" && (
            <Button onClick={() => setShowPayDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Wallet className="w-4 h-4" /> Mark as Paid
            </Button>
          )}
          {period.status === "paid" && (
            <Button variant="outline" onClick={() => setShowCloseDialog(true)}>
              <Archive className="w-4 h-4" /> Close &amp; Archive Period
            </Button>
          )}
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Employees</div>
          <div className="text-2xl font-bold text-brand-navy">{periodSummaries.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Trips</div>
          <div className="text-2xl font-bold text-brand-navy">{totals.trips}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Trip Earnings</div>
          <div className="text-lg font-bold text-brand-navy">{formatCurrency(totals.tripEarnings)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Incentives</div>
          <div className="text-lg font-bold text-emerald-600">{formatCurrency(totals.incentives)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Gross Pay</div>
          <div className="text-lg font-bold text-brand-navy">{formatCurrency(totals.gross)}</div>
        </CardContent></Card>
        <Card className="bg-brand-teal/10 border-brand-teal/40"><CardContent className="p-4">
          <div className="text-[10px] uppercase text-brand-teal tracking-wide font-bold">Total Net</div>
          <div className="text-lg font-bold text-brand-teal">{formatCurrency(totals.net)}</div>
        </CardContent></Card>
      </div>

      {/* ── Audit Trail ───────────────────────────────────── */}
      {isLocked && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-brand-navy flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-brand-teal" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {period.generatedBy && (
              <AuditRow icon={<DollarSign className="w-3.5 h-3.5 text-sky-500" />}
                label="Computed" by={period.generatedBy} at={period.generatedAt} />
            )}
            {period.approvedBy && (
              <AuditRow icon={<ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />}
                label="Approved" by={period.approvedBy} at={period.approvedAt}
                notes={(period.status === "approved" ? period.notes : undefined)} />
            )}
            {period.paidBy && (
              <AuditRow icon={<Wallet className="w-3.5 h-3.5 text-emerald-500" />}
                label="Paid" by={period.paidBy} at={period.paidAt}
                extra={(period as any).paymentMethod
                  ? `${PAYMENT_METHODS.find((m) => m.value === (period as any).paymentMethod)?.label ?? (period as any).paymentMethod} · Ref: ${(period as any).paymentRef ?? "—"}`
                  : undefined}
                notes={period.notes} />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Payroll Table ─────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-brand-navy">Employee Payslips</p>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="driver">Drivers Only</SelectItem>
                  <SelectItem value="helper">Helpers Only</SelectItem>
                  <SelectItem value="office">Office Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Employee</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Mode</th>
                <th className="py-3 px-4 font-medium text-right">Trips</th>
                <th className="py-3 px-4 font-medium text-right">Trip Earnings</th>
                <th className="py-3 px-4 font-medium text-right">Base Salary</th>
                <th className="py-3 px-4 font-medium text-right">Incentives</th>
                <th className="py-3 px-4 font-medium text-right">Deductions</th>
                <th className="py-3 px-4 font-medium text-right">Net Pay</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {periodSummaries
                .filter((s) => {
                  if (roleFilter === "all") return true;
                  const isHelper = s.driverId.startsWith("h-");
                  const isOffice = s.driverId.startsWith("oe-");
                  if (roleFilter === "office") return isOffice;
                  if (roleFilter === "helper") return isHelper;
                  return !isHelper && !isOffice; // driver
                })
                .map((s) => {
                const isHelper = s.driverId.startsWith("h-");
                const isOffice = s.driverId.startsWith("oe-");
                const driver = drivers.find((d) => d.id === s.driverId);
                const helper = helpers.find((h) => h.id === s.driverId);
                const office = officeStaff.find((e) => e.id === s.driverId);
                const empName = driver?.name ?? helper?.name ?? office?.name ?? s.driverId;
                const empSub = driver?.licenseNumber ?? helper?.phone ?? office?.position ?? "";
                const roleBadge = isOffice ? "Office" : isHelper ? "Helper" : "Driver";
                const roleVariant = isOffice ? "neutral" : isHelper ? "purple" : "info";
                return (
                  <tr key={s.id} className="border-b border-brand-border/60 hover:bg-gray-50 group">
                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-navy">{empName}</div>
                      <div className="text-[10px] text-muted-foreground">{empSub}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={roleVariant as any} className="text-[10px]">
                        {roleBadge}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" className="text-[10px]">{s.payrollMode.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">{s.tripsCount}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(s.tripEarnings)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(s.baseSalary)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">{s.incentives > 0 ? `+${formatCurrency(s.incentives)}` : "—"}</td>
                    <td className="py-3 px-4 text-right font-mono text-red-600">{s.totalDeductions > 0 ? `−${formatCurrency(s.totalDeductions)}` : "—"}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-brand-teal">{formatCurrency(s.netPay)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>
                        {s.status === "paid" && <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />}
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost" className="opacity-60 group-hover:opacity-100" onClick={() => setOpenPayslip(s.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {periodSummaries.length === 0 && (
                <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">
                  No payroll summaries for this period. Run computation first.
                </td></tr>
              )}
            </tbody>
            {periodSummaries.length > 0 && (
              <tfoot>
                <tr className="bg-brand-navy/5 border-t-2 border-brand-border font-semibold">
                  <td className="py-3 px-4" colSpan={4}>Totals ({periodSummaries.length} employees)</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(totals.tripEarnings)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(periodSummaries.reduce((a, b) => a + b.baseSalary, 0))}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600">+{formatCurrency(totals.incentives)}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">−{formatCurrency(totals.deductions)}</td>
                  <td className="py-3 px-4 text-right font-mono text-brand-teal text-base">{formatCurrency(totals.net)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════
          APPROVE DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy">
              <ShieldCheck className="w-5 h-5 text-brand-teal" /> Approve Payroll — {period.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-xs">
              <p className="font-semibold mb-1">⚠ This action locks the payroll</p>
              <p>Once approved, no changes can be made to earnings, deductions, or employee data for this period. Verify all payslips before proceeding.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryBox label="Employees" value={String(periodSummaries.length)} />
              <SummaryBox label="Total Trips" value={String(totals.trips)} />
              <SummaryBox label="Gross Pay" value={formatCurrency(totals.gross)} />
              <SummaryBox label="Total Net Pay" value={formatCurrency(totals.net)} highlight />
            </div>
            <div>
              <Label>Approval Notes (optional)</Label>
              <Textarea
                rows={2} value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. All payslips verified. Approved for May 2026 Cut-off A."
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Approving as: <strong>{user?.name}</strong> · {new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} className="bg-brand-teal hover:bg-brand-teal/90 text-white">
              <ShieldCheck className="w-4 h-4" /> Confirm Approval &amp; Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          PAY DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy">
              <Wallet className="w-5 h-5 text-emerald-600" /> Record Payment — {period.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-brand-teal-light border border-brand-teal/40 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Amount to Release</p>
              <p className="text-3xl font-bold text-brand-teal mt-1">{formatCurrency(totals.net)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{periodSummaries.length} employees</p>
            </div>
            <div>
              <Label>Payment Method *</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference Number / Transaction ID *</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. BPI-20260515-00142 or Check #10045" className="mt-1" />
            </div>
            <div>
              <Label>Actual Pay Date *</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Payment Notes (optional)</Label>
              <Textarea rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. Released via BPI payroll facility." className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Recorded by: <strong>{user?.name}</strong> · {new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancel</Button>
            <Button onClick={handlePay} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Wallet className="w-4 h-4" /> Confirm Payment Released
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          CLOSE DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy">
              <Archive className="w-5 h-5 text-slate-500" /> Archive Period
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-700 text-xs">
              <p className="font-semibold mb-1">This action is permanent</p>
              <p>Closing archives all records. Payslips remain printable but no changes are allowed. For corrections, open a new adjustment period.</p>
            </div>
            <SummaryBox label="Net Released" value={formatCurrency(totals.net)} highlight />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
            <Button onClick={handleClose} variant="outline" className="border-slate-400 text-slate-700">
              <Archive className="w-4 h-4" /> Close &amp; Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          PAYSLIP DIALOG
      ════════════════════════════════════════════════════ */}
      <Dialog open={!!openPayslip} onOpenChange={(o) => !o && setOpenPayslip(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {(() => {
            const s = periodSummaries.find((x) => x.id === openPayslip);
            if (!s) return null;
            const isHelper = s.driverId.startsWith("h-");
            const isOffice = s.driverId.startsWith("oe-");
            const driver = drivers.find((d) => d.id === s.driverId);
            const helper = helpers.find((h) => h.id === s.driverId);
            const office = officeStaff.find((e) => e.id === s.driverId);
            const empName = driver?.name ?? helper?.name ?? office?.name ?? s.driverId;
            const empId = driver?.licenseNumber ?? helper?.phone ?? office?.position ?? s.driverId;
            const empRole = isOffice ? "Office" : isHelper ? "Helper" : "Driver";
            const driverTripPayrolls = periodTripPayrolls.filter((tp) => tp.driverId === s.driverId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-teal" />
                    Payslip · {empName}
                    <Badge variant={isOffice ? "neutral" : isHelper ? "purple" : "info"} className="text-[10px] ml-1">{empRole}</Badge>
                    {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1" />}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border border-brand-border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <SlipRow label="Employee" value={empName} />
                      <SlipRow label={isOffice ? "Position" : isHelper ? "Phone" : "License No."} value={empId} />
                      <SlipRow label="Period" value={period.name} />
                      <SlipRow label="Pay Date" value={period.payDate ? new Date(period.payDate).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "TBD"} />
                      <SlipRow label="Mode" value={s.payrollMode.replace(/_/g, " ")} badge="info" />
                      <SlipRow label="Status" value={s.status} badge={STATUS_VARIANT[s.status]} />
                    </div>
                  </div>

                  {driverTripPayrolls.length > 0 && (
                    <div>
                      <h4 className="font-bold text-brand-navy text-sm mb-2">
                        Trip Earnings ({driverTripPayrolls.length} trip{driverTripPayrolls.length !== 1 ? "s" : ""})
                      </h4>
                      <div className="border border-brand-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium">Trip ID</th>
                              <th className="text-left py-2 px-3 font-medium">Route</th>
                              <th className="text-right py-2 px-3 font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverTripPayrolls.map((tp) => {
                              const t = trips.find((x) => x.id === tp.tripId);
                              return (
                                <tr key={tp.id} className="border-t border-brand-border/60">
                                  <td className="py-2 px-3 font-mono">{tp.tripId}</td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {t ? `${t.pickup.address.split(",")[0]} → ${t.dropoff.address.split(",")[0]}` : "—"}
                                    {tp.tonAmount > 0 && <div className="text-[10px] text-sky-700 mt-0.5">Ton-based: {formatCurrency(tp.tonAmount)}</div>}
                                    {tp.unitAmount > 0 && <div className="text-[10px] text-violet-700 mt-0.5">Unit-based: {formatCurrency(tp.unitAmount)}</div>}
                                    {tp.tierMultiplier !== 1 && (
                                      <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1 py-0.5">
                                        ×{tp.tierMultiplier} distance tier
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(tp.finalAmount)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                      <div className="text-xs uppercase text-emerald-700 font-bold mb-2">Earnings</div>
                      <div className="space-y-1 text-sm">
                        <PayslipLine label="Base Salary" value={formatCurrency(s.baseSalary)} />
                        <PayslipLine label="Trip Earnings" value={formatCurrency(s.tripEarnings)} />
                        <PayslipLine label="Incentives" value={formatCurrency(s.incentives)} />
                        <PayslipLine label="Allowances" value={formatCurrency(s.allowances)} />
                        <PayslipLine label="Overtime" value={formatCurrency(s.overtimeAmount)} />
                        <div className="flex justify-between border-t border-emerald-300 pt-1 font-bold">
                          <span>Gross Pay</span><span>{formatCurrency(s.grossPay)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-3 bg-rose-50">
                      <div className="text-xs uppercase text-rose-700 font-bold mb-2">Deductions</div>
                      <div className="space-y-1 text-sm">
                        <PayslipLine label="SSS" value={`−${formatCurrency(s.sssDeduction)}`} />
                        <PayslipLine label="PhilHealth" value={`−${formatCurrency(s.philhealthDeduction)}`} />
                        <PayslipLine label="Pag-IBIG" value={`−${formatCurrency(s.pagibigDeduction)}`} />
                        <PayslipLine label="Withholding Tax" value={`−${formatCurrency(s.taxDeduction)}`} />
                        <PayslipLine label="Cash Advance" value={`−${formatCurrency(s.cashAdvanceDeduction)}`} />
                        <PayslipLine label="Other" value={`−${formatCurrency(s.otherDeductions)}`} />
                        <div className="flex justify-between border-t border-rose-300 pt-1 font-bold">
                          <span>Total</span><span>−{formatCurrency(s.totalDeductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-teal/10 border border-brand-teal/40 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase text-brand-teal font-bold">NET PAY</div>
                      <div className="text-xs text-muted-foreground">Take-home for {period.name}</div>
                      {s.paidAt && (
                        <div className="text-xs text-emerald-600 mt-0.5">
                          Paid: {new Date(s.paidAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-brand-teal">{formatCurrency(s.netPay)}</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print Payslip</Button>
                  <Button onClick={() => setOpenPayslip(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SummaryBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? "bg-brand-teal/10 border-brand-teal/40" : "bg-gray-50 border-brand-border/60"}`}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-bold mt-0.5 ${highlight ? "text-brand-teal text-lg" : "text-brand-navy"}`}>{value}</p>
    </div>
  );
}

function AuditRow({ icon, label, by, at, notes, extra }: {
  icon: React.ReactNode; label: string; by?: string; at?: string; notes?: string; extra?: string;
}) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-brand-border/40 last:border-0">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 text-sm">
        <span className="font-medium text-brand-navy">{label}</span>
        {by && <span className="text-muted-foreground"> · {by}</span>}
        {at && <span className="text-muted-foreground"> · {new Date(at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span>}
        {extra && <div className="text-xs text-muted-foreground mt-0.5">{extra}</div>}
        {notes && <div className="text-xs text-brand-navy bg-gray-50 rounded mt-1 px-2 py-1 border border-brand-border/40">{notes}</div>}
      </div>
    </div>
  );
}

function SlipRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      {badge ? <Badge variant={badge as any}>{value}</Badge> : <span className="font-medium">{value}</span>}
    </div>
  );
}

function PayslipLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
