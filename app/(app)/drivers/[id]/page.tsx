"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User as UserIcon, Truck, Star, Phone, Mail, MapPin, Shield,
  Calendar, TrendingUp, Route, Wallet, Activity, CheckCircle2, Settings2,
  AlertCircle, Pencil, Trash2, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDriverStore, useFleetStore, useTripStore, useDriverPayrollProfileStore, usePayrollPeriodStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddDriverSheet } from "@/components/forms/AddDriverSheet";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function DriverDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const driver = useDriverStore((s) => s.drivers.find((d) => d.id === params.id));
  const deleteDriver = useDriverStore((s) => s.deleteDriver);
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const profiles = useDriverPayrollProfileStore((s) => s.profiles);
  const summaries = usePayrollPeriodStore((s) => s.summaries);
  const periods = usePayrollPeriodStore((s) => s.periods);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!driver) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Driver not found.</p>
        <Button className="mt-4" onClick={() => router.push("/drivers")}>
          <ArrowLeft className="w-4 h-4" /> Back to Drivers
        </Button>
      </div>
    );
  }

  const vehicle = vehicles.find((v) => v.id === driver.assignedVehicleId);
  const driverTrips = trips.filter((t) => t.driverId === driver.id);
  const activeTrip = driverTrips.find((t) => ["in_transit", "loaded", "vehicle_dispatched", "driver_assigned"].includes(t.status));
  const completedTrips = driverTrips.filter((t) => t.status === "completed" || t.status === "delivered");
  const payrollProfile = profiles.find((p) => p.driverId === driver.id);
  const driverSummaries = summaries.filter((s) => s.driverId === driver.id).sort((a, b) => {
    const pa = periods.find((p) => p.id === a.payrollPeriodId);
    const pb = periods.find((p) => p.id === b.payrollPeriodId);
    return (pb ? new Date(pb.endDate).getTime() : 0) - (pa ? new Date(pa.endDate).getTime() : 0);
  });
  const totalEarned = driverSummaries.filter((s) => s.status === "paid").reduce((a, b) => a + b.netPay, 0);

  const handleDelete = () => {
    deleteDriver(driver.id);
    toast.success(`Driver ${driver.name} removed`);
    router.push("/drivers");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.name}
        subtitle={`${driver.licenseClass} · License ${driver.licenseNumber}`}
        breadcrumbs={[{ label: "Operations" }, { label: "Drivers", href: "/drivers" }, { label: driver.name }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/drivers")}>
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
        <StatCard label="Status" value={driver.status.replace("_", " ")} icon={Activity} variant={STATUS_VARIANT[driver.status]} />
        <StatCard label="On-Time Rate" value={`${driver.onTimePercent}%`} icon={TrendingUp} />
        <StatCard label="Total Trips" value={driverTrips.length} icon={Route} />
        <StatCard label="Rating" value={`${driver.rating} / 5`} icon={Star} />
      </div>

      {/* Profile Hero */}
      <Card className="border-brand-border bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-navy text-white font-extrabold text-2xl flex items-center justify-center shrink-0">
              {driver.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">{driver.name}</h2>
                <Badge variant={STATUS_VARIANT[driver.status]}>{driver.status.replace("_", " ")}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm">
                <InfoRow icon={Phone} label="Phone" value={driver.phone} />
                <InfoRow icon={Mail} label="Email" value={driver.email} />
                <InfoRow icon={MapPin} label="Address" value={driver.address || "—"} />
                <InfoRow icon={Shield} label="License No." value={driver.licenseNumber} />
                <InfoRow icon={Shield} label="License Class" value={driver.licenseClass} />
                <InfoRow icon={Calendar} label="License Expiry" value={new Date(driver.licenseExpiry).toLocaleDateString()} />
                <InfoRow icon={Calendar} label="Hire Date" value={new Date(driver.hireDate).toLocaleDateString()} />
                <InfoRow icon={UserIcon} label="Emergency Contact" value={driver.emergencyContact || "—"} />
                {vehicle && <InfoRow icon={Truck} label="Assigned Vehicle" value={`${vehicle.plate} — ${vehicle.brand} ${vehicle.model}`} />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance + Assigned Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-brand-border bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">On-Time Delivery</span>
                <span className="font-bold text-brand-navy dark:text-white">{driver.onTimePercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-teal rounded-full" style={{ width: `${driver.onTimePercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Driver Rating</span>
                <span className="font-bold text-brand-navy dark:text-white flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)} / 5
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(driver.rating / 5) * 100}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-brand-teal-light p-3 text-center">
                <div className="text-2xl font-extrabold text-brand-navy">{completedTrips.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Completed Trips</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <div className="text-2xl font-extrabold text-brand-navy">{driverTrips.filter((t) => t.status === "delayed").length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Delayed Trips</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Assigned Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {vehicle ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7 text-brand-teal" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-brand-navy dark:text-white">{vehicle.plate}</div>
                  <div className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} · {vehicle.year}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={{ available: "success", in_trip: "info", maintenance: "warning", inactive: "neutral" }[vehicle.status] as any}>
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{vehicle.type}</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => router.push(`/fleet/${vehicle.id}`)}>
                    View Vehicle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No vehicle assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trips">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="trips">Trip History ({driverTrips.length})</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Summary</TabsTrigger>
          <TabsTrigger value="payroll_settings">Payroll Settings</TabsTrigger>
          <TabsTrigger value="active">Active Trip</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                    <th className="py-3 px-4">Trip ID</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Fare</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {driverTrips.map((t) => (
                    <tr key={t.id} className="border-b border-brand-border/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                      onClick={() => router.push(`/trips/${t.id}`)}>
                      <td className="py-3 px-4 font-medium text-brand-teal">{t.id}</td>
                      <td className="py-3 px-4">
                        <div className="text-brand-navy font-medium truncate max-w-[200px]">{t.pickup.address}</div>
                        <div className="text-xs text-muted-foreground">→ {t.dropoff.address}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(t.fare)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          t.status === "completed" || t.status === "delivered" ? "success" :
                          t.status === "delayed" ? "danger" :
                          t.status === "in_transit" ? "info" : "neutral"
                        }>{t.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {(t.status === "completed" || t.status === "delivered") && (
                          <Badge variant={
                            t.approvalStatus === "approved" ? "success" :
                            t.approvalStatus === "rejected" ? "danger" : "neutral"
                          }>{t.approvalStatus ?? "pending"}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {driverTrips.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No trip history.</td></tr>}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardContent className="p-0">
              {driverSummaries.length > 0 ? (
                <>
                  <div className="p-4 border-b border-brand-border bg-brand-teal-light/40 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total Earned (Paid)</div>
                    <div className="text-2xl font-extrabold text-brand-navy">{formatCurrency(totalEarned)}</div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
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
                      {driverSummaries.map((s) => {
                        const period = periods.find((p) => p.id === s.payrollPeriodId);
                        return (
                          <tr key={s.id} className="border-b border-brand-border/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                            onClick={() => router.push(`/payroll/${s.payrollPeriodId}`)}>
                            <td className="py-3 px-4 text-muted-foreground">{period?.name ?? s.payrollPeriodId}</td>
                            <td className="py-3 px-4 text-xs capitalize">{s.payrollMode.replace(/_/g, " ")}</td>
                            <td className="py-3 px-4">{s.tripsCount}</td>
                            <td className="py-3 px-4">{formatCurrency(s.tripEarnings)}</td>
                            <td className="py-3 px-4 text-emerald-600">+{formatCurrency(s.incentives)}</td>
                            <td className="py-3 px-4 text-red-500">−{formatCurrency(s.totalDeductions)}</td>
                            <td className="py-3 px-4 font-bold text-brand-navy">{formatCurrency(s.netPay)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={s.status === "paid" ? "success" : s.status === "approved" ? "info" : "neutral"}>
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
                  {/* Mode & Base */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-brand-border p-4">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Payroll Mode</div>
                      <div className="font-bold text-brand-navy capitalize">{payrollProfile.payrollMode.replace(/_/g, " ")}</div>
                    </div>
                    <div className="rounded-xl border border-brand-border p-4">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Base Salary (Monthly)</div>
                      <div className="font-bold text-brand-navy">{formatCurrency(payrollProfile.baseSalary)}</div>
                    </div>
                    {payrollProfile.allowanceEnabled && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Monthly Allowance</div>
                        <div className="font-bold text-brand-navy">{formatCurrency(payrollProfile.monthlyAllowance ?? 0)}</div>
                      </div>
                    )}
                    {payrollProfile.perTripFlatRate && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Per Trip Rate</div>
                        <div className="font-bold text-brand-navy">{formatCurrency(payrollProfile.perTripFlatRate)}</div>
                      </div>
                    )}
                    {payrollProfile.perDeliveryRate && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Per Delivery Rate</div>
                        <div className="font-bold text-brand-navy">{formatCurrency(payrollProfile.perDeliveryRate)}</div>
                      </div>
                    )}
                    {payrollProfile.commissionPercent && (
                      <div className="rounded-xl border border-brand-border p-4">
                        <div className="text-xs uppercase text-muted-foreground mb-1">Commission</div>
                        <div className="font-bold text-brand-navy">{payrollProfile.commissionPercent}%</div>
                      </div>
                    )}
                  </div>
                  {/* Government Deductions */}
                  <div>
                    <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">Government Deductions</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "SSS", enabled: payrollProfile.sssEnabled },
                        { label: "PhilHealth", enabled: payrollProfile.philhealthEnabled },
                        { label: "Pag-IBIG", enabled: payrollProfile.pagibigEnabled },
                        { label: "Withholding Tax", enabled: payrollProfile.taxEnabled },
                      ].map((g) => (
                        <div key={g.label} className={`rounded-xl border p-3 flex items-center gap-2 ${g.enabled ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                          {g.enabled ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <span className={`text-sm font-medium ${g.enabled ? "text-emerald-800" : "text-gray-400"}`}>{g.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Extras */}
                  <div>
                    <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">Additional Features</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: "Overtime Pay", enabled: payrollProfile.overtimeEnabled },
                        { label: "Allowances", enabled: payrollProfile.allowanceEnabled },
                      ].map((f) => (
                        <div key={f.label} className={`rounded-xl border p-3 flex items-center gap-2 ${f.enabled ? "border-sky-200 bg-sky-50" : "border-gray-200 bg-gray-50"}`}>
                          {f.enabled ? <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <span className={`text-sm font-medium ${f.enabled ? "text-sky-800" : "text-gray-400"}`}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/payroll?tab=profiles">Edit Profile in Payroll</a>
                    </Button>
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

        <TabsContent value="active">
          <Card>
            <CardContent className="p-6">
              {activeTrip ? (
                <div className="space-y-3">
                  <div className="text-lg font-bold text-brand-teal">{activeTrip.id}</div>
                  <div className="text-sm text-brand-navy">{activeTrip.pickup.address} → {activeTrip.dropoff.address}</div>
                  <Badge variant="info">{activeTrip.status.replace(/_/g, " ")}</Badge>
                  <div className="text-xs text-muted-foreground">ETA: {activeTrip.eta ? new Date(activeTrip.eta).toLocaleString() : "—"}</div>
                  <Button size="sm" onClick={() => router.push(`/trips/${activeTrip.id}`)}>View Trip Detail</Button>
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

      {/* Edit Driver Sheet */}
      <AddDriverSheet open={editOpen} onOpenChange={setEditOpen} editDriver={driver} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Remove Driver
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{driver.name}</strong> from the roster?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant }: { label: string; value: any; icon: any; variant?: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white dark:bg-card p-4 shadow-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-teal" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-base font-bold text-brand-navy dark:text-white capitalize">{value}</div>
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
