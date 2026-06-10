"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Play } from "lucide-react";

// ─── Coordinate Data ──────────────────────────────────────────────────────────

interface Coordinate {
  lat: number;
  lng: number;
}

const LOCATIONS: Record<string, Coordinate> = {
  "Manila Port": { lat: 14.5995, lng: 120.9642 },
  Pampanga: { lat: 15.0286, lng: 120.693 },
  "Cavite Industrial": { lat: 14.4275, lng: 120.91 },
  Laguna: { lat: 14.2114, lng: 121.1645 },
  Makati: { lat: 14.5547, lng: 121.0244 },
  Batangas: { lat: 13.7565, lng: 121.0583 },
  "Quezon City": { lat: 14.676, lng: 121.0437 },
  Bulacan: { lat: 14.8433, lng: 120.8093 },
  Rizal: { lat: 14.5864, lng: 121.1761 },
};

interface RouteData {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  performance: "Excellent" | "Good" | "Needs Attention";
}

const ROUTES: RouteData[] = [
  { id: "RT-001", origin: "Manila Port", destination: "Pampanga", distanceKm: 96, performance: "Excellent" },
  { id: "RT-002", origin: "Cavite Industrial", destination: "Laguna", distanceKm: 62, performance: "Good" },
  { id: "RT-003", origin: "Makati", destination: "Batangas", distanceKm: 88, performance: "Excellent" },
  { id: "RT-004", origin: "Quezon City", destination: "Bulacan", distanceKm: 47, performance: "Good" },
  { id: "RT-005", origin: "Makati", destination: "Rizal", distanceKm: 38, performance: "Good" },
];

const PERFORMANCE_COLORS: Record<string, string> = {
  Excellent: "#10B981",
  Good: "#F59E0B",
  "Needs Attention": "#EF4444",
};

const VEHICLES = ["NEX-101", "NEX-102", "NEX-103", "NEX-104", "NEX-105"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function interpolatePoints(start: Coordinate, end: Coordinate, steps: number): Coordinate[] {
  const points: Coordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return points;
}

function makeOriginIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
    </div>`,
  });
}

function makeDestinationIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
    </div>`,
  });
}

function makeTruckIcon() {
  return L.divIcon({
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div style="width:40px;height:40px;background:#0B1220;border:3px solid #14B8A6;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">
      🚛
    </div>`,
  });
}

// ─── Animated Marker Component ────────────────────────────────────────────────

function AnimatedMarker({ position }: { position: Coordinate }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!markerRef.current) {
      markerRef.current = L.marker([position.lat, position.lng], {
        icon: makeTruckIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SimStatus = "Departing" | "In Transit" | "Arriving" | "Delivered";

export default function RouteMap() {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simPosition, setSimPosition] = useState<Coordinate | null>(null);
  const [simStatus, setSimStatus] = useState<SimStatus | null>(null);
  const [simProgress, setSimProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedRoute = ROUTES[selectedRouteIdx];
  const originCoord = LOCATIONS[selectedRoute.origin];
  const destCoord = LOCATIONS[selectedRoute.destination];

  const handleSimulate = useCallback(() => {
    if (simulating) return;

    const steps = 50;
    const totalDuration = 5000; // 5 seconds
    const intervalMs = totalDuration / steps;
    const points = interpolatePoints(originCoord, destCoord, steps);

    setSimulating(true);
    setSimPosition(points[0]);
    setSimStatus("Departing");
    setSimProgress(0);

    let currentStep = 0;

    intervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setSimPosition(points[steps]);
        setSimStatus("Delivered");
        setSimProgress(100);
        setSimulating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setSimPosition(points[currentStep]);
      const progress = Math.round((currentStep / steps) * 100);
      setSimProgress(progress);

      if (progress < 15) {
        setSimStatus("Departing");
      } else if (progress < 80) {
        setSimStatus("In Transit");
      } else {
        setSimStatus("Arriving");
      }
    }, intervalMs);
  }, [simulating, originCoord, destCoord]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleRouteSelect = (idx: number) => {
    if (simulating) return;
    setSelectedRouteIdx(idx);
    setSimPosition(null);
    setSimStatus(null);
    setSimProgress(0);
  };

  const statusColor: Record<SimStatus, string> = {
    Departing: "text-blue-600",
    "In Transit": "text-amber-600",
    Arriving: "text-purple-600",
    Delivered: "text-emerald-600",
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-brand-navy">Select Vehicle:</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            {VEHICLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-brand-navy">Route:</label>
          <select
            value={selectedRouteIdx}
            onChange={(e) => handleRouteSelect(Number(e.target.value))}
            disabled={simulating}
            className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            {ROUTES.map((r, i) => (
              <option key={r.id} value={i}>
                {r.id}: {r.origin} → {r.destination}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={simulating}
          size="sm"
          className="gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          {simulating ? "Simulating..." : "Simulate Route"}
        </Button>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-brand-border" style={{ height: 480 }}>
        <MapContainer
          center={[14.5995, 120.9842]}
          zoom={9}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route Polylines */}
          {ROUTES.map((route, idx) => {
            const start = LOCATIONS[route.origin];
            const end = LOCATIONS[route.destination];
            if (!start || !end) return null;
            return (
              <Polyline
                key={route.id}
                positions={[
                  [start.lat, start.lng],
                  [end.lat, end.lng],
                ]}
                pathOptions={{
                  color: PERFORMANCE_COLORS[route.performance],
                  weight: idx === selectedRouteIdx ? 4 : 2,
                  opacity: idx === selectedRouteIdx ? 1 : 0.5,
                  dashArray: idx === selectedRouteIdx ? undefined : "5, 10",
                }}
              />
            );
          })}

          {/* Origin & Destination Markers */}
          {ROUTES.map((route) => {
            const start = LOCATIONS[route.origin];
            const end = LOCATIONS[route.destination];
            if (!start || !end) return null;
            return (
              <span key={`markers-${route.id}`}>
                <Marker position={[start.lat, start.lng]} icon={makeOriginIcon()}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <div className="font-bold">{route.origin}</div>
                      <div className="text-muted-foreground">Origin - {route.id}</div>
                    </div>
                  </Popup>
                </Marker>
                <Marker position={[end.lat, end.lng]} icon={makeDestinationIcon()}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <div className="font-bold">{route.destination}</div>
                      <div className="text-muted-foreground">Destination - {route.id}</div>
                    </div>
                  </Popup>
                </Marker>
              </span>
            );
          })}

          {/* Animated Truck Marker */}
          {simPosition && <AnimatedMarker position={simPosition} />}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-brand-navy">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded" /> Excellent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500 rounded" /> Good
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-500 rounded" /> Needs Attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" /> Origin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" /> Destination
        </span>
      </div>

      {/* Simulation Info Panel */}
      {simStatus && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-teal" />
              Route Simulation
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-brand-navy">{selectedVehicle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Route</p>
                <p className="font-semibold text-brand-navy">
                  {selectedRoute.origin} → {selectedRoute.destination}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold text-brand-navy">{selectedRoute.distanceKm} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="font-semibold text-brand-navy">
                  {simStatus === "Delivered"
                    ? "Arrived"
                    : `~${Math.round(((100 - simProgress) / 100) * (selectedRoute.distanceKm / 50) * 60)} min`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-semibold ${statusColor[simStatus]}`}>{simStatus}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full transition-all duration-100"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">{simProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
