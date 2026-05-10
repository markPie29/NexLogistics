import type { Trip, TripStatus, TripStatusLog } from "@/lib/types";

// Approximate Metro Manila / nearby coords
const coords = {
  manila: { lat: 14.5995, lng: 120.9842 },
  qc: { lat: 14.676, lng: 121.0437 },
  pasig: { lat: 14.5764, lng: 121.0851 },
  makati: { lat: 14.5547, lng: 121.0244 },
  bgc: { lat: 14.5507, lng: 121.0494 },
  pampanga: { lat: 15.0794, lng: 120.62 },
  batangas: { lat: 13.7565, lng: 121.0583 },
  cavite: { lat: 14.4791, lng: 120.8969 },
  laguna: { lat: 14.1407, lng: 121.4692 },
  bulacan: { lat: 14.7943, lng: 120.8794 },
  rizal: { lat: 14.6037, lng: 121.3084 },
};

let tripCounter = 165;
function makeId() {
  tripCounter += 1;
  return `TRP-2024-${tripCounter}`;
}

function logsFor(status: TripStatus, baseDate: string): TripStatusLog[] {
  const all: TripStatus[] = [
    "scheduled",
    "driver_assigned",
    "vehicle_dispatched",
    "loaded",
    "in_transit",
    "delivered",
    "completed",
  ];
  const idx = all.indexOf(status);
  const used: TripStatus[] = idx >= 0 ? all.slice(0, idx + 1) : ["scheduled", status];
  const base = new Date(baseDate).getTime();
  return used.map((s, i) => ({
    status: s,
    at: new Date(base + i * 60 * 60 * 1000).toISOString(),
    by: "system",
  }));
}

