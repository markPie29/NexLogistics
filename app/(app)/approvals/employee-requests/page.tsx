"use client";
import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, Eye, AlertCircle, Users,
  Calendar, Clock, DollarSign, Shirt, HardHat, ArrowUpCircle, CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore } from "@/lib/store/employee-portal";
import {
  useLeaveStore,
  useUndertimeStore,
  useCashAdvanceRequestStore,
  useUniformRequestStore,
  usePPERequestStore,
  useLiquidationStore,
  useLoanRequestStore,
} from "@/lib/store/employee-portal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type {
  LeaveRequest, UndertimeRequest, CashAdvanceRequest, UniformRequest,
  PPERequest, LiquidationRequest, LoanRequest, ApprovalStep,
  EmployeeRequestStatus,
} from "@/lib/types";
import type { Role } from "@/lib/types";

// ── Role → approval step label mapping ───────────────────────
// The step chain uses human-readable labels ("HR", "Executive Officer-in-Charge", "Owner")
// Map system roles to those labels so the gate works.
const ROLE_TO_STEP: Partial<Record<Role, string>> = {
  accounting: "HR",
  company_admin: "Executive Officer-in-Charge",
  super_admin: "Owner",
};

// ── Allowed viewer roles ──────────────────────────────────────
const ALLOWED_ROLES: Role[] = ["super_admin", "company_admin", "accounting"];

// ── Unified request shape for display ────────────────────────
type AnyRequest = (
  | (LeaveRequest & { kind: "leave" })
  | (UndertimeRequest & { kind: "undertime" })
  | (CashAdvanceRequest & { kind: "cash_advance" })
  | (UniformRequest & { kind: "uniform" })
  | (PPERequest & { kind: "ppe" })
  | (LiquidationRequest & { kind: "liquidation" })
  | (LoanRequest & { kind: "loan" })
);

type TabKey = "leave" | "undertime" | "cash_advance" | "uniform" | "ppe" | "liquidation" | "loan";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "leave", label: "Leave", icon: Calendar },
  { key: "undertime", label: "Undertime", icon: Clock },
  { key: "cash_advance", label: "Cash Advance", icon: DollarSign },
  { key: "uniform", label: "Uniform", icon: Shirt },
  { key: "ppe", label: "PPE", icon: HardHat },
  { key: "liquidation", label: "Liquidation", icon: ArrowUpCircle },
  { key: "loan", label: "Loan", icon: CreditCard },
];

// ── Helpers ───────────────────────────────────────────────────

/** Returns the first pending step in the chain, or null if none */
function currentStep(steps: ApprovalStep[]): ApprovalStep | null {
  return steps.find((s) => s.status === "pending") ?? null;
}

function StatusBadge({ status }: { status: EmployeeRequestStatus }) {
  if (status === "approved") return <Badge variant="success" className="text-[10px] !bg-brand-navy text-emerald-400 ring-emerald-500/30">Approved</Badge>;
  if (status === "rejected") return <Badge variant="danger" className="text-[10px] !bg-brand-navy text-red-400 ring-red-500/30">Rejected</Badge>;
  return <Badge variant="warning" className="text-[10px] !bg-brand-navy text-amber-400 ring-amber-500/30">Pending</Badge>;
}

function StepChain({ steps }: { steps: ApprovalStep[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((st, i) => (
        <span
          key={i}
          className={
            st.status === "approved" ? "text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium" :
              st.status === "rejected" ? "text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium" :
                "text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
          }
        >
          {st.role}
        </span>
      ))}
    </div>
  );
}

