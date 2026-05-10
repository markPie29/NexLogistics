"use client";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useFleetStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapPin, Truck, Package, Phone, ClipboardCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { TripStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const NEXT: Partial<Record<TripStatus, { next: TripStatus; label: string }>> = {
  scheduled: { next: "driver_assigned", label: "Accept Trip" },
  driver_assigned: { next: "vehicle_dispatched", label: "Dispatched" },
  vehicle_dispatched: { next: "loaded", label: "Arrived at Pickup" },
  loaded: { next: "in_transit", label: "Start Trip" },
  in_transit: { next: "delivered", label: "Arrived at Dropoff" },
  delivered: { next: "completed", label: "Capture POD" },
};

export default function DriverPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const setStatus = useTripStore((s) => s.setStatus);
  const vehicles = useFleetStore((s) => s.vehicles);

  const driverId = user?.driverId;
  const myTrips = trips.filter((t) => t.driverId === driverId);
  const active = myTrips.find((t) => t.status !== "completed" && t.status !== "cancelled");
  const completed = myTrips.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="My Trip" subtitle={`Welcome, ${user?.name?.split(" ")[0] || "Driver"}`} breadcrumbs={[{ label: "Driver" }, { label: "My Trip" }]} />

      {!active && (
        <Card><CardContent className="text-center py-12">
          <Truck className="w-12 h-12 text-brand-teal mx-auto mb-3 opacity-50" />
          <div className="font-bold text-brand-navy">No active trip</div>
          <div className="text-sm text-muted-foreground">You'll be notified when a new trip is assigned.</div>
        </CardContent></Card>
      )}

      {active && (() => {
        const v = vehicles.find((x) => x.id === active.vehicleId);
        const action = NEXT[active.status];
        return (
          <>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs opacity-90 uppercase tracking-wide">Active Trip</div>
                    <div className="text-2xl font-bold mt-1">{active.id}</div>
                    <Badge variant="neutral" className="mt-2 bg-white/20 text-white border-0">{active.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-90">Fare</div>
                    <div className="text-xl font-bold">{formatCurrency(active.fare)}</div>
                  </div>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <Row icon={MapPin} title="Pickup" value={active.pickup.address} sub={new Date(active.pickup.scheduledAt).toLocaleString()} />
                <Row icon={MapPin} title="Dropoff" value={active.dropoff.address} sub={new Date(active.dropoff.scheduledAt).toLocaleString()} accent />
                <Row icon={Package} title="Cargo" value={active.cargo.type} sub={`${active.cargo.weightKg} kg · ${active.cargo.units} units`} />
                <Row icon={Truck} title="Vehicle" value={v?.plate || "—"} sub={v ? `${v.brand} ${v.model}` : ""} />
              </CardContent>
            </Card>

            {action && (
              action.next === "completed" ? (
                <Button asChild size="lg" className="w-full h-16 text-base shadow-glow">
                  <Link href={`/pod/${active.id}`}><ClipboardCheck className="w-5 h-5" /> {action.label}</Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full h-16 text-base shadow-glow" onClick={() => { setStatus(active.id, action.next, "driver"); toast.success(`→ ${action.next.replace(/_/g, " ")}`); }}>
                  <CheckCircle2 className="w-5 h-5" /> {action.label} <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              )
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" className="h-14"><Phone className="w-4 h-4" /> Call Dispatch</Button>
              <Button variant="outline" size="lg" className="h-14" onClick={() => toast("Issue reported")}>Report Issue</Button>
            </div>
          </>
        );
      })()}

      <div>
        <h3 className="font-bold text-brand-navy mb-3">Recent Completed ({completed.length})</h3>
        <div className="space-y-2">
          {completed.slice(0, 5).map((t) => (
            <Card key={t.id}><CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{t.id}</div>
                <div className="text-xs text-muted-foreground truncate">{t.dropoff.address}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{formatCurrency(t.fare)}</div>
                <div className="text-xs text-muted-foreground">{new Date(t.dropoff.scheduledAt).toLocaleDateString()}</div>
              </div>
            </CardContent></Card>
          ))}
          {completed.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No completed trips yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, value, sub, accent }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-10 h-10 rounded-lg ${accent ? "bg-brand-teal text-white" : "bg-brand-teal-light text-brand-teal"} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="font-bold text-brand-navy">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
