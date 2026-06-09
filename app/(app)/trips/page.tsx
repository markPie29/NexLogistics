"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ArrowRight, LayoutGrid, Handshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore, useDriverStore, useFleetStore, useClientStore, usePartnerStore } from "@/lib/store";
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
  const partners = usePartnerStore((s) => s.partners);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "company" | "subcon">("all");

  const filtered = useMemo(() => trips.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const client = clients.find((c) => c.id === t.clientId);
      const customer = t.customerName ?? t.consigneeName;
      if (
        !t.id.toLowerCase().includes(q) &&
        !(t.documentNo?.toLowerCase().includes(q)) &&
        !(customer?.toLowerCase().includes(q)) &&
        !(t.cargo.type.toLowerCase().includes(q)) &&
        !(client?.name.toLowerCase().includes(q))
      ) return false;
    }
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (ownerFilter === "company" && t.partnerId) return false;
    if (ownerFilter === "subcon"  && !t.partnerId) return false;
    return true;
  }), [trips, search, statusFilter, ownerFilter, clients]);

  const counts = useMemo(() => ({
    all:     trips.length,
    company: trips.filter((t) => !t.partnerId).length,
    subcon:  trips.filter((t) =>  t.partnerId).length,
  }), [trips]);

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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, DR#, client, item, customer..." className="pl-10" />
          </div>
          <div className="inline-flex rounded-md border border-brand-border/60 bg-white p-0.5 text-xs">
            {(["all","company","subcon"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setOwnerFilter(k)}
                className={`px-3 py-1.5 rounded transition font-medium ${ownerFilter === k ? "bg-brand-teal text-white" : "text-muted-foreground hover:text-brand-navy"}`}
              >
                {k === "all" ? "All" : k === "company" ? "Company" : "Subcon"}
                <span className="ml-1.5 opacity-70">{counts[k]}</span>
              </button>
            ))}
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
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                <th className="py-3 px-4 font-medium">Trip ID</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">DR#</th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Item</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Delivery Address</th>
                <th className="py-3 px-4 font-medium">Customer / Client</th>
                <th className="py-3 px-4 font-medium">Driver / Partner</th>
                <th className="py-3 px-4 font-medium">Plate #</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Fare</th>
              </tr></thead>
              <tbody>
                {filtered.map((t) => {
                  const driver = drivers.find((d) => d.id === t.driverId);
                  const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                  const client = clients.find((c) => c.id === t.clientId);
                  const partner = partners.find((p) => p.id === t.partnerId);
                  return (
                    <tr key={t.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/trips/${t.id}`} className="font-semibold text-brand-teal hover:underline">{t.id}</Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.pickup.scheduledAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{t.documentNo || "—"}</td>
                      <td className="py-3 px-4">{client?.name || "—"}</td>
                      <td className="py-3 px-4 text-xs">{t.cargo.type}</td>
                      <td className="py-3 px-4">
                        {partner ? (
                          <Badge variant="warning" className="text-[10px]"><Handshake className="w-3 h-3 mr-0.5" /> Subcon</Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px]">Company</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs"><span>{t.pickup.address}</span> <ArrowRight className="inline w-3 h-3 mx-1" /> <span>{t.dropoff.address}</span></td>
                      <td className="py-3 px-4">{(t.customerName ?? t.consigneeName) || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-3 px-4">
                        {partner ? (
                          <span className="inline-flex items-center gap-1 text-brand-navy"><Handshake className="w-3 h-3" /> {partner.name}</span>
                        ) : (driver?.name || "—")}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">{vehicle?.plate || (partner ? <span className="text-muted-foreground italic">subcon</span> : "—")}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace(/_/g, " ")}</Badge></td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(t.fare)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={12} className="py-12 text-center text-muted-foreground">No trips found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

