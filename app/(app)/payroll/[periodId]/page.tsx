"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Wallet, FileText, Printer, Send, AlertCircle, Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDriverStore, useTripStore, usePayrollPeriodStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  draft: "neutral", computing: "info", ready_for_review: "warning", approved: "info", paid: "success", closed: "neutral",
};

export default function PayrollPeriodDetailPage() {
  const params = useParams<{ periodId: string }>();
  const router = useRouter();
  const periods = usePayrollPeriodStore((s) => s.periods);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const tripPayrolls = usePayrollPeriodStore((s) => s.tripPayrolls);
  const approvePeriod = usePayrollPeriodStore((s) => s.approvePeriod);
  const payPeriod = usePayrollPeriodStore((s) => s.payPeriod);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);
  const user = useAuthStore((s) => s.user);

  const period = periods.find((p) => p.id === params.periodId);
  const periodSummaries = summaries.filter((s) => s.payrollPeriodId === params.periodId);
  const periodTripPayrolls = tripPayrolls.filter((tp) => tp.payrollPeriodId === params.periodId);

  const [openPayslip, setOpenPayslip] = useState<string | null>(null);

  const totals = useMemo(() => {
    return {
      gross: periodSummaries.reduce((a, b) => a + b.grossPay, 0),
      deductions: periodSummaries.reduce((a, b) => a + b.totalDeductions, 0),
      net: periodSummaries.reduce((a, b) => a + b.netPay, 0),
      trips: periodSummaries.reduce((a, b) => a + b.tripsCount, 0),
    };
  }, [periodSummaries]);

  if (!period) {
    return (
      <Card><CardContent className="p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <p className="text-lg font-bold">Payroll Period not found</p>
        <Button asChild className="mt-4"><Link href="/payroll"><ArrowLeft className="w-4 h-4" /> Back to Payroll</Link></Button>
      </CardContent></Card>
    );
  }

  const handleApprove = () => {
    approvePeriod(period.id, user?.name ?? "admin");
    toast.success("Payroll period approved · Ready for payment");
  };
  const handlePay = () => {
    payPeriod(period.id, user?.name ?? "admin");
    toast.success("Payroll marked as paid");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={period.name}
        subtitle={`${new Date(period.startDate).toLocaleDateString()} – ${new Date(period.endDate).toLocaleDateString()} · Pay date: ${period.payDate ? new Date(period.payDate).toLocaleDateString() : "TBD"}`}
        breadcrumbs={[{ label: "Finance" }, { label: "Payroll", href: "/payroll" }, { label: period.name }]}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Badge variant={STATUS_VARIANT[period.status]}>{period.status.replace("_", " ")}</Badge>
            {period.status === "ready_for_review" && (
              <Button size="sm" onClick={handleApprove}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
            )}
            {period.status === "approved" && (
              <Button size="sm" onClick={handlePay}><Wallet className="w-4 h-4" /> Mark as Paid</Button>
            )}
            <Button variant="outline" size="sm" asChild><Link href="/payroll"><ArrowLeft className="w-4 h-4" /> Back</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Drivers</div><div className="text-2xl font-bold text-brand-navy">{periodSummaries.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Trips</div><div className="text-2xl font-bold text-brand-navy">{totals.trips}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-muted-foreground">Gross Pay</div><div className="text-2xl font-bold text-brand-navy">{formatCurrency(totals.gross)}</div></CardContent></Card>
        <Card className="bg-brand-teal/10 border-brand-teal/40"><CardContent className="p-4"><div className="text-xs uppercase text-brand-teal">Total Net</div><div className="text-2xl font-bold text-brand-teal">{formatCurrency(totals.net)}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium">Mode</th>
                <th className="py-3 px-4 font-medium text-right">Trips</th>
                <th className="py-3 px-4 font-medium text-right">Trip Earnings</th>
                <th className="py-3 px-4 font-medium text-right">Base</th>
                <th className="py-3 px-4 font-medium text-right">Incentives</th>
                <th className="py-3 px-4 font-medium text-right">Deductions</th>
                <th className="py-3 px-4 font-medium text-right">Net Pay</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {periodSummaries.map((s) => {
                const driver = drivers.find((d) => d.id === s.driverId);
                return (
                  <tr key={s.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{driver?.name ?? s.driverId}</td>
                    <td className="py-3 px-4 text-xs"><Badge variant="info">{s.payrollMode.replace(/_/g, " ")}</Badge></td>
                    <td className="py-3 px-4 text-right">{s.tripsCount}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(s.tripEarnings)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(s.baseSalary)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600">+{formatCurrency(s.incentives)}</td>
                    <td className="py-3 px-4 text-right text-red-600">−{formatCurrency(s.totalDeductions)}</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-teal">{formatCurrency(s.netPay)}</td>
                    <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status}</Badge></td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost" onClick={() => setOpenPayslip(s.id)}><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                );
              })}
              {periodSummaries.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No payroll summaries for this period.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Payslip Dialog */}
      <Dialog open={!!openPayslip} onOpenChange={(o) => !o && setOpenPayslip(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {(() => {
            const s = periodSummaries.find((x) => x.id === openPayslip);
            if (!s) return null;
            const driver = drivers.find((d) => d.id === s.driverId);
            const driverTripPayrolls = periodTripPayrolls.filter((tp) => tp.driverId === s.driverId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Payslip · {driver?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 print:text-sm">
                  <div className="border border-brand-border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Driver:</span> <b>{driver?.name}</b></div>
                      <div><span className="text-muted-foreground">License:</span> {driver?.licenseNumber}</div>
                      <div><span className="text-muted-foreground">Period:</span> {period.name}</div>
                      <div><span className="text-muted-foreground">Pay Date:</span> {period.payDate ? new Date(period.payDate).toLocaleDateString() : "TBD"}</div>
                      <div><span className="text-muted-foreground">Mode:</span> <Badge variant="info">{s.payrollMode.replace(/_/g, " ")}</Badge></div>
                      <div><span className="text-muted-foreground">Status:</span> <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status}</Badge></div>
                    </div>
                  </div>

                  {driverTripPayrolls.length > 0 && (
                    <div>
                      <h4 className="font-bold text-brand-navy text-sm mb-2">Trip Earnings ({driverTripPayrolls.length} trip{driverTripPayrolls.length === 1 ? "" : "s"})</h4>
                      <div className="border border-brand-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium">Trip</th>
                              <th className="text-left py-2 px-3 font-medium">Route</th>
                              <th className="text-right py-2 px-3 font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverTripPayrolls.map((tp) => {
                              const t = trips.find((x) => x.id === tp.tripId);
                              return (
                                <tr key={tp.id} className="border-t border-brand-border/60">
                                  <td className="py-2 px-3">{tp.tripId}</td>
                                  <td className="py-2 px-3 text-muted-foreground">
                                    {t ? `${t.pickup.address.split(",")[0]} → ${t.dropoff.address.split(",")[0]}` : "—"}
                                    {tp.tonAmount > 0 && (
                                      <div className="text-[10px] text-sky-700 mt-0.5">Ton-based: {formatCurrency(tp.tonAmount)}</div>
                                    )}
                                    {tp.unitAmount > 0 && (
                                      <div className="text-[10px] text-violet-700 mt-0.5">Unit-based: {formatCurrency(tp.unitAmount)}</div>
                                    )}
                                    {tp.tierMultiplier !== 1 && (
                                      <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1 py-0.5">×{tp.tierMultiplier} distance tier</span>
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
                        <div className="flex justify-between"><span>Base Salary</span><span>{formatCurrency(s.baseSalary)}</span></div>
                        <div className="flex justify-between"><span>Trip Earnings</span><span>{formatCurrency(s.tripEarnings)}</span></div>
                        <div className="flex justify-between"><span>Incentives</span><span>{formatCurrency(s.incentives)}</span></div>
                        <div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(s.allowances)}</span></div>
                        <div className="flex justify-between"><span>Overtime</span><span>{formatCurrency(s.overtimeAmount)}</span></div>
                        <div className="flex justify-between border-t border-emerald-300 pt-1 font-bold"><span>Gross Pay</span><span>{formatCurrency(s.grossPay)}</span></div>
                      </div>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-3 bg-rose-50">
                      <div className="text-xs uppercase text-rose-700 font-bold mb-2">Deductions</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>SSS</span><span>−{formatCurrency(s.sssDeduction)}</span></div>
                        <div className="flex justify-between"><span>PhilHealth</span><span>−{formatCurrency(s.philhealthDeduction)}</span></div>
                        <div className="flex justify-between"><span>Pag-IBIG</span><span>−{formatCurrency(s.pagibigDeduction)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>−{formatCurrency(s.taxDeduction)}</span></div>
                        <div className="flex justify-between"><span>Cash Advance</span><span>−{formatCurrency(s.cashAdvanceDeduction)}</span></div>
                        <div className="flex justify-between"><span>Other</span><span>−{formatCurrency(s.otherDeductions)}</span></div>
                        <div className="flex justify-between border-t border-rose-300 pt-1 font-bold"><span>Total</span><span>−{formatCurrency(s.totalDeductions)}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-teal/10 border border-brand-teal/40 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase text-brand-teal font-bold">NET PAY</div>
                      <div className="text-xs text-muted-foreground">Take-home for {period.name}</div>
                    </div>
                    <div className="text-3xl font-bold text-brand-teal">{formatCurrency(s.netPay)}</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</Button>
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
