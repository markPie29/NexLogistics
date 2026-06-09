"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Route,
  Truck,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Handshake,
  Wallet,
  Building2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Calendar,
  MapPin,
  Package,
  Banknote,
  AlertCircle,
  Fuel,
  MoreHorizontal,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, usePartnerRequestStore, usePartnerStore, useClientStore } from "@/lib/store";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = [
  "scheduled",
  "driver_assigned",
  "vehicle_dispatched",
  "loaded",
  "in_transit",
  "delayed",
] as const;

const COMPLETED_STATUSES = ["completed", "delivered"] as const;

const REQUEST_TYPE_ICON: Record<string, typeof Fuel> = {
  diesel: Fuel,
  cash_advance: Banknote,
  other: MoreHorizontal,
};

const REQUEST_TYPE_LABEL: Record<string, string> = {
  diesel: "Diesel",
  cash_advance: "Cash Advance",
  other: "Others",
};

export default function PartnerPortalOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const requests = usePartnerRequestStore((s) => s.requests);
  const partners = usePartnerStore((s) => s.partners);
  const clients = useClientStore((s) => s.clients);

  const partnerId = user?.partnerId;

  const partner = useMemo(
    () => partners.find((p) => p.id === partnerId) ?? null,
    [partners, partnerId]
  );

  const partnerTrips = useMemo(
    () => trips.filter((t) => t.partnerId === partnerId),
    [trips, partnerId]
  );

  const partnerRequests = useMemo(
    () => requests.filter((r) => r.partnerId === partnerId),
    [requests, partnerId]
  );

  // KPIs
  const kpis = useMemo(() => {
    const totalTrips = partnerTrips.length;
    const activeTrips = partnerTrips.filter((t) =>
      (ACTIVE_STATUSES as readonly string[]).includes(t.status)
    ).length;
    const completedTrips = partnerTrips.filter((t) =>
      (COMPLETED_STATUSES as readonly string[]).includes(t.status)
    ).length;
    const pendingPayables = partnerTrips
      .filter((t) => t.partnerPayoutStatus === "pending")
      .reduce((sum, t) => sum + computePayout(t, partner), 0);
    const totalEarned = partnerTrips
      .filter((t) => t.partnerPayoutStatus === "paid")
      .reduce((sum, t) => sum + computePayout(t, partner), 0);
    const totalEarnings = partnerTrips
      .filter((t) => (COMPLETED_STATUSES as readonly string[]).includes(t.status))
      .reduce((sum, t) => sum + computePayout(t, partner), 0);

    return { totalTrips, activeTrips, completedTrips, pendingPayables, totalEarned, totalEarnings };
  }, [partnerTrips, partner]);

  // Recent trips (last 5)
  const recentTrips = useMemo(
    () =>
      [...partnerTrips]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [partnerTrips]
  );

  // Pending requests
  const pendingRequests = useMemo(
    () => partnerRequests.filter((r) => r.status === "pending"),
    [partnerRequests]
  );

  // All requests for activity feed (last 5)
  const recentRequests = useMemo(
    () =>
      [...partnerRequests]
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
        .slice(0, 5),
    [partnerRequests]
  );

  // Active trip (the one currently in_transit or loaded)
  const activeTrip = useMemo(
    () => partnerTrips.find((t) => t.status === "in_transit" || t.status === "loaded"),
    [partnerTrips]
  );

  const resolveClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name ?? clientId;
  };

  return (
    <div className="space-y-6">
      {/* ─── KPI Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          label="Total Trips"
          value={kpis.totalTrips}
          icon={Route}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          footerLabel="All assigned trips"
          href="/partner-portal/trips"
          delay={0}
        />
        <KpiCard
          label="Active Trips"
          value={kpis.activeTrips}
          icon={Truck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          footerLabel="Currently in progress"
          href="/partner-portal/trips"
          delay={0.05}
        />
        <KpiCard
          label="Completed"
          value={kpis.completedTrips}
          icon={CheckCircle2}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          footerLabel="Delivered successfully"
          href="/partner-portal/trips"
          delay={0.1}
        />
        <KpiCard
          label="Pending Payables"
          value={formatCurrency(kpis.pendingPayables)}
          icon={CircleDollarSign}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          footerLabel="Awaiting payment"
          href="/partner-portal/earnings"
          delay={0.15}
        />
      </div>

      {/* ─── Earnings Summary Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <KpiCard
          label="Total Earnings"
          value={formatCurrency(kpis.totalEarnings)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          footerLabel="From completed trips"
          href="/partner-portal/earnings"
          delay={0.2}
        />
        <KpiCard
          label="Paid Out"
          value={formatCurrency(kpis.totalEarned)}
          icon={Wallet}
          iconColor="text-brand-teal"
          iconBg="bg-brand-teal-light"
          footerLabel="Successfully released"
          href="/partner-portal/earnings"
          delay={0.25}
        />
        <KpiCard
          label="Pending Requests"
          value={pendingRequests.length}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          footerLabel={pendingRequests.length > 0 ? `${formatCurrency(pendingRequests.reduce((s, r) => s + r.amount, 0))} total` : "No pending requests"}
          href="/partner-portal/requests"
          delay={0.3}
        />
      </div>

      {/* ─── Active Trip Banner ──────────────────────────────────── */}
      {activeTrip && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-brand-teal/30 bg-gradient-to-r from-brand-teal/5 via-white to-emerald-50/40 dark:from-brand-teal/10 dark:via-card dark:to-emerald-900/10">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-brand-teal/15 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-navy dark:text-white">{activeTrip.id}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-bold uppercase">
                        {activeTrip.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        {activeTrip.pickup.address.split(",")[0]}
                      </span>
                      <span className="mx-1.5">→</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {activeTrip.dropoff.address.split(",")[0]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Distance</div>
                    <div className="text-sm font-bold text-brand-navy dark:text-white">{activeTrip.distanceKm} km</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Client</div>
                    <div className="text-sm font-bold text-brand-navy dark:text-white">{resolveClientName(activeTrip.clientId)}</div>
                  </div>
                  <Link href="/partner-portal/trips">
                    <Button size="sm" variant="outline" className="shrink-0">
                      View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Main Content Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-5">
        {/* Recent Trips — 3 col */}
        <Card className="xl:col-span-3 border-gray-200 dark:border-white/10 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">Recent Trips</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Latest assigned and completed deliveries</p>
            </div>
            <Link
              href="/partner-portal/trips"
              className="text-xs font-semibold text-brand-teal hover:text-brand-navy dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CardContent className="p-0">
            {recentTrips.length === 0 ? (
              <div className="p-10 text-center">
                <Package className="w-10 h-10 mx-auto text-gray-200 dark:text-white/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No trips assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">When trips are assigned, they'll appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {recentTrips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/70 dark:hover:bg-white/5 transition group cursor-pointer"
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      trip.status === "completed" || trip.status === "delivered" ? "bg-emerald-500" :
                      trip.status === "in_transit" ? "bg-blue-500 animate-pulse" :
                      trip.status === "cancelled" ? "bg-red-500" : "bg-amber-500"
                    )} />

                    {/* Trip info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-navy dark:text-white">{trip.id}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{resolveClientName(trip.clientId)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {trip.pickup.address.split(",")[0]} → {trip.dropoff.address.split(",")[0]}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">{trip.distanceKm} km</div>
                      </div>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <div className="sm:hidden">
                      <TripStatusBadge status={trip.status} />
                    </div>

                    {/* Payout */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-brand-navy dark:text-white">
                        {formatCurrency(computePayout(trip, partner))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(trip.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column — Requests + Activity — 2 col */}
        <div className="xl:col-span-2 space-y-4">
          {/* Pending Requests Card */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-navy dark:text-white">Pending Requests</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Diesel, cash advances & others</p>
              </div>
              <Link
                href="/partner-portal/requests"
                className="text-xs font-semibold text-brand-teal hover:text-brand-navy dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-4">
              {pendingRequests.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-300 dark:text-emerald-600 mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">All requests processed</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Submit a new request when needed.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingRequests.slice(0, 4).map((req) => {
                    const TypeIcon = REQUEST_TYPE_ICON[req.type] ?? AlertCircle;
                    return (
                      <div key={req.id} className="flex items-center gap-3 rounded-lg bg-gray-50/70 dark:bg-white/5 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                          <TypeIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-brand-navy dark:text-white">
                            {REQUEST_TYPE_LABEL[req.type] ?? req.type}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {req.reason || "No reason provided"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-brand-navy dark:text-white">
                            {formatCurrency(req.amount)}
                          </div>
                          <Badge variant="warning" className="text-[9px] mt-0.5">Pending</Badge>
                        </div>
                      </div>
                    );
                  })}
                  {pendingRequests.length > 4 && (
                    <div className="text-center pt-1">
                      <Link href="/partner-portal/requests" className="text-[11px] font-semibold text-brand-teal hover:underline">
                        +{pendingRequests.length - 4} more requests
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Summary bar */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Total Pending</span>
                <span className="text-sm font-bold text-amber-600">
                  {formatCurrency(pendingRequests.reduce((s, r) => s + r.amount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-brand-navy dark:text-white">Recent Activity</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Request history and status changes</p>
            </div>
            <CardContent className="p-0">
              {recentRequests.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto text-gray-200 dark:text-white/20 mb-2" />
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {recentRequests.map((req) => (
                    <div key={req.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        req.status === "pending" ? "bg-amber-500" :
                        req.status === "approved" ? "bg-blue-500" :
                        req.status === "released" ? "bg-emerald-500" : "bg-red-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-brand-navy dark:text-white">
                          <span className="font-semibold">{REQUEST_TYPE_LABEL[req.type] ?? req.type}</span>
                          {" request "}
                          <span className={cn(
                            "font-semibold",
                            req.status === "released" ? "text-emerald-600" :
                            req.status === "rejected" ? "text-red-600" :
                            req.status === "approved" ? "text-blue-600" : "text-amber-600"
                          )}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(req.requestedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-navy dark:text-white shrink-0">
                        {formatCurrency(req.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickActionCard
          href="/partner-portal/trips"
          icon={Truck}
          label="My Trips"
          description="View assigned trips"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          count={kpis.totalTrips}
        />
        <QuickActionCard
          href="/partner-portal/requests"
          icon={Handshake}
          label="Requests"
          description="Submit & track"
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          count={pendingRequests.length}
          countLabel="pending"
        />
        <QuickActionCard
          href="/partner-portal/earnings"
          icon={Wallet}
          label="Earnings"
          description="Revenue & payouts"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <QuickActionCard
          href="/partner-portal/profile"
          icon={Building2}
          label="Profile"
          description="Company & banking"
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function computePayout(
  trip: { partnerRate?: number; distanceKm: number },
  partner: { defaultRate?: number; ratePerKm?: number } | null
): number {
  if (trip.partnerRate && trip.partnerRate > 0) return trip.partnerRate;
  if (partner?.defaultRate && partner.defaultRate > 0) return partner.defaultRate;
  if (partner?.ratePerKm && partner.ratePerKm > 0 && trip.distanceKm > 0) {
    return partner.ratePerKm * trip.distanceKm;
  }
  return 0;
}

function TripStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/30",
    driver_assigned: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/30",
    vehicle_dispatched: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700/30",
    loaded: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-700/30",
    in_transit: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-700/30",
    delayed: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/30",
    completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/30",
    delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700/30",
    cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/30",
  };

  const cls = colorMap[status] ?? "bg-gray-50 text-gray-700 ring-1 ring-gray-200/60";

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase whitespace-nowrap", cls)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  iconColor,
  iconBg,
  count,
  countLabel,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  iconColor: string;
  iconBg: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link href={href}>
      <Card className="border-gray-200 dark:border-white/10 hover:shadow-md hover:border-brand-teal/30 hover:-translate-y-0.5 transition-all cursor-pointer h-full group">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform", iconBg, "dark:bg-white/10")}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            {count !== undefined && count > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {count} {countLabel ?? ""}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-brand-navy dark:text-white">{label}</div>
            <div className="text-[11px] text-muted-foreground">{description}</div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
            Open <ArrowRight className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
