import type { Trip, TripStatus } from "@/lib/types";

// ─── Status Labels ────────────────────────────────────────────────────────────

/**
 * Maps Trip statuses to client-friendly display labels.
 */
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  scheduled: "Scheduled",
  driver_assigned: "Driver Assigned",
  vehicle_dispatched: "Dispatched",
  loaded: "Loaded",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

// ─── Badge Variants ───────────────────────────────────────────────────────────

/**
 * Maps all portal statuses (trip, invoice, ticket) to Tailwind CSS badge classes.
 */
export const STATUS_BADGE_VARIANT: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  in_transit: "bg-blue-100 text-blue-700",
  loaded: "bg-blue-100 text-blue-700",
  vehicle_dispatched: "bg-blue-100 text-blue-700",
  scheduled: "bg-gray-100 text-gray-700",
  delayed: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  sent: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  partially_paid: "bg-amber-100 text-amber-700",
  draft: "bg-gray-100 text-gray-700",
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

// ─── Document Categories ──────────────────────────────────────────────────────

/**
 * Predefined document categories with their respective document types.
 */
export const DOCUMENT_CATEGORIES = {
  Delivery: ["Bill of Lading", "Delivery Receipt", "Proof of Delivery"],
  Compliance: ["Certificate of Insurance", "Permits", "OR/CR"],
  Financial: ["BIR 2307", "Statement of Account", "Official Receipt"],
  Rate: ["Rate Confirmation"],
} as const;

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;

// ─── Portal Document Interface ────────────────────────────────────────────────

export interface PortalDocument {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "XLSX";
  category: DocumentCategory;
  uploadedAt: string;
  uploadedBy: string;
  tripId?: string;
  sizeKb: number;
  notes?: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns true if the document was uploaded less than 48 hours ago.
 */
export function isDocumentNew(uploadedAt: string): boolean {
  const FORTY_EIGHT_HOURS_MS = 172_800_000; // 48 * 60 * 60 * 1000
  return Date.now() - new Date(uploadedAt).getTime() < FORTY_EIGHT_HOURS_MS;
}

/**
 * Computes on-time delivery rate as a percentage.
 * Formula: (delivered + completed) / (total - scheduled - cancelled) × 100
 * Returns 0 if denominator is 0.
 */
export function computeOnTimeRate(trips: Trip[]): number {
  const delivered = trips.filter((t) =>
    ["delivered", "completed"].includes(t.status)
  ).length;
  const eligible = trips.filter(
    (t) => !["scheduled", "cancelled"].includes(t.status)
  ).length;
  if (eligible === 0) return 0;
  return (delivered / eligible) * 100;
}

/**
 * Groups trips by pickup→dropoff first address segment, sorted descending by count.
 */
export function computeTopLanes(
  trips: Trip[]
): { route: string; count: number }[] {
  const laneCounts = new Map<string, number>();
  for (const trip of trips) {
    const pickupSegment = trip.pickup.address.split(",")[0];
    const dropoffSegment = trip.dropoff.address.split(",")[0];
    const route = `${pickupSegment} → ${dropoffSegment}`;
    laneCounts.set(route, (laneCounts.get(route) ?? 0) + 1);
  }
  return Array.from(laneCounts.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Multi-criteria filter combining status predicate with case-insensitive search.
 * If statusFilter is "all", all items pass the status check.
 * If query is empty, all items pass the search check.
 */
export function filterBySearchAndStatus<T>(
  items: T[],
  query: string,
  statusFilter: string | "all",
  getStatus: (item: T) => string,
  getSearchFields: (item: T) => string[]
): T[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || getStatus(item) === statusFilter;
    const matchesSearch =
      !q || getSearchFields(item).some((f) => f.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });
}
