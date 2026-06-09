"use client";

import { useMemo, useState } from "react";
import { Wallet, CheckCircle2, Clock, TrendingUp, Banknote } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, usePartnerStore } from "@/lib/store";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import type { Trip, Partner } from "@/lib/types";

// 3-tier payout calculation precedence
function computePayoutAmount(trip: Trip, partner: Partner | undefined): number {
  if (trip.partnerRate && trip.partnerRate > 0) return trip.partnerRate;
  if (partner?.defaultRate && partner.defaultRate > 0) return partner.defaultRate;
  if (partner?.ratePerKm && partner.ratePerKm > 0 && trip.distanceKm > 0) {
    return partner.ratePerKm * trip.distanceKm;
  }
  return 0;
}

// Get completion date from statusLogs
function getCompletionDate(trip: Trip): string | null {
  const completedLog = [...trip.statusLogs]
    .reverse()
    .find((log) => log.status === "completed" || log.status === "delivered");
  return completedLog?.at ?? null;
}

export default function PartnerEarningsPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const partners = usePartnerStore((s) => s.partners);
  const [filter, setFilter] = useState("all");

  const partnerId = user?.partnerId;
  const partner = partners.find((p) => p.id === partnerId);

  // Only show trips where partnerId matches AND status is "completed" or "delivered"
  const completedTrips = useMemo(() => {
    if (!partnerId) return [];
    return trips
      .filter(
        (t) =>
          t.partnerId === partnerId &&
          (t.status === "completed" || t.status === "delivered")
      )
      .sort((a, b) => {
        const dateA = getCompletionDate(a);
        const dateB = getCompletionDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [trips, partnerId]);

  // Compute payouts for each trip
  const tripPayouts = useMemo(() => {
    return completedTrips.map((trip) => ({
      trip,
      payout: computePayoutAmount(trip, partner),
      completionDate: getCompletionDate(trip),
    }));
  }, [completedTrips, partner]);

  // KPI calculations
  const totalEarnings = useMemo(
    () => tripPayouts.reduce((sum, tp) => sum + tp.payout, 0),
    [tripPayouts]
  );

  const paidAmount = useMemo(
    () =>
      tripPayouts
        .filter((tp) => tp.trip.partnerPayoutStatus === "paid")
        .reduce((sum, tp) => sum + tp.payout, 0),
    [tripPayouts]
  );

  const pendingAmount = useMemo(
    () =>
      tripPayouts
        .filter((tp) => tp.trip.partnerPayoutStatus === "pending")
        .reduce((sum, tp) => sum + tp.payout, 0),
    [tripPayouts]
  );

  const tripsCompleted = completedTrips.length;

  // Apply filter
  const filteredPayouts = useMemo(() => {
    if (filter === "pending") return tripPayouts.filter((tp) => tp.trip.partnerPayoutStatus === "pending");
    if (filter === "paid") return tripPayouts.filter((tp) => tp.trip.partnerPayoutStatus === "paid");
    return tripPayouts;
  }, [tripPayouts, filter]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          footerLabel="All-time completed trips"
        />
        <KpiCard
          label="Paid Amount"
          value={formatCurrency(paidAmount)}
          icon={CheckCircle2}
          iconColor="text-brand-teal"
          iconBg="bg-brand-teal-light"
          footerLabel="Released payments"
        />
        <KpiCard
          label="Pending Amount"
          value={formatCurrency(pendingAmount)}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          footerLabel="Awaiting release"
        />
        <KpiCard
          label="Trips Completed"
          value={tripsCompleted}
          icon={Banknote}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          footerLabel="Completed / delivered"
        />
      </div>

      {/* Filter Tabs + Payout Table */}
      <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} forceMount>
          <Card>
            <CardContent className="p-0">
              {filteredPayouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No earnings to display yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed trips will appear here with their payout details.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border text-left">
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Trip ID</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Date Completed</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Route</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Rate Applied</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Payout Amount</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayouts.map(({ trip, payout, completionDate }) => (
                        <tr
                          key={trip.id}
                          className="border-b border-brand-border/60 last:border-0 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-brand-navy">
                            {trip.id}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {completionDate
                              ? new Date(completionDate).toLocaleDateString("en-PH", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-brand-navy">
                              {trip.pickup.address.split(",")[0]}
                            </span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span className="text-brand-navy">
                              {trip.dropoff.address.split(",")[0]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {getRateLabel(trip, partner)}
                          </td>
                          <td className="px-4 py-3 font-bold text-brand-navy">
                            {formatCurrency(payout)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={
                                  trip.partnerPayoutStatus === "paid"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {trip.partnerPayoutStatus === "paid" ? "Paid" : "Pending"}
                              </Badge>
                              {trip.partnerPayoutStatus === "paid" && trip.partnerPayoutAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(trip.partnerPayoutAt).toLocaleDateString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper to display which rate tier was applied
function getRateLabel(trip: Trip, partner: Partner | undefined): string {
  if (trip.partnerRate && trip.partnerRate > 0) return "Trip Rate";
  if (partner?.defaultRate && partner.defaultRate > 0) return "Default Rate";
  if (partner?.ratePerKm && partner.ratePerKm > 0 && trip.distanceKm > 0)
    return `${partner.ratePerKm}/km × ${trip.distanceKm}km`;
  return "—";
}
