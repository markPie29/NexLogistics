# Implementation Plan: Client Portal Redesign

## Overview

Replace the isolated `useClientPortalStore` with a hook-based integration layer that reads from core Zustand stores (`useTripStore`, `useInvoiceStore`, `useBillingPaymentStore`, `useClientStore`) filtered by `user.clientId`. Rebuild the UI with shadcn/ui components, brand colors, and PH-realistic seed data. Implementation follows a bottom-up approach: utility functions → custom hooks → seed data augmentation → portal store refactoring → layout → page components → property-based tests.

## Tasks

- [x] 1. Create utility functions and constants module
  - [x] 1.1 Create `lib/utils/client-portal.ts` with status mappings, badge variants, and helper functions
    - Define `TRIP_STATUS_LABELS` record mapping all `TripStatus` values to client-friendly labels (scheduled → "Scheduled", in_transit → "In Transit", delivered → "Delivered", completed → "Completed", delayed → "Delayed", cancelled → "Cancelled", driver_assigned → "Driver Assigned", vehicle_dispatched → "Dispatched", loaded → "Loaded")
    - Define `STATUS_BADGE_VARIANT` record mapping all portal statuses to Tailwind CSS classes (delivered/completed → emerald, in_transit/loaded/vehicle_dispatched → blue, scheduled → gray, delayed → amber, cancelled → red, paid → emerald, sent → blue, overdue → red, partially_paid → amber, draft → gray, open → amber, in_progress → blue, resolved → emerald)
    - Define `DOCUMENT_CATEGORIES` constant with categories: Delivery (Bill of Lading, Delivery Receipt, Proof of Delivery), Compliance (Certificate of Insurance, Permits, OR/CR), Financial (BIR 2307, Statement of Account, Official Receipt), Rate (Rate Confirmation)
    - Define `DocumentCategory` type from `DOCUMENT_CATEGORIES` keys
    - Implement `isDocumentNew(uploadedAt: string): boolean` — returns true if elapsed time < 48 hours (172,800,000 ms)
    - Implement `computeOnTimeRate(trips: Trip[]): number` — formula: (delivered + completed) / (total - scheduled - cancelled) × 100; returns 0 if denominator is 0
    - Implement `computeTopLanes(trips: Trip[]): { route: string; count: number }[]` — groups trips by pickup→dropoff first segment, sorted descending by count
    - Implement `filterBySearchAndStatus<T>(items, query, statusFilter, getStatus, getSearchFields): T[]` — multi-criteria filter combining status predicate (or "all") with case-insensitive substring search across multiple fields
    - Define `PortalDocument` interface: `id`, `name`, `type` (PDF|DOCX|XLSX), `category` (DocumentCategory), `uploadedAt`, `uploadedBy`, `tripId?`, `sizeKb`, `notes?`
    - _Requirements: 3.1, 3.4, 5.2, 5.4, 6.4, 7.5, 11.2, 11.3, 11.5, 12.2, 12.4, 13.2_

