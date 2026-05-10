"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Truck, User as UserIcon, Package, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTripStore, useDriverStore, useFleetStore, useClientStore, usePodStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { TripStatus } from "@/lib/types";
import Link from "next/link";

const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  scheduled: "driver_assigned",
  driver_assigned: "vehicle_dispatched",
  vehicle_dispatched: "loaded",
  loaded: "in_transit",
  in_transit: "delivered",
  delivered: "completed",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === params.id));
  const setStatus = useTripStore((s) => s.setStatus);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const pods = usePodStore((s) => s.pods);

  if (!trip) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button className="mt-4" onClick={() => router.push("/trips")}><ArrowLeft className="w-4 h-4" /> Back to Trips</Button>
      </div>
    );
  }

  const driver = drivers.find((d) => d.id === trip.driverId);
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
  const client = clients.find((c) => c.id === trip.clientId);
  const pod = pods.find((p) => p.tripId === trip.id);
  const next = NEXT_STATUS[trip.status];

  const advance = () => {
    if (!next) return;
    setStatus(trip.id, next, "dispatcher", `Advanced to ${next}`);
    toast.success(`Status → ${next.replace(/_/g, " ")}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={trip.id}
        subtitle={`${trip.pickup.address} → ${trip.dropoff.address}`}
        breadcrumbs={[{ label: "Trips", href: "/trips" }, { label: trip.id }]}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/trips")}><ArrowLeft className="w-4 h-4" /> Back</Button>
            {next && <Button onClick={advance}><CheckCircle2 className="w-4 h-4" /> Advance to {next.replace(/_/g, " ")}</Button>}
            <Button variant="outline" asChild><Link href={`/pod/${trip.id}`}>Capture POD</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Trip Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail icon={MapPin} label="Pickup" value={trip.pickup.address} sub={new Date(trip.pickup.scheduledAt).toLocaleString()} />
              <Detail icon={MapPin} label="Dropoff" value={trip.dropoff.address} sub={new Date(trip.dropoff.scheduledAt).toLocaleString()} />
              <Detail icon={UserIcon} label="Driver" value={driver?.name || "—"} sub={driver?.phone} />
              <Detail icon={Truck} label="Vehicle" value={vehicle?.plate || "—"} sub={vehicle ? `${vehicle.brand} ${vehicle.model}` : ""} />
              <Detail icon={Package} label="Cargo" value={trip.cargo.type} sub={`${trip.cargo.weightKg} kg · ${trip.cargo.units} units`} />
              <Detail icon={Clock} label="Distance / Fare" value={`${trip.distanceKm} km`} sub={formatCurrency(trip.fare)} />
            </div>
            <div className="border-t border-brand-border pt-4">
              <div className="text-xs text-muted-foreground mb-1">Client</div>
              <div className="font-semibold text-brand-navy">{client?.name || "—"}</div>
              <div className="text-xs text-muted-foreground">{client?.contactPerson} · {client?.phone}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="info" className="text-base px-3 py-1">{trip.status.replace(/_/g, " ")}</Badge>
            <div className="text-xs text-muted-foreground mt-2">ETA: {trip.eta ? new Date(trip.eta).toLocaleString() : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="relative border-l-2 border-brand-border ml-3">
            {trip.statusLogs.map((log, i) => (
              <li key={i} className="ml-6 mb-5 last:mb-0">
                <div className="absolute -left-2 w-4 h-4 rounded-full bg-brand-teal border-4 border-white shadow" />
                <div className="text-sm font-bold text-brand-navy capitalize">{log.status.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground">{new Date(log.at).toLocaleString()} {log.by ? `· by ${log.by}` : ""}</div>
                {log.note && <div className="text-xs text-muted-foreground italic mt-0.5">{log.note}</div>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {pod && (
        <Card>
          <CardHeader><CardTitle>Proof of Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm"><b>Receiver:</b> {pod.receiverName} {pod.receiverContact ? `(${pod.receiverContact})` : ""}</div>
            <div className="text-xs text-muted-foreground">Captured {new Date(pod.timestamp).toLocaleString()} · GPS {pod.gps.lat.toFixed(4)}, {pod.gps.lng.toFixed(4)}</div>
            {pod.signatureDataUrl && <img src={pod.signatureDataUrl} alt="Signature" className="border border-brand-border rounded-lg max-w-xs bg-white" />}
            <div className="grid grid-cols-3 gap-2">
              {pod.photoDataUrls.map((url, i) => <img key={i} src={url} alt={`POD ${i}`} className="rounded-lg border border-brand-border" />)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-teal-light flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-brand-teal" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-brand-navy">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
