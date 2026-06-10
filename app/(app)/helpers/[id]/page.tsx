"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Activity,
  TrendingUp,
  Route,
  Star,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  Truck,
  Briefcase,
  Shield,
  Wallet,
  FileText,
  CheckCircle2,
  Settings2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useHelperStore,
  useDriverStore,
  useFleetStore,
  useTripStore,
  usePayrollPeriodStore,
  useDriverPayrollProfileStore,
} from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddHelperSheet } from "@/components/forms/AddHelperSheet";
import {
  resolveHelperVehicle,
  formatRating,
  computeProgressWidth,
  getHelperTrips,
  findActiveTrip,
  computeTotalEarned,
} from "@/lib/services/helper-utils";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function HelperDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const helper = useHelperStore((s) => s.helpers.find((h) => h.id === params.id));
  const deleteHelper = useHelperStore((s) => s.deleteHelper);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const periods = usePayrollPeriodStore((s) => s.periods);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Resolve vehicle through driver chain
  const resolved = useMemo(() => {
    if (!helper) return { driver: undefined, vehicle: undefined };
    return resolveHelperVehicle(helper, drivers, vehicles);
  }, [helper, drivers, vehicles]);

  // Trip-based metrics
  const helperTrips = useMemo(
    () => (helper ? getHelperTrips(trips, helper.id) : []),
    [trips, helper]
  );
  const completedTrips = useMemo(
    () => helperTrips.filter((t) => t.status === "completed" || t.status === "delivered"),
    [helperTrips]
  );
  const delayedTrips = useMemo(
    () => helperTrips.filter((t) => t.status === "delayed"),
    [helperTrips]
  );

  // Active trip
  const activeTrip = useMemo(
    () => (helper ? findActiveTrip(trips, helper.id) : undefined),
    [trips, helper]
  );

  // Payroll data
  const helperSummaries = useMemo(() => {
    if (!helper) return [];
    return summaries
      .filter((s) => s.driverId === helper.id)
      .sort((a, b) => {
        const pa = periods.find((p) => p.id === a.payrollPeriodId);
        const pb = periods.find((p) => p.id === b.payrollPeriodId);
        return (pb ? new Date(pb.endDate).getTime() : 0) - (pa ? new Date(pa.endDate).getTime() : 0);
      });
  }, [summaries, periods, helper]);

  const totalEarned = useMemo(
    () => computeTotalEarned(helperSummaries),
    [helperSummaries]
  );

  // Payroll profile (reuses DriverPayrollProfile store with helper.id as driverId)
  const payrollProfile = useMemo(
    () => (helper ? profiles.find((p) => p.driverId === helper.id) : undefined),
    [profiles, helper]
  );

  if (!helper) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Helper not found.</p>
        <Button className="mt-4" onClick={() => router.push("/helpers")}>
          <ArrowLeft className="w-4 h-4" /> Back to Helpers
        </Button>
      </div>
    );
  }

  const rating = helper.rating ?? 0;
  const onTimePercent = helper.onTimePercent ?? 100;
  const totalTrips = helper.totalTrips ?? 0;

  const handleDelete = () => {
    deleteHelper(helper.id);
    toast.success(`Helper ${helper.name} removed`);
    router.push("/helpers");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={helper.name}
        subtitle={`${(helper.employmentType || "per_trip").replace(/_/g, " ")} helper`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Helpers", href: "/helpers" },
          { label: helper.name },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/helpers")}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Status"
          value={helper.status.replace(/_/g, " ")}
          icon={Activity}
          variant={STATUS_VARIANT[helper.status]}
        />
        <StatCard label="On-Time Rate" value={`${onTimePercent}%`} icon={TrendingUp} />
        <StatCard label="Total Trips" value={totalTrips || helperTrips.length} icon={Route} />
        <StatCard label="Rating" value={`${formatRating(rating)} / 5`} icon={Star} />
      </div>

      {/* Profile Hero Card */}
      <Card className="border-brand-border bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-navy text-white font-extrabold text-2xl flex items-center justify-center shrink-0">
              {helper.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
                  {helper.name}
                </h2>
                <Badge variant={STATUS_VARIANT[helper.status]}>
                  {helper.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                <InfoRow icon={Phone} label="Phone" value={helper.phone} />
                <InfoRow icon={Mail} label="Email" value={helper.email || "—"} />
                <InfoRow icon={MapPin} label="Address" value={helper.address || "—"} />
                <InfoRow
                  icon={Shield}
                  label="Emergency Contact"
                  value={helper.emergencyContact || "—"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Hire Date"
                  value={helper.hireDate ? new Date(helper.hireDate).toLocaleDateString() : "—"}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Employment Type"
                  value={(helper.employmentType || "per_trip").replace(/_/g, " ")}
                />
                <InfoRow
                  icon={UserIcon}
                  label="Assigned Driver"
                  value={resolved.driver?.name || "Unassigned"}
                />
                <InfoRow
                  icon={Truck}
                  label="Assigned Vehicle"
                  value={resolved.vehicle?.plate || "—"}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance + Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Card */}
        <Card className="border-brand-border bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">On-Time Delivery</span>
                <span className="font-bold text-brand-navy dark:text-white">{onTimePercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full"
                  style={{ width: `${computeProgressWidth(onTimePercent, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Helper Rating</span>
                <span className="font-bold text-brand-navy dark:text-white flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{" "}
                  {formatRating(rating)} / 5
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${computeProgressWidth(rating, 5)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-brand-teal-light p-3 text-center">
                <div className="text-2xl font-extrabold text-brand-navy">
                  {completedTrips.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Completed Trips</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <div className="text-2xl font-extrabold text-brand-navy">
                  {delayedTrips.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Delayed Trips</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Card */}
        <Card className="border-brand-border bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">
              Assigned Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {resolved.vehicle ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7 text-brand-teal" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-brand-navy dark:text-white">
                    {resolved.vehicle.plate}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {resolved.vehicle.brand} {resolved.vehicle.model} · {resolved.vehicle.year}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant={
                        (
                          {
                            available: "success",
                            in_trip: "info",
                            maintenance: "warning",
                            inactive: "neutral",
                          } as Record<string, any>
                        )[resolved.vehicle.status] ?? "neutral"
                      }
                    >
                      {resolved.vehicle.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline">{resolved.vehicle.type}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push(`/fleet/${resolved.vehicle!.id}`)}
                  >
                    View Vehicle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {resolved.driver
                    ? "Driver has no vehicle assigned"
                    : "No vehicle assigned"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trips">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="trips">Trip History ({helperTrips.length})</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
          <TabsTrigger value="payroll_settings">Payroll Settings</TabsTrigger>
          <TabsTrigger value="active">Active Trip</TabsTrigger>
        </TabsList>

        {/* Trip History Tab */}
        <TabsContent value="trips">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50">
                      <th className="py-3 px-4">Trip ID</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">Helper Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">POD</th>
                      <th className="py-3 px-4">Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helperTrips.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-brand-border/60 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => router.push(`/trips/${t.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-brand-teal">{t.id}</td>
                        <td className="py-3 px-4">
                          <div className="text-brand-navy font-medium truncate max-w-[200px]">
                            {t.pickup.address}
                          </div>
                          <div className="text-xs text-muted-foreground">→ {t.dropoff.address}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {formatCurrency(t.helperRate ?? t.helperFee ?? 0)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              t.status === "completed" || t.status === "delivered"
                                ? "success"
                                : t.status === "delayed"
                                ? "danger"
                                : t.status === "in_transit"
                                ? "info"
                                : "neutral"
                            }
                          >
                            {t.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {t.podSubmittedAt ? (
                            <FileText className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {(t.status === "completed" || t.status === "delivered") && (
                            <Badge
                              variant={
                                t.approvalStatus === "approved"
                                  ? "success"
                                  : t.approvalStatus === "rejected"
                                  ? "danger"
                                  : "neutral"
                              }
                            >
                              {t.approvalStatus ?? "pending"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {helperTrips.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <Route className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p>No trip history.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Summary Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardContent className="p-0">
              {helperSummaries.length > 0 ? (
                <>
                  <div className="p-4 border-b border-brand-border bg-brand-teal-light/40 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total Earned (Paid)</div>
                    <div className="text-2xl font-extrabold text-brand-navy">
                      {formatCurrency(totalEarned)}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50">
                          <th className="py-3 px-4">Period</th>
                          <th className="py-3 px-4">Mode</th>
                          <th className="py-3 px-4">Trips</th>
                          <th className="py-3 px-4">Trip Earnings</th>
                          <th className="py-3 px-4">Incentives</th>
                          <th className="py-3 px-4">Deductions</th>
                          <th className="py-3 px-4">Net Pay</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {helperSummaries.map((s) => {
                          const period = periods.find((p) => p.id === s.payrollPeriodId);
                          return (
                            <tr
                              key={s.id}
                              className="border-b border-brand-border/60 hover:bg-gray-50 cursor-pointer transition"
                              onClick={() => router.push(`/payroll/${s.payrollPeriodId}`)}
                            >
                              <td className="py-3 px-4 text-muted-foreground">
                                {period?.name ?? s.payrollPeriodId}
                              </td>
                              <td className="py-3 px-4 text-xs capitalize">
                                {s.payrollMode.replace(/_/g, " ")}
                              </td>
                              <td className="py-3 px-4">{s.tripsCount}</td>
                              <td className="py-3 px-4">{formatCurrency(s.tripEarnings)}</td>
                              <td className="py-3 px-4 text-emerald-600">
                                +{formatCurrency(s.incentives)}
                              </td>
                              <td className="py-3 px-4 text-red-500">
                                −{formatCurrency(s.totalDeductions)}
                              </td>
                              <td className="py-3 px-4 font-bold text-brand-navy">
                                {formatCurrency(s.netPay)}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    s.status === "paid"
                                      ? "success"
                                      : s.status === "approved"
                                      ? "info"
                                      : "neutral"
                                  }
                                >
                                  {s.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No payroll records yet.</p>
                  <p className="text-xs mt-1">Run a payroll period to see earnings here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Settings Tab */}
        <TabsContent value="payroll_settings">
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-brand-navy flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Payroll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {payrollProfile ? (
                <div className="space-y-5">
                  {/* Rate cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-brand-border p-4">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Employment Type</div>
                      <div className="font-bold text-brand-navy capitalize">
                        {(helper.employmentType || "per_trip").replace(/_/g, " ")}
                      </div>
                    </div>
                    {payrollProfile.baseSalary > 0 && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Monthly Salary</div>
                        <div className="font-bold text-brand-navy">
                          {formatCurrency(payrollProfile.baseSalary)}
                        </div>
                      </div>
                    )}
                    {payrollProfile.perTripFlatRate && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Per Trip Rate</div>
                        <div className="font-bold text-brand-navy">
                          {formatCurrency(payrollProfile.perTripFlatRate)}
                        </div>
                      </div>
                    )}
                    {payrollProfile.commissionPercent && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Commission %</div>
                        <div className="font-bold text-brand-navy">
                          {payrollProfile.commissionPercent}%
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Government Deductions */}
                  <div>
                    <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                      Government Deductions
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "SSS", enabled: payrollProfile.sssEnabled },
                        { label: "PhilHealth", enabled: payrollProfile.philhealthEnabled },
                        { label: "Pag-IBIG", enabled: payrollProfile.pagibigEnabled },
                        { label: "Withholding Tax", enabled: payrollProfile.taxEnabled },
                      ].map((g) => (
                        <div
                          key={g.label}
                          className={`rounded-xl border p-3 flex items-center gap-2 ${
                            g.enabled
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          {g.enabled ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              g.enabled ? "text-emerald-800" : "text-gray-400"
                            }`}
                          >
                            {g.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : helper.monthlyBaseSalary || helper.baseRatePerTrip || helper.commissionPercent ? (
                <div className="space-y-5">
                  {/* Fallback to helper's inline rate fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-brand-border p-4">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Employment Type</div>
                      <div className="font-bold text-brand-navy capitalize">
                        {(helper.employmentType || "per_trip").replace(/_/g, " ")}
                      </div>
                    </div>
                    {helper.monthlyBaseSalary && helper.monthlyBaseSalary > 0 && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Monthly Salary</div>
                        <div className="font-bold text-brand-navy">
                          {formatCurrency(helper.monthlyBaseSalary)}
                        </div>
                      </div>
                    )}
                    {helper.baseRatePerTrip && helper.baseRatePerTrip > 0 && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Per Trip Rate</div>
                        <div className="font-bold text-brand-navy">
                          {formatCurrency(helper.baseRatePerTrip)}
                        </div>
                      </div>
                    )}
                    {helper.ratePerKm && helper.ratePerKm > 0 && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Per KM Rate</div>
                        <div className="font-bold text-brand-navy">
                          {formatCurrency(helper.ratePerKm)}
                        </div>
                      </div>
                    )}
                    {helper.commissionPercent && helper.commissionPercent > 0 && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Commission %</div>
                        <div className="font-bold text-brand-navy">{helper.commissionPercent}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Settings2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No payroll profile configured.</p>
                  <p className="text-xs mt-1">Set up a payroll profile from the Payroll module.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href="/payroll?tab=profiles">Configure Payroll Profile</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Trip Tab */}
        <TabsContent value="active">
          <Card>
            <CardContent className="p-6">
              {activeTrip ? (
                <div className="space-y-3">
                  <div className="text-lg font-bold text-brand-teal">{activeTrip.id}</div>
                  <div className="text-sm text-brand-navy">
                    {activeTrip.pickup.address} → {activeTrip.dropoff.address}
                  </div>
                  <Badge variant="info">{activeTrip.status.replace(/_/g, " ")}</Badge>
                  <div className="text-xs text-muted-foreground">
                    ETA: {activeTrip.eta ? new Date(activeTrip.eta).toLocaleString() : "—"}
                  </div>
                  <Button size="sm" onClick={() => router.push(`/trips/${activeTrip.id}`)}>
                    View Trip Detail
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Route className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No active trip assigned.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Helper Sheet */}
      <AddHelperSheet open={editOpen} onOpenChange={setEditOpen} editHelper={helper} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Remove Helper
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{helper.name}</strong> from the roster?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove Helper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: any;
  variant?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white dark:bg-card p-4 shadow-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-teal" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-base font-bold text-brand-navy dark:text-white capitalize">
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-brand-navy dark:text-white">{value}</div>
      </div>
    </div>
  );
}