- [x] 2. Create custom hooks integration layer
  - [x] 2.1 Create `lib/hooks/client-portal/use-client-trips.ts`
    - Read `user.clientId` from `useAuthStore`
    - Filter `useTripStore.trips` by `trip.clientId === user.clientId`
    - Enrich each trip with `driverName` from `useDriverStore` and `vehiclePlate` from `useFleetStore`
    - Return `{ trips: enrichedTrips, total: enrichedTrips.length }` wrapped in `useMemo`
    - _Requirements: 1.1, 5.1_

  - [x] 2.2 Create `lib/hooks/client-portal/use-client-invoices.ts`
    - Read `user.clientId` from `useAuthStore`
    - Filter `useInvoiceStore.invoices` by `invoice.clientId === user.clientId`
    - Return `{ invoices: clientInvoices }` wrapped in `useMemo`
    - _Requirements: 1.2, 6.1_

  - [x] 2.3 Create `lib/hooks/client-portal/use-client-payments.ts`
    - Read `user.clientId` from `useAuthStore`
    - Filter `useBillingPaymentStore.payments` by `payment.clientId === user.clientId`
    - Return `{ payments: clientPayments }` wrapped in `useMemo`
    - _Requirements: 1.3_

  - [x] 2.4 Create `lib/hooks/client-portal/use-client-company.ts`
    - Read `user.clientId` from `useAuthStore`
    - Find matching client from `useClientStore.clients` by `client.id === user.clientId`
    - Return `company` or `null` wrapped in `useMemo`
    - _Requirements: 2.5, 10.3_

  - [x] 2.5 Create `lib/hooks/client-portal/use-client-kpis.ts`
    - Compose `useClientTrips()` and `useClientInvoices()`
    - Compute `totalShipments`, `inTransit` (statuses: in_transit, loaded, vehicle_dispatched), `delivered` (statuses: delivered, completed), `outstandingBalance` (sum of invoice.balance where balance > 0)
    - Return KPI object wrapped in `useMemo`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.6 Create `lib/hooks/client-portal/use-client-documents.ts`
    - Read portal documents from the portal store (seeded documents)
    - Filter by client's trip IDs using `useClientTrips()`
    - Return `{ documents: clientDocuments }` with category grouping helpers
    - _Requirements: 11.1, 11.2_

  - [x] 2.7 Create barrel export `lib/hooks/client-portal/index.ts`
    - Re-export all hooks from a single entry point
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Augment seed data with PH-realistic entries for client c-001
  - [x] 3.1 Add 5+ trips to Trip_Store seed data for `clientId: "c-001"`
    - Use Philippine routes: Manila → Pampanga, Makati → Laguna, Quezon City → Batangas, Taguig → Bulacan, Pasig → Cavite
    - Include varied statuses: in_transit, delivered, scheduled, delayed, completed
    - Include statusLogs arrays with realistic timestamps in Asia/Manila timezone
    - Assign existing driverIds and vehicleIds from seed data
    - _Requirements: 2.1, 5.5_

  - [x] 3.2 Add 3+ invoices to Invoice_Store seed data for `clientId: "c-001"`
    - Use PHP amounts (e.g., ₱185,400.00, ₱92,750.00, ₱310,200.00)
    - Include varied statuses: paid, sent, overdue, partially_paid
    - Include line items, subtotal, 12% VAT, vatAmount, totalAmount, paidAmount, balance
    - _Requirements: 2.2, 6.2_

  - [x] 3.3 Create portal documents seed data in `lib/store/client-portal.ts`
    - Create 8+ `PortalDocument` entries with Filipino uploader names (e.g., "Maria Santos", "Juan dela Cruz", "Ana Reyes")
    - Use PH document types: Bill of Lading, Delivery Receipt, BIR 2307, Certificate of Insurance, OR/CR, Rate Confirmation
    - Reference trip IDs from c-001's trips
    - Include varied file types (PDF, DOCX, XLSX) and realistic sizes
    - _Requirements: 2.4, 11.4_

  - [x] 3.4 Create portal tickets seed data in `lib/store/client-portal.ts`
    - Create 3+ `PortalTicket` entries with PH-realistic scenarios (EDSA traffic delay, MICT port congestion, incorrect weight declaration)
    - Reference actual trip IDs and invoice numbers from c-001's data
    - Include Filipino support agent names and varied statuses (open, in_progress, resolved)
    - _Requirements: 2.3, 13.1, 13.5_

- [x] 4. Refactor portal store to lightweight version
  - [x] 4.1 Refactor `lib/store/client-portal.ts` to remove duplicated data
    - Remove `shipments`, `documents` (moved to seed/hooks), `invoices`, `markInvoicePaid` from the store
    - Retain only: `tickets`, `exports`, `preferences`, `documents` (portal-specific seed)
    - Implement `addTicket`, `updateTicketStatus`, `addReportExport`, `updatePreferences`, `reset` actions
    - Define `PortalTicket`, `PortalReportExport`, `PortalPreferences`, `PortalTicketStatus` interfaces
    - Initialize with PH-realistic seed data from task 3.3 and 3.4
    - _Requirements: 1.4, 1.5, 13.4_

