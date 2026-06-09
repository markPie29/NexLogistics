import type { Trip, ProofOfDelivery, Driver } from "@/lib/types";

// ─── Interfaces ──────────────────────────────────────────────

export interface PodKpiData {
  awaitingCount: number;
  capturedTodayCount: number;
  completionRate: number | null; // null when no delivered/completed trips exist
}

export interface AwaitingPodRow {
  tripId: string;
  driverName: string; // "Unassigned" if unresolvable
  pickupAddress: string;
  dropoffAddress: string;
  deliveryDate: string; // ISO string from last statusLog or trip createdAt
}

export interface CapturedPodRow {
  tripId: string;
  podId: string;
  driverName: string;
  receiverName: string;
  captureDate: string; // POD timestamp ISO string
  hasSignature: boolean;
  photoCount: number;
}

export interface PodFilters {
  search: string; // max 100 chars
  driverFilter: string | null; // driverId or null for all
}

export interface PodSort {
  column: string;
  direction: "asc" | "desc";
}

export interface PodPagination {
  currentPage: number;
  pageSize: number; // default 10
}

export interface DriverPodSummary {
  pendingCount: number;
  capturedCount: number;
  awaitingTrips: Trip[];
  capturedItems: Array<{ trip: Trip; pod: ProofOfDelivery }>;
}

// ─── Constants ───────────────────────────────────────────────

const POD_ELIGIBLE_STATUSES = new Set(["delivered", "completed"]);

// ─── Driver Name Resolution ─────────────────────────────────

/**
 * Resolves a driverId to the driver's name.
 * Returns "Unassigned" if driverId is undefined or not found.
 */
export function resolveDriverName(
  driverId: string | undefined,
  drivers: Driver[]
): string {
  if (!driverId) return "Unassigned";
  const driver = drivers.find((d) => d.id === driverId);
  return driver ? driver.name : "Unassigned";
}

// ─── Date Formatting ─────────────────────────────────────────

/**
 * Formats an ISO date string as "MMM DD, YYYY HH:mm" using en-PH locale.
 */
export function formatPodDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Formats an ISO date string as "MMM DD, YYYY" using en-PH locale.
 */
export function formatDeliveryDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Number Formatting ───────────────────────────────────────

/**
 * Formats a number with locale-appropriate thousands separators.
 */
export function formatCount(n: number): string {
  return n.toLocaleString("en-PH");
}

// ─── KPI Computation ─────────────────────────────────────────

/**
 * Computes POD KPI metrics from trips and pods arrays.
 *
 * - awaitingCount: delivered/completed trips with no matching POD
 * - capturedTodayCount: PODs with timestamp in today's calendar day (local timezone)
 * - completionRate: (matched / total eligible) * 100, rounded, capped at 100; null if no eligible trips
 */
export function computePodKpis(
  trips: Trip[],
  pods: ProofOfDelivery[]
): PodKpiData {
  const eligibleTrips = trips.filter((t) => POD_ELIGIBLE_STATUSES.has(t.status));
  const totalEligible = eligibleTrips.length;

  if (totalEligible === 0) {
    return {
      awaitingCount: 0,
      capturedTodayCount: countCapturedToday(pods),
      completionRate: null,
    };
  }

  const podTripIds = new Set(pods.map((p) => p.tripId));
  const awaitingCount = eligibleTrips.filter((t) => !podTripIds.has(t.id)).length;
  const matchedCount = totalEligible - awaitingCount;

  const rawRate = (matchedCount / totalEligible) * 100;
  const completionRate = Math.min(Math.round(rawRate), 100);

  return {
    awaitingCount,
    capturedTodayCount: countCapturedToday(pods),
    completionRate,
  };
}

function countCapturedToday(pods: ProofOfDelivery[]): number {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  return pods.filter((p) => {
    const ts = new Date(p.timestamp).getTime();
    return ts >= todayStart && ts < todayEnd;
  }).length;
}

// ─── Table Row Derivation ────────────────────────────────────

/**
 * Derives AwaitingPodRow[] for trips with status "delivered"/"completed"
 * that have no matching POD record.
 */
export function deriveAwaitingRows(
  trips: Trip[],
  pods: ProofOfDelivery[],
  drivers: Driver[]
): AwaitingPodRow[] {
  const podTripIds = new Set(pods.map((p) => p.tripId));

  return trips
    .filter((t) => POD_ELIGIBLE_STATUSES.has(t.status) && !podTripIds.has(t.id))
    .map((t) => ({
      tripId: t.id,
      driverName: resolveDriverName(t.driverId, drivers),
      pickupAddress: t.pickup.address,
      dropoffAddress: t.dropoff.address,
      deliveryDate: getDeliveryDate(t),
    }));
}

/**
 * Derives CapturedPodRow[] for trips that have a matching POD record.
 */
export function deriveCapturedRows(
  trips: Trip[],
  pods: ProofOfDelivery[],
  drivers: Driver[]
): CapturedPodRow[] {
  const podByTripId = new Map(pods.map((p) => [p.tripId, p]));

  return trips
    .filter((t) => podByTripId.has(t.id))
    .map((t) => {
      const pod = podByTripId.get(t.id)!;
      return {
        tripId: t.id,
        podId: pod.id,
        driverName: resolveDriverName(t.driverId, drivers),
        receiverName: pod.receiverName,
        captureDate: pod.timestamp,
        hasSignature: !!pod.signatureDataUrl,
        photoCount: pod.photoDataUrls?.length ?? 0,
      };
    });
}

