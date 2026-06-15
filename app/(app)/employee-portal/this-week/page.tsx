"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Printer, Wallet, TrendingUp, Minus, FileText } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore, useCashAdvanceRequestStore } from "@/lib/store/employee-portal";
import { usePayrollPeriodStore, useIncentiveStore, useDeductionStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ThisWeekPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const incentives = useIncentiveStore((s) => s.incentives);
  const deductions = useDeductionStore((s) => s.deductions);
  const cashAdvanceReqs = useCashAdvanceRequestStore((s) => s.requests);
  const [printOpen, setPrintOpen] = useState(false);

  const profile = employees.find((e) => e.userId === user?.id);

  // Resolve most recent payroll period for this employee
  const mySummaries = useMemo(() => {
    if (!profile?.driverId) return [];
    return summaries
      .filter((s) => s.driverId === profile.driverId)
      .map((s) => ({ summary: s, period: periods.find((p) => p.id === s.payrollPeriodId) }))
      .filter((x) => x.period)
      .sort(
        (a, b) =>
          new Date(b.period!.endDate).getTime() - new Date(a.period!.endDate).getTime()
      );
  }, [summaries, periods, profile]);

  const latest = mySummaries[0];
  const s = latest?.summary;
  const period = latest?.period;

  // Incentives for current period
  const myIncentives = useMemo(() => {
    if (!s) return [];
    return incentives.filter(
      (i) => i.driverId === s.driverId && i.payrollPeriodId === s.payrollPeriodId
    );
  }, [incentives, s]);

  // Approved Cash Advances for current period
  const myCashAdvances = useMemo(() => {
    if (!profile) return [];
    return cashAdvanceReqs.filter(
      (r) => r.employeeId === profile.id && r.status === "approved"
    );
  }, [cashAdvanceReqs, profile]);

  // Deductions for current period
  const myDeductions = useMemo(() => {
    if (!s) return [];
    return deductions.filter(
      (d) => d.driverId === s.driverId && d.payrollPeriodId === s.payrollPeriodId
    );
  }, [deductions, s]);

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-emerald-100 text-emerald-700",
    paid: "bg-brand-teal/10 text-brand-teal",
    computing: "bg-blue-100 text-blue-600",
    ready_for_review: "bg-amber-100 text-amber-700",
    closed: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1220] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-white/60">Employee Portal</div>
            <div className="text-lg font-bold">This Week's Summary</div>
          </div>
        </div>
        {period && (
          <div className="text-sm text-white/70">{period.name}</div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {!s ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-500">No payroll data yet</div>
            <div className="text-xs text-muted-foreground mt-1">Your earnings will appear here once a payroll period is processed.</div>
          </div>
        ) : (
          <>
            {/* Period status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period Status</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[s.status] ?? "bg-gray-100"}`}>
                {s.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            {/* Earnings */}
            <Section title="Earnings" icon={<Wallet className="w-4 h-4 text-brand-teal" />}>
              <Row label="Base Salary" value={formatCurrency(s.baseSalary)} />
              <Row label="Trip Earnings" value={formatCurrency(s.tripEarnings)} />
              <Row label="Allowances" value={formatCurrency(s.allowances)} />
              <Row label="Overtime" value={formatCurrency(s.overtimeAmount)} />
              <RowBold label="Gross Pay" value={formatCurrency(s.grossPay)} />
            </Section>

            {/* Incentives */}
            <Section title="Incentives" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
              {myIncentives.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">No incentives for this period.</div>
              ) : (
                myIncentives.map((inc) => (
                  <Row
                    key={inc.id}
                    label={inc.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={formatCurrency(inc.amount)}
                    note={inc.notes}
                  />
                ))
              )}
              <RowBold label="Total Incentives" value={formatCurrency(s.incentives)} />
            </Section>

            {/* Cash Advances / Vale */}
            <Section title="Cash Advances / Vale" icon={<Minus className="w-4 h-4 text-amber-500" />}>
              {myCashAdvances.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">No approved cash advances.</div>
              ) : (
                myCashAdvances.map((ca) => (
                  <Row
                    key={ca.id}
                    label={`Cash Advance — ${new Date(ca.date).toLocaleDateString("en-PH", { dateStyle: "short" })}`}
                    value={formatCurrency(ca.amount)}
                  />
                ))
              )}
            </Section>

            {/* Deductions */}
            <Section title="Deductions" icon={<Minus className="w-4 h-4 text-red-400" />}>
              <Row label="SSS" value={formatCurrency(s.sssDeduction)} />
              <Row label="PhilHealth" value={formatCurrency(s.philhealthDeduction)} />
              <Row label="Pag-IBIG" value={formatCurrency(s.pagibigDeduction)} />
              <Row label="Withholding Tax" value={formatCurrency(s.taxDeduction)} />
              <Row label="Cash Advance" value={formatCurrency(s.cashAdvanceDeduction)} />
              {myDeductions
                .filter((d) => !["sss", "philhealth", "pagibig", "tax", "cash_advance"].includes(d.type))
                .map((d) => (
                  <Row key={d.id} label={d.reason} value={formatCurrency(d.amount)} />
                ))}
              <RowBold label="Total Deductions" value={`− ${formatCurrency(s.totalDeductions)}`} negative />
            </Section>

            {/* Net Pay */}
            <div className="bg-brand-teal/10 border border-brand-teal/30 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-brand-teal">NET PAY</div>
                <div className="text-xs text-muted-foreground">Take-home for {period?.name}</div>
                {s.paidAt && (
                  <div className="text-xs text-emerald-600 mt-0.5">
                    Paid: {new Date(s.paidAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </div>
                )}
              </div>
              <div className="text-3xl font-extrabold text-brand-teal">{formatCurrency(s.netPay)}</div>
            </div>

            {/* Payslip button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPrintOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" /> View & Print Payslip
            </Button>
          </>
        )}
      </div>

      {/* Payslip Dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payslip — {period?.name}</DialogTitle>
          </DialogHeader>
          {s && (
            <div className="space-y-1 text-sm print:text-black">
              <div className="font-bold text-center text-base mb-3">{user?.name}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{profile?.department ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span>{profile?.position ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{period?.name}</span></div>
              <hr className="my-2" />
              <div className="flex justify-between"><span>Base Salary</span><span>{formatCurrency(s.baseSalary)}</span></div>
              <div className="flex justify-between"><span>Trip Earnings</span><span>{formatCurrency(s.tripEarnings)}</span></div>
              <div className="flex justify-between"><span>Incentives</span><span>{formatCurrency(s.incentives)}</span></div>
              <div className="flex justify-between font-semibold"><span>Gross Pay</span><span>{formatCurrency(s.grossPay)}</span></div>
              <hr className="my-2" />
              <div className="flex justify-between text-red-600"><span>SSS</span><span>−{formatCurrency(s.sssDeduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>PhilHealth</span><span>−{formatCurrency(s.philhealthDeduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>Pag-IBIG</span><span>−{formatCurrency(s.pagibigDeduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>Tax</span><span>−{formatCurrency(s.taxDeduction)}</span></div>
              <div className="flex justify-between text-red-600"><span>Cash Advance</span><span>−{formatCurrency(s.cashAdvanceDeduction)}</span></div>
              <div className="flex justify-between font-semibold text-red-600"><span>Total Deductions</span><span>−{formatCurrency(s.totalDeductions)}</span></div>
              <hr className="my-2" />
              <div className="flex justify-between font-extrabold text-brand-teal text-base"><span>NET PAY</span><span>{formatCurrency(s.netPay)}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button onClick={() => setPrintOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-[#0B1220]">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, note, negative }: { label: string; value: string; note?: string; negative?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
      </div>
      <span className={`text-sm font-medium shrink-0 ${negative ? "text-red-500" : ""}`}>{value}</span>
    </div>
  );
}

function RowBold({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
      <span className="text-sm font-bold text-[#0B1220]">{label}</span>
      <span className={`text-sm font-bold shrink-0 ${negative ? "text-red-600" : "text-[#0B1220]"}`}>{value}</span>
    </div>
  );
}
