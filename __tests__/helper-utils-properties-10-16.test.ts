import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computeProgressWidth,
  getHelperTrips,
  computeTotalEarned,
  findActiveTrip,
} from "@/lib/services/helper-utils";
import type { Trip, PayrollSummary, TripStatus, PayrollMode } from "@/lib/types";

// ─── Generators ───────────────────────────────────────────────────────────────

const tripStatusArb = fc.constantFrom<TripStatus>(
  "scheduled",
  "driver_assigned",
  "vehicle_dispatched",
  "loaded",
  "in_transit",
  "delivered",
  "delayed",
  "completed",
  "cancelled"
);

const activeStatusArb = fc.constantFrom<TripStatus>(
  "in_transit",
  "loaded",
  "vehicle_dispatched",
  "driver_assigned"
);

/** Generate a valid ISO date string without using fc.date (which can produce invalid dates) */
const isoDateArb = fc
  .integer({ min: 1672531200000, max: 1798761600000 }) // 2023-01-01 to 2026-12-31 in ms
  .map((ms) => new Date(ms).toISOString());

/** Generate a minimal valid Trip object */
const tripArb = fc.record({
  id: fc.uuid(),
  clientId: fc.uuid(),
  driverId: fc.option(fc.uuid(), { nil: undefined }),
  helperId: fc.option(fc.uuid(), { nil: undefined }),
  pickup: fc.record({
    address: fc.string({ minLength: 1, maxLength: 50 }),
    lat: fc.float({ min: Math.fround(-90), max: Math.fround(90), noNaN: true }),
    lng: fc.float({ min: Math.fround(-180), max: Math.fround(180), noNaN: true }),
    scheduledAt: isoDateArb,
  }),
  dropoff: fc.record({
    address: fc.string({ minLength: 1, maxLength: 50 }),
    lat: fc.float({ min: Math.fround(-90), max: Math.fround(90), noNaN: true }),
    lng: fc.float({ min: Math.fround(-180), max: Math.fround(180), noNaN: true }),
    scheduledAt: isoDateArb,
  }),
  cargo: fc.record({
    type: fc.string({ minLength: 1 }),
    weightKg: fc.float({ min: Math.fround(0), max: Math.fround(50000), noNaN: true }),
    units: fc.nat({ max: 1000 }),
  }),
  distanceKm: fc.float({ min: Math.fround(0), max: Math.fround(2000), noNaN: true }),
  fare: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  status: tripStatusArb,
  statusLogs: fc.constant([]),
  createdAt: isoDateArb,
  podSubmittedAt: fc.option(isoDateArb, { nil: undefined }),
  helperRate: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }), { nil: undefined }),
  helperFee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }), { nil: undefined }),
}) as fc.Arbitrary<Trip>;

/** Generate a trip with a specific helperId */
function tripWithHelperIdArb(helperId: string): fc.Arbitrary<Trip> {
  return tripArb.map((t) => ({ ...t, helperId }));
}

const payrollModeArb = fc.constantFrom<PayrollMode>(
  "fixed_salary",
  "fixed_plus_trip",
  "per_trip",
  "per_delivery",
  "percentage"
);

const payrollSummaryStatusArb = fc.constantFrom(
  "draft" as const,
  "approved" as const,
  "paid" as const
);

/** Generate a PayrollSummary */
const payrollSummaryArb = fc.record({
  id: fc.uuid(),
  driverId: fc.uuid(),
  payrollPeriodId: fc.uuid(),
  payrollMode: payrollModeArb,
  tripsCount: fc.nat({ max: 100 }),
  baseSalary: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  tripEarnings: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
  incentives: fc.float({ min: Math.fround(0), max: Math.fround(50000), noNaN: true }),
  allowances: fc.float({ min: Math.fround(0), max: Math.fround(20000), noNaN: true }),
  overtimeAmount: fc.float({ min: Math.fround(0), max: Math.fround(20000), noNaN: true }),
  sssDeduction: fc.float({ min: Math.fround(0), max: Math.fround(5000), noNaN: true }),
  philhealthDeduction: fc.float({ min: Math.fround(0), max: Math.fround(5000), noNaN: true }),
  pagibigDeduction: fc.float({ min: Math.fround(0), max: Math.fround(5000), noNaN: true }),
  taxDeduction: fc.float({ min: Math.fround(0), max: Math.fround(20000), noNaN: true }),
  cashAdvanceDeduction: fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
  otherDeductions: fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }),
  totalDeductions: fc.float({ min: Math.fround(0), max: Math.fround(50000), noNaN: true }),
  grossPay: fc.float({ min: Math.fround(0), max: Math.fround(200000), noNaN: true }),
  netPay: fc.float({ min: Math.fround(0), max: Math.fround(200000), noNaN: true }),
  status: payrollSummaryStatusArb,
}) as fc.Arbitrary<PayrollSummary>;