/**
 * Gets the delivery date for a trip from the last statusLog timestamp,
 * falling back to createdAt.
 */
function getDeliveryDate(trip: Trip): string {
  const deliveredLog = [...trip.statusLogs]
    .reverse()
    .find((log) => log.status === "delivered" || log.status === "completed");
  return deliveredLog?.at ?? trip.createdAt;
}

// ─── Filtering ───────────────────────────────────────────────

/**
 * Filters POD rows using case-insensitive partial match on Trip ID, Driver Name,
 * and Receiver Name (captured tab only). AND logic with driver filter.
 *
 * The `driverFilter` in PodFilters should be the resolved driver name (not driverId),
 * since rows carry driverName. The orchestrator resolves driverId → name before calling.
 */
export function filterPodRows<T extends AwaitingPodRow | CapturedPodRow>(
  rows: T[],
  filters: PodFilters,
  tab: "awaiting" | "captured"
): T[] {
  const { search, driverFilter } = filters;

  return rows.filter((row) => {
    // Driver filter: exact match on resolved driver name
    if (driverFilter && row.driverName !== driverFilter) {
      return false;
    }

    // Search filter: case-insensitive partial match
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesTripId = row.tripId.toLowerCase().includes(searchLower);
      const matchesDriverName = row.driverName.toLowerCase().includes(searchLower);

      if (tab === "captured" && "receiverName" in row) {
        const matchesReceiverName = (row as CapturedPodRow).receiverName
          .toLowerCase()
          .includes(searchLower);
        if (!matchesTripId && !matchesDriverName && !matchesReceiverName) return false;
      } else {
        if (!matchesTripId && !matchesDriverName) return false;
      }
    }

    return true;
  });
}

// ─── Sorting ─────────────────────────────────────────────────

/**
 * Sorts POD rows by the specified column using locale-aware string comparison
 * for text columns and chronological comparison for date columns.
 * Supports asc/desc direction.
 */
export function sortPodRows<T extends AwaitingPodRow | CapturedPodRow>(
  rows: T[],
  sort: PodSort
): T[] {
  const { column, direction } = sort;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aVal = getColumnValue(a, column);
    const bVal = getColumnValue(b, column);

    // Date columns: compare chronologically
    if (isDateColumn(column)) {
      const aTime = new Date(aVal).getTime();
      const bTime = new Date(bVal).getTime();
      return (aTime - bTime) * multiplier;
    }

    // Text columns: locale-aware string comparison
    return String(aVal).localeCompare(String(bVal), "en-PH") * multiplier;
  });
}

function getColumnValue(row: AwaitingPodRow | CapturedPodRow, column: string): string {
  switch (column) {
    case "tripId":
      return row.tripId;
    case "driverName":
      return row.driverName;
    case "pickupAddress":
      return "pickupAddress" in row ? (row as AwaitingPodRow).pickupAddress : "";
    case "dropoffAddress":
      return "dropoffAddress" in row ? (row as AwaitingPodRow).dropoffAddress : "";
    case "deliveryDate":
      return "deliveryDate" in row ? (row as AwaitingPodRow).deliveryDate : "";
    case "receiverName":
      return "receiverName" in row ? (row as CapturedPodRow).receiverName : "";
    case "captureDate":
      return "captureDate" in row ? (row as CapturedPodRow).captureDate : "";
    default:
      return "";
  }
}

function isDateColumn(column: string): boolean {
  return column === "deliveryDate" || column === "captureDate";
}

// ─── Pagination ──────────────────────────────────────────────

/**
 * Paginates rows returning the subset for the current page,
 * along with total pages and total count.
 */
export function paginatePodRows<T>(
  rows: T[],
  pagination: PodPagination
): { pageRows: T[]; totalPages: number; totalCount: number } {
  const { currentPage, pageSize } = pagination;
  const totalCount = rows.length;
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  return { pageRows, totalPages, totalCount };
}

// ─── Driver View Helpers ─────────────────────────────────────

/**
 * Computes the driver POD summary: pending/captured counts and lists.
 * Filters trips to the specified driverId.
 */
export function computeDriverPodSummary(
  trips: Trip[],
  pods: ProofOfDelivery[],
  driverId: string | null
): DriverPodSummary {
  // Filter trips to this driver and eligible status
  const driverTrips = trips.filter(
    (t) => t.driverId === driverId && POD_ELIGIBLE_STATUSES.has(t.status)
  );

  const podByTripId = new Map(pods.map((p) => [p.tripId, p]));

  const awaitingTrips: Trip[] = [];
  const capturedItems: Array<{ trip: Trip; pod: ProofOfDelivery }> = [];

  for (const trip of driverTrips) {
    const pod = podByTripId.get(trip.id);
    if (pod) {
      capturedItems.push({ trip, pod });
    } else {
      awaitingTrips.push(trip);
    }
  }

  // Sort awaiting by delivery date ascending (oldest first)
  awaitingTrips.sort((a, b) => {
    const aDate = new Date(getDeliveryDate(a)).getTime();
    const bDate = new Date(getDeliveryDate(b)).getTime();
    return aDate - bDate;
  });

  // Sort captured by POD timestamp descending (most recent first)
  capturedItems.sort((a, b) => {
    const aTime = new Date(a.pod.timestamp).getTime();
    const bTime = new Date(b.pod.timestamp).getTime();
    return bTime - aTime;
  });

  return {
    pendingCount: awaitingTrips.length,
    capturedCount: capturedItems.length,
    awaitingTrips,
    capturedItems,
  };
}
