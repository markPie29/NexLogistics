"use client";
import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, useDroppable, useDraggable, closestCorners,
} from "@dnd-kit/core";
import { Truck, ArrowRight, User as UserIcon, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Board"
        subtitle="Drag-and-drop trips between status columns to update them in real time"
        breadcrumbs={[{ label: "Operations" }, { label: "Trips", href: "/trips" }, { label: "Dispatch" }]}
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {COLUMNS.map((col) => (
            <Column key={col.id} col={col} trips={grouped[col.id]} drivers={drivers} vehicles={vehicles} />
          ))}
        </div>
        <DragOverlay>
          {activeTrip ? <TripCard trip={activeTrip} drivers={drivers} vehicles={vehicles} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ col, trips, drivers, vehicles }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] w-[300px] rounded-2xl border bg-white p-3 transition ${isOver ? "border-brand-teal bg-brand-teal-light/30" : "border-brand-border"}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.color}`} />
          <span className="text-sm font-bold text-brand-navy">{col.label}</span>
        </div>
        <Badge variant="neutral">{trips.length}</Badge>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {trips.map((t: Trip) => <TripCard key={t.id} trip={t} drivers={drivers} vehicles={vehicles} />)}
      </div>
    </div>
  );
}

function TripCard({ trip, drivers, vehicles, dragging }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: trip.id });
  const driver = drivers.find((d: any) => d.id === trip.driverId);
  const vehicle = vehicles.find((v: any) => v.id === trip.vehicleId);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`rounded-xl border border-brand-border bg-white p-3 shadow-sm hover:shadow-card cursor-grab active:cursor-grabbing transition ${isDragging || dragging ? "opacity-80 ring-2 ring-brand-teal" : ""}`}
    >
      <Link href={`/trips/${trip.id}`} onClick={(e) => e.stopPropagation()} className="text-xs font-bold text-brand-teal hover:underline">{trip.id}</Link>
      <div className="text-sm mt-1 text-brand-navy font-medium leading-tight">
        {trip.pickup.address} <ArrowRight className="inline w-3 h-3" /> {trip.dropoff.address}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{driver?.name?.split(" ")[0] || "—"}</span>
        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{vehicle?.plate || "—"}</span>
      </div>
      {trip.eta && <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />ETA {new Date(trip.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
    </div>
  );
}
