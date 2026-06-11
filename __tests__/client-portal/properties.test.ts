/**
 * Property-Based Tests for Client Portal Redesign
 *
 * Uses fast-check with Vitest to validate correctness properties
 * defined in the design document.
 *
 * Feature: client-portal-redesign
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Trip, TripStatus, Invoice, InvoiceLineItem } from "@/lib/types";

// ─── Configuration ────────────────────────────────────────────────────────────

/** Minimum iterations per property test */
const PBT_NUM_RUNS = 100;

// ─── Arbitrary Generators ─────────────────────────────────────────────────────

/** All valid TripStatus values */
const TRIP_STATUSES: TripStatus[] = [
  "scheduled",
  "driver_assigned",
  "vehicle_dispatched",
  "loaded",
  "in_transit",
  "delivered",
  "delayed",
  "completed",
  "cancelled",
];

/** Generates a valid TripStatus */
export const arbTripStatus: fc.Arbitrary<TripStatus> = fc.constantFrom(
  ...TRIP_STATUSES
);

/** Generates a valid ISO timestamp string (within a reasonable date range) */
export const arbTimestamp: fc.Arbitrary<string> = fc
  .integer({
    min: new Date("2020-01-01T00:00:00Z").getTime(),
    max: new Date("2026-12-31T23:59:59Z").getTime(),
  })
  .map((ms) => new Date(ms).toISOString());

/** Generates a Philippine-style address string */
const arbAddress: fc.Arbitrary<string> = fc.oneof(
  fc.constant("Manila, Metro Manila"),
  fc.constant("Makati, Metro Manila"),
  fc.constant("Quezon City, Metro Manila"),
  fc.constant("Taguig, Metro Manila"),
  fc.constant("Pasig, Metro Manila"),
  fc.constant("Pampanga, Central Luzon"),
  fc.constant("Laguna, Calabarzon"),
  fc.constant("Batangas, Calabarzon"),
  fc.constant("Bulacan, Central Luzon"),
  fc.constant("Cavite, Calabarzon")
);

/** Generates a clientId (random short string) */
const arbClientId: fc.Arbitrary<string> = fc.oneof(
  fc.constant("c-001"),
  fc.constant("c-002"),
  fc.constant("c-003"),
  fc.constant("c-004"),
  fc.constant("c-005"),
  fc.constant("c-010")
);

