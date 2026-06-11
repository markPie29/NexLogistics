import { useMemo } from "react";
import { useClientTrips } from "./use-client-trips";
import { useClientInvoices } from "./use-client-invoices";

export function useClientKpis() {
  const { trips } = useClientTrips();
  const { invoices } = useClientInvoices();

  return useMemo(() => {
    const inTransitStatuses = ["in_transit", "loaded", "vehicle_dispatched"];
    const deliveredStatuses = ["delivered", "completed"];

    return {
      totalShipments: trips.length,
      inTransit: trips.filter((t) => inTransitStatuses.includes(t.status))
        .length,
      delivered: trips.filter((t) => deliveredStatuses.includes(t.status))
        .length,
      outstandingBalance: invoices
        .filter((i) => i.balance > 0)
        .reduce((sum, i) => sum + i.balance, 0),
    };
  }, [trips, invoices]);
}