/** Build a human-readable summary of a request for the confirm dialog */
function RequestSummary({ req }: { req: AnyRequest }) {
  const rows: { label: string; value: string }[] = [];
  if ("dateFrom" in req) {
    rows.push({ label: "From", value: req.dateFrom });
    rows.push({ label: "To", value: req.dateTo });
    rows.push({ label: "Type", value: req.type });
    rows.push({ label: "Reason", value: req.reason });
  } else if ("date" in req && "time" in req) {
    rows.push({ label: "Date", value: (req as UndertimeRequest).date });
    rows.push({ label: "Time", value: (req as UndertimeRequest).time });
    rows.push({ label: "Type", value: (req as UndertimeRequest).type });
    rows.push({ label: "Reason", value: (req as UndertimeRequest).reason });
  } else if ("amount" in req && "purpose" in req) {
    rows.push({ label: "Date", value: (req as CashAdvanceRequest).date });
    rows.push({ label: "Amount", value: formatCurrency((req as CashAdvanceRequest).amount) });
    rows.push({ label: "Purpose", value: (req as CashAdvanceRequest).purpose });
  } else if ("size" in req) {
    rows.push({ label: "Date", value: (req as UniformRequest).date });
    rows.push({ label: "Size", value: (req as UniformRequest).size });
    rows.push({ label: "Reason", value: (req as UniformRequest).reason });
  } else if ("ppe" in req) {
    rows.push({ label: "Date", value: (req as PPERequest).date });
    rows.push({ label: "PPE", value: (req as PPERequest).ppe });
    rows.push({ label: "Reason", value: (req as PPERequest).reason });
  } else if ("item" in req) {
    rows.push({ label: "Date", value: (req as LiquidationRequest).date });
    rows.push({ label: "Amount", value: formatCurrency((req as LiquidationRequest).amount) });
    rows.push({ label: "Item", value: (req as LiquidationRequest).item });
  } else if ("reason" in req && "type" in req && "date" in req) {
    rows.push({ label: "Date", value: (req as LoanRequest).date });
    rows.push({ label: "Loan Type", value: (req as LoanRequest).type });
    rows.push({ label: "Reason", value: (req as LoanRequest).reason });
  }
  rows.push({ label: "Signature", value: req.signature });
  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-2 text-sm">
          <span className="text-muted-foreground w-24 shrink-0">{label}</span>
          <span className="font-medium flex-1">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function EmployeeRequestApprovalsPage() {
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);

  const leaveStore = useLeaveStore();
  const undertimeStore = useUndertimeStore();
  const caStore = useCashAdvanceRequestStore();
  const uniformStore = useUniformRequestStore();
  const ppeStore = usePPERequestStore();
  const liquidationStore = useLiquidationStore();
  const loanStore = useLoanRequestStore();

  const [tab, setTab] = useState<TabKey>("leave");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">("approve");
  const [selectedReq, setSelectedReq] = useState<AnyRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReq, setDetailReq] = useState<AnyRequest | null>(null);
  const [notes, setNotes] = useState("");

  const role = user?.role as Role | undefined;

  // Access guard
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Employee Request Approvals"
          subtitle="Manage leave, cash advance, and other employee requests"
          breadcrumbs={[{ label: "Approvals" }, { label: "Employee Requests" }]}
        />
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="font-semibold">Restricted Access</p>
            <p className="text-sm">Only HR, Executive Officers, and Owners can review employee requests.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // The step role this user can act on
  const myStepRole = ROLE_TO_STEP[role] ?? null;

  // Aggregate all requests per tab key
  const allByKind: Record<TabKey, AnyRequest[]> = useMemo(() => ({
    leave: leaveStore.requests.map((r) => ({ ...r, kind: "leave" as const })),
    undertime: undertimeStore.requests.map((r) => ({ ...r, kind: "undertime" as const })),
    cash_advance: caStore.requests.map((r) => ({ ...r, kind: "cash_advance" as const })),
    uniform: uniformStore.requests.map((r) => ({ ...r, kind: "uniform" as const })),
    ppe: ppeStore.requests.map((r) => ({ ...r, kind: "ppe" as const })),
    liquidation: liquidationStore.requests.map((r) => ({ ...r, kind: "liquidation" as const })),
    loan: loanStore.requests.map((r) => ({ ...r, kind: "loan" as const })),
  }), [leaveStore, undertimeStore, caStore, uniformStore, ppeStore, liquidationStore, loanStore]);

  // Count pending across all types for the header KPI
  const totalPending = useMemo(() =>
    Object.values(allByKind).flat().filter((r) => r.status === "pending").length,
    [allByKind]
  );

  // Open confirm dialog
  const openConfirm = (req: AnyRequest, action: "approve" | "reject") => {
    setSelectedReq(req);
    setConfirmAction(action);
    setNotes("");
    setConfirmOpen(true);
  };

  // Execute approve/reject
  const handleConfirm = () => {
    if (!selectedReq || !myStepRole || !user) return;
    if (confirmAction === "reject" && !notes.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    const by = user.name ?? user.id;
    const n = notes.trim() || undefined;

    switch (selectedReq.kind) {
      case "leave": confirmAction === "approve" ? leaveStore.approve(selectedReq.id, myStepRole, by, n) : leaveStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "undertime": confirmAction === "approve" ? undertimeStore.approve(selectedReq.id, myStepRole, by, n) : undertimeStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "cash_advance": confirmAction === "approve" ? caStore.approve(selectedReq.id, myStepRole, by, n) : caStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "uniform": confirmAction === "approve" ? uniformStore.approve(selectedReq.id, myStepRole, by, n) : uniformStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "ppe": confirmAction === "approve" ? ppeStore.approve(selectedReq.id, myStepRole, by, n) : ppeStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "liquidation": confirmAction === "approve" ? liquidationStore.approve(selectedReq.id, myStepRole, by, n) : liquidationStore.reject(selectedReq.id, myStepRole, by, notes); break;
      case "loan": confirmAction === "approve" ? loanStore.approve(selectedReq.id, myStepRole, by, n) : loanStore.reject(selectedReq.id, myStepRole, by, notes); break;
    }

    toast.success(`Request ${confirmAction === "approve" ? "approved" : "rejected"} successfully.`);
    setConfirmOpen(false);
    setSelectedReq(null);
  };

  const currentList = allByKind[tab].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Request Approvals"
        subtitle="Review and approve employee-submitted requests"
        breadcrumbs={[{ label: "Approvals", href: "/approvals" }, { label: "Employee Requests" }]}
      />

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Pending</div>
            <div className="text-2xl font-extrabold text-amber-600">{totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Your Approval Role</div>
            <div className="text-sm font-bold text-brand-navy dark:text-white">{myStepRole ?? "View only"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Actionable Now</div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {myStepRole
                ? Object.values(allByKind).flat().filter((r) => {
                  const step = currentStep(r.steps);
                  return step?.role === myStepRole;
                }).length
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count = allByKind[key].filter((r) => r.status === "pending").length;
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map(({ key }) => (
          <TabsContent key={key} value={key}>
            <RequestTable
              requests={currentList}
              employees={employees}
              myStepRole={myStepRole}
              onApprove={(req) => openConfirm(req, "approve")}
              onReject={(req) => openConfirm(req, "reject")}
              onView={(req) => { setDetailReq(req); setDetailOpen(true); }}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </DialogTitle>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/10">
                <RequestSummary req={selectedReq} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Approval step:</span>
                  <span className="font-semibold">{myStepRole}</span>
                </div>
                <StepChain steps={selectedReq.steps} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600">
                  {confirmAction === "reject" ? "Rejection Reason (required)" : "Notes (optional)"}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={confirmAction === "reject" ? "State the reason for rejection..." : "Optional notes..."}
                  className="mt-1.5 h-24 resize-none text-black"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant={confirmAction === "approve" ? "primary" : "destructive"}
              onClick={handleConfirm} className="bg-brand-teal hover:bg-brand-teal/75 text-white"
            >
              {confirmAction === "approve"
                ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</>
                : <><XCircle className="w-4 h-4 mr-1" /> Reject</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail drawer/dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {detailReq && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{detailReq.id}</span>
                <StatusBadge status={detailReq.status} />
              </div>
              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(detailReq.submittedAt).toLocaleString("en-PH")}
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/10">
                <RequestSummary req={detailReq} />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Approval Chain</div>
                <div className="space-y-2">
                  {detailReq.steps.map((st, i) => (
                    <div key={i} className="flex items-start justify-between text-sm gap-2">
                      <div>
                        <div className="font-medium">{st.role}</div>
                        {st.reviewedBy && (
                          <div className="text-xs text-muted-foreground">
                            By {st.reviewedBy}
                            {st.reviewedAt && ` · ${new Date(st.reviewedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}`}
                          </div>
                        )}
                        {st.notes && <div className="text-xs text-muted-foreground italic">"{st.notes}"</div>}
                      </div>
                      <span className={
                        st.status === "approved" ? "text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0" :
                          st.status === "rejected" ? "text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium shrink-0" :
                            "text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium shrink-0"
                      }>
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Request Table ─────────────────────────────────────────────

interface TableProps {
  requests: AnyRequest[];
  employees: ReturnType<typeof useEmployeeProfileStore>["employees"];
  myStepRole: string | null;
  onApprove: (req: AnyRequest) => void;
  onReject: (req: AnyRequest) => void;
  onView: (req: AnyRequest) => void;
}

function RequestTable({ requests, employees, myStepRole, onApprove, onReject, onView }: TableProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No requests in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Submitted</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Next Step</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {requests.map((req) => {
              const emp = employees.find((e) => e.id === req.employeeId);
              const step = currentStep(req.steps);
              const canAct = !!myStepRole && step?.role === myStepRole && req.status === "pending";
              return (
                <tr key={req.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-navy dark:text-white">{emp?.name ?? req.employeeId}</div>
                    <div className="text-xs text-muted-foreground">{emp?.position ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(req.submittedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3">
                    {step ? (
                      <span className="text-xs font-medium text-amber-600">{step.role}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(req)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canAct && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onApprove(req)}
                            className="h-7 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReject(req)}
                            className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
