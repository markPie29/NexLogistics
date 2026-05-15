"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Layers, Truck, Users, MapPin, Route, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, UserCheck, PhoneCall, Navigation, Package, Filter,
  ThumbsUp, ThumbsDown, BadgeCheck, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useFleetStore, useDriverStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { TripStatus } from "@/lib/types";

const STATUS_VARIANT: Record<TripStatus, string> = {
  scheduled: "neutral",
  driver_assigned: "info",
  vehicle_dispatched: "info",
  loaded: "info",
  in_transit: "warning",
  delivered: "success",
  completed: "success",
  delayed: "danger",
  cancelled: "danger",
};

export default function DispatcherPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const setStatus = useTripStore((s) => s.setStatus);
  const approveTrip = useTripStore((s) => s.approveTrip);
  const rejectTrip = useTripStore((s) => s.rejectTrip);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);

  const [filter, setFilter] = useState<"all" | "unassigned" | "active" | "delayed">("all");

  // KPI stats
  const activeTrips = trips.filter((t) => t.status === "in_transit" || t.status === "loaded" || t.status === "vehicle_dispatched").length;
  const unassigned = trips.filter((t) => t.status === "scheduled").length;
  const availableDrivers = drivers.filter((d) => d.status === "active" && !trips.find((t) => t.driverId === d.id && t.status !== "completed" && t.status !== "cancelled")).length;
  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const delayedTrips = trips.filter((t) => t.status === "delayed").length;

  // Trips completed or delivered but pending payroll approval
  const pendingApproval = trips.filter(
    (t) => (t.status === "completed" || t.status === "delivered") &&
      (!t.approvalStatus || t.approvalStatus === "pending") &&
      !t.payrollProcessed
  );

  const filteredTrips = trips.filter((t) => {
    // Phase 5 — hide trips still awaiting Super Admin rate confirmation
    if (t.approvalStatus === "pending_rate_approval") return false;
    if (filter === "unassigned") return t.status === "scheduled";
    if (filter === "active") return ["driver_assigned", "vehicle_dispatched", "loaded", "in_transit"].includes(t.status);
    if (filter === "delayed") return t.status === "delayed";
    return t.status !== "completed" && t.status !== "cancelled";
  }).slice(0, 12);

  const onlineDrivers = drivers.filter((d) => d.status === "active").slice(0, 6);

  function handleDispatch(tripId: string) {
    const driver = drivers.find((d) => d.status === "active");
    const vehicle = vehicles.find((v) => v.status === "available");
    if (!driver || !vehicle) { toast.error("No available driver or vehicle"); return; }
    setStatus(tripId, "driver_assigned", user?.name, "Auto-dispatched by dispatcher");
    toast.success(`Trip ${tripId} dispatched to ${driver.name}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Center"
        subtitle={`Welcome, ${user?.name?.split(" ")[0] || "Dispatcher"} — manage and assign trips in real-time`}
        breadcrumbs={[{ label: "Operations" }, { label: "Dispatch Center" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/gps"><Navigation className="w-4 h-4" /> Live Map</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/trips/new"><Route className="w-4 h-4" /> New Trip</Link>
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KpiCard label="Active Trips" value={activeTrips} icon={Navigation} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineData={[18,22,20,28,26,31,29,activeTrips]} sparklineColor="#0EA5E9" footerLabel="In progress now" />
        <KpiCard label="Unassigned" value={unassigned} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel="Needs assignment" href="/trips" />
        <KpiCard label="Delayed" value={delayedTrips} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" footerLabel="Needs attention" />
        <KpiCard label="Avail. Drivers" value={availableDrivers} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[5,6,7,8,7,9,8,availableDrivers]} sparklineColor="#10B981" footerLabel="Ready to dispatch" />
        <KpiCard label="Pending Approval" value={pendingApproval.length} icon={BadgeCheck} iconColor="text-rose-600" iconBg="bg-rose-50" footerLabel="Awaiting payroll approval" />
      </div>

      {/* Main Content: Trip Queue + Driver Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trip Dispatch Queue */}
        <Card className="lg:col-span-2 border-brand-border shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-brand-navy">Trip Queue</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Assign drivers and vehicles to pending trips</p>
              </div>
              <div className="flex gap-1.5">
                {(["all", "unassigned", "active", "delayed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filter === f
                        ? "bg-brand-navy text-white shadow"
                        : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                    }`}
                  >
                    {f === "all" ? "All Active" : f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredTrips.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <div className="font-semibold">All clear!</div>
                  <div className="text-sm">No trips in this category</div>
                </div>
              )}
              {filteredTrips.map((t) => {
                const driver = drivers.find((d) => d.id === t.driverId);
                const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                const variant = STATUS_VARIANT[t.status] as any;
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-brand-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand-navy text-sm">{t.id}</span>
                        <Badge variant={variant}>{t.status.replace(/_/g, " ")}</Badge>
                        {t.cargo.type && <span className="text-xs text-muted-foreground">· {t.cargo.type}</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 shrink-0 text-emerald-500" />
                        <span className="truncate">{t.pickup.address}</span>
                        <span className="mx-1">→</span>
                        <MapPin className="w-3 h-3 shrink-0 text-red-500" />
                        <span className="truncate">{t.dropoff.address}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {driver && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{driver.name}</span>}
                        {vehicle && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle.plate}</span>}
                        <span className="font-semibold text-brand-navy">{formatCurrency(t.fare)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.status === "scheduled" && (
                        <Button size="sm" onClick={() => handleDispatch(t.id)}>
                          Dispatch
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/trips/${t.id}`}><ChevronRight className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Driver Status Panel */}
        <div className="space-y-4">
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-brand-navy flex items-center justify-between">
                Driver Status
                <Link href="/drivers" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {onlineDrivers.map((d) => {
                const activeTrip = trips.find((t) => t.driverId === d.id && t.status !== "completed" && t.status !== "cancelled");
                return (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-teal/30 hover:bg-gray-50 transition-colors">
                    <div className="relative w-9 h-9 rounded-full bg-brand-navy text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {d.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${activeTrip ? "bg-sky-500" : "bg-emerald-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-navy truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {activeTrip ? `On trip: ${activeTrip.id}` : "Available"}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-brand-navy">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                { href: "/trips", label: "All Trips", icon: Route, desc: "Manage & track all trips" },
                { href: "/drivers", label: "Driver List", icon: Users, desc: "Driver profiles & status" },
                { href: "/fleet", label: "Fleet", icon: Truck, desc: "Vehicle availability" },
                { href: "/gps", label: "Live Map", icon: MapPin, desc: "Real-time GPS tracking" },
                { href: "/pod", label: "Delivery Proof", icon: CheckCircle2, desc: "POD submissions" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-teal/40 hover:bg-brand-teal-light/20 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-50 group-hover:bg-brand-teal-light flex items-center justify-center shrink-0 transition-colors">
                    <link.icon className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-teal transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Trip Approval Queue ─────────────────────────────── */}
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl font-bold text-brand-navy flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-brand-teal" />
                Trip Approval Queue
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review completed trips and approve them for payroll processing
              </p>
            </div>
            {pendingApproval.length > 0 && (
              <Badge variant="danger" className="text-xs">{pendingApproval.length} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingApproval.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <div className="font-semibold">All caught up!</div>
              <div className="text-sm">No trips awaiting approval</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingApproval.map((t) => {
                const driver = drivers.find((d) => d.id === t.driverId);
                const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                return (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand-navy text-sm">{t.id}</span>
                        <Badge variant="success">{t.status.replace(/_/g, " ")}</Badge>
                        <Badge variant="neutral">pending approval</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 shrink-0 text-emerald-500" />
                        <span className="truncate">{t.pickup.address}</span>
                        <span className="mx-1">→</span>
                        <MapPin className="w-3 h-3 shrink-0 text-red-500" />
                        <span className="truncate">{t.dropoff.address}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {driver && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{driver.name}</span>}
                        {vehicle && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle.plate}</span>}
                        <span className="font-semibold text-brand-navy">{formatCurrency(t.fare)}</span>
                        <span>{t.distanceKm} km</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          rejectTrip(t.id, user?.name ?? "dispatcher", "Rejected by dispatcher");
                          toast.error(`Trip ${t.id} rejected`);
                        }}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          approveTrip(t.id, user?.name ?? "dispatcher");
                          toast.success(`Trip ${t.id} approved for payroll`);
                        }}
                      >
                        <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/trips/${t.id}`}><ChevronRight className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

