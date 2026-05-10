"use client";
import { useMemo, useState } from "react";
import { Wallet, CheckCircle2, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePayrollStore, useDriverStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { PayrollRecord } from "@/lib/types";

const STATUS_VARIANT: Record<string, any> = { draft: "neutral", approved: "info", paid: "success" };

const schema = z.object({
  driverId: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string(),
  baseSalary: z.coerce.number().nonnegative(),
  incentives: z.coerce.number().nonnegative(),
  overtime: z.coerce.number().nonnegative(),
  deductions: z.coerce.number().nonnegative(),
});

export default function PayrollPage() {
  const records = usePayrollStore((s) => s.records);
  const addRecord = usePayrollStore((s) => s.addRecord);
  const updateRecord = usePayrollStore((s) => s.updateRecord);
  const drivers = useDriverStore((s) => s.drivers);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PayrollRecord | null>(null);

  const totals = useMemo(() => ({
    paid: records.filter((r) => r.status === "paid").reduce((s, r) => s + r.net, 0),
    approved: records.filter((r) => r.status === "approved").reduce((s, r) => s + r.net, 0),
    draft: records.filter((r) => r.status === "draft").length,
  }), [records]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { baseSalary: 0, incentives: 0, overtime: 0, deductions: 0 },
  });

  const onSubmit = (d: z.infer<typeof schema>) => {
    const net = d.baseSalary + d.incentives + d.overtime - d.deductions;
    addRecord({ ...d, net, status: "draft" });
    toast.success("Payroll recorded");
    reset();
    setOpen(false);
  };

  const setStatus = (id: string, status: PayrollRecord["status"]) => {
    updateRecord(id, { status, ...(status === "paid" ? { paidAt: new Date().toISOString() } : {}) });
    toast.success(`Marked ${status}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Driver payroll periods, computations, and payslips"
        breadcrumbs={[{ label: "Finance" }, { label: "Payroll" }]}
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button size="sm"><Plus className="w-4 h-4" /> New Period</Button></SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New Payroll Period</SheetTitle></SheetHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <div><Label>Driver</Label>
                  <Select value={watch("driverId")} onValueChange={(v) => setValue("driverId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.driverId && <p className="text-xs text-red-600 mt-1">Required</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Period Start</Label><Input type="date" {...register("periodStart")} /></div>
                  <div><Label>Period End</Label><Input type="date" {...register("periodEnd")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Base Salary</Label><Input type="number" step="0.01" {...register("baseSalary")} /></div>
                  <div><Label>Incentives</Label><Input type="number" step="0.01" {...register("incentives")} /></div>
                  <div><Label>Overtime</Label><Input type="number" step="0.01" {...register("overtime")} /></div>
                  <div><Label>Deductions</Label><Input type="number" step="0.01" {...register("deductions")} /></div>
                </div>
                <div className="bg-brand-bg p-3 rounded-lg text-sm">
                  <span className="text-muted-foreground">Net: </span>
                  <span className="font-bold text-brand-navy text-lg">
                    {formatCurrency((+watch("baseSalary") || 0) + (+watch("incentives") || 0) + (+watch("overtime") || 0) - (+watch("deductions") || 0))}
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save Draft</Button></div>
              </form>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <KpiCard label="Paid this period" value={formatCurrency(totals.paid)} icon={Wallet} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineColor="#10B981" sparklineData={[20,22,25,30,32,38,40,42]} />
        <KpiCard label="Approved Pending" value={formatCurrency(totals.approved)} icon={CheckCircle2} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineColor="#0EA5E9" sparklineData={[10,12,15,14,18,17,19,21]} />
        <KpiCard label="Drafts" value={totals.draft} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineColor="#F59E0B" sparklineData={[2,3,3,4,4,5,5,6]} />
      </div>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
            <th className="py-3 px-4 font-medium">Driver</th>
            <th className="py-3 px-4 font-medium">Period</th>
            <th className="py-3 px-4 font-medium text-right">Base</th>
            <th className="py-3 px-4 font-medium text-right">Incentives</th>
            <th className="py-3 px-4 font-medium text-right">OT</th>
            <th className="py-3 px-4 font-medium text-right">Deductions</th>
            <th className="py-3 px-4 font-medium text-right">Net</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium w-44"></th>
          </tr></thead>
          <tbody>
            {records.map((r) => {
              const d = drivers.find((x) => x.id === r.driverId);
              return (
                <tr key={r.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{d?.name || r.driverId}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(r.baseSalary)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600">+{formatCurrency(r.incentives)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600">+{formatCurrency(r.overtime)}</td>
                  <td className="py-3 px-4 text-right text-red-600">−{formatCurrency(r.deductions)}</td>
                  <td className="py-3 px-4 text-right font-bold">{formatCurrency(r.net)}</td>
                  <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></td>
                  <td className="py-3 px-4 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>Slip</Button>
                    {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "approved")}>Approve</Button>}
                    {r.status === "approved" && <Button size="sm" onClick={() => setStatus(r.id, "paid")}>Pay</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Payslip</DialogTitle></DialogHeader>
          {preview && (() => {
            const d = drivers.find((x) => x.id === preview.driverId);
            return (
              <div className="space-y-3 text-sm">
                <div className="text-center pb-3 border-b border-brand-border">
                  <div className="text-xs text-muted-foreground">NEX LOGISTICS · OFFICIAL PAYSLIP</div>
                  <div className="font-bold text-brand-navy text-lg mt-1">{d?.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(preview.periodStart).toLocaleDateString()} – {new Date(preview.periodEnd).toLocaleDateString()}</div>
                </div>
                <Row label="Base Salary" value={formatCurrency(preview.baseSalary)} />
                <Row label="Incentives" value={`+${formatCurrency(preview.incentives)}`} />
                <Row label="Overtime" value={`+${formatCurrency(preview.overtime)}`} />
                <Row label="Deductions" value={`−${formatCurrency(preview.deductions)}`} />
                <div className="border-t border-brand-border pt-3 flex justify-between items-center">
                  <div className="font-bold">Net Pay</div>
                  <div className="font-bold text-brand-teal text-xl">{formatCurrency(preview.net)}</div>
                </div>
                <Badge variant={STATUS_VARIANT[preview.status]}>{preview.status}</Badge>
                <Button className="w-full" onClick={() => window.print()}>Print Payslip</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

