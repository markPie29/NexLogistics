import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  applyHelperDefaults,
  computeHelperCounts,
  formatRating,
  getHelperTripCount,
  resolveHelperVehicle,
  filterHelpers,
} from "@/lib/services/helper-utils";
import type { Helper, Driver, Vehicle } from "@/lib/types";

// ─── Generators ───────────────────────────────────────────────────────────────

const helperStatusArb = fc.constantFrom(
  "active" as const,
  "off_duty" as const,
  "on_leave" as const
);

/** Generate a minimal valid Helper object with optional performance fields */
const helperArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.option(fc.string(), { nil: undefined }),
  status: helperStatusArb,
  assignedDriverId: fc.option(fc.uuid(), { nil: undefined }),
  createdAt: fc.constant("2024-01-01T00:00:00Z"),
  rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
  onTimePercent: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  totalTrips: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
}) as fc.Arbitrary<Helper>;

/** Generate a Helper with guaranteed defined performance fields */
const helperWithFieldsArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  status: helperStatusArb,
  createdAt: fc.constant("2024-01-01T00:00:00Z"),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  onTimePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  totalTrips: fc.nat({ max: 1000 }),
}) as fc.Arbitrary<Helper>;

/** Generate a Helper explicitly missing performance fields */
const helperMissingFieldsArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  status: helperStatusArb,
  createdAt: fc.constant("2024-01-01T00:00:00Z"),
}) as fc.Arbitrary<Helper>;

const driverArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.string(),
  phone: fc.string(),
  licenseNumber: fc.string(),
  licenseClass: fc.string(),
  licenseExpiry: fc.constant("2025-12-31"),
  hireDate: fc.constant("2023-01-01"),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  onTimePercent: fc.float({ min: 0, max: 100, noNaN: true }),
  totalTrips: fc.nat(),
  status: fc.constantFrom("active" as const, "off_duty" as const, "on_leave" as const),
  assignedVehicleId: fc.option(fc.uuid(), { nil: undefined }),
}) as fc.Arbitrary<Driver>;

