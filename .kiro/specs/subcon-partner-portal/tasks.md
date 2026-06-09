# Implementation Plan: Subcon Partner Portal

## Overview

This plan implements the Subcon Partner Portal by extending the existing role-based architecture with a "partner" role and creating a dedicated portal route group with six sub-pages. The implementation follows a foundation-first approach: type system → navigation/auth → layout → pages, ensuring each step builds on the previous without orphaned code.

## Tasks

- [x] 1. Foundation — Type system, roles, and seed data
  - [x] 1.1 Add "partner" role to type system and User interface
    - Add `"partner"` to the `Role` union type in `lib/types.ts`
    - Add `partnerId?: string` field to the `User` interface (following `driverId`, `helperId`, `clientId` pattern)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Add partner entries to role configuration
    - Add `ROLE_LABEL["partner"] = "Subcon Partner"` in `lib/auth/roles.ts`
    - Add `DEFAULT_LANDING["partner"] = "/partner-portal/overview"` in `lib/auth/roles.ts`
    - Add Partner Portal NAV_ITEMS entry: `{ label: "Partner Portal", href: "/partner-portal", icon: Handshake, group: "customer", roles: ["partner"] }`
    - _Requirements: 1.3, 1.4, 2.1, 10.6_

  - [x] 1.3 Add seed partner user to demo data
    - Add partner user to `seedUsers` in `lib/data/users.ts` with id `"u-008"`, name `"Northbound Trucking"`, email `"partner@nexlogistics.demo"`, role `"partner"`, `_demoPassword: "Partner123!"`, phone `"09171234567"`, `partnerId: "ptn-001"`
    - _Requirements: 3.2, 11.4, 11.5_

- [x] 2. Login page and sidebar navigation
  - [x] 2.1 Add partner role card and quick access to login page
    - Add 8th entry to `ROLE_CARDS` array in `app/(auth)/login/page.tsx` with role "partner", title "SUBCON PARTNER", subtitle "Partner portal access", description of partner capabilities, email/password from seed user, Handshake icon, and appropriate accent colors
    - Add entry to `QUICK_ACCESS` array with role "partner", label "Subcon Partner", code "Partner123!", Handshake icon, color class
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 2.2 Add partner portal expandable nav to Sidebar
    - Define `PARTNER_PORTAL_CHILDREN` array in `components/layout/Sidebar.tsx` with entries: Overview (`/partner-portal/overview`, LayoutGrid), My Trips (`/partner-portal/trips`, Truck), Requests (`/partner-portal/requests`, Receipt), Earnings (`/partner-portal/earnings`, Wallet), Profile (`/partner-portal/profile`, User icon), Settings (`/partner-portal/settings`, Settings icon)
    - Add `isPartnerPortal` condition (`item.href === "/partner-portal"`) in the nav render logic
    - Render `ExpandableNav` for the partner portal nav item using `PARTNER_PORTAL_CHILDREN` and basePath `/partner-portal`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3. Checkpoint — Ensure type system, roles, login, and sidebar compile correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Portal layout and redirect
  - [x] 4.1 Create partner portal layout
    - Create `app/(app)/partner-portal/layout.tsx` with heading "Partner Portal", subtitle "View trips, submit requests, track earnings, and manage your company profile.", using the same wrapper structure as `client-portal/layout.tsx` (container with `space-y-4 pb-10`)
    - _Requirements: 10.1, 10.2_

  - [x] 4.2 Create partner portal root redirect
    - Create `app/(app)/partner-portal/page.tsx` that performs a server-side redirect to `/partner-portal/overview` using Next.js `redirect()` from `next/navigation`
    - _Requirements: 10.3_