export const seedTrips: Trip[] = [
  {
    id: makeId(),
    clientId: "c-002",
    driverId: "d-001",
    vehicleId: "v-101",
    pickup: { ...coords.manila, address: "Manila Port Area", scheduledAt: "2026-05-09T06:00:00Z" },
    dropoff: { ...coords.pampanga, address: "San Fernando, Pampanga", scheduledAt: "2026-05-09T10:30:00Z" },
    cargo: { type: "Frozen Goods", weightKg: 2400, units: 120 },
    distanceKm: 96,
    fare: 18500,
    status: "in_transit",
    statusLogs: logsFor("in_transit", "2026-05-09T05:30:00Z"),
    createdAt: "2026-05-08T22:00:00Z",
    eta: "2026-05-09T10:30:00Z",
  },
  {
    id: makeId(),
    clientId: "c-004",
    driverId: "d-002",
    vehicleId: "v-102",
    pickup: { ...coords.cavite, address: "Cavite Industrial Park", scheduledAt: "2026-05-09T05:00:00Z" },
    dropoff: { ...coords.laguna, address: "Calamba, Laguna", scheduledAt: "2026-05-09T09:45:00Z" },
    cargo: { type: "Retail Stock", weightKg: 5200, units: 380 },
    distanceKm: 62,
    fare: 14200,
    status: "delivered",
    statusLogs: logsFor("delivered", "2026-05-09T05:00:00Z"),
    createdAt: "2026-05-08T19:00:00Z",
    eta: "2026-05-09T09:45:00Z",
  },
  {
    id: makeId(),
    clientId: "c-005",
    driverId: "d-003",
    vehicleId: "v-103",
    pickup: { ...coords.makati, address: "Makati CBD", scheduledAt: "2026-05-08T07:30:00Z" },
    dropoff: { ...coords.batangas, address: "Lipa, Batangas", scheduledAt: "2026-05-08T11:00:00Z" },
    cargo: { type: "Medical Supplies", weightKg: 800, units: 65 },
    distanceKm: 88,
    fare: 11900,
    status: "completed",
    statusLogs: logsFor("completed", "2026-05-08T07:00:00Z"),
    createdAt: "2026-05-07T20:00:00Z",
  },
  {
    id: makeId(),
    clientId: "c-001",
    driverId: "d-004",
    vehicleId: "v-104",
    pickup: { ...coords.qc, address: "Quezon City Depot", scheduledAt: "2026-05-09T08:15:00Z" },
    dropoff: { ...coords.bulacan, address: "Malolos, Bulacan", scheduledAt: "2026-05-09T11:00:00Z" },
    cargo: { type: "Construction Materials", weightKg: 6800, units: 24 },
    distanceKm: 47,
    fare: 9800,
    status: "delayed",
    statusLogs: logsFor("delayed", "2026-05-09T08:00:00Z"),
    createdAt: "2026-05-08T22:30:00Z",
    eta: "2026-05-09T12:30:00Z",
  },
  {
    id: makeId(),
    clientId: "c-003",
    driverId: "d-005",
    vehicleId: "v-105",
    pickup: { ...coords.makati, address: "Makati Warehouse", scheduledAt: "2026-05-09T11:00:00Z" },
    dropoff: { ...coords.rizal, address: "Antipolo, Rizal", scheduledAt: "2026-05-09T13:30:00Z" },
    cargo: { type: "General Cargo", weightKg: 3100, units: 90 },
    distanceKm: 38,
    fare: 8200,
    status: "in_transit",
    statusLogs: logsFor("in_transit", "2026-05-09T10:30:00Z"),
    createdAt: "2026-05-09T07:00:00Z",
    eta: "2026-05-09T13:30:00Z",
  },
  {
    id: makeId(),
    clientId: "c-006",
    driverId: "d-007",
    vehicleId: "v-107",
    pickup: { ...coords.pampanga, address: "Pampanga Builders Depot", scheduledAt: "2026-05-09T04:00:00Z" },
    dropoff: { ...coords.qc, address: "QC Construction Site", scheduledAt: "2026-05-09T08:30:00Z" },
    cargo: { type: "Steel Bars", weightKg: 18500, units: 200 },
    distanceKm: 88,
    fare: 28500,
    status: "loaded",
    statusLogs: logsFor("loaded", "2026-05-09T03:30:00Z"),
    createdAt: "2026-05-08T21:00:00Z",
    eta: "2026-05-09T08:30:00Z",
  },
  {
    id: makeId(),
    clientId: "c-002",
    driverId: "d-006",
    vehicleId: "v-106",
    pickup: { ...coords.pasig, address: "Pasig Distribution Hub", scheduledAt: "2026-05-09T13:00:00Z" },
    dropoff: { ...coords.bgc, address: "BGC, Taguig", scheduledAt: "2026-05-09T14:30:00Z" },
    cargo: { type: "Documents", weightKg: 50, units: 5 },
    distanceKm: 12,
    fare: 2800,
    status: "scheduled",
    statusLogs: logsFor("scheduled", "2026-05-09T13:00:00Z"),
    createdAt: "2026-05-09T09:00:00Z",
    eta: "2026-05-09T14:30:00Z",
  },
  {
    id: makeId(),
    clientId: "c-004",
    driverId: "d-008",
    vehicleId: "v-108",
    pickup: { ...coords.qc, address: "QC Warehouse", scheduledAt: "2026-05-09T15:00:00Z" },
    dropoff: { ...coords.cavite, address: "Imus, Cavite", scheduledAt: "2026-05-09T18:00:00Z" },
    cargo: { type: "Retail Stock", weightKg: 1100, units: 80 },
    distanceKm: 42,
    fare: 7400,
    status: "driver_assigned",
    statusLogs: logsFor("driver_assigned", "2026-05-09T14:00:00Z"),
    createdAt: "2026-05-09T11:00:00Z",
    eta: "2026-05-09T18:00:00Z",
  },
  {
    id: makeId(),
    clientId: "c-001",
    driverId: "d-009",
    vehicleId: "v-109",
    pickup: { ...coords.batangas, address: "Batangas Port", scheduledAt: "2026-05-09T02:00:00Z" },
    dropoff: { ...coords.qc, address: "QC Yard", scheduledAt: "2026-05-09T07:30:00Z" },
    cargo: { type: "Container 40ft", weightKg: 22000, units: 1 },
    distanceKm: 130,
    fare: 38500,
    status: "completed",
    statusLogs: logsFor("completed", "2026-05-09T01:30:00Z"),
    createdAt: "2026-05-08T18:00:00Z",
  },
  {
    id: makeId(),
    clientId: "c-005",
    driverId: "d-010",
    vehicleId: "v-110",
    pickup: { ...coords.makati, address: "Makati Med Hub", scheduledAt: "2026-05-09T09:00:00Z" },
    dropoff: { ...coords.rizal, address: "Cainta, Rizal", scheduledAt: "2026-05-09T11:00:00Z" },
    cargo: { type: "Vaccines (Cold)", weightKg: 200, units: 12 },
    distanceKm: 22,
    fare: 6800,
    status: "vehicle_dispatched",
    statusLogs: logsFor("vehicle_dispatched", "2026-05-09T08:30:00Z"),
    createdAt: "2026-05-09T06:00:00Z",
    eta: "2026-05-09T11:00:00Z",
  },
  // History trips
  ...Array.from({ length: 12 }).map((_, i) => {
    const driverId = `d-00${(i % 9) + 1}`;
    const vehicleId = `v-10${(i % 9) + 1}`;
    const clientIds = ["c-001", "c-002", "c-003", "c-004", "c-005", "c-006"];
    const day = 1 + i;
    const status: TripStatus = i % 7 === 0 ? "delayed" : "completed";
    return {
      id: makeId(),
      clientId: clientIds[i % clientIds.length],
      driverId,
      vehicleId,
      pickup: { ...coords.manila, address: "Manila Port", scheduledAt: `2026-04-${String(day).padStart(2, "0")}T06:00:00Z` },
      dropoff: { ...coords.pampanga, address: "Pampanga Hub", scheduledAt: `2026-04-${String(day).padStart(2, "0")}T10:30:00Z` },
      cargo: { type: "General Cargo", weightKg: 2000 + i * 350, units: 50 + i * 8 },
      distanceKm: 75 + i * 4,
      fare: 9500 + i * 800,
      status,
      statusLogs: logsFor(status, `2026-04-${String(day).padStart(2, "0")}T05:30:00Z`),
      createdAt: `2026-04-${String(day).padStart(2, "0")}T02:00:00Z`,
    } satisfies Trip;
  }),
];
