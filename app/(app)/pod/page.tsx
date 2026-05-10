"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTripStore, usePodStore, useDriverStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClipboardCheck } from "lucide-react";

export default function PodListPage() {
  const trips = useTripStore((s) => s.trips);
  const pods = usePodStore((s) => s.pods);
  const drivers = useDriverStore((s) => s.drivers);

  const needsPod = trips.filter((t) => (t.status === "delivered" || t.status === "completed") && !pods.find((p) => p.tripId === t.id));
  const captured = trips.filter((t) => pods.find((p) => p.tripId === t.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proof of Delivery"
        subtitle="Capture signatures, photos, and receiver confirmations"
        breadcrumbs={[{ label: "Operations" }, { label: "POD" }]}
      />

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-brand-navy mb-3">Awaiting POD ({needsPod.length})</h3>
          <div className="space-y-2">
            {needsPod.map((t) => {
              const d = drivers.find((x) => x.id === t.driverId);
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-border">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-amber-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy">{t.id} <span className="text-xs text-muted-foreground font-normal">· {d?.name}</span></div>
                    <div className="text-xs text-muted-foreground truncate">{t.pickup.address} → {t.dropoff.address}</div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                  <Button size="sm" asChild><Link href={`/pod/${t.id}`}>Capture</Link></Button>
                </div>
              );
            })}
            {needsPod.length === 0 && <div className="text-center py-8 text-muted-foreground">No deliveries awaiting POD.</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold text-brand-navy mb-3">Captured ({captured.length})</h3>
          <div className="space-y-2">
            {captured.map((t) => {
              const pod = pods.find((p) => p.tripId === t.id)!;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-border bg-emerald-50/30">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy">{t.id} <span className="text-xs text-muted-foreground font-normal">· {pod.receiverName}</span></div>
                    <div className="text-xs text-muted-foreground">{new Date(pod.timestamp).toLocaleString()}</div>
                  </div>
                  <Badge variant="success">Done</Badge>
                  <Button size="sm" variant="outline" asChild><Link href={`/trips/${t.id}`}>View</Link></Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