- [x] 5. Partner Portal — Overview page
  - [x] 5.1 Implement overview dashboard page
    - Create `app/(app)/partner-portal/overview/page.tsx`
    - Display 4 KPI cards: Total Trips (all trips with matching partnerId), Active Trips (status in scheduled/driver_assigned/vehicle_dispatched/loaded/in_transit/delayed), Completed Trips (status completed/delivered), Pending Payables (sum of computed payout for trips with partnerPayoutStatus "pending", formatted ₱ en-PH)
    - Display recent trips list (last 5 by createdAt desc) showing trip ID, route, status, date
    - Display pending requests summary (count + total ₱ amount)
    - Display 4 quick link cards navigating to Trips, Requests, Earnings, Profile
    - Filter all data by `user.partnerId`; show empty state with 0/₱0.00 when no data
    - Read trips from `useTripStore`, requests from `usePartnerRequestStore`, user from `useAuthStore`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 11.1, 11.2_

  - [ ]* 5.2 Write property test for KPI computation (Property 7)
    - **Property 7: KPI computation correctness**
    - Test that for any set of trips with varying statuses and payout amounts, the KPI values match expected counts and sums
    - **Validates: Requirements 4.1, 4.3, 7.1**

- [x] 6. Partner Portal — Trips page
  - [x] 6.1 Implement trips list page with filters, search, and detail view
    - Create `app/(app)/partner-portal/trips/page.tsx`
    - Display all trips where `trip.partnerId === user.partnerId`, sorted by pickup date desc
    - Show trip ID, client name (resolved from clientId), pickup/dropoff address, pickup date, distance, status, payout amount (3-tier precedence: partnerRate → defaultRate → ratePerKm × distance)
    - Add status filter tabs: All, Active, Completed, Cancelled
    - Add search input (case-insensitive partial match on trip ID, pickup address, dropoff address)
    - Implement trip detail view (click row) showing full trip info + status timeline from statusLog + payout status
    - Show empty state message when no trips match
    - Read from `useTripStore`, `usePartnerStore`, `useAuthStore`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.1_

  - [ ]* 6.2 Write property test for trip search (Property 8)
    - **Property 8: Trip search case-insensitive partial matching**
    - Test that for any search query and trip set, results contain exactly trips matching query against ID/pickup/dropoff (lowercased)
    - **Validates: Requirements 5.4**

  - [ ]* 6.3 Write property test for status filtering (Property 6)
    - **Property 6: Status filtering correctness**
    - Test that for any collection of trips and selected filter, output contains exactly matching items
    - **Validates: Requirements 5.3, 6.7, 7.3**

- [x] 7. Partner Portal — Requests page
  - [x] 7.1 Implement requests page with list, form, and filters
    - Create `app/(app)/partner-portal/requests/page.tsx`
    - Display all partner requests where `request.partnerId === user.partnerId`, sorted by requestedAt desc
    - Show date, type, amount (₱ en-PH), reason, status with color-coded badges (pending→amber, approved→blue, rejected→red, released→green)
    - Add "New Request" button opening a form dialog with type select (diesel/cash_advance/other), amount input (>0 validation), optional reason textarea
    - Validate required fields on submit; show error for invalid data; on success create request with status "pending" via `usePartnerRequestStore.addRequest()`
    - Add status filter tabs: All, Pending, Approved, Rejected, Released
    - Show empty state when no requests match active filter
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 11.2_

  - [ ]* 7.2 Write property test for request validation (Property 5)
    - **Property 5: Request validation and creation**
    - Test that valid type + amount > 0 produces a pending request, and invalid submissions are rejected
    - **Validates: Requirements 6.3, 6.4, 6.5, 11.2**

- [x] 8. Checkpoint — Ensure overview, trips, and requests pages work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Partner Portal — Earnings page
  - [x] 9.1 Implement earnings page with KPIs, payout table, and filters
    - Create `app/(app)/partner-portal/earnings/page.tsx`
    - Display 4 KPI cards: Total Earnings (all-time), Paid Amount, Pending/Unpaid Amount, Trips Completed — all ₱ values formatted en-PH 2 decimal places
    - Display payout table showing trip ID, date completed, route (origin → destination), rate applied, payout amount (₱), payout status (pending/paid), sorted by date desc
    - Show payment date (partnerPayoutAt) for paid trips
    - Use 3-tier payout calculation precedence: partnerRate → defaultRate → ratePerKm × distanceKm; display ₱0.00 if none yields > 0
    - Add filter for payout status: All (default), Pending, Paid
    - Show only trips where partnerId matches AND status is "completed" or "delivered"
    - Show empty state with zero KPIs when no completed trips
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 9.2 Write property test for payout precedence calculation (Property 3)
    - **Property 3: Payout amount precedence calculation**
    - Test all combinations of partnerRate, defaultRate, ratePerKm × distanceKm to verify correct precedence
    - **Validates: Requirements 7.5**

