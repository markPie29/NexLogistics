"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Truck, MapPin, Package, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore } from "@/lib/store/employee-portal";
import { useTripStore, useClientStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  completed:  "bg-emerald-100 text-emerald-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered:  "bg-teal-100 text-teal-700",
  cancelled:  "bg-red-100 text-red-600",
  scheduled:  "bg-amber-100 text-amber-700",
  loaded:     "bg-orange-100 text-orange-700",
};

export default function EmployeeTripsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);
  const trips = useTripStore((s) => s.trips);
  const clients = useClientStore((s) => s.clients);

  const profile = employees.find((e) => e.userId === user?.id);
  const isAllowed = profile?.employeeType === "driver" || profile?.employeeType === "helper";

  const myTrips = useMemo(() => {
    if (!profile) return [];
    return trips
      .filter((t) => {
        if (profile.driverId && t.driverId === profile.driverId) return true;
        if (profile.helperId && t.helperId === profile.helperId) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trips, profile]);

  const totalEarnings = useMemo(() => {
    return myTrips
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => {
        const rate = profile?.driverId ? (t.driverRate ?? 0) : (t.helperRate ?? 0);
        return sum + rate;
      }, 0);
  }, [myTrips, profile]);

  // Summary stats
  const stats = useMemo(() => ({
    total: myTrips.length,
    completed: myTrips.filter((t) => t.status === "completed").length,
    thisWeek: myTrips.filter((t) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return new Date(t.createdAt) >= weekStart && t.status === "completed";
    }).length,
  }), [myTrips]);

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#0B1220] text-white px-4 pt-10 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-lg font-bold">My Trips</div>
          </div>
        </div>
        <div className="px-4 py-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <div className="text-sm font-medium text-gray-500">Trip history is only available for Drivers and Helpers.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1220] text-white px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-white/60">Employee Portal</div>
            <div className="text-lg font-bold">My Trips</div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <StatBadge label="Total" value={stats.total} />
          <StatBadge label="Completed" value={stats.completed} />
          <StatBadge label="This Week" value={stats.thisWeek} />
        </div>
      </div>

      {/* Earnings summary */}
      <div className="px-4 py-3">
        <div className="bg-brand-teal/10 border border-brand-teal/30 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="text-xs font-semibold text-brand-teal">Total Earnings (All Time)</div>
          <div className="text-base font-extrabold text-brand-teal">{formatCurrency(totalEarnings)}</div>
        </div>
      </div>

      {/* Trip list */}
      <div className="px-4 pb-8 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Trip History ({myTrips.length})
        </div>
        {myTrips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-500">No trips recorded yet</div>
            <div className="text-xs text-muted-foreground mt-1">Trips are logged by your Client Relations Specialist.</div>
          </div>
        ) : (
          myTrips.map((trip) => {
            const client = clients.find((c) => c.id === trip.clientId);
            const rate = profile?.driverId ? trip.driverRate : trip.helperRate;
            return (
              <div key={trip.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-bold text-[#0B1220]">{trip.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trip.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLOR[trip.status] ?? "bg-gray-100 text-gray-600")}>
                    {trip.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="truncate">{trip.pickup.address}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    <span className="truncate">{trip.dropoff.address}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Package className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    <span>{trip.cargo.type} · {trip.cargo.weightKg} kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                  <span className="text-xs text-muted-foreground">{client?.name ?? "Unknown Client"}</span>
                  {rate !== undefined && rate > 0 && (
                    <span className="text-sm font-bold text-brand-teal">{formatCurrency(rate)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] text-white/60">{label}</div>
    </div>
  );
}
