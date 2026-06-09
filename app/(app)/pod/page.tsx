"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTripStore, usePodStore, useDriverStore, useUiStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ClipboardCheck, ChevronRight, Camera, CheckCircle2, FileImage, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DriverNav } from "@/components/driver/DriverNav";
import { DriverSidebar } from "@/components/driver/DriverSidebar";

export default function PodListPage() {
  const user    = useAuthStore((s) => s.user);
  const trips   = useTripStore((s) => s.trips);
  const pods    = usePodStore((s) => s.pods);
  const drivers = useDriverStore((s) => s.drivers);

  const needsPod = trips.filter((t) => (t.status === "delivered" || t.status === "completed") && !pods.find((p) => p.tripId === t.id));
  const captured = trips.filter((t) => pods.find((p) => p.tripId === t.id));

  // ── Driver / Helper mobile view ──
  if (user?.role === "driver" || user?.role === "helper") {
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
          <h3 className="font-bold text-brand-navy mb-3 dark:text-white">Awaiting POD ({needsPod.length})</h3>
          <div className="space-y-2">
            {needsPod.map((t) => {
              const d = drivers.find((x) => x.id === t.driverId);
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-border">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-amber-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy dark:text-white">{t.id} <span className="text-xs text-muted-foreground font-normal">· {d?.name}</span></div>
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
          <h3 className="font-bold text-brand-navy mb-3 dark:text-white">Captured ({captured.length})</h3>
          <div className="space-y-2">
            {captured.map((t) => {
              const pod = pods.find((p) => p.tripId === t.id)!;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-brand-border bg-emerald-50/30">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy dark:text-white">{t.id} <span className="text-xs text-muted-foreground font-normal">· {pod.receiverName}</span></div>
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
// Driver Mobile POD List — full DVH, safe areas, brand tokens
// ─────────────────────────────────────────────────────────────
function DriverPodList({ user, trips, pods, drivers, needsPod, captured }: {
  user: any;
  trips: any[];
  pods: any[];
  drivers: any[];
  needsPod: any[];
  captured: any[];
}) {
  const router        = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const notifications = useUiStore((s) => s.notifications);
  const unread        = notifications.filter((n: any) => !n.read).length;

  const driverId   = user?.driverId ?? drivers[0]?.id;
  const myNeedsPod = needsPod.filter((t) => t.driverId === driverId);
  const myCaptured = captured.filter((t) => t.driverId === driverId);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-gray-50 overscroll-none">

      {/* ── Sticky header — identical to driver page ── */}
      <header
        className="sticky top-0 z-30 bg-brand-navy w-full shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between">
          {/* Hamburger — matches driver page */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] flex flex-col justify-center items-start gap-1.5 p-2 -ml-2"
            aria-label="Menu"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-3.5 h-0.5 bg-white rounded" />
          </button>

          {/* Brand — identical to driver page */}
          <div className="text-center leading-none select-none">
            <p className="text-white font-extrabold text-sm tracking-tight">
              NE<span className="text-brand-teal">X</span>
            </p>
            <p className="text-[8px] tracking-[0.25em] text-brand-teal/80 font-semibold">
              LOGISTICS
            </p>
          </div>

          {/* Bell — matches driver page */}
          <button
            onClick={() => toast.info("Notifications")}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Title banner ── */}
      <div className="bg-brand-navy px-5 pb-5 pt-1 shrink-0">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center shrink-0">
              <FileImage className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Proof of Delivery</p>
              <p className="text-xs text-white/50">Capture delivery confirmations</p>
            </div>
          </div>
          {/* Summary pills */}
          <div className="flex gap-2 mt-4">
            <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {myNeedsPod.length} Pending
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {myCaptured.length} Captured
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-5 pb-8">

          {/* Awaiting section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-brand-navy dark:text-white">Awaiting POD</h2>
              {myNeedsPod.length > 0 && (
                <span className="text-[11px] text-white bg-amber-500 rounded-full px-2.5 py-0.5 font-semibold">
                  {myNeedsPod.length}
                </span>
              )}
            </div>

            {myNeedsPod.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <p className="font-bold text-brand-navy dark:text-white">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No deliveries need a POD right now.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myNeedsPod.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/pod/${t.id}`)}
                    className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left flex items-center gap-3 active:scale-[0.99] transition-transform min-h-[76px]"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-brand-navy dark:text-white">{t.id}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.dropoff.address}</p>
                      <span className="mt-1.5 inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                        Awaiting Capture
                      </span>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-brand-teal" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Captured section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-brand-navy dark:text-white">Captured</h2>
              {myCaptured.length > 0 && (
                <span className="text-[11px] text-white bg-emerald-500 rounded-full px-2.5 py-0.5 font-semibold">
                  {myCaptured.length}
                </span>
              )}
            </div>
            {myCaptured.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No PODs captured yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myCaptured.map((t) => {
                  const pod = pods.find((p: any) => p.tripId === t.id);
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 min-h-[72px]"
                    >
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-brand-navy dark:text-white">{t.id}</p>
                        {pod && (
                          <p className="text-xs text-gray-500 mt-0.5">Received by: <span className="font-medium">{pod.receiverName}</span></p>
                        )}
                        {pod && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(pod.timestamp).toLocaleDateString("en-PH", {
                              month: "short", day: "numeric", year: "numeric",
                            })} &bull; {new Date(pod.timestamp).toLocaleTimeString("en-PH", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold shrink-0">
                        Done
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <DriverNav active={"pod"} />

      <DriverSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        active="pod"
      />
    </div>
  );
}
