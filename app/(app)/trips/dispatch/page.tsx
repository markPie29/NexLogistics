"use client";
import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, useDroppable, useDraggable, closestCorners,
} from "@dnd-kit/core";
import { Truck, ArrowRight, User as UserIcon, Clock, MapPin, Package, DollarSign, Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useTripStore, useDriverStore, useFleetStore } from "@/lib/store";
import type { TripStatus, Trip } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

const COLUMNS: Array<{ id: TripStatus; label: string; color: string }> = [
  { id: "scheduled", label: "Scheduled", color: "bg-gray-400" },
  { id: "driver_assigned", label: "Driver Assigned", color: "bg-violet-500" },
  { id: "vehicle_dispatched", label: "Dispatched", color: "bg-sky-500" },
  { id: "loaded", label: "Loaded", color: "bg-cyan-500" },
  { id: "in_transit", label: "In Transit", color: "bg-blue-500" },
  { id: "delivered", label: "Delivered", color: "bg-emerald-500" },
  { id: "completed", label: "Completed", color: "bg-emerald-600" },
  { id: "delayed", label: "Delayed", color: "bg-red-500" },
];

export default function DispatchPage() {
  const trips = useTripStore((s) => s.trips);
  const setStatus = useTripStore((s) => s.setStatus);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    COLUMNS.forEach((c) => (map[c.id] = []));
    trips.forEach((t) => {
      // Phase 5 — exclude rate-pending trips from dispatch board
      if (t.approvalStatus === "pending_rate_approval") return;
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [trips]);

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const tripId = String(e.active.id);
    const newStatus = e.over?.id as TripStatus | undefined;
    if (!newStatus) return;
    const trip = trips.find((t) => t.id === tripId);
    if (!trip || trip.status === newStatus) return;
    setStatus(tripId, newStatus, "dispatcher", `Moved to ${newStatus}`);
    toast.success(`${tripId} → ${newStatus.replace(/_/g, " ")}`);
  };

  const activeTrip = trips.find((t) => t.id === activeId);

  const handleTripClick = (trip: Trip) => setSelectedTrip(trip);

  const selectedDriver = selectedTrip ? drivers.find((d) => d.id === selectedTrip.driverId) : null;
  const selectedVehicle = selectedTrip ? vehicles.find((v) => v.id === selectedTrip.vehicleId) : null;
  const statusCol = selectedTrip ? COLUMNS.find((c) => c.id === selectedTrip.status) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Board"
        subtitle="Drag-and-drop trips between status columns to update them in real time"
        breadcrumbs={[{ label: "Operations" }, { label: "Trips", href: "/trips" }, { label: "Dispatch" }]}
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0">
          {COLUMNS.map((col) => (
            <Column key={col.id} col={col} trips={grouped[col.id]} drivers={drivers} vehicles={vehicles} onTripClick={handleTripClick} />
          ))}
        </div>
        <DragOverlay>
          {activeTrip ? <TripCard trip={activeTrip} drivers={drivers} vehicles={vehicles} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Trip Detail Dialog */}
      <Dialog open={!!selectedTrip} onOpenChange={(open) => { if (!open) setSelectedTrip(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-navy">{selectedTrip?.id}</DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusCol?.color || "bg-gray-400"}`} />
                <Badge variant="neutral">{statusCol?.label || selectedTrip.status.replace(/_/g, " ")}</Badge>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm font-medium text-brand-navy">{selectedTrip.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dropoff</p>
                    <p className="text-sm font-medium text-brand-navy">{selectedTrip.dropoff.address}</p>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-brand-border p-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="w-3 h-3" />Driver</p>
                  <p className="text-sm font-medium text-brand-navy">{selectedDriver?.name || "Unassigned"}</p>
                </div>
                <div className="rounded-lg border border-brand-border p-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" />Vehicle</p>
                  <p className="text-sm font-medium text-brand-navy">{selectedVehicle?.plate || "—"}</p>
                </div>
              </div>

              {/* Cargo */}
              <div className="rounded-lg border border-brand-border p-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />Cargo</p>
                <p className="text-sm font-medium text-brand-navy">
                  {selectedTrip.cargo.type} · {selectedTrip.cargo.weightKg.toLocaleString()} kg
                </p>
              </div>

              {/* Fare, Distance, ETA */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-brand-border p-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" />Fare</p>
                  <p className="text-sm font-bold text-brand-teal">₱{selectedTrip.fare.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-brand-border p-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Route className="w-3 h-3" />Distance</p>
                  <p className="text-sm font-bold text-brand-navy">{selectedTrip.distanceKm} km</p>
                </div>
                <div className="rounded-lg border border-brand-border p-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="w-3 h-3" />ETA</p>
                  <p className="text-sm font-bold text-brand-navy">
                    {selectedTrip.eta ? new Date(selectedTrip.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedTrip(null)}>
              Close
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedTrip(null); router.push(`/trips/${selectedTrip?.id}`); }}>
              View Full Details
            </Button>
            <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90 text-white" onClick={() => { setSelectedTrip(null); router.push(`/trips/${selectedTrip?.id}`); }}>
              Edit Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Column({ col, trips, drivers, vehicles, onTripClick }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] md:min-w-[300px] md:w-[300px] flex-shrink-0 snap-start rounded-2xl border bg-white p-3 transition ${isOver ? "border-brand-teal bg-brand-teal-light/30" : "border-brand-border"}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.color}`} />
          <span className="text-sm font-bold text-brand-navy">{col.label}</span>
        </div>
        <Badge variant="neutral">{trips.length}</Badge>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {trips.map((t: Trip) => <TripCard key={t.id} trip={t} drivers={drivers} vehicles={vehicles} onTripClick={onTripClick} />)}
      </div>
    </div>
  );
}

function TripCard({ trip, drivers, vehicles, dragging, onTripClick }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: trip.id });
  const driver = drivers?.find((d: any) => d.id === trip.driverId);
  const vehicle = vehicles?.find((v: any) => v.id === trip.vehicleId);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const handleClick = () => {
    // Only fire click if no drag transform was applied (pure click, not drag)
    if (!transform && onTripClick) {
      onTripClick(trip);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={handleClick}
      className={`rounded-xl border border-brand-border bg-white p-3 shadow-sm hover:shadow-card cursor-grab active:cursor-grabbing transition ${isDragging || dragging ? "opacity-80 ring-2 ring-brand-teal" : ""}`}
    >
      <span className="text-xs font-bold text-brand-teal">{trip.id}</span>
      <div className="text-sm mt-1 text-brand-navy font-medium leading-tight line-clamp-2">
        {trip.pickup.address.split(",")[0]} <ArrowRight className="inline w-3 h-3 mx-0.5" /> {trip.dropoff.address.split(",")[0]}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{driver?.name?.split(" ")[0] || "—"}</span>
        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle?.plate || "—"}</span>
      </div>
      {trip.eta && <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />ETA {new Date(trip.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
    </div>
  );
}