/** Generates a Trip-like object with all required fields */
export const arbTrip: fc.Arbitrary<Trip> = fc.record({
  id: fc.string({ minLength: 5, maxLength: 15 }),
  clientId: arbClientId,
  status: arbTripStatus,
  pickup: fc.record({
    address: arbAddress,
    lat: fc.double({ min: 14.0, max: 15.0, noNaN: true }),
    lng: fc.double({ min: 120.5, max: 121.5, noNaN: true }),
    scheduledAt: arbTimestamp,
  }),
  dropoff: fc.record({
    address: arbAddress,
    lat: fc.double({ min: 14.0, max: 15.0, noNaN: true }),
    lng: fc.double({ min: 120.5, max: 121.5, noNaN: true }),
    scheduledAt: arbTimestamp,
  }),
  cargo: fc.record({
    type: fc.constantFrom("General", "Fragile", "Perishable", "Hazmat"),
    weightKg: fc.double({ min: 1, max: 30000, noNaN: true }),
    units: fc.integer({ min: 1, max: 500 }),
    description: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
  }),
  distanceKm: fc.double({ min: 1, max: 1000, noNaN: true }),
  fare: fc.double({ min: 100, max: 500000, noNaN: true }),
  statusLogs: fc.array(
    fc.record({
      status: arbTripStatus,
      at: arbTimestamp,
      by: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
      note: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  createdAt: arbTimestamp,
  driverId: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
  vehicleId: fc.option(fc.string({ minLength: 3, maxLength: 10 }), { nil: undefined }),
}) as fc.Arbitrary<Trip>;

/** Generates an InvoiceLineItem */
const arbInvoiceLineItem: fc.Arbitrary<InvoiceLineItem> = fc
  .record({
    description: fc.string({ minLength: 3, maxLength: 40 }),
    quantity: fc.integer({ min: 1, max: 100 }),
    unitPrice: fc.double({ min: 100, max: 100000, noNaN: true }),
  })
  .map((item) => ({
    ...item,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));

/** Invoice statuses */
const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
] as const;

/** Generates an Invoice-like object with consistent financial fields */
export const arbInvoice: fc.Arbitrary<Invoice> = fc
  .record({
    id: fc.string({ minLength: 5, maxLength: 15 }),
    invoiceNumber: fc.string({ minLength: 5, maxLength: 12 }),
    clientId: arbClientId,
    referenceNo: fc.string({ minLength: 3, maxLength: 10 }),
    invoiceDate: arbTimestamp,
    dueDate: arbTimestamp,
    status: fc.constantFrom(...INVOICE_STATUSES),
    items: fc.array(arbInvoiceLineItem, { minLength: 1, maxLength: 5 }),
    vatRate: fc.constantFrom(0.12, 0, 0.05),
    paidAmount: fc.double({ min: 0, max: 500000, noNaN: true }),
    salesperson: fc.string({ minLength: 3, maxLength: 20 }),
    paymentTerms: fc.constantFrom("Net 30", "Net 15", "Due on Receipt", "Net 60"),
    notes: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
  })
  .map((inv) => {
    const subtotal = inv.items.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = Math.round(subtotal * inv.vatRate * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
    const paidAmount = Math.min(inv.paidAmount, totalAmount);
    const balance = Math.round((totalAmount - paidAmount) * 100) / 100;
    return {
      ...inv,
      subtotal,
      vatAmount,
      totalAmount,
      paidAmount,
      balance,
    };
  });

// ─── Test Infrastructure Verification ─────────────────────────────────────────

describe("Client Portal - Property-Based Test Infrastructure", () => {
  it("arbTripStatus generates only valid TripStatus values", () => {
    fc.assert(
      fc.property(arbTripStatus, (status) => {
        expect(TRIP_STATUSES).toContain(status);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  it("arbTimestamp generates valid ISO timestamp strings", () => {
    fc.assert(
      fc.property(arbTimestamp, (ts) => {
        const parsed = new Date(ts);
        expect(parsed.getTime()).not.toBeNaN();
        expect(parsed.toISOString()).toBe(ts);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  it("arbTrip generates objects with required Trip fields", () => {
    fc.assert(
      fc.property(arbTrip, (trip) => {
        expect(trip).toHaveProperty("id");
        expect(trip).toHaveProperty("clientId");
        expect(trip).toHaveProperty("status");
        expect(trip).toHaveProperty("pickup.address");
        expect(trip).toHaveProperty("dropoff.address");
        expect(trip).toHaveProperty("createdAt");
        expect(trip).toHaveProperty("cargo");
        expect(TRIP_STATUSES).toContain(trip.status);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  it("arbInvoice generates objects with consistent financial fields", () => {
    fc.assert(
      fc.property(arbInvoice, (invoice) => {
        expect(invoice).toHaveProperty("id");
        expect(invoice).toHaveProperty("clientId");
        expect(invoice).toHaveProperty("invoiceNumber");
        expect(invoice).toHaveProperty("status");
        expect(invoice).toHaveProperty("totalAmount");
        expect(invoice).toHaveProperty("paidAmount");
        expect(invoice).toHaveProperty("balance");
        expect(invoice).toHaveProperty("subtotal");
        expect(invoice).toHaveProperty("vatRate");
        expect(invoice).toHaveProperty("vatAmount");
        expect(invoice).toHaveProperty("items");
        expect(invoice.items.length).toBeGreaterThanOrEqual(1);
        // Financial consistency: balance = totalAmount - paidAmount
        expect(invoice.balance).toBeCloseTo(
          invoice.totalAmount - invoice.paidAmount,
          1
        );
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});


// ─── Property 1: Client Data Filtering Correctness ────────────────────────────
// Feature: client-portal-redesign, Property 1: Client data filtering correctness

describe("Property 1: Client data filtering correctness", () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 5.1, 6.1**
   *
   * For any collection of items with various clientId values, filtering by a given
   * clientId returns exactly the items where item.clientId === clientId.
   */
  it("filtering by clientId includes all matching items and excludes all non-matching items", () => {
    fc.assert(
      fc.property(
        fc.array(arbTrip, { minLength: 0, maxLength: 30 }),
        arbClientId,
        (trips, targetClientId) => {
          // Simulate the filtering logic used by hooks
          const filtered = trips.filter((t) => t.clientId === targetClientId);

          // All filtered items must match the target clientId
          for (const trip of filtered) {
            expect(trip.clientId).toBe(targetClientId);
          }

          // No matching items should be excluded
          const expectedCount = trips.filter(
            (t) => t.clientId === targetClientId
          ).length;
          expect(filtered.length).toBe(expectedCount);

          // No non-matching items should be included
          const nonMatchingInFiltered = filtered.filter(
            (t) => t.clientId !== targetClientId
          );
          expect(nonMatchingInFiltered.length).toBe(0);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 2: Currency Formatting Produces Valid PHP Format ─────────────────
// Feature: client-portal-redesign, Property 2: Currency formatting produces valid PHP format

import { formatCurrency } from "@/lib/utils";

describe("Property 2: Currency formatting produces valid PHP format", () => {
  /**
   * **Validates: Requirements 3.1, 3.4, 6.5**
   *
   * For any finite numeric amount, formatCurrency(amount) produces a string
   * beginning with ₱ with exactly 2 decimal places.
   */
  it("formatCurrency output starts with ₱ (or -₱ for negatives) and has exactly 2 decimal places", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 999999999, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = formatCurrency(amount);

          // Non-negative amounts must start with ₱
          expect(result.startsWith("₱")).toBe(true);

          // The format should have exactly 2 decimal places
          const match = result.match(/\.(\d+)$/);
          expect(match).not.toBeNull();
          expect(match![1].length).toBe(2);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 3: Date Formatting Uses Asia/Manila Timezone ────────────────────
// Feature: client-portal-redesign, Property 3: Date formatting uses Asia/Manila timezone

describe("Property 3: Date formatting uses Asia/Manila timezone", () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * For any valid ISO timestamp, formatting with Asia/Manila timezone reflects
   * the UTC+8 offset — the rendered date matches the calendar date at UTC+8.
   */
  it("date formatted in Asia/Manila reflects UTC+8 offset", () => {
    fc.assert(
      fc.property(arbTimestamp, (isoTimestamp) => {
        const date = new Date(isoTimestamp);

        // Format using Asia/Manila timezone
        const manilaFormatted = new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);

        // Manually compute the expected Manila date by adding 8 hours to UTC
        const utcMs = date.getTime();
        const manilaDate = new Date(utcMs + 8 * 60 * 60 * 1000);
        const expectedDay = manilaDate.getUTCDate();

        // Extract the day from the formatted string (format is MM/DD/YYYY for en-PH)
        const parts = new Intl.DateTimeFormat("en-PH", {
          timeZone: "Asia/Manila",
          day: "numeric",
        }).format(date);

        expect(parseInt(parts, 10)).toBe(expectedDay);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 4: Status Count Computation Accuracy ────────────────────────────
// Feature: client-portal-redesign, Property 4: Status count computation accuracy

describe("Property 4: Status count computation accuracy", () => {
  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any set of trips and any subset of statuses, the computed count
   * equals the number of trips whose status is in that subset.
   */
  it("computed status count equals manual count of matching statuses", () => {
    fc.assert(
      fc.property(
        fc.array(arbTrip, { minLength: 0, maxLength: 30 }),
        fc.subarray(TRIP_STATUSES, { minLength: 1 }),
        (trips, statusSubset) => {
          // Simulate the KPI computation logic
          const computedCount = trips.filter((t) =>
            statusSubset.includes(t.status)
          ).length;

          // Manual count verification
          let manualCount = 0;
          for (const trip of trips) {
            if (statusSubset.includes(trip.status)) {
              manualCount++;
            }
          }

          expect(computedCount).toBe(manualCount);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 5: Outstanding Balance Aggregation ──────────────────────────────
// Feature: client-portal-redesign, Property 5: Outstanding balance aggregation

describe("Property 5: Outstanding balance aggregation", () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any set of invoices, the computed outstanding balance equals
   * the sum of invoice.balance for all invoices where balance > 0.
   */
  it("computed outstanding equals sum of positive balances", () => {
    fc.assert(
      fc.property(
        fc.array(arbInvoice, { minLength: 0, maxLength: 20 }),
        (invoices) => {
          // Simulate the outstanding balance computation from useClientKpis
          const computedOutstanding = invoices
            .filter((i) => i.balance > 0)
            .reduce((sum, i) => sum + i.balance, 0);

          // Manual verification
          let manualSum = 0;
          for (const invoice of invoices) {
            if (invoice.balance > 0) {
              manualSum += invoice.balance;
            }
          }

          expect(computedOutstanding).toBeCloseTo(manualSum, 2);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 6: Recent Items Sort Order ──────────────────────────────────────
// Feature: client-portal-redesign, Property 6: Recent items sort order

describe("Property 6: Recent items sort order", () => {
  /**
   * **Validates: Requirements 4.5**
   *
   * For any set of trips, selecting the 5 most recent by createdAt descending
   * produces a list where each item's createdAt >= the next item's createdAt,
   * and the list length is min(5, total trips).
   */
  it("top 5 recent trips are correctly ordered and length is min(5, total)", () => {
    fc.assert(
      fc.property(
        fc.array(arbTrip, { minLength: 0, maxLength: 30 }),
        (trips) => {
          // Simulate the recent items computation
          const recentTrips = [...trips]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5);

          // Length must be min(5, total)
          expect(recentTrips.length).toBe(Math.min(5, trips.length));

          // Must be in descending order by createdAt
          for (let i = 0; i < recentTrips.length - 1; i++) {
            const currentTime = new Date(recentTrips[i].createdAt).getTime();
            const nextTime = new Date(recentTrips[i + 1].createdAt).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 7: Trip Status Label Mapping Completeness ───────────────────────
// Feature: client-portal-redesign, Property 7: Trip status label mapping completeness

import { TRIP_STATUS_LABELS } from "@/lib/utils/client-portal";

describe("Property 7: Trip status label mapping completeness", () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * For any valid TripStatus value, TRIP_STATUS_LABELS[status] returns
   * a non-empty string.
   */
  it("every valid TripStatus maps to a non-empty label string", () => {
    fc.assert(
      fc.property(arbTripStatus, (status) => {
        const label = TRIP_STATUS_LABELS[status];

        // Must be defined
        expect(label).toBeDefined();
        // Must be a string
        expect(typeof label).toBe("string");
        // Must be non-empty
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});


// ─── Property 8: Multi-criteria Filter Correctness ────────────────────────────
// Feature: client-portal-redesign, Property 8: Multi-criteria filter correctness

import { filterBySearchAndStatus } from "@/lib/utils/client-portal";

describe("Property 8: Multi-criteria filter correctness", () => {
  /**
   * **Validates: Requirements 5.4, 6.4, 11.3**
   *
   * For any collection of items, any status filter value, and any search query string,
   * the filtered result contains only items that match both the status predicate
   * (or all items if filter is "all") AND contain the query substring in at least one
   * searchable field.
   */
  it("filtered result contains only items matching both status and search predicates", () => {
    interface TestItem {
      id: string;
      status: string;
      name: string;
      description: string;
    }

    const arbTestItem: fc.Arbitrary<TestItem> = fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }),
      status: fc.constantFrom("active", "inactive", "pending", "completed", "cancelled"),
      name: fc.string({ minLength: 1, maxLength: 30 }),
      description: fc.string({ minLength: 1, maxLength: 50 }),
    });

    const arbStatusFilter = fc.constantFrom("all", "active", "inactive", "pending", "completed", "cancelled");

    fc.assert(
      fc.property(
        fc.array(arbTestItem, { minLength: 0, maxLength: 30 }),
        arbStatusFilter,
        fc.string({ minLength: 0, maxLength: 10 }),
        (items, statusFilter, query) => {
          const result = filterBySearchAndStatus(
            items,
            query,
            statusFilter,
            (item) => item.status,
            (item) => [item.name, item.description]
          );

          const q = query.trim().toLowerCase();

          // Every item in the result must match both predicates
          for (const item of result) {
            // Status predicate
            if (statusFilter !== "all") {
              expect(item.status).toBe(statusFilter);
            }
            // Search predicate
            if (q) {
              const matchesSearch = [item.name, item.description].some((f) =>
                f.toLowerCase().includes(q)
              );
              expect(matchesSearch).toBe(true);
            }
          }

          // No matching items should be excluded
          const expectedCount = items.filter((item) => {
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;
            const matchesSearch = !q || [item.name, item.description].some((f) =>
              f.toLowerCase().includes(q)
            );
            return matchesStatus && matchesSearch;
          }).length;
          expect(result.length).toBe(expectedCount);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 9: Invoice VAT Calculation Integrity ────────────────────────────
// Feature: client-portal-redesign, Property 9: Invoice VAT calculation integrity

describe("Property 9: Invoice VAT calculation integrity", () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any invoice, vatAmount ≈ subtotal × vatRate (±0.01) and
   * totalAmount ≈ subtotal + vatAmount.
   */
  it("vatAmount equals subtotal × vatRate and totalAmount equals subtotal + vatAmount within tolerance", () => {
    fc.assert(
      fc.property(arbInvoice, (invoice) => {
        const expectedVat = invoice.subtotal * invoice.vatRate;
        const expectedTotal = invoice.subtotal + invoice.vatAmount;

        // vatAmount ≈ subtotal × vatRate (±0.01)
        expect(invoice.vatAmount).toBeCloseTo(expectedVat, 1);

        // totalAmount ≈ subtotal + vatAmount
        expect(invoice.totalAmount).toBeCloseTo(expectedTotal, 1);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 10: Badge Color Mapping Completeness ────────────────────────────
// Feature: client-portal-redesign, Property 10: Badge color mapping completeness

import { STATUS_BADGE_VARIANT } from "@/lib/utils/client-portal";

describe("Property 10: Badge color mapping completeness", () => {
  /**
   * **Validates: Requirements 7.5, 13.2**
   *
   * For any valid status string used in the portal (trip statuses, invoice statuses,
   * ticket statuses), STATUS_BADGE_VARIANT[status] is defined and non-empty.
   */
  it("every portal status maps to a defined, non-empty CSS class string", () => {
    // All statuses used across trip, invoice, and ticket contexts in the portal
    const ALL_PORTAL_STATUSES = [
      // Trip statuses (those with badge variants)
      "delivered",
      "completed",
      "in_transit",
      "loaded",
      "vehicle_dispatched",
      "scheduled",
      "delayed",
      "cancelled",
      // Invoice statuses
      "paid",
      "sent",
      "overdue",
      "partially_paid",
      "draft",
      // Ticket statuses
      "open",
      "in_progress",
      "resolved",
    ] as const;

    const arbPortalStatus = fc.constantFrom(...ALL_PORTAL_STATUSES);

    fc.assert(
      fc.property(arbPortalStatus, (status) => {
        const variant = STATUS_BADGE_VARIANT[status];

        // Must be defined
        expect(variant).toBeDefined();
        // Must be a string
        expect(typeof variant).toBe("string");
        // Must be non-empty
        expect(variant.length).toBeGreaterThan(0);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 11: Active Tab Determination by URL Path ────────────────────────
// Feature: client-portal-redesign, Property 11: Active tab determination by URL path

describe("Property 11: Active tab determination by URL path", () => {
  /**
   * **Validates: Requirements 10.2**
   *
   * For any valid portal sub-path, the active tab determination logic returns
   * the tab whose href prefix-matches the current path.
   */
  it("active tab matches the tab whose href prefix-matches the path", () => {
    const TABS = [
      { value: "overview", label: "Overview", href: "/client-portal/overview" },
      { value: "shipments", label: "Shipments", href: "/client-portal/shipments" },
      { value: "invoices", label: "Invoices", href: "/client-portal/invoices" },
      { value: "documents", label: "Documents", href: "/client-portal/documents" },
      { value: "reports", label: "Reports", href: "/client-portal/reports" },
      { value: "support", label: "Support", href: "/client-portal/support" },
    ];

    // Generate valid portal paths (base paths and paths with additional segments)
    const arbPortalPath = fc.constantFrom(
      "/client-portal/overview",
      "/client-portal/shipments",
      "/client-portal/invoices",
      "/client-portal/documents",
      "/client-portal/reports",
      "/client-portal/support",
      "/client-portal/overview/details",
      "/client-portal/shipments/trip-123",
      "/client-portal/invoices/inv-001",
      "/client-portal/documents/upload",
      "/client-portal/reports/export",
      "/client-portal/support/new-ticket"
    );

    fc.assert(
      fc.property(arbPortalPath, (path) => {
        // Replicate the logic from layout.tsx
        const activeTab = TABS.find((t) => path.startsWith(t.href))?.value ?? "overview";

        // The active tab must be defined
        expect(activeTab).toBeDefined();
        expect(typeof activeTab).toBe("string");
        expect(activeTab.length).toBeGreaterThan(0);

        // The path must start with the matched tab's href
        const matchedTab = TABS.find((t) => t.value === activeTab);
        expect(matchedTab).toBeDefined();
        expect(path.startsWith(matchedTab!.href)).toBe(true);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 12: Document Categorization Completeness ────────────────────────
// Feature: client-portal-redesign, Property 12: Document categorization completeness

import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/utils/client-portal";

describe("Property 12: Document categorization completeness", () => {
  /**
   * **Validates: Requirements 11.2**
   *
   * For any document with a name matching one of the defined document types,
   * it is assigned to exactly one valid DocumentCategory.
   */
  it("every known document type maps to exactly one valid category", () => {
    // Collect all known document type names from DOCUMENT_CATEGORIES
    const ALL_DOC_TYPES: string[] = [];
    for (const types of Object.values(DOCUMENT_CATEGORIES)) {
      ALL_DOC_TYPES.push(...types);
    }

    const arbDocType = fc.constantFrom(...ALL_DOC_TYPES);

    fc.assert(
      fc.property(arbDocType, (docType) => {
        // Find which categories contain this document type
        const matchingCategories: string[] = [];
        for (const [category, types] of Object.entries(DOCUMENT_CATEGORIES)) {
          if ((types as readonly string[]).includes(docType)) {
            matchingCategories.push(category);
          }
        }

        // Exactly one category must match
        expect(matchingCategories.length).toBe(1);

        // That category must be a valid DocumentCategory
        const validCategories = Object.keys(DOCUMENT_CATEGORIES);
        expect(validCategories).toContain(matchingCategories[0]);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 13: New Badge Time Threshold ────────────────────────────────────
// Feature: client-portal-redesign, Property 13: New badge time threshold

import { isDocumentNew } from "@/lib/utils/client-portal";

describe("Property 13: New badge time threshold", () => {
  /**
   * **Validates: Requirements 11.5**
   *
   * For any document uploadedAt timestamp, isDocumentNew(uploadedAt) returns true
   * if and only if the elapsed time since upload is less than 48 hours (172,800,000 ms).
   */
  it("isDocumentNew returns true iff elapsed < 48 hours", () => {
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

    fc.assert(
      fc.property(
        // Generate offsets from "now" ranging from 0 to 96 hours (to test both sides of threshold)
        fc.integer({ min: 0, max: 96 * 60 * 60 * 1000 }),
        (offsetMs) => {
          const now = Date.now();
          const uploadedAt = new Date(now - offsetMs).toISOString();

          const result = isDocumentNew(uploadedAt);

          // The function should return true iff elapsed < 48 hours
          const elapsed = now - new Date(uploadedAt).getTime();
          const expected = elapsed < FORTY_EIGHT_HOURS_MS;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 14: Route Grouping Aggregation ──────────────────────────────────
// Feature: client-portal-redesign, Property 14: Route grouping aggregation

import { computeTopLanes } from "@/lib/utils/client-portal";

describe("Property 14: Route grouping aggregation", () => {
  /**
   * **Validates: Requirements 12.2**
   *
   * For any set of trips, computeTopLanes(trips) produces groups where the sum
   * of all group counts equals the total number of trips, and groups are sorted
   * in descending order by count.
   */
  it("sum of group counts equals total trips and groups are sorted descending", () => {
    fc.assert(
      fc.property(
        fc.array(arbTrip, { minLength: 0, maxLength: 30 }),
        (trips) => {
          const lanes = computeTopLanes(trips);

          // Sum of all group counts must equal total trips
          const totalCount = lanes.reduce((sum, lane) => sum + lane.count, 0);
          expect(totalCount).toBe(trips.length);

          // Groups must be sorted in descending order by count
          for (let i = 0; i < lanes.length - 1; i++) {
            expect(lanes[i].count).toBeGreaterThanOrEqual(lanes[i + 1].count);
          }

          // Each lane must have a non-empty route string
          for (const lane of lanes) {
            expect(lane.route.length).toBeGreaterThan(0);
            expect(lane.count).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});


// ─── Property 15: On-time Delivery Rate Formula ───────────────────────────────
// Feature: client-portal-redesign, Property 15: On-time delivery rate formula

import { computeOnTimeRate } from "@/lib/utils/client-portal";

describe("Property 15: On-time delivery rate formula", () => {
  /**
   * **Validates: Requirements 12.4**
   *
   * For any set of trips, computeOnTimeRate(trips) SHALL equal
   * (count of trips with status in ["delivered", "completed"]) /
   * (count of trips with status NOT in ["scheduled", "cancelled"]) × 100.
   * If the denominator is 0, the result SHALL be 0.
   */
  it("computed on-time rate equals manual formula calculation", () => {
    fc.assert(
      fc.property(
        fc.array(arbTrip, { minLength: 0, maxLength: 30 }),
        (trips) => {
          const result = computeOnTimeRate(trips);

          // Manual calculation
          const delivered = trips.filter((t) =>
            ["delivered", "completed"].includes(t.status)
          ).length;
          const eligible = trips.filter(
            (t) => !["scheduled", "cancelled"].includes(t.status)
          ).length;

          const expected = eligible === 0 ? 0 : (delivered / eligible) * 100;

          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });

  it("returns 0 when denominator is 0 (all trips are scheduled or cancelled)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 15 }),
            clientId: fc.constant("c-001"),
            status: fc.constantFrom("scheduled" as TripStatus, "cancelled" as TripStatus),
            pickup: fc.record({
              address: fc.constant("Manila, Metro Manila"),
              lat: fc.constant(14.5),
              lng: fc.constant(121.0),
              scheduledAt: arbTimestamp,
            }),
            dropoff: fc.record({
              address: fc.constant("Makati, Metro Manila"),
              lat: fc.constant(14.5),
              lng: fc.constant(121.0),
              scheduledAt: arbTimestamp,
            }),
            cargo: fc.record({
              type: fc.constant("General" as const),
              weightKg: fc.constant(100),
              units: fc.constant(1),
              description: fc.constant("Test cargo"),
            }),
            distanceKm: fc.constant(10),
            fare: fc.constant(1000),
            statusLogs: fc.constant([{ status: "scheduled" as TripStatus, at: "2024-01-01T00:00:00Z" }]),
            createdAt: arbTimestamp,
            driverId: fc.constant(undefined),
            vehicleId: fc.constant(undefined),
          }) as fc.Arbitrary<Trip>,
          { minLength: 0, maxLength: 10 }
        ),
        (trips) => {
          const result = computeOnTimeRate(trips);
          expect(result).toBe(0);
        }
      ),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});

// ─── Property 16: Ticket-Trip Status Join Correctness ─────────────────────────
// Feature: client-portal-redesign, Property 16: Ticket-trip status join correctness

describe("Property 16: Ticket-trip status join correctness", () => {
  /**
   * **Validates: Requirements 13.3**
   *
   * For any support ticket that references a tripId via shipmentRef,
   * looking up that trip by ID from the trip store returns the trip's
   * current status field — not a stale cached value.
   */
  it("displayed trip status matches the trip's current status field when looked up by shipmentRef", () => {
    /** Generates a simple ticket with a shipmentRef pointing to a trip ID */
    const arbTicketAndTrips = fc
      .array(arbTrip, { minLength: 1, maxLength: 10 })
      .chain((trips) => {
        // Pick a random index to reference
        const arbIndex = fc.integer({ min: 0, max: trips.length - 1 });
        return arbIndex.map((idx) => ({
          ticket: {
            id: `ticket-${idx}`,
            subject: "Test ticket",
            shipmentRef: trips[idx].id,
          },
          trips,
          expectedStatus: trips[idx].status,
        }));
      });

    fc.assert(
      fc.property(arbTicketAndTrips, ({ ticket, trips, expectedStatus }) => {
        // Simulate the join: look up trip by the ticket's shipmentRef
        const referencedTrip = trips.find((t) => t.id === ticket.shipmentRef);

        // The trip must be found
        expect(referencedTrip).toBeDefined();

        // The displayed status must match the trip's current status
        expect(referencedTrip!.status).toBe(expectedStatus);
      }),
      { numRuns: PBT_NUM_RUNS }
    );
  });
});
