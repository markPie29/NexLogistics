"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useFleetStore, useDriverStore, useClientStore, useUiStore } from "@/lib/store";
import {
  Bell, ChevronLeft, ChevronRight, LayoutGrid, ClipboardList, Camera,
  Truck, Package, Navigation2, Clock3, CheckCircle2,
  MessageSquare, Wallet, Megaphone, Fuel, X, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { TripStatus, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DriverNav } from "@/components/driver/DriverNav";
import type { DriverTab } from "@/components/driver/DriverNav";
import { DriverSidebar } from "@/components/driver/DriverSidebar";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROGRESS_STEPS: TripStatus[] = [
  "driver_assigned",
  "vehicle_dispatched",
  "loaded",
  "in_transit",
  "delivered",
  "completed",
];

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  driver_assigned: "Driver Assigned",
  vehicle_dispatched: "Vehicle Dispatched",
  loaded: "Loaded",
  in_transit: "In Transit",
  delivered: "Arrived at Destination",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-500",
  scheduled: "bg-amber-100 text-amber-700",
  driver_assigned: "bg-violet-100 text-violet-700",
  vehicle_dispatched: "bg-indigo-100 text-indigo-700",
  loaded: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-600",
};

const SHEET_STATUSES: { value: TripStatus; label: string }[] = [
  { value: "loaded",    label: "Arrived at Pickup" },
  { value: "in_transit", label: "Start Trip / In Transit" },
  { value: "delivered", label: "Arrived at Destination" },
  { value: "completed", label: "Trip Completed" },
];