- [x] 5. Checkpoint - Ensure hooks and store compile correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Rebuild portal layout with shadcn/ui Tabs navigation
  - [x] 6.1 Rewrite `app/(app)/client-portal/layout.tsx`
    - Use shadcn/ui `Tabs` + `TabsList` + `TabsTrigger` for navigation
    - Define TABS array: Overview, Shipments, Invoices, Documents, Reports, Support with corresponding hrefs
    - Determine active tab from `usePathname()` prefix matching
    - Display page heading "Client Portal" in navy `#0B1220` with `text-3xl font-extrabold tracking-tight`
    - Display company name and contact person subtitle from `useClientCompany()` hook
    - Handle null company gracefully (omit subtitle)
    - Use `router.push()` on tab change via `onValueChange`
    - Apply consistent spacing: `space-y-6 pb-10`
    - _Requirements: 10.1, 10.2, 10.3, 8.2, 9.1_

  - [x] 6.2 Update `app/(app)/client-portal/page.tsx` to redirect to overview
    - Use `redirect("/client-portal/overview")` from `next/navigation`
    - _Requirements: 10.4_

- [x] 7. Implement Overview page
  - [x] 7.1 Rewrite `app/(app)/client-portal/overview/page.tsx`
    - Import `useClientKpis`, `useClientTrips`, `useClientCompany` hooks
    - Render 4 KPI cards using shadcn/ui `Card`: Total Shipments, In Transit, Delivered, Outstanding Balance (₱ formatted)
    - Each card: icon top-right (Lucide icons: Package, Truck, CheckCircle, DollarSign), label top-left, large value below
    - Use brand teal `#66B2B2` for primary indicators, navy `#0B1220` for values
    - Render "Recent Shipments" table with shadcn/ui `Table` showing 5 most recent trips sorted by `createdAt` descending
    - Table columns: Trip ID, Route (pickup → dropoff), Status (Badge), Date
    - Use `STATUS_BADGE_VARIANT` for badge colors, `TRIP_STATUS_LABELS` for labels
    - Responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` for KPI cards
    - Handle empty state: show "No shipments found" when zero trips
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5, 8.1, 8.2, 9.1, 9.2, 14.1_

- [x] 8. Implement Shipments page
  - [x] 8.1 Rewrite `app/(app)/client-portal/shipments/page.tsx`
    - Import `useClientTrips` hook and `filterBySearchAndStatus` utility
    - Add local state: `searchQuery`, `statusFilter`, `selectedTrip`
    - Render filter bar with shadcn/ui `Input` for search and `Select` for status filter
    - Render shadcn/ui `Table` with columns: Trip ID, Pickup, Dropoff, Status (Badge), Driver, Vehicle, Date
    - Truncate addresses to 40 characters with ellipsis
    - Use `TRIP_STATUS_LABELS` and `STATUS_BADGE_VARIANT` for display
    - Implement row click to open shipment detail in shadcn/ui `Dialog`
    - Detail dialog shows: pickup address, dropoff address, cargo description, weight, vehicle plate, driver name, status timeline from `trip.statusLogs`
    - Status timeline: vertical list with timestamp + status label for each entry
    - Handle empty/filtered-empty states with appropriate messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.3, 7.4, 9.4, 9.5, 14.2, 14.3_

- [x] 9. Implement Invoices page
  - [x] 9.1 Rewrite `app/(app)/client-portal/invoices/page.tsx`
    - Import `useClientInvoices`, `useClientPayments` hooks and utilities
    - Add local state: `searchQuery`, `statusFilter`, `selectedInvoice`
    - Render filter bar with search (by invoice number) and status filter (paid, sent, overdue, partially_paid, draft)
    - Render shadcn/ui `Table` with columns: Invoice #, Date, Amount (₱ formatted), Status (Badge), Balance (₱ formatted)
    - Overdue invoices: red warning indicator using `STATUS_BADGE_VARIANT`
    - Implement row click to open invoice detail in shadcn/ui `Dialog`
    - Detail dialog shows: line items table, subtotal, VAT (12%), VAT amount, total, paid amount, outstanding balance
    - All amounts formatted with `formatCurrency` (₱XX,XXX.XX)
    - Handle empty state appropriately
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4, 8.1, 14.2_

- [x] 10. Checkpoint - Ensure overview, shipments, and invoices pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Documents page
  - [x] 11.1 Rewrite `app/(app)/client-portal/documents/page.tsx`
    - Import `useClientDocuments` hook and `DOCUMENT_CATEGORIES`, `isDocumentNew` utilities
    - Add local state: `categoryFilter`, `typeFilter`, `searchQuery`
    - Render filter bar with category dropdown (Delivery, Compliance, Financial, Rate, All) and type dropdown (PDF, DOCX, XLSX, All)
    - Render shadcn/ui `Table` with columns: Document Name, Category (Badge), Type, Uploaded By, Upload Date, Size
    - Display "New" badge (emerald) on documents where `isDocumentNew(uploadedAt)` returns true
    - Show Filipino uploader names from seed data
    - Implement download action button (placeholder) on each row
    - Handle empty state with "No documents found" message
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 7.3, 7.5, 14.3_

- [x] 12. Implement Reports page
  - [x] 12.1 Rewrite `app/(app)/client-portal/reports/page.tsx`
    - Import `useClientTrips`, `useClientInvoices` hooks and `computeOnTimeRate`, `computeTopLanes` utilities
    - Render KPI summary cards: Total Shipments, On-Time Delivery Rate (%), Total Spend (₱ formatted from invoice totals)
    - Render "Top Lanes" table using shadcn/ui `Table` with columns: Route, Shipment Count
    - Display Philippine route names (e.g., "Manila → Pampanga")
    - Render "Export Report" section with format selection (CSV, PDF) using shadcn/ui `Select`
    - Wire export action to `useClientPortalStore.addReportExport`
    - Display export history table from portal store
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 7.3, 8.1_

- [x] 13. Implement Support page
  - [x] 13.1 Rewrite `app/(app)/client-portal/support/page.tsx`
    - Import `useClientPortalStore` for tickets and `useClientTrips` for trip status resolution
    - Render tickets list with shadcn/ui `Table`: Subject, Category, Priority (Badge), Status (Badge), Created Date
    - Use `STATUS_BADGE_VARIANT` for ticket status badges (open → amber, in_progress → blue, resolved → emerald)
    - Display referenced trip status alongside ticket when `ticket.shipmentRef` exists (resolve from trips array)
    - Implement "New Ticket" button opening shadcn/ui `Dialog` with form fields: Subject, Category (dropdown), Priority (dropdown), Details (textarea), Shipment Reference (optional Select from client's trips), Invoice Reference (optional Select from client's invoices)
    - Wire form submission to `useClientPortalStore.addTicket`
    - Display Filipino support agent names from seed data
    - Handle empty tickets state with "No tickets yet" message
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 7.1, 7.4, 7.5_

- [x] 14. Apply brand colors and accessibility standards across all pages
  - [x] 14.1 Audit and apply brand color consistency
    - Replace any hardcoded colors (`#008A56`, `#007045`, `#0E7490`) with brand teal `#66B2B2`
    - Ensure headings use navy `#0B1220`
    - Apply `brand-teal-light` (`#E6F2F2`) for hover states and highlighted backgrounds
    - Use status colors from `tailwind.config.ts` for status indicators
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 14.2 Apply accessibility attributes across all portal pages
    - Add `focus-visible:ring-2 ring-brand-teal` to all interactive elements
    - Add `aria-label` to all icon-only buttons
    - Add proper `scope` attributes to table headers
    - Ensure 16px minimum touch target spacing between interactive elements
    - Verify consistent row height (`h-12`), font sizes (`text-sm` body, `text-xs` secondary), padding (`px-4 py-3`) on all tables
    - _Requirements: 14.2, 14.3, 14.4, 14.5, 9.3, 9.5_

