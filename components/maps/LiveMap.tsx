"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useFleetStore } from "@/lib/store";
import { useDriverStore } from "@/lib/store";
import { useTripStore } from "@/lib/store";

interface SimVehicle {
  id: string;
  plate: string;
  driver: string;
  tripId?: string;
  lat: number;
  lng: number;
  speedKph: number;
  status: "moving" | "idle" | "stopped" | "offline";
  engineOn: boolean;
  lastUpdate: string;
}

const STATUS_COLOR: Record<SimVehicle["status"], string> = {
  moving: "#10B981",
  idle: "#F59E0B",
  stopped: "#EF4444",
  offline: "#9CA3AF",
};

function makeIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [80, 32],
    iconAnchor: [40, 16],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:white;border:2px solid ${color};color:#0B1220;font-weight:700;font-size:11px;padding:3px 8px;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.15);white-space:nowrap;">
          🚚 ${label}
        </div>
        <div style="width:8px;height:8px;background:${color};border-radius:50%;margin-top:-2px;box-shadow:0 0 0 4px ${color}33;"></div>
      </div>`,
  });
}

interface LiveMapProps {
  height?: number | string;
  showLegend?: boolean;
  zoom?: number;
}

export default function LiveMap({ height = 320, showLegend = true, zoom = 11 }: LiveMapProps) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);

  const [sim, setSim] = useState<SimVehicle[]>([]);

  useEffect(() => {
    // initial positions: spread some active vehicles around Metro Manila
    const center = { lat: 14.6, lng: 121.0 };
    const initial: SimVehicle[] = vehicles.slice(0, 8).map((v, i) => {
      const driver = drivers.find((d) => d.id === v.assignedDriverId);
      const trip = trips.find((t) => t.vehicleId === v.id && (t.status === "in_transit" || t.status === "loaded" || t.status === "vehicle_dispatched"));
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.08 + (i % 3) * 0.02;
      const status: SimVehicle["status"] =
        v.status === "maintenance" || v.status === "inactive"
          ? "offline"
          : trip
          ? "moving"
          : i % 3 === 0
          ? "idle"
          : "stopped";
      return {
        id: v.id,
        plate: v.plate,
        driver: driver?.name || "Unassigned",
        tripId: trip?.id,
        lat: center.lat + Math.cos(angle) * r,
        lng: center.lng + Math.sin(angle) * r,
        speedKph: status === "moving" ? 40 + Math.round(Math.random() * 35) : status === "idle" ? 0 : 0,
        status,
        engineOn: status !== "offline",
        lastUpdate: new Date().toISOString(),
      };
    });
    setSim(initial);

    const t = setInterval(() => {
      setSim((prev) =>
        prev.map((v) => {
          if (v.status !== "moving") return { ...v, lastUpdate: new Date().toISOString() };
          const dx = (Math.random() - 0.5) * 0.004;
          const dy = (Math.random() - 0.5) * 0.004;
          return {
            ...v,
            lat: v.lat + dx,
            lng: v.lng + dy,
            speedKph: 35 + Math.round(Math.random() * 40),
            lastUpdate: new Date().toISOString(),
          };
        })
      );
    }, 3000);
    return () => clearInterval(t);
  }, [vehicles, drivers, trips]);

  const counts = sim.reduce(
    (acc, v) => {
      acc[v.status] += 1;
      return acc;
    },
    { moving: 0, idle: 0, stopped: 0, offline: 0 }
  );

  return (
    <div className="relative z-0 rounded-xl overflow-hidden border border-brand-border" style={{ height }}>
      <MapContainer
        center={[14.6, 121.0]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ zIndex: 0, height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sim.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={makeIcon(STATUS_COLOR[v.status], v.plate)}>
            <Popup>
              <div className="p-3 min-w-[200px] font-sans">
                <div className="font-bold text-brand-navy text-sm">{v.plate}</div>
                <div className="text-xs text-muted-foreground mb-2">{v.driver}</div>
                <div className="space-y-1 text-xs">
                  {v.tripId && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Trip</span><span className="font-medium">{v.tripId}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Speed</span><span className="font-medium">{v.speedKph} km/h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize" style={{ color: STATUS_COLOR[v.status] }}>{v.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Engine</span><span className="font-medium">{v.engineOn ? "On" : "Off"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GPS</span><span className="font-medium text-emerald-600">Active</span></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 bg-white/95 backdrop-blur border border-brand-border rounded-lg px-3 py-2 text-xs shadow-md dark:bg-slate-900/95 dark:border-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Moving <b>{counts.moving}</b></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Idle <b>{counts.idle}</b></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Stopped <b>{counts.stopped}</b></span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Offline <b>{counts.offline}</b></span>
          </div>
        </div>
      )}
    </div>
  );
}