type View = "dashboard" | "trip_details" | "trips_list";

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DriverPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const trips        = useTripStore((s) => s.trips);
  const setStatus    = useTripStore((s) => s.setStatus);
  const vehicles     = useFleetStore((s) => s.vehicles);
  const drivers      = useDriverStore((s) => s.drivers);
  const clients      = useClientStore((s) => s.clients);
  const notifications = useUiStore((s) => s.notifications);

  const [view,          setView]         = useState<View>("dashboard");
  const [selectedTrip,  setSelectedTrip] = useState<Trip | null>(null);
  const [activeTab,     setActiveTab]    = useState<DriverTab>("dashboard");
  const [sidebarOpen,   setSidebarOpen]  = useState(false);
  const [showSheet,     setShowSheet]    = useState(false);
  const [sheetStatus,   setSheetStatus]  = useState<TripStatus>("in_transit");
  const [sheetNote,     setSheetNote]    = useState("");

  // Read ?view= query param to deep-link into trips list from other pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "trips") { setView("trips_list"); setActiveTab("trips"); }
  }, []);

  // Resolve driver â€” fall back to first driver (Mark Santos) for demo
  const driverId = user?.driverId ?? drivers[0]?.id;
  const myDriver = drivers.find((d) => d.id === driverId) ?? drivers[0];

  const myTrips       = trips.filter((t) => t.driverId === driverId);
  const activeTrip    = myTrips.find((t) => !["completed", "cancelled"].includes(t.status));
  const completedTrips = myTrips.filter((t) => t.status === "completed");
  const vehicle       = vehicles.find((v) => v.id === (activeTrip?.vehicleId ?? myDriver?.assignedVehicleId));
  const unread        = notifications.filter((n) => !n.read).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? myDriver?.name?.split(" ")[0] ?? "Driver";
  const fullName  = user?.name ?? myDriver?.name ?? "Mark Santos";

  function openTrip(trip: Trip) {
    setSelectedTrip(trip);
    setView("trip_details");
  }

  function openStatusSheet() {
    if (!activeTrip) return;
    setSheetStatus(activeTrip.status);
    setShowSheet(true);
  }

  function submitStatus() {
    if (!activeTrip) return;
    setStatus(activeTrip.id, sheetStatus, fullName, sheetNote || undefined);
    toast.success(`Status updated: ${STATUS_LABELS[sheetStatus]}`);
    setShowSheet(false);
    setSheetNote("");
  }

  function handleTab(tab: DriverTab) {
    if (tab === "pod")      { router.push("/pod"); return; }
    if (tab === "settings") { router.push("/driver/settings"); return; }
    setActiveTab(tab);
    if (tab === "dashboard") { setView("dashboard"); }
    if (tab === "trips")     { setView("trips_list"); }
  }

  // â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function Dashboard() {
    return (
      <div className="space-y-5 pb-24">
        {/* Profile banner */}
        <div className="-mx-4 -mt-4 px-5 pt-6 pb-6 bg-brand-navy">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
              {fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-white/60">{greeting},</p>
              <p className="text-lg font-bold text-white leading-tight">{fullName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/60">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-navy text-sm">Today's Summary</h2>
              <button className="text-xs text-brand-teal font-semibold min-h-[44px] px-2">View all</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: "Assigned\nTrips",   value: myTrips.filter(t => !["completed","cancelled"].includes(t.status)).length || 1, icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
              { label: "Completed\nToday",  value: completedTrips.length,                                                           icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-600" },
              { label: "Travelled\n(km)",   value: activeTrip?.distanceKm ?? 120,                                                   icon: Navigation2,   color: "bg-amber-50 text-amber-600" },
              { label: "On Duty\n(hrs)",    value: "8.5",                                                                           icon: Clock3,        color: "bg-rose-50 text-rose-600" },
            ] as const).map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 flex flex-col items-center text-center gap-1.5">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                  <span className="font-bold text-sm text-brand-navy leading-none">{s.value}</span>
                  <span className="text-[9px] text-gray-500 leading-tight whitespace-pre-line">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Current Trip */}
        <section>
          {activeTrip ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="font-bold text-brand-navy text-sm">Current Trip</h2>
                <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold", STATUS_COLOR[activeTrip.status] ?? "bg-gray-100 text-gray-600")}>
                  {STATUS_LABELS[activeTrip.status]}
                </span>
              </div>
              <div className="px-4 pb-3">
                <div className="flex gap-3 items-stretch">
                  {/* Route connector */}
                  <div className="flex flex-col items-center pt-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400 shrink-0" />
                    <span className="w-0.5 flex-1 bg-gray-200 my-1" />
                    <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-400 shrink-0" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-bold text-sm text-brand-navy">{activeTrip.pickup.address.split(",")[0]}</p>
                      <p className="text-xs text-gray-400">Pick-up</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-brand-navy">{activeTrip.dropoff.address.split(",")[0]}</p>
                      <p className="text-xs text-gray-400">Drop-off</p>
                    </div>
                  </div>
                  <div className="text-right space-y-3 pt-0.5">
                    <div>
                      <p className="text-[10px] text-gray-400">ETA</p>
                      <p className="font-bold text-sm text-brand-navy">
                        {activeTrip.eta ? new Date(activeTrip.eta).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "10:30 AM"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Distance</p>
                      <p className="font-bold text-sm text-brand-navy">{activeTrip.distanceKm} km</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-2 flex justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
                <span>Trip ID: <span className="font-semibold text-brand-navy">{activeTrip.id}</span></span>
                <span>Vehicle: <span className="font-semibold text-brand-navy">{vehicle?.plate ?? "NEX-101"}</span></span>
              </div>
              <div className="px-4 pb-4 pt-2">
                <button
                  onClick={() => openTrip(activeTrip)}
                  className="w-full min-h-[52px] bg-brand-teal hover:opacity-90 active:scale-[0.98] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  View Trip Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Truck className="w-10 h-10 text-brand-teal mx-auto mb-3 opacity-40" />
              <p className="font-bold text-brand-navy">No active trip</p>
              <p className="text-sm text-gray-400 mt-1">You'll be notified when a trip is assigned.</p>
            </div>
          )}
        </section>

        {/* My Vehicle */}
        {vehicle && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-brand-navy text-sm">My Vehicle</h2>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                vehicle.status === "in_trip" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                {vehicle.status === "in_trip" ? "â— Online" : vehicle.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Truck className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-brand-navy text-sm">{vehicle.plate}</p>
                <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.model} Wing Van</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Plate Number",  value: vehicle.plate },
                { label: "Fuel Level",    value: "70%",                          extra: <Fuel className="w-3 h-3 text-blue-500 inline mr-0.5" /> },
                { label: "Odometer",      value: `${vehicle.odometer.toLocaleString()} km` },
              ].map((d) => (
                <div key={d.label} className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-gray-400">{d.label}</p>
                  <p className="font-bold text-xs text-brand-navy mt-0.5">{d.extra}{d.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
              <h2 className="font-bold text-brand-navy text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {([
              { label: "Update\nStatus",  icon: CheckCircle2,  onClick: openStatusSheet,                         badge: 0 },
              { label: "Upload\nPOD",     icon: Camera,        onClick: () => router.push(activeTrip ? `/pod/${activeTrip.id}` : "/pod"),  badge: 0 },
              { label: "Expenses",        icon: Wallet,        onClick: () => toast.info("Expenses module"),     badge: 0 },
              { label: "Messages",        icon: MessageSquare, onClick: () => toast.info("Messages coming soon"), badge: 2 },
            ] as const).map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform min-h-[80px] justify-center"
              >
                {a.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">
                    {a.badge}
                  </span>
                )}
                <div className="w-9 h-9 bg-brand-teal/10 rounded-xl flex items-center justify-center">
                  <a.icon className="w-4 h-4 text-brand-teal" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium leading-tight whitespace-pre-line">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Announcements */}
        <section>
          <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-brand-navy text-sm">Announcements</h2>
            <button className="text-xs text-brand-teal font-semibold min-h-[44px] px-2">View all</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-snug">Safety first! Always wear your seatbelt and follow traffic rules.</p>
              <p className="text-xs text-gray-400 mt-1">May 25, 2024 â€¢ 08:00 AM</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
          </div>
        </section>

        {/* Recent completed trips */}
        {completedTrips.length > 0 && (
          <section>
            <h2 className="font-bold text-brand-navy text-sm mb-3">Recent Trips</h2>
            <div className="space-y-2">
              {completedTrips.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTrip(t)}
                  className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform min-h-[60px]"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-brand-navy">{t.id}</p>
                    <p className="text-xs text-gray-400 truncate">{t.dropoff.address}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // â”€â”€â”€ Trip Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function TripDetails({ trip }: { trip: Trip }) {
    const v      = vehicles.find((x) => x.id === trip.vehicleId);
    const client = clients.find((c) => c.id === trip.clientId);
    const isActive = trip.id === activeTrip?.id;

    return (
      <div className="space-y-4 pb-24">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">TRIP ID</p>
              <p className="text-lg font-extrabold text-brand-navy mt-0.5">{trip.id}</p>
            </div>
            <span className={cn("text-xs px-3 py-1.5 rounded-full font-semibold", STATUS_COLOR[trip.status] ?? "bg-gray-100 text-gray-500")}>
              {STATUS_LABELS[trip.status]}
            </span>
          </div>
          {client && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium text-gray-700">Client: </span>{client.name}
            </p>
          )}
        </div>

        {/* Route card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex gap-4 items-stretch">
            <div className="flex flex-col items-center pt-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
              <span className="w-0.5 flex-1 bg-gray-200 my-1" />
              <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-300" />
            </div>
            <div className="grid grid-cols-2 flex-1 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Pick-up</p>
                <p className="font-bold text-sm text-brand-navy leading-tight">{trip.pickup.address.split(",")[0]}</p>
                {trip.pickup.address.includes(",") && (
                  <p className="text-[11px] text-gray-400">{trip.pickup.address.split(",").slice(1).join(",").trim()}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Drop-off</p>
                <p className="font-bold text-sm text-brand-navy leading-tight">{trip.dropoff.address.split(",")[0]}</p>
                {trip.dropoff.address.includes(",") && (
                  <p className="text-[11px] text-gray-400">{trip.dropoff.address.split(",").slice(1).join(",").trim()}</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-50">
            <div>
              <p className="text-[10px] text-gray-400">Scheduled</p>
              <p className="font-semibold text-xs text-brand-navy">
                {new Date(trip.pickup.scheduledAt).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})} &bull; {new Date(trip.pickup.scheduledAt).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">ETA</p>
              <p className="font-semibold text-xs text-brand-navy">
                {trip.eta ? new Date(trip.eta).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}) : "10:30 AM"}
              </p>
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-brand-navy mb-3">Cargo Information</h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-navy">{trip.cargo.type}</p>
              <p className="text-xs text-gray-500">{trip.cargo.weightKg.toLocaleString()} kg â€¢ {trip.cargo.units} Pallets</p>
              {trip.cargo.description && (
                <p className="text-xs text-gray-400 mt-0.5">Notes: {trip.cargo.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Trip Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-brand-navy mb-4">Trip Progress</h3>
          <div className="space-y-0">
            {PROGRESS_STEPS.map((step, i) => {
              const log      = trip.statusLogs.find((l) => l.status === step);
              const done     = Boolean(log);
              const current  = trip.status === step;
              const last     = i === PROGRESS_STEPS.length - 1;
              return (
                <div key={step} className="flex gap-3">
                  {/* spine */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white",
                      done    ? "border-brand-teal bg-brand-teal" :
                      current ? "border-brand-teal" : "border-gray-300"
                    )}>
                      {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {current && !done && <span className="w-2 h-2 rounded-full bg-brand-teal" />}
                    </div>
                    {!last && <div className={cn("w-0.5 h-7 mt-0", done ? "bg-brand-teal" : "bg-gray-200")} />}
                  </div>
                  {/* label */}
                  <div className={cn("flex-1 pb-2", last ? "pb-0" : "")}>
                    <p className={cn("text-sm font-semibold leading-tight",
                      done || current ? "text-brand-navy" : "text-gray-400")}>
                      {STATUS_LABELS[step]}
                    </p>
                    {log && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(log.at).toLocaleDateString("en-PH",{month:"short",day:"numeric"})} &bull; {new Date(log.at).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"})}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-40 bg-gradient-to-br from-brand-teal/5 via-brand-teal/10 to-blue-50 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Navigation2 className="w-8 h-8 text-brand-teal" />
            <span className="text-xs font-medium text-gray-600">Live GPS coming soon</span>
            <span className="text-[10px] text-gray-400 px-6 text-center">{trip.pickup.address} â†’ {trip.dropoff.address}</span>
          </div>
        </div>

        {/* Update status CTA */}
        {isActive && !["completed","cancelled"].includes(trip.status) && (
          <button
            onClick={openStatusSheet}
            className="w-full h-14 bg-brand-teal hover:opacity-90 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-brand-navy/20"
          >
            Update Trip Status
          </button>
        )}

        {/* Driver & Vehicle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm text-brand-navy mb-3">Driver &amp; Vehicle</h3>
          <div className="space-y-3">
            {/* Driver row */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold shrink-0">
                {fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-brand-navy">{fullName}</p>
                <p className="text-xs text-gray-400">{myDriver?.phone ?? "0917 123 4567"}</p>
              </div>
              <button
                onClick={() => toast.info("Chat coming soon")}
                className="w-9 h-9 rounded-full bg-brand-teal/10 flex items-center justify-center active:scale-95 transition-transform"
              >
                <MessageSquare className="w-4 h-4 text-brand-teal" />
              </button>
            </div>
            {/* Vehicle row */}
            {v && (
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-navy">{v.plate}</p>
                  <p className="text-xs text-gray-400">{v.brand} {v.model} Wing Van</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ Trips List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function TripsList() {
    return (
      <div className="space-y-4 pb-24">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-brand-navy text-sm mb-4">All Trips ({myTrips.length})</h2>
          {myTrips.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No trips assigned yet.</p>
          )}
          <div className="space-y-2">
            {myTrips.map((t) => (
              <button
                key={t.id}
                onClick={() => openTrip(t)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-[0.99] transition-all"
              >
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-0.5",
                  t.status === "completed"   ? "bg-emerald-500" :
                  t.status === "in_transit"  ? "bg-blue-500"    :
                  t.status === "cancelled"   ? "bg-red-500"     : "bg-amber-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-brand-navy">{t.id}</p>
                  <p className="text-xs text-gray-400 truncate">{t.pickup.address} â†’ {t.dropoff.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-500")}>
                    {STATUS_LABELS[t.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-gray-50 overscroll-none">

      {/* â”€â”€ Sticky header â”€â”€ */}
      <header
        className="sticky top-0 z-30 bg-brand-navy w-full shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] flex flex-col justify-center items-start gap-1.5 p-2 -ml-2"
            aria-label="Menu"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-3.5 h-0.5 bg-white rounded" />
          </button>

          <div className="text-center leading-none select-none">
            <p className="text-white font-extrabold text-sm tracking-tight">
              NE<span className="text-brand-teal">X</span>
            </p>
            <p className="text-[8px] tracking-[0.25em] text-brand-teal/80 font-semibold">
              LOGISTICS
            </p>
          </div>

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

      {/* â”€â”€ Sub-view back bar â”€â”€ */}
      {view !== "dashboard" && (
        <div className="sticky top-14 z-20 bg-white border-b border-gray-100 shrink-0"
          style={{ top: `calc(3.5rem + env(safe-area-inset-top))` }}
        >
          <div className="max-w-lg mx-auto h-11 px-4 flex items-center">
            <button
              onClick={() => { setView("dashboard"); setActiveTab("dashboard"); setSelectedTrip(null); }}
              className="flex items-center gap-1 text-sm font-semibold text-brand-navy min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              {view === "trip_details" ? "Trip Details" : "All Trips"}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Scrollable content â”€â”€ */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 pt-4">
          {view === "dashboard"    && <Dashboard />}
          {view === "trip_details" && selectedTrip && <TripDetails trip={selectedTrip} />}
          {view === "trips_list"   && <TripsList />}
        </div>
      </main>

      <DriverNav active={activeTab} />

      <DriverSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        active={activeTab}
      />

      {/* â”€â”€ Update Status Bottom Sheet â”€â”€ */}
      {showSheet && activeTrip && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSheet(false)}
          />
          <div
            className="relative bg-white rounded-t-3xl px-5 pt-3 w-full max-w-lg mx-auto shadow-2xl"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-brand-navy">Update Trip Status</h3>
              <button
                onClick={() => setShowSheet(false)}
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center"
                aria-label="Close"
              >
                <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </span>
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {SHEET_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSheetStatus(value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors min-h-[56px]",
                    sheetStatus === value
                      ? "border-brand-teal bg-brand-teal/5"
                      : "border-gray-100 bg-gray-50 active:bg-gray-100"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    sheetStatus === value ? "border-brand-teal" : "border-gray-300"
                  )}>
                    {sheetStatus === value && <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    sheetStatus === value ? "text-brand-teal" : "text-gray-600"
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="Add notes (optional)"
              value={sheetNote}
              onChange={(e) => setSheetNote(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal/40 text-gray-700 placeholder:text-gray-400"
            />
            <p className="text-[10px] text-gray-400 text-right mb-4">{sheetNote.length}/200</p>
            <button
              onClick={submitStatus}
              className="w-full min-h-[56px] bg-brand-teal hover:opacity-90 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-lg"
            >
              Submit Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

