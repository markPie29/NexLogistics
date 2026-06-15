"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft, Plus, FileText, Calendar, Clock, Shirt,
  HardHat, DollarSign, ArrowUpCircle, CreditCard, ChevronDown, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import {
  useEmployeeProfileStore,
  useLeaveStore,
  useUndertimeStore,
  useCashAdvanceRequestStore,
  useUniformRequestStore,
  usePPERequestStore,
  useLiquidationStore,
  useLoanRequestStore,
} from "@/lib/store/employee-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type FormType = "leave" | "undertime" | "cash_advance" | "uniform" | "ppe" | "liquidation" | "loan";

const REQUEST_TYPES: { type: FormType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "leave",        label: "Leave Form",          icon: Calendar },
  { type: "undertime",    label: "Undertime Form",       icon: Clock },
  { type: "cash_advance", label: "Cash Advance / Vale",  icon: DollarSign },
  { type: "uniform",      label: "Uniform Request",      icon: Shirt },
  { type: "ppe",          label: "PPE Request",          icon: HardHat },
  { type: "liquidation",  label: "Liquidation (2A)",     icon: ArrowUpCircle },
  { type: "loan",         label: "Loan Request",         icon: CreditCard },
];

// ── Zod schemas ───────────────────────────────────────────────

const leaveSchema = z.object({
  dateFrom: z.string().min(1, "Required"),
  dateTo: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  reason: z.string().min(5, "Please provide a reason"),
  signature: z.string().min(2, "Signature required"),
});

const undertimeSchema = z.object({
  date: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  time: z.string().min(1, "Required"),
  reason: z.string().min(5, "Please provide a reason"),
  signature: z.string().min(2, "Signature required"),
});

const cashAdvanceSchema = z.object({
  date: z.string().min(1, "Required"),
  amount: z.coerce.number().positive("Amount must be > 0"),
  purpose: z.string().min(5, "Please describe the purpose"),
  signature: z.string().min(2, "Signature required"),
});

const uniformSchema = z.object({
  date: z.string().min(1, "Required"),
  size: z.string().min(1, "Required"),
  reason: z.string().min(5, "Please provide a reason"),
  signature: z.string().min(2, "Signature required"),
});

const ppeSchema = z.object({
  date: z.string().min(1, "Required"),
  ppe: z.string().min(1, "Required"),
  reason: z.string().min(5, "Please provide a reason"),
  signature: z.string().min(2, "Signature required"),
});

const liquidationSchema = z.object({
  date: z.string().min(1, "Required"),
  amount: z.coerce.number().positive("Amount must be > 0"),
  item: z.string().min(2, "Required"),
  signature: z.string().min(2, "Signature required"),
});

const loanSchema = z.object({
  date: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  reason: z.string().min(5, "Please provide a reason"),
  signature: z.string().min(2, "Signature required"),
});

// ── Status badge component ────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="success" className="text-[10px]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="danger" className="text-[10px]">Rejected</Badge>;
  return <Badge variant="warning" className="text-[10px]">Pending</Badge>;
}

// ── Approval steps display ────────────────────────────────────

