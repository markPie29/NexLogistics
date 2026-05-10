"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Route as RouteIcon, ArrowRight, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore, useDriverStore, useFleetStore, useClientStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";

const STATUS_VARIANT: Record<string, any> = {
  scheduled: "neutral", driver_assigned: "info", vehicle_dispatched: "info", loaded: "info", in_transit: "info",
  delivered: "success", completed: "success", delayed: "danger", cancelled: "neutral",
};

export default function TripsPage() {
  const trips = useTripStore((s) => s.trips);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => trips.filter((t) => {
    if (search && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  }), [trips, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Management"
        subtitle="Schedule, dispatch, and monitor all your trips"
        breadcrumbs={[{ label: "Operations" }, { label: "Trips" }]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild><Link href="/trips/dispatch"><LayoutGrid className="w-4 h-4" /> Dispatch Board</Link></Button>
            <Button size="sm" asChild><Link href="/trips/new"><Plus className="w-4 h-4" /> New Trip</Link></Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trip ID..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_VARIANT).map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Trip ID</th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Route</th>
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium">Vehicle</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Fare</th>
              </tr></thead>
              <tbody>
                {filtered.map((t) => {
                  const driver = drivers.find((d) => d.id === t.driverId);
                  const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                  const client = clients.find((c) => c.id === t.clientId);
                  return (
                    <tr key={t.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                      <td className="py-3 px-4"><Link href={`/trips/${t.id}`} className="font-semibold text-brand-teal hover:underline">{t.id}</Link></td>
                      <td className="py-3 px-4">{client?.name || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground"><span>{t.pickup.address}</span> <ArrowRight className="inline w-3 h-3 mx-1" /> <span>{t.dropoff.address}</span></td>
                      <td className="py-3 px-4">{driver?.name || "—"}</td>
                      <td className="py-3 px-4">{vehicle?.plate || "—"}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace(/_/g, " ")}</Badge></td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(t.fare)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No trips found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

