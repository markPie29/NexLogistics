"use client";

import { PodAdminView } from "@/components/pod/PodAdminView";
import { DriverPodList } from "@/components/pod/DriverPodList";
import { usePodStore, useTripStore, useDriverStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";

// ─── Loading Skeleton ─────────────────────────────────────────
function PodLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* KPI Panel skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Table area skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────
export default function PodListPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const pods = usePodStore((s) => s.pods);
  const drivers = useDriverStore((s) => s.drivers);

  // Show loading skeleton while auth store is hydrating
  if (user === undefined) {
    return <PodLoadingSkeleton />;
  }

  // Driver / Helper → mobile-optimized Driver View
  if (user?.role === "driver" || user?.role === "helper") {
    return <DriverPodList user={user} trips={trips} pods={pods} drivers={drivers} />;
  }

  // Super Admin, Company Admin, Dispatcher, or any other role (fallback) → Admin View
  return <PodAdminView trips={trips} pods={pods} drivers={drivers} />;
}