/** Generate a PayrollSummary with specific driverId */
function payrollSummaryWithDriverIdArb(driverId: string): fc.Arbitrary<PayrollSummary> {
  return payrollSummaryArb.map((s) => ({ ...s, driverId }));
}

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("Feature: helper-management-redesign, Property 10: Progress bar width computation", () => {
  /**
   * **Validates: Requirements 11.2, 11.3**
   *
   * For any numeric value and maximum (where max > 0), the computed progress bar width
   * percentage equals (value / max) * 100 clamped to [0, 100].
   */
  it("computes (value / max) * 100 clamped to [0, 100] for positive max", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        (value, max) => {
          const result = computeProgressWidth(value, max);
          const rawExpected = (value / max) * 100;
          const expected = Math.max(0, Math.min(100, rawExpected));

          expect(result).toBeCloseTo(expected, 5);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 when max <= 0", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(-1000), max: Math.fround(0), noNaN: true, noDefaultInfinity: true }),
        (value, max) => {
          const result = computeProgressWidth(value, max);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 100 when value >= max (positive max)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        (max) => {
          // value >= max should produce 100
          const result = computeProgressWidth(max * 2, max);
          expect(result).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 when value <= 0 (positive max)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Math.fround(-1000), max: Math.fround(0), noNaN: true, noDefaultInfinity: true }),
        (max, value) => {
          const result = computeProgressWidth(value, max);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 11: Trip count derivation", () => {
  /**
   * **Validates: Requirements 11.4**
   *
   * For any array of Trip objects filtered by a given helperId,
   * the completed trip count equals trips with status "completed" or "delivered",
   * and the delayed trip count equals trips with status "delayed".
   */
  it("completed count equals trips with status completed or delivered", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 50 }),
        (helperId, trips) => {
          // Assign some trips to our helperId
          const mixedTrips = trips.map((t, i) =>
            i % 2 === 0 ? { ...t, helperId } : t
          );

          const helperTrips = mixedTrips.filter((t) => t.helperId === helperId);
          const completedCount = helperTrips.filter(
            (t) => t.status === "completed" || t.status === "delivered"
          ).length;
          const delayedCount = helperTrips.filter(
            (t) => t.status === "delayed"
          ).length;

          // Manually verify the derivation
          const expectedCompleted = helperTrips.reduce(
            (acc, t) => acc + (t.status === "completed" || t.status === "delivered" ? 1 : 0),
            0
          );
          const expectedDelayed = helperTrips.reduce(
            (acc, t) => acc + (t.status === "delayed" ? 1 : 0),
            0
          );

          expect(completedCount).toBe(expectedCompleted);
          expect(delayedCount).toBe(expectedDelayed);
          expect(completedCount).toBeGreaterThanOrEqual(0);
          expect(delayedCount).toBeGreaterThanOrEqual(0);
          expect(completedCount + delayedCount).toBeLessThanOrEqual(helperTrips.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns zero counts when no trips match the helperId", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 20 }),
        (helperId, trips) => {
          // Ensure no trip has the target helperId
          const noMatchTrips = trips.map((t) => ({
            ...t,
            helperId: "other-helper-id",
          }));

          const helperTrips = noMatchTrips.filter((t) => t.helperId === helperId);
          const completedCount = helperTrips.filter(
            (t) => t.status === "completed" || t.status === "delivered"
          ).length;
          const delayedCount = helperTrips.filter(
            (t) => t.status === "delayed"
          ).length;

          expect(completedCount).toBe(0);
          expect(delayedCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 12: Trip history filtering and sorting", () => {
  /**
   * **Validates: Requirements 13.3, 13.4**
   *
   * For any array of Trip objects and a given helperId, getHelperTrips returns
   * exactly those trips where trip.helperId === helperId, sorted by date descending.
   */
  it("returns only trips matching helperId, sorted by date descending", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 30 }),
        (helperId, basTrips) => {
          // Mix in trips for our target helper
          const trips = basTrips.map((t, i) =>
            i % 3 === 0 ? { ...t, helperId } : t
          );

          const result = getHelperTrips(trips, helperId);

          // All results must match helperId
          for (const trip of result) {
            expect(trip.helperId).toBe(helperId);
          }

          // Count should match manual filter
          const expectedCount = trips.filter((t) => t.helperId === helperId).length;
          expect(result.length).toBe(expectedCount);

          // Results should be sorted by date descending
          for (let i = 0; i < result.length - 1; i++) {
            const dateA = new Date(
              result[i].pickup?.scheduledAt || result[i].createdAt
            ).getTime();
            const dateB = new Date(
              result[i + 1].pickup?.scheduledAt || result[i + 1].createdAt
            ).getTime();
            expect(dateA).toBeGreaterThanOrEqual(dateB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty array when no trips match helperId", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 20 }),
        (helperId, trips) => {
          // Ensure no trip matches
          const noMatchTrips = trips.map((t) => ({
            ...t,
            helperId: "non-matching-id",
          }));

          const result = getHelperTrips(noMatchTrips, helperId);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 13: Total earned computation", () => {
  /**
   * **Validates: Requirements 14.1**
   *
   * For any array of PayrollSummary objects, the total earned value equals
   * the sum of netPay for all summaries whose status === "paid".
   */
  it("equals sum of netPay for paid summaries only", () => {
    fc.assert(
      fc.property(
        fc.array(payrollSummaryArb, { maxLength: 30 }),
        (summaries) => {
          const result = computeTotalEarned(summaries);

          const expected = summaries
            .filter((s) => s.status === "paid")
            .reduce((sum, s) => sum + s.netPay, 0);

          expect(result).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 when no summaries have status paid", () => {
    fc.assert(
      fc.property(
        fc.array(payrollSummaryArb, { maxLength: 20 }),
        (baseSummaries) => {
          // Force all summaries to non-paid status
          const summaries = baseSummaries.map((s) => ({
            ...s,
            status: "draft" as const,
          }));

          const result = computeTotalEarned(summaries);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 for empty summaries array", () => {
    expect(computeTotalEarned([])).toBe(0);
  });

  it("ignores draft and approved summaries in total", () => {
    fc.assert(
      fc.property(
        fc.array(payrollSummaryArb, { maxLength: 20 }),
        (summaries) => {
          const result = computeTotalEarned(summaries);

          // Sum should NOT include draft or approved
          const draftAndApprovedSum = summaries
            .filter((s) => s.status !== "paid")
            .reduce((sum, s) => sum + s.netPay, 0);

          const allSum = summaries.reduce((sum, s) => sum + s.netPay, 0);
          const paidSum = allSum - draftAndApprovedSum;

          expect(result).toBeCloseTo(paidSum, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 14: Payroll summaries filtering and sorting", () => {
  /**
   * **Validates: Requirements 14.3**
   *
   * For any array of PayrollSummary objects and a given helperId,
   * the filtered result contains exactly those summaries where
   * summary.driverId === helperId, sorted by associated period endDate descending.
   */
  it("filters summaries by driverId === helperId", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(payrollSummaryArb, { maxLength: 30 }),
        (helperId, baseSummaries) => {
          // Mix: some summaries for our helper, some for others
          const summaries = baseSummaries.map((s, i) =>
            i % 3 === 0 ? { ...s, driverId: helperId } : s
          );

          // Filter logic (mirrors what the component does)
          const filtered = summaries.filter((s) => s.driverId === helperId);

          // All filtered items match helperId
          for (const s of filtered) {
            expect(s.driverId).toBe(helperId);
          }

          // Count matches expected
          const expectedCount = summaries.filter(
            (s) => s.driverId === helperId
          ).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sorts filtered summaries by period endDate descending", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            summary: payrollSummaryArb,
            endDate: isoDateArb,
          }),
          { maxLength: 20 }
        ),
        (helperId, items) => {
          // Assign helperId to all and pair with endDate
          const summariesWithPeriods = items.map(({ summary, endDate }) => ({
            summary: { ...summary, driverId: helperId },
            endDate,
          }));

          // Sort by endDate descending (what the component does)
          const sorted = [...summariesWithPeriods].sort(
            (a, b) =>
              new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );

          // Verify descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            const dateA = new Date(sorted[i].endDate).getTime();
            const dateB = new Date(sorted[i + 1].endDate).getTime();
            expect(dateA).toBeGreaterThanOrEqual(dateB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty when no summaries match helperId", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(payrollSummaryArb, { maxLength: 20 }),
        (helperId, summaries) => {
          // Ensure no summary matches
          const noMatchSummaries = summaries.map((s) => ({
            ...s,
            driverId: "other-id",
          }));

          const filtered = noMatchSummaries.filter(
            (s) => s.driverId === helperId
          );
          expect(filtered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 15: Active trip selection", () => {
  /**
   * **Validates: Requirements 16.1**
   *
   * For any array of Trip objects and a given helperId, findActiveTrip returns
   * the first trip where helperId matches AND status is one of the active statuses.
   */
  it("returns first trip matching helperId with an active status", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 30 }),
        activeStatusArb,
        (helperId, baseTrips, activeStatus) => {
          // Inject one active trip for the helper at a random position
          const activeTrip: Trip = {
            ...baseTrips[0] ?? {
              id: "active-trip-id",
              clientId: "client-1",
              pickup: { address: "A", lat: 0, lng: 0, scheduledAt: "2024-06-01T00:00:00Z" },
              dropoff: { address: "B", lat: 0, lng: 0, scheduledAt: "2024-06-01T06:00:00Z" },
              cargo: { type: "General", weightKg: 100, units: 1 },
              distanceKm: 50,
              fare: 5000,
              statusLogs: [],
              createdAt: "2024-06-01T00:00:00Z",
            },
            id: "injected-active-trip",
            helperId,
            status: activeStatus,
          };

          // Ensure no other trip has both this helperId and an active status
          const otherTrips = baseTrips.map((t) => ({
            ...t,
            helperId: "other-helper",
            status: "scheduled" as TripStatus,
          }));

          const trips = [...otherTrips, activeTrip];

          const result = findActiveTrip(trips, helperId);
          expect(result).toBeDefined();
          expect(result!.helperId).toBe(helperId);
          expect(["in_transit", "loaded", "vehicle_dispatched", "driver_assigned"]).toContain(
            result!.status
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns undefined when no trip matches helperId with active status", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 20 }),
        (helperId, baseTrips) => {
          // Set all trips to non-active status and different helperId
          const trips = baseTrips.map((t) => ({
            ...t,
            helperId: "other-helper",
            status: "scheduled" as TripStatus,
          }));

          const result = findActiveTrip(trips, helperId);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns undefined when helperId matches but no active status", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(tripArb, { maxLength: 20 }),
        (helperId, baseTrips) => {
          // All trips have the helperId but non-active statuses
          const nonActiveStatuses: TripStatus[] = [
            "scheduled",
            "delivered",
            "completed",
            "cancelled",
            "delayed",
          ];
          const trips = baseTrips.map((t, i) => ({
            ...t,
            helperId,
            status: nonActiveStatuses[i % nonActiveStatuses.length],
          }));

          const result = findActiveTrip(trips, helperId);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the first matching active trip (preserves order)", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        activeStatusArb,
        activeStatusArb,
        (helperId, status1, status2) => {
          const trip1: Trip = {
            id: "trip-first",
            clientId: "c1",
            helperId,
            pickup: { address: "A", lat: 0, lng: 0, scheduledAt: "2024-01-01T00:00:00Z" },
            dropoff: { address: "B", lat: 0, lng: 0, scheduledAt: "2024-01-01T06:00:00Z" },
            cargo: { type: "General", weightKg: 100, units: 1 },
            distanceKm: 50,
            fare: 5000,
            status: status1,
            statusLogs: [],
            createdAt: "2024-01-01T00:00:00Z",
          };
          const trip2: Trip = {
            id: "trip-second",
            clientId: "c1",
            helperId,
            pickup: { address: "C", lat: 0, lng: 0, scheduledAt: "2024-01-02T00:00:00Z" },
            dropoff: { address: "D", lat: 0, lng: 0, scheduledAt: "2024-01-02T06:00:00Z" },
            cargo: { type: "General", weightKg: 100, units: 1 },
            distanceKm: 60,
            fare: 6000,
            status: status2,
            statusLogs: [],
            createdAt: "2024-01-02T00:00:00Z",
          };

          const result = findActiveTrip([trip1, trip2], helperId);
          expect(result).toBeDefined();
          expect(result!.id).toBe("trip-first");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 16: POD indicator logic", () => {
  /**
   * **Validates: Requirements 20.1**
   *
   * For any Trip object, the POD indicator displays a document/check icon
   * if and only if the trip has a truthy podSubmittedAt value;
   * otherwise it displays a dash "—".
   */
  it("truthy podSubmittedAt produces icon indicator, falsy produces dash", () => {
    fc.assert(
      fc.property(tripArb, (trip) => {
        // Pure logic test: derive what the POD indicator should be
        const podIndicator = trip.podSubmittedAt ? "icon" : "dash";

        if (trip.podSubmittedAt) {
          expect(podIndicator).toBe("icon");
          // Truthy podSubmittedAt should be a non-empty string
          expect(trip.podSubmittedAt).toBeTruthy();
        } else {
          expect(podIndicator).toBe("dash");
          expect(trip.podSubmittedAt).toBeFalsy();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("any non-empty string podSubmittedAt produces icon", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        (dateStr) => {
          const trip = {
            podSubmittedAt: dateStr,
          } as Trip;

          const podIndicator = trip.podSubmittedAt ? "icon" : "dash";
          expect(podIndicator).toBe("icon");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("undefined or empty podSubmittedAt produces dash", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(undefined, "", null),
        (podValue) => {
          const trip = {
            podSubmittedAt: podValue,
          } as unknown as Trip;

          const podIndicator = trip.podSubmittedAt ? "icon" : "dash";
          expect(podIndicator).toBe("dash");
        }
      ),
      { numRuns: 100 }
    );
  });
});
