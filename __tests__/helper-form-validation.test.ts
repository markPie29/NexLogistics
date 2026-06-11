import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { z } from "zod";

// ─── Schema (mirrors AddHelperSheet zod schema) ──────────────────────────────

const helperSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  status: z.enum(["active", "off_duty", "on_leave"]),
  assignedDriverId: z.string().optional(),
  employmentType: z.enum(["per_trip", "monthly", "hybrid"]),
  monthlyBaseSalary: z.number().min(0).optional(),
  baseRatePerTrip: z.number().min(0).optional(),
  ratePerKm: z.number().min(0).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Generators ──────────────────────────────────────────────────────────────

const statusArb = fc.constantFrom(
  "active" as const,
  "off_duty" as const,
  "on_leave" as const
);

const employmentTypeArb = fc.constantFrom(
  "per_trip" as const,
  "monthly" as const,
  "hybrid" as const
);

/** Generate a valid form data object (non-empty name and phone, valid other fields) */
const validFormDataArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  phone: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.constantFrom("", "user@example.com", "test@test.org"),
  address: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  emergencyContact: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  status: statusArb,
  assignedDriverId: fc.option(fc.uuid(), { nil: undefined }),
  employmentType: employmentTypeArb,
  monthlyBaseSalary: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), { nil: undefined }),
  baseRatePerTrip: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
  ratePerKm: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
  commissionPercent: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
});

/** Generate form data with an empty name */
const emptyNameFormDataArb = validFormDataArb.map((data) => ({
  ...data,
  name: "",
}));

/** Generate form data with an empty phone */
const emptyPhoneFormDataArb = validFormDataArb.map((data) => ({
  ...data,
  phone: "",
}));

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Feature: helper-management-redesign, Property 9: Form validation rejects empty required fields", () => {
  /**
   * **Validates: Requirements 8.5**
   *
   * For any form submission where the name field is empty,
   * the validation function SHALL return at least one error.
   */
  it("rejects any form data where name is empty", () => {
    fc.assert(
      fc.property(emptyNameFormDataArb, (formData) => {
        const result = helperSchema.safeParse(formData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const nameErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "name"
          );
          expect(nameErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.5**
   *
   * For any form submission where the phone field is empty,
   * the validation function SHALL return at least one error.
   */
  it("rejects any form data where phone is empty", () => {
    fc.assert(
      fc.property(emptyPhoneFormDataArb, (formData) => {
        const result = helperSchema.safeParse(formData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const phoneErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "phone"
          );
          expect(phoneErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 8.5**
   *
   * For any valid form data (non-empty name and phone, valid other fields),
   * the validation function SHALL pass.
   */
  it("accepts any form data with non-empty name and phone and valid fields", () => {
    fc.assert(
      fc.property(validFormDataArb, (formData) => {
        const result = helperSchema.safeParse(formData);

        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
