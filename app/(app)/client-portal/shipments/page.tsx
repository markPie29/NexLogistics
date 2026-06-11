"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClientTrips } from "@/lib/hooks/client-portal";
import {
  TRIP_STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  filterBySearchAndStatus,
} from "@/lib/utils/client-portal";
import type { TripStatus } from "@/lib/types";

function truncateAddress(addr: string): string {
  return addr.length > 40 ? addr.slice(0, 40) + "…" : addr;
}

export default function ClientPortalShipmentsPage() {
  const { trips } = useClientTrips();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTrip, setSelectedTrip] = useState<(typeof trips)[number] | null>(null);

  const filteredTrips = useMemo(
    () =>
      filterBySearchAndStatus(
        trips,
        searchQuery,
        statusFilter,
        (trip) => trip.status,
        (trip) => [
          trip.id,
          trip.pickup?.address ?? "",
          trip.dropoff?.address ?? "",
          trip.driverName ?? "",
        ]
      ),
    [trips, searchQuery, statusFilter]
  );

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by trip ID, address, or driver…"
            className="pl-9 focus-visible:ring-2 focus-visible:ring-brand-teal"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] focus-visible:ring-2 focus-visible:ring-brand-teal">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(TRIP_STATUS_LABELS) as TripStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {TRIP_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {trips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No shipments found for your account.
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No shipments match your current filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4 py-3 text-xs">Trip ID</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Pickup</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Dropoff</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Status</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Driver</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Vehicle</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.map((trip) => (
              <TableRow
                key={trip.id}
                className="h-12 cursor-pointer hover:bg-brand-teal-light focus-visible:ring-2 focus-visible:ring-brand-teal"
                tabIndex={0}
                onClick={() => setSelectedTrip(trip)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTrip(trip);
                  }
                }}
              >
                <TableCell className="px-4 py-3 text-sm font-semibold text-brand-navy">
                  {trip.id}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {truncateAddress(trip.pickup?.address ?? "—")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {truncateAddress(trip.dropoff?.address ?? "—")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <Badge
                    className={
                      STATUS_BADGE_VARIANT[trip.status] ??
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {TRIP_STATUS_LABELS[trip.status as TripStatus] ??
                      trip.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">{trip.driverName}</TableCell>
                <TableCell className="px-4 py-3 text-sm">{trip.vehiclePlate}</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {trip.createdAt
                    ? new Date(trip.createdAt).toLocaleDateString("en-PH")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={selectedTrip !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTrip(null);
        }}
      >
        {selectedTrip && (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Shipment {selectedTrip.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              {/* Addresses */}
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Pickup</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.pickup?.address ?? "—"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Dropoff</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.dropoff?.address ?? "—"}
                </span>
              </div>

              {/* Cargo */}
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Cargo</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.cargo?.description ?? "—"}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Weight</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.cargo?.weightKg
                    ? `${selectedTrip.cargo.weightKg.toLocaleString()} kg`
                    : "—"}
                </span>
              </div>

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.vehiclePlate}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium text-brand-navy">
                  {selectedTrip.driverName}
                </span>
              </div>

              {/* Status */}
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  className={
                    STATUS_BADGE_VARIANT[selectedTrip.status] ??
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {TRIP_STATUS_LABELS[selectedTrip.status as TripStatus] ??
                    selectedTrip.status}
                </Badge>
              </div>

              {/* Status Timeline */}
              {selectedTrip.statusLogs && selectedTrip.statusLogs.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Status Timeline
                  </h4>
                  <div className="space-y-3 border-l-2 border-gray-200 pl-4">
                    {selectedTrip.statusLogs.map((log, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-teal border-2 border-white" />
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.at).toLocaleString("en-PH", {
                            timeZone: "Asia/Manila",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                        <div className="font-medium text-brand-navy">
                          {TRIP_STATUS_LABELS[log.status as TripStatus] ??
                            log.status}
                        </div>
                        {log.note && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {log.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
