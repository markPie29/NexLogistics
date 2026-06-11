import { useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useDriverStore, useFleetStore } from "@/lib/store";

export function useClientTrips() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);

  const clientTrips = useMemo(
    () => trips.filter((t) => t.clientId === user?.clientId),
    [trips, user?.clientId]
  );

  const enrichedTrips = useMemo(
    () =>
      clientTrips.map((trip) => ({
        ...trip,
        driverName:
          drivers.find((d) => d.id === trip.driverId)?.name ?? "Unassigned",
        vehiclePlate:
          vehicles.find((v) => v.id === trip.vehicleId)?.plate ?? "—",
      })),
    [clientTrips, drivers, vehicles]
  );

  return { trips: enrichedTrips, total: enrichedTrips.length };
}
