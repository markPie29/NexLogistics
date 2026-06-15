"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, FileText, Briefcase, CreditCard, Truck, Clock,
  ChevronRight, AlertCircle, Bell, LogOut, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import {
  useEmployeeProfileStore,
  useLeaveStore,
  useCashAdvanceRequestStore,
  useHRDocumentStore,
  useUndertimeStore,
  useUniformRequestStore,
  usePPERequestStore,
} from "@/lib/store/employee-portal";
import {
  usePayrollPeriodStore,
  useTripStore,
} from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function EmployeePortalPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const leaves = useLeaveStore((s) => s.requests);
  const undertimes = useUndertimeStore((s) => s.requests);
  const cashAdvances = useCashAdvanceRequestStore((s) => s.requests);
  const uniforms = useUniformRequestStore((s) => s.requests);
  const ppeReqs = usePPERequestStore((s) => s.requests);
  const hrDocs = useHRDocumentStore((s) => s.documents);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const trips = useTripStore((s) => s.trips);

  const profile = employees.find((e) => e.userId === user?.id);
  const isDriverOrHelper = profile?.employeeType === "driver" || profile?.employeeType === "helper";

  // Find the latest paid/approved payroll summary for this employee
  const myPayroll = useMemo(() => {
    if (!profile) return null;
    const driverId = profile.driverId;
    if (!driverId) return null;
    const sorted = [...summaries]
      .filter((s) => s.driverId === driverId && (s.status === "paid" || s.status === "approved"))
      .sort((a, b) => {
        const pa = periods.find((p) => p.id === a.payrollPeriodId);
        const pb = periods.find((p) => p.id === b.payrollPeriodId);
        return new Date(pb?.endDate ?? 0).getTime() - new Date(pa?.endDate ?? 0).getTime();
      });
    return sorted[0] ?? null;
  }, [summaries, periods, profile]);

  // Weekly trips (driver/helper)
  const weeklyTrips = useMemo(() => {
    if (!isDriverOrHelper || !profile?.driverId) return 0;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    return trips.filter((t) => {
      if (t.status !== "completed") return false;
      if (profile.driverId && t.driverId !== profile.driverId) return false;
      return new Date(t.createdAt) >= weekStart;
    }).length;
  }, [trips, profile, isDriverOrHelper]);

  // Pending requests count
  const pendingCount = useMemo(() => {
    const eId = profile?.id;
    if (!eId) return 0;
    const all = [
      ...leaves.filter((r) => r.employeeId === eId && r.status === "pending"),
      ...undertimes.filter((r) => r.employeeId === eId && r.status === "pending"),
      ...cashAdvances.filter((r) => r.employeeId === eId && r.status === "pending"),
      ...uniforms.filter((r) => r.employeeId === eId && r.status === "pending"),
      ...ppeReqs.filter((r) => r.employeeId === eId && r.status === "pending"),
    ];
    return all.length;
  }, [profile, leaves, undertimes, cashAdvances, uniforms, ppeReqs]);

  // Unresponded NTEs
  const nteCount = useMemo(() => {
    if (!profile) return 0;
    return hrDocs.filter(
      (d) => d.employeeId === profile.id && d.type === "notice_to_explain" && !d.employeeResponse
    ).length;
  }, [hrDocs, profile]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Employee";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Quick action items
  const quickActions = [
    { label: "This Week", icon: Wallet,     href: "/employee-portal/this-week",   color: "bg-brand-teal/10 text-brand-teal" },
    { label: "Requests",  icon: FileText,   href: "/employee-portal/requests",    color: "bg-blue-100 text-blue-600" },
    { label: "HR Docs",   icon: Briefcase,  href: "/employee-portal/hr-documents", color: "bg-amber-100 text-amber-600", badge: nteCount > 0 ? nteCount : undefined },
    { label: "My ID",     icon: CreditCard, href: "/employee-portal/credentials", color: "bg-violet-100 text-violet-600" },
    ...(isDriverOrHelper
      ? [{ label: "My Trips", icon: Truck, href: "/employee-portal/trips", color: "bg-emerald-100 text-emerald-600" }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1220] text-white px-5 pt-10 pb-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center shrink-0">
              <span className="font-extrabold text-lg text-[#0B1220]">N</span>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] text-brand-teal font-semibold">EMPLOYEE PORTAL</div>
              <div className="text-sm font-bold">NEX Logistics</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 text-white/70" />
          </button>
        </div>

        <div className="mb-1 text-white/60 text-xs">{greeting},</div>
        <div className="text-2xl font-extrabold">{user?.name ?? firstName}</div>
        {profile && (
          <div className="text-sm text-white/60 mt-0.5">
            {profile.position} · {profile.department}
          </div>
        )}

        {/* Alerts */}
        {(nteCount > 0 || pendingCount > 0) && (
          <div className="mt-4 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200 space-y-0.5">
              {nteCount > 0 && <div>You have {nteCount} unanswered Notice to Explain.</div>}
              {pendingCount > 0 && <div>{pendingCount} request{pendingCount > 1 ? "s" : ""} awaiting approval.</div>}
            </div>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="px-4 -mt-4 grid grid-cols-2 gap-3">
        {/* Earnings card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-brand-teal" />
            <span className="text-xs text-muted-foreground">
              {isDriverOrHelper ? "Last Payroll" : "Last Net Pay"}
            </span>
          </div>
          <div className="text-xl font-bold text-[#0B1220]">
            {myPayroll ? formatCurrency(myPayroll.netPay) : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {myPayroll
              ? (() => {
                  const p = periods.find((x) => x.id === myPayroll.payrollPeriodId);
                  return p?.name ?? "See details";
                })()
              : "No payroll yet"}
          </div>
        </div>

        {/* Trips / Pending card */}
        {isDriverOrHelper ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Trips This Week</span>
            </div>
            <div className="text-xl font-bold text-[#0B1220]">{weeklyTrips}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Completed</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Pending Requests</span>
            </div>
            <div className="text-xl font-bold text-[#0B1220]">{pendingCount}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {pendingCount === 0 ? "All caught up" : "Awaiting approval"}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Quick Access
        </div>
        <div className={cn("grid gap-3", quickActions.length <= 4 ? "grid-cols-4" : "grid-cols-5")}>
          {quickActions.map(({ label, icon: Icon, href, color, badge }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform relative"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center relative", color)}>
                <Icon className="w-5 h-5" />
                {badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-center text-gray-600 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent requests preview */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Requests</div>
          <button
            onClick={() => router.push("/employee-portal/requests")}
            className="text-xs text-brand-teal font-medium flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {(() => {
            const eId = profile?.id;
            if (!eId) return <div className="text-xs text-muted-foreground px-1">No requests yet.</div>;

            const all = [
              ...leaves.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Leave" })),
              ...cashAdvances.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Cash Advance" })),
              ...undertimes.filter((r) => r.employeeId === eId).map((r) => ({ ...r, kind: "Undertime" })),
            ]
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .slice(0, 3);

            if (all.length === 0) return <div className="text-xs text-muted-foreground px-1">No requests yet.</div>;

            return all.map((req) => (
              <div
                key={req.id}
                onClick={() => router.push("/employee-portal/requests")}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
              >
                <div>
                  <div className="text-sm font-medium text-[#0B1220]">{(req as any).kind}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(req.submittedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </div>
                </div>
                <StatusBadge status={req.status as "pending" | "approved" | "rejected"} />
              </div>
            ));
          })()}
        </div>
      </div>

      {/* HR Docs preview */}
      {hrDocs.filter((d) => d.employeeId === profile?.id).length > 0 && (
        <div className="px-4 mt-4 mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HR Documents</div>
            <button
              onClick={() => router.push("/employee-portal/hr-documents")}
              className="text-xs text-brand-teal font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {hrDocs
              .filter((d) => d.employeeId === profile?.id)
              .slice(0, 2)
              .map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push("/employee-portal/hr-documents")}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-[#0B1220]">{doc.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(doc.issuedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </div>
                  </div>
                  {doc.type === "notice_to_explain" && !doc.employeeResponse && (
                    <Badge variant="warning" className="text-[10px]">Respond</Badge>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") return <Badge variant="success" className="text-[10px]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="danger" className="text-[10px]">Rejected</Badge>;
  return <Badge variant="warning" className="text-[10px]">Pending</Badge>;
}