- [x] 10. Partner Portal — Profile page
  - [x] 10.1 Implement read-only profile page
    - Create `app/(app)/partner-portal/profile/page.tsx`
    - Display "Profile" section Card: company name, contact person, phone, email, address, TIN, vehicle types (comma-separated)
    - Display "Banking" section Card: bank name, masked account number (last 4 visible, rest as asterisks)
    - Display "Rates" section Card: default rate and rate per km formatted ₱ en-PH 2 decimal places
    - Display partner status Badge: green for active, amber for suspended, neutral for inactive
    - Use read-only Card components; display "—" for optional fields with no value
    - Read partner data from `usePartnerStore` by matching `user.partnerId`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 11.3_

  - [ ]* 10.2 Write property test for bank account masking (Property 4)
    - **Property 4: Bank account number masking**
    - Test that for any string of length ≥ 4, output has first N-4 chars as "*" and last 4 matching original; strings < 4 returned as-is
    - **Validates: Requirements 8.2**

  - [ ]* 10.3 Write property test for profile field fallback (Property 9)
    - **Property 9: Profile field rendering with fallback**
    - Test that undefined/null/empty optional fields render "—" and defined fields render their value
    - **Validates: Requirements 8.1, 8.6**

- [x] 11. Partner Portal — Settings page
  - [x] 11.1 Implement settings page
    - Create `app/(app)/partner-portal/settings/page.tsx`
    - Display profile section showing user's full name, email, phone
    - Display notification preferences section with toggles for notification categories
    - Add Log Out button that clears auth session and redirects to login page
    - Follow the same layout pattern as the driver settings page (`app/(app)/driver/settings/page.tsx`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 12. Final integration and role-based access verification
  - [x] 12.1 Wire navigation filtering and verify partner data isolation
    - Ensure `navForRole("partner")` returns only partner-specific items (Partner Portal + Settings)
    - Ensure non-partner roles do NOT see `/partner-portal` routes in navigation
    - Verify all portal pages filter data by `user.partnerId` — no cross-partner data leakage
    - Verify login flow: `loginAsRole("partner")` returns user with valid partnerId matching a Partner in `usePartnerStore`
    - _Requirements: 1.5, 10.4, 11.4, 11.5_

  - [ ]* 12.2 Write property test for role-based navigation filtering (Property 1)
    - **Property 1: Role-based navigation filtering**
    - Test that for any role, navForRole returns only items where roles is undefined or includes that role; partner items only visible to partner role
    - **Validates: Requirements 2.8, 10.4**

  - [ ]* 12.3 Write property test for partner data isolation (Property 2)
    - **Property 2: Partner data isolation**
    - Test that filtering logic only returns trips/requests/profile matching user.partnerId and never returns data with a different partnerId
    - **Validates: Requirements 4.5, 5.1, 7.7, 11.1, 11.2**

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript/React (Next.js) with existing Zustand stores — no new stores needed
- All data filtering is client-side by matching `user.partnerId` against store records
- Currency formatting uses `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })` throughout

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "4.1", "4.2"] },
    { "id": 3, "tasks": ["5.1", "6.1", "7.1", "9.1", "10.1", "11.1"] },
    { "id": 4, "tasks": ["5.2", "6.2", "6.3", "7.2", "9.2", "10.2", "10.3"] },
    { "id": 5, "tasks": ["12.1"] },
    { "id": 6, "tasks": ["12.2", "12.3"] }
  ]
}
```