- [x] 15. Checkpoint - Ensure all pages render and navigate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Write property-based tests
  - [x] 16.1 Set up fast-check test infrastructure
    - Install `fast-check` package if not present
    - Create test file `__tests__/client-portal/properties.test.ts`
    - Set up test helpers: arbitrary generators for Trip, Invoice, TripStatus, and timestamp values
    - Configure minimum 100 iterations per property
    - _Requirements: 1.1, 5.1_

  - [x] 16.2 Write property test for client data filtering correctness
    - **Property 1: Client data filtering correctness**
    - Generate random arrays of items with varied `clientId` values; assert filtered result contains exactly items matching target clientId
    - **Validates: Requirements 1.1, 1.2, 1.3, 5.1, 6.1**

  - [x] 16.3 Write property test for currency formatting
    - **Property 2: Currency formatting produces valid PHP format**
    - Generate random finite numbers; assert `formatCurrency(amount)` starts with `₱` and has exactly 2 decimal places
    - **Validates: Requirements 3.1, 3.4, 6.5**

  - [x] 16.4 Write property test for date timezone formatting
    - **Property 3: Date formatting uses Asia/Manila timezone**
    - Generate random ISO timestamps; assert formatted date reflects UTC+8 offset
    - **Validates: Requirements 3.2**

  - [x] 16.5 Write property test for status count computation
    - **Property 4: Status count computation accuracy**
    - Generate random trip arrays with random statuses; assert computed count equals manual count of matching statuses
    - **Validates: Requirements 4.2, 4.3**

  - [x] 16.6 Write property test for outstanding balance aggregation
    - **Property 5: Outstanding balance aggregation**
    - Generate random invoice arrays with varied balances; assert computed outstanding equals sum of positive balances
    - **Validates: Requirements 4.4**

  - [x] 16.7 Write property test for recent items sort order
    - **Property 6: Recent items sort order**
    - Generate random trip arrays with random dates; assert top 5 by createdAt descending are correctly ordered and length is min(5, total)
    - **Validates: Requirements 4.5**

  - [x] 16.8 Write property test for trip status label mapping
    - **Property 7: Trip status label mapping completeness**
    - Generate all valid TripStatus values; assert `TRIP_STATUS_LABELS[status]` returns a non-empty string
    - **Validates: Requirements 5.2**

  - [x] 16.9 Write property test for multi-criteria filter
    - **Property 8: Multi-criteria filter correctness**
    - Generate random arrays + random status filter + random search query; assert result contains only items matching both predicates
    - **Validates: Requirements 5.4, 6.4, 11.3**

  - [x] 16.10 Write property test for invoice VAT calculation
    - **Property 9: Invoice VAT calculation integrity**
    - Generate random subtotals and VAT rates; assert vatAmount ≈ subtotal × vatRate (±0.01) and totalAmount ≈ subtotal + vatAmount
    - **Validates: Requirements 6.2**

  - [x] 16.11 Write property test for badge color mapping
    - **Property 10: Badge color mapping completeness**
    - Generate all valid status strings used in portal; assert `STATUS_BADGE_VARIANT[status]` is defined and non-empty
    - **Validates: Requirements 7.5, 13.2**

  - [x] 16.12 Write property test for active tab determination
    - **Property 11: Active tab determination by URL path**
    - Generate valid portal sub-paths; assert active tab matches the tab whose href prefix-matches the path
    - **Validates: Requirements 10.2**

  - [x] 16.13 Write property test for document categorization
    - **Property 12: Document categorization completeness**
    - Generate documents with known type names; assert each is assigned to exactly one valid DocumentCategory
    - **Validates: Requirements 11.2**

  - [x] 16.14 Write property test for new badge time threshold
    - **Property 13: New badge time threshold**
    - Generate random timestamps; assert `isDocumentNew` returns true iff elapsed < 48 hours
    - **Validates: Requirements 11.5**

  - [x] 16.15 Write property test for route grouping aggregation
    - **Property 14: Route grouping aggregation**
    - Generate random trip arrays with addresses; assert sum of all group counts equals total trips and groups are sorted descending
    - **Validates: Requirements 12.2**

  - [x] 16.16 Write property test for on-time delivery rate
    - **Property 15: On-time delivery rate formula**
    - Generate random trip status arrays; assert computed rate equals manual formula calculation; assert 0 when denominator is 0
    - **Validates: Requirements 12.4**

  - [x] 16.17 Write property test for ticket-trip status join
    - **Property 16: Ticket-trip status join correctness**
    - Generate tickets referencing trip IDs and a trip store state; assert displayed status matches trip's current status field
    - **Validates: Requirements 13.3**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The portal store is slimmed to only portal-specific entities (tickets, exports, preferences, documents seed)
- All monetary values use `formatCurrency` from `@/lib/utils` for consistent ₱ formatting
- All dates use `Asia/Manila` timezone formatting
- Brand colors: teal `#66B2B2` for actions, navy `#0B1220` for headings

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["2.5", "2.6", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.7", "3.3", "3.4"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["7.1", "8.1", "9.1"] },
    { "id": 7, "tasks": ["11.1", "12.1", "13.1"] },
    { "id": 8, "tasks": ["14.1", "14.2"] },
    { "id": 9, "tasks": ["16.1"] },
    { "id": 10, "tasks": ["16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8"] },
    { "id": 11, "tasks": ["16.9", "16.10", "16.11", "16.12", "16.13", "16.14", "16.15"] },
    { "id": 12, "tasks": ["16.16", "16.17"] }
  ]
}
```
