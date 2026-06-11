import type { Helper, Driver, Vehicle, Trip, PayrollSummary } from "@/lib/types";

/**
 * Applies default values to a helper's optional performance fields.
 * Ensures backward compatibility for records missing the new fields.
 */
export function applyHelperDefaults(
  helper: Helper
): Helper & { rating: number; onTimePercent: number; totalTrips: number } {
  return {
    ...helper,
    rating: helper.rating ?? 0,
    onTimePercent: helper.onTimePercent ?? 100,
    totalTrips: helper.totalTrips ?? 0,
  };
}

/**
 * Computes status-based counts from an array of helpers.
 */
export function computeHelperCounts(helpers: Helper[]): {
  total: number;
  active: number;
  off_duty: number;
  on_leave: number;
} {
  let active = 0;
  let off_duty = 0;
  let on_leave = 0;

  for (const h of helpers) {
    if (h.status === "active") active++;
    else if (h.status === "off_duty") off_duty++;
    else if (h.status === "on_leave") on_leave++;
  }

  return { total: helpers.length, active, off_duty, on_leave };
}

/**
 * Formats a numeric rating to one decimal place (e.g., "4.0", "3.7").
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Returns the trip count for a helper.
 * Uses helper.totalTrips if > 0, otherwise falls back to tripCountMap lookup.
 */
export function getHelperTripCount(
  helper: Helper,
  tripCountMap: Record<string, number>
): number {
  const totalTrips = helper.totalTrips ?? 0;
  if (totalTrips > 0) {
    return totalTrips;
  }
  return tripCountMap[helper.id] ?? 0;
}

/**
 * Resolves a helper's vehicle through the driver assignment chain:
 * helper.assignedDriverId → driver → driver.assignedVehicleId → vehicle
 */
export function resolveHelperVehicle(
  helper: Helper,
  drivers: Driver[],
  vehicles: Vehicle[]
): { driver?: Driver; vehicle?: Vehicle } {
  if (!helper.assignedDriverId) {
    return {};
  }

  const driver = drivers.find((d) => d.id === helper.assignedDriverId);
  if (!driver) {
    return {};
  }

  if (!driver.assignedVehicleId) {
    return { driver };
  }

  const vehicle = vehicles.find((v) => v.id === driver.assignedVehicleId);
  return { driver, vehicle };
}

/**
 * Filters helpers by search string and status filter using AND logic.
 * Search matches case-insensitively against name and phone.
 * Status filter of "all" skips status matching.
 */
export function filterHelpers(
  helpers: Helper[],
  search: string,
  statusFilter: string
): Helper[] {
  const searchLower = search.toLowerCase().trim();

  return helpers.filter((helper) => {
    // Search match: name or phone contains the search string (case-insensitive)
    const matchesSearch =
      searchLower === "" ||
      helper.name.toLowerCase().includes(searchLower) ||
      helper.phone.toLowerCase().includes(searchLower);

    // Status match: "all" passes everything, otherwise exact match
    const matchesStatus =
      statusFilter === "all" || helper.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Returns trips for a given helper, sorted by date descending (newest first).
 * Uses scheduledDate (pickup.scheduledAt) or createdAt for sorting.
 */
export function getHelperTrips(trips: Trip[], helperId: string): Trip[] {
  return trips
    .filter((t) => t.helperId === helperId)
    .sort((a, b) => {
      const dateA = a.pickup?.scheduledAt || a.createdAt;
      const dateB = b.pickup?.scheduledAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Finds the first active trip for a given helper.
 * Active statuses: "in_transit", "loaded", "vehicle_dispatched", "driver_assigned"
 */
export function findActiveTrip(
  trips: Trip[],
  helperId: string
): Trip | undefined {
  const activeStatuses = [
    "in_transit",
    "loaded",
    "vehicle_dispatched",
    "driver_assigned",
  ] as const;

  return trips.find(
    (t) =>
      t.helperId === helperId &&
      activeStatuses.includes(t.status as (typeof activeStatuses)[number])
  );
}

/**
 * Computes the total earned from payroll summaries (sum of netPay for paid summaries).
 */
export function computeTotalEarned(summaries: PayrollSummary[]): number {
  return summaries.reduce((sum, s) => {
    if (s.status === "paid") {
      return sum + s.netPay;
    }
    return sum;
  }, 0);
}

/**
 * Computes progress bar width as a percentage, clamped to [0, 100].
 * Returns 0 when max <= 0.
 */
export function computeProgressWidth(value: number, max: number): number {
  if (max <= 0) return 0;
  const raw = (value / max) * 100;
  return Math.max(0, Math.min(100, raw));
}
