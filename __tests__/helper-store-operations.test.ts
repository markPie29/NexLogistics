import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import type { Helper } from "@/lib/types";

// ─── localStorage mock (must be set before Zustand persist middleware loads) ──

const storage: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (index: number) => Object.keys(storage)[index] ?? null,
};

// Attach to globalThis so Zustand's persist picks it up
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// Now import the store (after localStorage is available)
const { useHelperStore } = await import("@/lib/store/helpers");

// ─── Generators ───────────────────────────────────────────────────────────────

const helperStatusArb = fc.constantFrom(
  "active" as const,
  "off_duty" as const,
  "on_leave" as const
);

const employmentTypeArb = fc.constantFrom(
  "per_trip" as const,
  "monthly" as const,
  "hybrid" as const
);

/** Generate a full Helper object with all fields populated */
const helperArb: fc.Arbitrary<Helper> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  status: helperStatusArb,
  assignedDriverId: fc.option(fc.uuid(), { nil: undefined }),
  hireDate: fc.option(fc.constant("2024-01-15"), { nil: undefined }),
  address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  emergencyContact: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  photoUrl: fc.option(fc.constant("https://example.com/photo.jpg"), { nil: undefined }),
  employmentType: fc.option(employmentTypeArb, { nil: undefined }),
  monthlyBaseSalary: fc.option(fc.float({ min: 0, max: 50000, noNaN: true }), { nil: undefined }),
  baseRatePerTrip: fc.option(fc.float({ min: 0, max: 5000, noNaN: true }), { nil: undefined }),
  ratePerKm: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  commissionPercent: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  createdAt: fc.constant("2024-01-01T00:00:00Z"),
  rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true }), { nil: undefined }),
  onTimePercent: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  totalTrips: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
}) as fc.Arbitrary<Helper>;

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("Feature: helper-management-redesign, Property 7: Status change updates store", () => {
  /**
   * **Validates: Requirements 6.1, 6.2**
   *
   * For any Helper and any target status different from the helper's current status,
   * after a status change operation the helper's status field in the store SHALL equal
   * the target status, and all other fields SHALL remain unchanged.
   */

  beforeEach(() => {
    useHelperStore.setState({ helpers: [] });
  });

  it("status field changes to new value, all other fields preserved", () => {
    fc.assert(
      fc.property(
        helperArb,
        helperStatusArb,
        (helper, newStatus) => {
          // Only test when the new status differs from current
          fc.pre(newStatus !== helper.status);

          // Set up the store with the helper
          useHelperStore.setState({ helpers: [helper] });

          // Perform the status change via updateHelper
          useHelperStore.getState().updateHelper(helper.id, { status: newStatus });

          // Get the updated helper from the store
          const updatedHelper = useHelperStore.getState().helpers.find(
            (h) => h.id === helper.id
          );

          // Helper should still exist
          expect(updatedHelper).toBeDefined();

          // Status should be the new status
          expect(updatedHelper!.status).toBe(newStatus);

          // All other fields should remain unchanged
          expect(updatedHelper!.id).toBe(helper.id);
          expect(updatedHelper!.name).toBe(helper.name);
          expect(updatedHelper!.phone).toBe(helper.phone);
          expect(updatedHelper!.email).toBe(helper.email);
          expect(updatedHelper!.assignedDriverId).toBe(helper.assignedDriverId);
          expect(updatedHelper!.hireDate).toBe(helper.hireDate);
          expect(updatedHelper!.address).toBe(helper.address);
          expect(updatedHelper!.emergencyContact).toBe(helper.emergencyContact);
          expect(updatedHelper!.photoUrl).toBe(helper.photoUrl);
          expect(updatedHelper!.employmentType).toBe(helper.employmentType);
          expect(updatedHelper!.monthlyBaseSalary).toBe(helper.monthlyBaseSalary);
          expect(updatedHelper!.baseRatePerTrip).toBe(helper.baseRatePerTrip);
          expect(updatedHelper!.ratePerKm).toBe(helper.ratePerKm);
          expect(updatedHelper!.commissionPercent).toBe(helper.commissionPercent);
          expect(updatedHelper!.notes).toBe(helper.notes);
          expect(updatedHelper!.createdAt).toBe(helper.createdAt);
          expect(updatedHelper!.rating).toBe(helper.rating);
          expect(updatedHelper!.onTimePercent).toBe(helper.onTimePercent);
          expect(updatedHelper!.totalTrips).toBe(helper.totalTrips);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("does not affect other helpers in the store", () => {
    fc.assert(
      fc.property(
        fc.array(helperArb, { minLength: 2, maxLength: 10 }),
        helperStatusArb,
        (helpers, newStatus) => {
          // Ensure unique IDs
          const uniqueHelpers = helpers.map((h, i) => ({ ...h, id: `helper-${i}` }));

          // Pick the first helper as the target
          const target = uniqueHelpers[0];
          fc.pre(newStatus !== target.status);

          // Set up store
          useHelperStore.setState({ helpers: uniqueHelpers });

          // Perform the status change
          useHelperStore.getState().updateHelper(target.id, { status: newStatus });

          const storeHelpers = useHelperStore.getState().helpers;

          // All other helpers should be completely unchanged
          for (let i = 1; i < uniqueHelpers.length; i++) {
            const storeHelper = storeHelpers.find((h) => h.id === uniqueHelpers[i].id);
            expect(storeHelper).toBeDefined();
            expect(storeHelper).toEqual(uniqueHelpers[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Feature: helper-management-redesign, Property 8: Delete removes helper", () => {
  /**
   * **Validates: Requirements 7.3**
   *
   * For any Helper in the store, after a confirmed delete operation,
   * the store SHALL no longer contain a helper with that ID,
   * and all other helpers SHALL remain unchanged with their original data.
   */

  beforeEach(() => {
    useHelperStore.setState({ helpers: [] });
  });

  it("deleted helper is no longer in the store", () => {
    fc.assert(
      fc.property(
        helperArb,
        (helper) => {
          // Set up the store with the helper
          useHelperStore.setState({ helpers: [helper] });

          // Delete the helper
          useHelperStore.getState().deleteHelper(helper.id);

          // The store should not contain the deleted helper
          const remaining = useHelperStore.getState().helpers;
          const found = remaining.find((h) => h.id === helper.id);
          expect(found).toBeUndefined();
          expect(remaining.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all other helpers remain unchanged after deletion", () => {
    fc.assert(
      fc.property(
        fc.array(helperArb, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        (helpers, indexSeed) => {
          // Ensure unique IDs
          const uniqueHelpers = helpers.map((h, i) => ({ ...h, id: `helper-${i}` }));

          // Pick one to delete
          const deleteIndex = indexSeed % uniqueHelpers.length;
          const helperToDelete = uniqueHelpers[deleteIndex];

          // Set up store
          useHelperStore.setState({ helpers: [...uniqueHelpers] });

          // Delete the selected helper
          useHelperStore.getState().deleteHelper(helperToDelete.id);

          const remaining = useHelperStore.getState().helpers;

          // Deleted helper should not be found
          expect(remaining.find((h) => h.id === helperToDelete.id)).toBeUndefined();

          // Remaining count should be one less
          expect(remaining.length).toBe(uniqueHelpers.length - 1);

          // All other helpers should be completely unchanged
          for (let i = 0; i < uniqueHelpers.length; i++) {
            if (i === deleteIndex) continue;
            const storeHelper = remaining.find((h) => h.id === uniqueHelpers[i].id);
            expect(storeHelper).toBeDefined();
            expect(storeHelper).toEqual(uniqueHelpers[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("deleting a non-existent ID does not affect existing helpers", () => {
    fc.assert(
      fc.property(
        fc.array(helperArb, { minLength: 1, maxLength: 10 }),
        (helpers) => {
          // Ensure unique IDs
          const uniqueHelpers = helpers.map((h, i) => ({ ...h, id: `helper-${i}` }));

          // Set up store
          useHelperStore.setState({ helpers: [...uniqueHelpers] });

          // Try to delete a non-existent helper
          useHelperStore.getState().deleteHelper("non-existent-id");

          const remaining = useHelperStore.getState().helpers;

          // All helpers should remain unchanged
          expect(remaining.length).toBe(uniqueHelpers.length);
          for (let i = 0; i < uniqueHelpers.length; i++) {
            const storeHelper = remaining.find((h) => h.id === uniqueHelpers[i].id);
            expect(storeHelper).toBeDefined();
            expect(storeHelper).toEqual(uniqueHelpers[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