function ApprovalSteps({ steps }: { steps: { role: string; status: string }[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {steps.map((st, i) => (
        <span key={i} className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium",
          st.status === "approved" ? "bg-emerald-100 text-emerald-700" :
          st.status === "rejected" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
        )}>
          {st.role}
        </span>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function RequestsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const profile = employees.find((e) => e.userId === user?.id);

  const leaveStore = useLeaveStore();
  const undertimeStore = useUndertimeStore();
  const caStore = useCashAdvanceRequestStore();
  const uniformStore = useUniformRequestStore();
  const ppeStore = usePPERequestStore();
  const liquidationStore = useLiquidationStore();
  const loanStore = useLoanRequestStore();

  const [openForm, setOpenForm] = useState<FormType | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | FormType>("all");

  // Aggregate all requests for this employee
  const allRequests = useMemo(() => {
    const eId = profile?.id;
    if (!eId) return [];
    return [
      ...leaveStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Leave Form" })),
      ...undertimeStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Undertime Form" })),
      ...caStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Cash Advance" })),
      ...uniformStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Uniform Request" })),
      ...ppeStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "PPE Request" })),
      ...liquidationStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Liquidation" })),
      ...loanStore.requests.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Loan Request" })),
    ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [profile, leaveStore, undertimeStore, caStore, uniformStore, ppeStore, liquidationStore, loanStore]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1220] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="text-xs text-white/60">Employee Portal</div>
            <div className="text-lg font-bold">My Requests</div>
          </div>
          <button
            onClick={() => setOpenForm("leave")}
            className="w-9 h-9 rounded-full bg-brand-teal flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-[#0B1220]" />
          </button>
        </div>
      </div>

      {/* New request buttons */}
      <div className="px-4 py-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Submit a Request</div>
        <div className="grid grid-cols-4 gap-2">
          {REQUEST_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setOpenForm(type)}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-brand-teal">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-medium text-gray-600 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Request history */}
      <div className="px-4 pb-8">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Request History</div>
        {allRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-500">No requests yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {allRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0B1220]">{(req as any).kind}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(req.submittedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </div>
                    {(req as any).steps && <ApprovalSteps steps={(req as any).steps} />}
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialogs */}
      {openForm && (
        <RequestFormDialog
          type={openForm}
          employeeId={profile?.id ?? ""}
          employeeName={user?.name ?? ""}
          onClose={() => setOpenForm(null)}
          stores={{ leaveStore, undertimeStore, caStore, uniformStore, ppeStore, liquidationStore, loanStore }}
        />
      )}
    </div>
  );
}

// ── Form Dialog ───────────────────────────────────────────────

function RequestFormDialog({
  type, employeeId, employeeName, onClose, stores,
}: {
  type: FormType;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  stores: ReturnType<typeof collectStores>;
}) {
  const today = new Date().toISOString().split("T")[0];

  const { register: regLeave, handleSubmit: hsLeave, formState: { errors: eLeave } } = useForm({ resolver: zodResolver(leaveSchema), defaultValues: { dateFrom: today, dateTo: today, type: "", reason: "", signature: employeeName } });
  const { register: regUt,    handleSubmit: hsUt,    formState: { errors: eUt    } } = useForm({ resolver: zodResolver(undertimeSchema), defaultValues: { date: today, type: "", time: "", reason: "", signature: employeeName } });
  const { register: regCa,    handleSubmit: hsCa,    formState: { errors: eCa    } } = useForm({ resolver: zodResolver(cashAdvanceSchema), defaultValues: { date: today, amount: 0, purpose: "", signature: employeeName } });
  const { register: regUni,   handleSubmit: hsUni,   formState: { errors: eUni   } } = useForm({ resolver: zodResolver(uniformSchema), defaultValues: { date: today, size: "", reason: "", signature: employeeName } });
  const { register: regPpe,   handleSubmit: hsPpe,   formState: { errors: ePpe   } } = useForm({ resolver: zodResolver(ppeSchema), defaultValues: { date: today, ppe: "", reason: "", signature: employeeName } });
  const { register: regLiq,   handleSubmit: hsLiq,   formState: { errors: eLiq   } } = useForm({ resolver: zodResolver(liquidationSchema), defaultValues: { date: today, amount: 0, item: "", signature: employeeName } });
  const { register: regLoan,  handleSubmit: hsLoan,  formState: { errors: eLoan  } } = useForm({ resolver: zodResolver(loanSchema), defaultValues: { date: today, type: "", reason: "", signature: employeeName } });

  const submit = (data: any, fn: (d: any) => any) => {
    fn({ ...data, employeeId });
    toast.success("Request submitted successfully!");
    onClose();
  };

  const titleMap: Record<FormType, string> = {
    leave: "Leave Form",
    undertime: "Undertime Form",
    cash_advance: "Cash Advance / Vale",
    uniform: "Uniform Request",
    ppe: "PPE Request",
    liquidation: "Liquidation Form 2A",
    loan: "Loan Request",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleMap[type]}</DialogTitle>
        </DialogHeader>

        {type === "leave" && (
          <form onSubmit={hsLeave((d) => submit(d, stores.leaveStore.submit))} className="space-y-3">
            <Field label="Date From" error={eLeave.dateFrom?.message}><input type="date" {...regLeave("dateFrom")} className={inputCls} /></Field>
            <Field label="Date To" error={eLeave.dateTo?.message}><input type="date" {...regLeave("dateTo")} className={inputCls} /></Field>
            <Field label="Type of Leave" error={eLeave.type?.message}>
              <select {...regLeave("type")} className={inputCls}>
                <option value="">Select...</option>
                {["Sick Leave","Vacation Leave","Emergency Leave","Maternity Leave","Paternity Leave"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Reason/s" error={eLeave.reason?.message}><textarea {...regLeave("reason")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={eLeave.signature?.message}><input {...regLeave("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "undertime" && (
          <form onSubmit={hsUt((d) => submit(d, stores.undertimeStore.submit))} className="space-y-3">
            <Field label="Date" error={eUt.date?.message}><input type="date" {...regUt("date")} className={inputCls} /></Field>
            <Field label="Type of Undertime" error={eUt.type?.message}>
              <select {...regUt("type")} className={inputCls}>
                <option value="">Select...</option>
                {["Personal","Medical","Emergency","Family Matter"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Indicate Time" error={eUt.time?.message}><input type="time" {...regUt("time")} className={inputCls} /></Field>
            <Field label="Reason/s" error={eUt.reason?.message}><textarea {...regUt("reason")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={eUt.signature?.message}><input {...regUt("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "cash_advance" && (
          <form onSubmit={hsCa((d) => submit(d, stores.caStore.submit))} className="space-y-3">
            <Field label="Date" error={eCa.date?.message}><input type="date" {...regCa("date")} className={inputCls} /></Field>
            <Field label="Amount (₱)" error={eCa.amount?.message}><input type="number" min="1" step="1" {...regCa("amount")} className={inputCls} /></Field>
            <Field label="Purpose" error={eCa.purpose?.message}><textarea {...regCa("purpose")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={eCa.signature?.message}><input {...regCa("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "uniform" && (
          <form onSubmit={hsUni((d) => submit(d, stores.uniformStore.submit))} className="space-y-3">
            <Field label="Date" error={eUni.date?.message}><input type="date" {...regUni("date")} className={inputCls} /></Field>
            <Field label="Uniform Size" error={eUni.size?.message}>
              <select {...regUni("size")} className={inputCls}>
                <option value="">Select...</option>
                {["XS","S","M","L","XL","XXL","XXXL"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Reason" error={eUni.reason?.message}><textarea {...regUni("reason")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={eUni.signature?.message}><input {...regUni("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "ppe" && (
          <form onSubmit={hsPpe((d) => submit(d, stores.ppeStore.submit))} className="space-y-3">
            <Field label="Date" error={ePpe.date?.message}><input type="date" {...regPpe("date")} className={inputCls} /></Field>
            <Field label="PPE Item" error={ePpe.ppe?.message}>
              <select {...regPpe("ppe")} className={inputCls}>
                <option value="">Select...</option>
                {["Hard Hat","Safety Vest","Gloves","Safety Shoes","Goggles","Ear Plugs","Face Mask","Full Body Harness"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Reason" error={ePpe.reason?.message}><textarea {...regPpe("reason")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={ePpe.signature?.message}><input {...regPpe("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "liquidation" && (
          <form onSubmit={hsLiq((d) => submit(d, stores.liquidationStore.submit))} className="space-y-3">
            <Field label="Date" error={eLiq.date?.message}><input type="date" {...regLiq("date")} className={inputCls} /></Field>
            <Field label="Amount for Liquidation (₱)" error={eLiq.amount?.message}><input type="number" min="1" step="1" {...regLiq("amount")} className={inputCls} /></Field>
            <Field label="Item" error={eLiq.item?.message}><input {...regLiq("item")} className={inputCls} /></Field>
            <Field label="Signature (Type Full Name)" error={eLiq.signature?.message}><input {...regLiq("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}

        {type === "loan" && (
          <form onSubmit={hsLoan((d) => submit(d, stores.loanStore.submit))} className="space-y-3">
            <Field label="Date" error={eLoan.date?.message}><input type="date" {...regLoan("date")} className={inputCls} /></Field>
            <Field label="Type of Loan" error={eLoan.type?.message}>
              <select {...regLoan("type")} className={inputCls}>
                <option value="">Select...</option>
                {["SSS Loan","Pag-IBIG Loan","Company Loan","Emergency Loan"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Reason" error={eLoan.reason?.message}><textarea {...regLoan("reason")} className={`${inputCls} h-20 resize-none`} /></Field>
            <Field label="Signature (Type Full Name)" error={eLoan.signature?.message}><input {...regLoan("signature")} className={inputCls} /></Field>
            <FormFooter onClose={onClose} />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function collectStores() {
  return {
    leaveStore: useLeaveStore(),
    undertimeStore: useUndertimeStore(),
    caStore: useCashAdvanceRequestStore(),
    uniformStore: useUniformRequestStore(),
    ppeStore: usePPERequestStore(),
    liquidationStore: useLiquidationStore(),
    loanStore: useLoanRequestStore(),
  };
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormFooter({ onClose }: { onClose: () => void }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      <Button type="submit" variant="primary">Submit Request</Button>
    </DialogFooter>
  );
}
