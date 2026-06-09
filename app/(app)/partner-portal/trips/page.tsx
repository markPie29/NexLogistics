"use client";

import { useMemo, useState } from "react";
import { Search, Route, MapPin, Package, CheckCircle2, Clock, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, usePartnerStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Trip, TripStatus } from "@/lib/types";

const ACTIVE_STATUSES: TripStatus[] = [
  "scheduled",
  "driver_assigned",
  "vehicle_dispatched",
  "loaded",
  "in_transit",
];

function computePayoutAmount(
  trip: Trip,
  partner: { defaultRate?: number; ratePerKm?: number } | undefined
): number {
  if (trip.partnerRate && trip.partnerRate > 0) return trip.partnerRate;
  if (partner?.defaultRate && partner.defaultRate > 0) return partner.defaultRate;
  if (partner?.ratePerKm && partner.ratePerKm > 0 && trip.distanceKm > 0) {
    return partner.ratePerKm * trip.distanceKm;
  }
  return 0;
}

function getStatusBadgeClass(status: TripStatus): string {
  if (status === "in_transit") return "bg-blue-100 text-blue-700";
  if (status === "completed" || status === "delivered")
    return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  // scheduled, driver_assigned, vehicle_dispatched, loaded
  return "bg-amber-100 text-amber-700";
}

export default function PartnerTripsPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const partners = usePartnerStore((s) => s.partners);
  const clients = useClientStore((s) => s.clients);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const partner = useMemo(
    () => partners.find((p) => p.id === user?.partnerId),
    [partners, user?.partnerId]
  );

  // All trips for this partner, sorted by pickup.scheduledAt desc
  const partnerTrips = useMemo(() => {
    if (!user?.partnerId) return [];
    return trips
      .filter((t) => t.partnerId === user.partnerId)
      .sort(
        (a, b) =>
          new Date(b.pickup.scheduledAt).getTime() -
          new Date(a.pickup.scheduledAt).getTime()
      );
  }, [trips, user?.partnerId]);

  // Apply status filter
  const filteredByStatus = useMemo(() => {
    if (tab === "all") return partnerTrips;
    if (tab === "active")
      return partnerTrips.filter((t) => ACTIVE_STATUSES.includes(t.status));
    if (tab === "completed")
      return partnerTrips.filter((t) => t.status === "completed" || t.status === "delivered");
    if (tab === "cancelled")
      return partnerTrips.filter((t) => t.status === "cancelled");
    return partnerTrips;
  }, [partnerTrips, tab]);

  // Apply search
  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredByStatus;
    return filteredByStatus.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.pickup.address.toLowerCase().includes(q) ||
        t.dropoff.address.toLowerCase().includes(q)
    );
  }, [filteredByStatus, search]);

  const resolveClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name ?? clientId;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trip ID, pickup, or dropoff..."
              className="h-9 pl-9 text-xs"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {filteredTrips.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  No trips found matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left border-b border-gray-100 text-gray-600">
                        <th className="py-3 px-2">Trip ID</th>
                        <th className="py-3 px-2">Client</th>
                        <th className="py-3 px-2">Pickup</th>
                        <th className="py-3 px-2">Dropoff</th>
                        <th className="py-3 px-2">Scheduled</th>
                        <th className="py-3 px-2">Distance</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrips.map((trip) => (
                        <tr
                          key={trip.id}
                          onClick={() => setSelectedTrip(trip)}
                          className="border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer"
                        >
                          <td className="py-3 px-2 font-semibold text-[#0B1220]">
                            {trip.id}
                          </td>
                          <td className="py-3 px-2 text-gray-700">
                            {resolveClientName(trip.clientId)}
                          </td>
                          <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">
                            {trip.pickup.address}
                          </td>
                          <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">
                            {trip.dropoff.address}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {new Date(trip.pickup.scheduledAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {trip.distanceKm.toFixed(1)} km
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              className={`text-[10px] uppercase font-bold ${getStatusBadgeClass(trip.status)}`}
                            >
                              {trip.status.replaceAll("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">
                            {formatCurrency(computePayoutAmount(trip, partner))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Trip Detail Dialog */}
      <Dialog
        open={!!selectedTrip}
        onOpenChange={(open) => {
          if (!open) setSelectedTrip(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Trip Details
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-4 text-sm">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500 text-xs">Trip ID</div>
                  <div className="font-semibold">{selectedTrip.id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Client</div>
                  <div className="font-semibold">
                    {resolveClientName(selectedTrip.clientId)}
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Pickup</div>
                    <div className="font-medium">{selectedTrip.pickup.address}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(selectedTrip.pickup.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Dropoff</div>
                    <div className="font-medium">{selectedTrip.dropoff.address}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(selectedTrip.dropoff.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500 text-xs">Distance</div>
                  <div className="font-semibold">{selectedTrip.distanceKm.toFixed(1)} km</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Status</div>
                  <Badge
                    className={`text-[10px] uppercase font-bold ${getStatusBadgeClass(selectedTrip.status)}`}
                  >
                    {selectedTrip.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Cargo */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-gray-500 text-xs">Cargo Type</div>
                  <div className="font-medium">{selectedTrip.cargo.type}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Weight</div>
                  <div className="font-medium">{selectedTrip.cargo.weightKg} kg</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Units</div>
                  <div className="font-medium">{selectedTrip.cargo.units}</div>
                </div>
              </div>

              {/* Payout Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <div className="text-gray-500 text-xs">Payout Amount</div>
                  <div className="text-lg font-bold text-[#0B1220]">
                    {formatCurrency(computePayoutAmount(selectedTrip, partner))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Payout Status</div>
                  <Badge
                    className={`text-[10px] uppercase font-bold ${
                      selectedTrip.partnerPayoutStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedTrip.partnerPayoutStatus ?? "pending"}
                  </Badge>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Status Timeline
                </div>
                <div className="space-y-2 border-l-2 border-gray-200 pl-4 ml-1">
                  {selectedTrip.statusLogs.map((log, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[9px] uppercase font-bold ${getStatusBadgeClass(log.status)}`}
                        >
                          {log.status.replaceAll("_", " ")}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(log.at).toLocaleString()}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