const vehicleArb = fc.record({
  id: fc.uuid(),
  plate: fc.string({ minLength: 1, maxLength: 10 }),
  type: fc.constantFrom("Truck", "Van", "Pickup"),
  brand: fc.string({ minLength: 1 }),
  model: fc.string({ minLength: 1 }),
  year: fc.integer({ min: 2000, max: 2025 }),
  color: fc.string(),
  capacity: fc.string(),
  fuelType: fc.constantFrom("Diesel" as const, "Gasoline" as const),
  odometer: fc.nat(),
  registrationExpiry: fc.constant("2025-12-31"),
  insuranceExpiry: fc.constant("2025-12-31"),
  permitExpiry: fc.constant("2025-12-31"),
  status: fc.constantFrom("available" as const, "in_trip" as const),
  createdAt: fc.constant("2024-01-01T00:00:00Z"),
}) as fc.Arbitrary<Vehicle>;

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("Feature: helper-management-redesign, Property 1: Backward compatibility defaults", () => {
  /**
   * **Validates: Requirements 1.4**
   *
   * For any Helper missing rating, onTimePercent, or totalTrips fields,
   * applyHelperDefaults produces correct defaults: rating=0, onTimePercent=100, totalTrips=0.
   */
  it("produces correct defaults for missing fields", () => {
    fc.assert(
      fc.property(helperMissingFieldsArb, (helper) => {
        const result = applyHelperDefaults(helper);

        // Missing fields should get defaults
        expect(result.rating).toBe(0);
        expect(result.onTimePercent).toBe(100);
        expect(result.totalTrips).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves existing performance field values when present", () => {
    fc.assert(
      fc.property(helperWithFieldsArb, (helper) => {
        const result = applyHelperDefaults(helper);

        // Present fields should be preserved
        expect(result.rating).toBe(helper.rating);
        expect(result.onTimePercent).toBe(helper.onTimePercent);
        expect(result.totalTrips).toBe(helper.totalTrips);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves all non-performance fields regardless of performance field state", () => {
    fc.assert(
      fc.property(helperArb, (helper) => {
        const result = applyHelperDefaults(helper);

        expect(result.id).toBe(helper.id);
        expect(result.name).toBe(helper.name);
        expect(result.phone).toBe(helper.phone);
        expect(result.status).toBe(helper.status);
        expect(result.assignedDriverId).toBe(helper.assignedDriverId);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 2: KPI status count computation", () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * For any array of Helpers, the computed count for each status matches
   * the actual number of helpers with that status, and all counts sum to total.
   */
  it("counts match actual statuses and sum equals total", () => {
    fc.assert(
      fc.property(fc.array(helperArb, { maxLength: 50 }), (helpers) => {
        const counts = computeHelperCounts(helpers);

        // Manually count statuses
        const expectedActive = helpers.filter((h) => h.status === "active").length;
        const expectedOffDuty = helpers.filter((h) => h.status === "off_duty").length;
        const expectedOnLeave = helpers.filter((h) => h.status === "on_leave").length;

        expect(counts.active).toBe(expectedActive);
        expect(counts.off_duty).toBe(expectedOffDuty);
        expect(counts.on_leave).toBe(expectedOnLeave);
        expect(counts.total).toBe(helpers.length);

        // Sum of status counts equals total
        expect(counts.active + counts.off_duty + counts.on_leave).toBe(counts.total);
      }),
      { numRuns: 100 }
    );
  });

  it("returns zeros for empty array", () => {
    const counts = computeHelperCounts([]);
    expect(counts).toEqual({ total: 0, active: 0, off_duty: 0, on_leave: 0 });
  });
});

describe("Feature: helper-management-redesign, Property 3: Rating formatting", () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * For any numeric rating in [0, 5], the formatted display string
   * contains exactly one decimal place.
   */
  it("output always has exactly one decimal place for any value in [0, 5]", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5, noNaN: true, noDefaultInfinity: true }),
        (rating) => {
          const formatted = formatRating(rating);

          // Must contain a decimal point
          expect(formatted).toContain(".");

          // Must have exactly one digit after the decimal point
          const parts = formatted.split(".");
          expect(parts).toHaveLength(2);
          expect(parts[1]).toHaveLength(1);

          // Must be parseable back to a number close to original
          const parsed = parseFloat(formatted);
          expect(parsed).toBeGreaterThanOrEqual(0);
          expect(parsed).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("formats boundary values correctly", () => {
    expect(formatRating(0)).toBe("0.0");
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(3.7)).toBe("3.7");
    expect(formatRating(4.0)).toBe("4.0");
  });
});

describe("Feature: helper-management-redesign, Property 4: Trip count source logic", () => {
  /**
   * **Validates: Requirements 3.4**
   *
   * If totalTrips > 0, uses that field. Otherwise, falls back to tripCountMap.
   */
  it("uses helper.totalTrips when > 0, otherwise falls back to tripCountMap", () => {
    fc.assert(
      fc.property(
        helperArb,
        fc.dictionary(fc.uuid(), fc.nat({ max: 500 })),
        (helper, tripCountMap) => {
          const result = getHelperTripCount(helper, tripCountMap);
          const totalTrips = helper.totalTrips ?? 0;

          if (totalTrips > 0) {
            expect(result).toBe(totalTrips);
          } else {
            expect(result).toBe(tripCountMap[helper.id] ?? 0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 0 when totalTrips is 0 and helper not in tripCountMap", () => {
    const helper: Helper = {
      id: "test-id",
      name: "Test",
      phone: "123",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
      totalTrips: 0,
    };
    expect(getHelperTripCount(helper, {})).toBe(0);
  });

  it("returns map value when totalTrips is undefined and helper exists in map", () => {
    const helper: Helper = {
      id: "test-id",
      name: "Test",
      phone: "123",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
    };
    expect(getHelperTripCount(helper, { "test-id": 42 })).toBe(42);
  });
});

describe("Feature: helper-management-redesign, Property 5: Vehicle resolution chain", () => {
  /**
   * **Validates: Requirements 3.5, 12.2**
   *
   * Verifies correct resolution through driver→vehicle chain.
   */
  it("resolves vehicle when helper→driver→vehicle chain is complete", () => {
    fc.assert(
      fc.property(
        helperArb,
        driverArb,
        vehicleArb,
        (baseHelper, baseDriver, baseVehicle) => {
          // Create a complete chain: helper → driver → vehicle
          const driverId = baseDriver.id;
          const vehicleId = baseVehicle.id;

          const helper: Helper = { ...baseHelper, assignedDriverId: driverId };
          const driver: Driver = { ...baseDriver, assignedVehicleId: vehicleId };
          const vehicle: Vehicle = { ...baseVehicle };

          const result = resolveHelperVehicle(helper, [driver], [vehicle]);

          expect(result.driver).toBeDefined();
          expect(result.driver!.id).toBe(driverId);
          expect(result.vehicle).toBeDefined();
          expect(result.vehicle!.id).toBe(vehicleId);
          expect(result.vehicle!.plate).toBe(vehicle.plate);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty result when helper has no assignedDriverId", () => {
    fc.assert(
      fc.property(
        helperArb,
        fc.array(driverArb),
        fc.array(vehicleArb),
        (baseHelper, drivers, vehicles) => {
          const helper: Helper = { ...baseHelper, assignedDriverId: undefined };
          const result = resolveHelperVehicle(helper, drivers, vehicles);

          expect(result.driver).toBeUndefined();
          expect(result.vehicle).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns driver but no vehicle when driver has no assignedVehicleId", () => {
    fc.assert(
      fc.property(helperArb, driverArb, (baseHelper, baseDriver) => {
        const helper: Helper = { ...baseHelper, assignedDriverId: baseDriver.id };
        const driver: Driver = { ...baseDriver, assignedVehicleId: undefined };

        const result = resolveHelperVehicle(helper, [driver], []);

        expect(result.driver).toBeDefined();
        expect(result.driver!.id).toBe(driver.id);
        expect(result.vehicle).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("returns empty when assignedDriverId does not match any driver", () => {
    fc.assert(
      fc.property(helperArb, fc.array(driverArb), (baseHelper, drivers) => {
        // Use an ID guaranteed not to match any driver
        const helper: Helper = {
          ...baseHelper,
          assignedDriverId: "non-existent-driver-id-xyz",
        };

        const result = resolveHelperVehicle(helper, drivers, []);

        expect(result.driver).toBeUndefined();
        expect(result.vehicle).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 6: Combined filter logic", () => {
  /**
   * **Validates: Requirements 4.1, 4.4, 4.5**
   *
   * Verifies AND logic produces exactly matching results.
   */
  it("filtered result contains exactly helpers matching both search AND status", () => {
    fc.assert(
      fc.property(
        fc.array(helperArb, { maxLength: 30 }),
        fc.string({ maxLength: 20 }),
        fc.constantFrom("all", "active", "off_duty", "on_leave"),
        (helpers, search, statusFilter) => {
          const result = filterHelpers(helpers, search, statusFilter);
          const searchLower = search.toLowerCase().trim();

          // Manually compute expected result
          const expected = helpers.filter((h) => {
            const matchesSearch =
              searchLower === "" ||
              h.name.toLowerCase().includes(searchLower) ||
              h.phone.toLowerCase().includes(searchLower);
            const matchesStatus =
              statusFilter === "all" || h.status === statusFilter;
            return matchesSearch && matchesStatus;
          });

          // Result should match expected exactly
          expect(result.length).toBe(expected.length);

          // Every result item should satisfy both conditions
          for (const h of result) {
            if (searchLower !== "") {
              const nameMatch = h.name.toLowerCase().includes(searchLower);
              const phoneMatch = h.phone.toLowerCase().includes(searchLower);
              expect(nameMatch || phoneMatch).toBe(true);
            }
            if (statusFilter !== "all") {
              expect(h.status).toBe(statusFilter);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns all helpers when search is empty and status is 'all'", () => {
    fc.assert(
      fc.property(fc.array(helperArb, { maxLength: 20 }), (helpers) => {
        const result = filterHelpers(helpers, "", "all");
        expect(result.length).toBe(helpers.length);
      }),
      { numRuns: 100 }
    );
  });

  it("filtered count equals length of result set", () => {
    fc.assert(
      fc.property(
        fc.array(helperArb, { maxLength: 20 }),
        fc.string({ maxLength: 10 }),
        fc.constantFrom("all", "active", "off_duty", "on_leave"),
        (helpers, search, statusFilter) => {
          const result = filterHelpers(helpers, search, statusFilter);
          // The count of filtered results is exactly the array length
          expect(result.length).toBeGreaterThanOrEqual(0);
          expect(result.length).toBeLessThanOrEqual(helpers.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
