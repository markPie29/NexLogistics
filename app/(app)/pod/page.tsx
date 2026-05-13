"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTripStore, usePodStore, useDriverStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClipboardCheck, ChevronLeft, ChevronRight, Camera, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PodListPage() {
  const user    = useAuthStore((s) => s.user);
  const trips   = useTripStore((s) => s.trips);
  const pods    = usePodStore((s) => s.pods);
  const drivers = useDriverStore((s) => s.drivers);

  const needsPod = trips.filter((t) => (t.status === "delivered" || t.status === "completed") && !pods.find((p) => p.tripId === t.id));
  const captured = trips.filter((t) => pods.find((p) => p.tripId === t.id));

  // ── Driver mobile view ──
  if (user?.role === "driver") {
    return <DriverPodList user={user} trips={trips} pods={pods} drivers={drivers} needsPod={needsPod} captured={captured} />;
  }

  // ── Admin / dispatcher view (unchanged) ──
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

// ─────────────────────────────────────────────────────────────
// Driver Mobile POD List
// ─────────────────────────────────────────────────────────────
function DriverPodList({ user, trips, pods, drivers, needsPod, captured }: {
  user: any;
  trips: any[];
  pods: any[];
  drivers: any[];
  needsPod: any[];
  captured: any[];
}) {
  const router = useRouter();

  const driverId     = user?.driverId ?? drivers[0]?.id;
  const myNeedsPod   = needsPod.filter((t) => t.driverId === driverId);
  const myCaptured   = captured.filter((t) => t.driverId === driverId);

  return (
    <div className="max-w-sm mx-auto -mt-6 -mx-6 min-h-screen flex flex-col bg-gray-50 sm:mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B1C2E] h-14 px-4 flex items-center justify-between shrink-0">
        <button onClick={() => router.push("/driver")} className="w-9 h-9 flex items-center justify-center" aria-label="Back">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center leading-none">
          <p className="text-white font-extrabold text-sm tracking-tight">NE<span className="text-teal-400">X</span></p>
          <p className="text-[8px] tracking-[0.25em] text-teal-400/80 font-semibold">LOGISTICS</p>
        </div>
        <div className="w-9" />
      </header>

      {/* Title bar */}
      <div className="bg-[#0B1C2E] px-5 pb-5 pt-1">
        <p className="text-white font-bold text-lg">Proof of Delivery</p>
        <p className="text-xs text-white/50 mt-0.5">Capture delivery confirmations</p>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-8">
        {/* Awaiting */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-[#0B1C2E]">Awaiting POD</h2>
            <span className="text-xs text-white bg-amber-500 rounded-full px-2 py-0.5 font-semibold">{myNeedsPod.length}</span>
          </div>

          {myNeedsPod.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="font-bold text-[#0B1C2E]">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No deliveries need a POD right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myNeedsPod.map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/pod/${t.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left flex items-center gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#0B1C2E]">{t.id}</p>
                    <p className="text-xs text-gray-500 truncate">{t.dropoff.address}</p>
                    <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      Pending
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Captured */}
        {myCaptured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-[#0B1C2E]">Captured</h2>
              <span className="text-xs text-white bg-emerald-500 rounded-full px-2 py-0.5 font-semibold">{myCaptured.length}</span>
            </div>
            <div className="space-y-2">
              {myCaptured.map((t) => {
                const pod = pods.find((p: any) => p.tripId === t.id);
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#0B1C2E]">{t.id}</p>
                      {pod && <p className="text-xs text-gray-500">Received by: {pod.receiverName}</p>}
                      {pod && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(pod.timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold shrink-0">Done</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
