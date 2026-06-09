"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, FileImage } from "lucide-react";
import { useUiStore } from "@/lib/store";
import { computeDriverPodSummary } from "@/lib/utils/pod-helpers";
import { DriverNav } from "@/components/driver/DriverNav";
import { DriverSidebar } from "@/components/driver/DriverSidebar";
import PodCardList from "@/components/pod/PodCardList";
import type { User, Trip, ProofOfDelivery, Driver } from "@/lib/types";

// ─── Props ────────────────────────────────────────────────────
interface DriverPodListProps {
  user: User;
  trips: Trip[];
  pods: ProofOfDelivery[];
  drivers: Driver[];
}

// ─── Component ────────────────────────────────────────────────
export function DriverPodList({ user, trips, pods, drivers }: DriverPodListProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const notifications = useUiStore((s) => s.notifications);

  // Unread count with 99+ overflow
  const unread = notifications.filter((n) => !n.read).length;
  const unreadDisplay = unread > 99 ? "99+" : String(unread);

  // Resolve current driver ID
  const driverId = user?.driverId ?? drivers[0]?.id ?? null;

  // Compute driver-specific POD summary
  const { pendingCount, capturedCount, awaitingTrips, capturedItems } =
    computeDriverPodSummary(trips, pods, driverId);

  // Navigation handler for card capture
  const handleCapture = (tripId: string) => {
    router.push(`/pod/${tripId}`);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gray-50 dark:bg-brand-navy overscroll-none">
      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-30 bg-brand-navy w-full shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between">
          {/* Hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] flex flex-col justify-center items-start gap-1.5 p-2 -ml-2"
            aria-label="Open navigation menu"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-3.5 h-0.5 bg-white rounded" />
          </button>

          {/* NE[X] LOGISTICS brand mark */}
          <div className="text-center leading-none select-none">
            <p className="text-white font-extrabold text-sm tracking-tight">
              NE<span className="text-brand-teal">X</span>
            </p>
            <p className="text-[8px] tracking-[0.25em] text-brand-teal/80 font-semibold">
              LOGISTICS
            </p>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => router.push("/driver?view=notifications")}
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadDisplay}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Title Banner ── */}
      <div className="bg-brand-navy px-5 pb-5 pt-1 shrink-0">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center shrink-0">
              <FileImage className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Proof of Delivery</p>
              <p className="text-xs text-white/50">Capture delivery confirmations</p>
            </div>
          </div>

          {/* Summary Banner pills */}
          <div className="flex gap-2 mt-4">
            <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {pendingCount} Pending
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {capturedCount} Captured
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content Area ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain dark:bg-brand-navy">
        <div className="max-w-md mx-auto px-4 pt-5 pb-8">
          <PodCardList
            awaitingTrips={awaitingTrips}
            capturedTrips={capturedItems}
            onCapture={handleCapture}
          />
        </div>
      </main>

      {/* ── Bottom Navigation ── */}
      <DriverNav active="pod" />

      {/* ── Sidebar Drawer ── */}
      <DriverSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        active="pod"
      />
    </div>
  );
}
