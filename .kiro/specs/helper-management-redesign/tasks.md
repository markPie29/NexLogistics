# Implementation Plan: Helper Management Redesign

## Overview

Complete redesign of the Helper Management pages (`/helpers` list and `/helpers/[id]` detail) to match the quality, completeness, and professionalism of the existing Driver Management pages. Implementation follows a bottom-up approach: type extensions and seed data first, then utility functions, then the AddHelperSheet form component, then the list page, then the detail page with all tabs, and finally responsive polish.

## Tasks

- [x] 1. Extend Helper type and seed data with performance fields
  - [x] 1.1 Add performance fields to the Helper interface in `lib/types.ts`
    - Add `rating?: number` field (0–5, default 0)
    - Add `onTimePercent?: number` field (0–100, default 100)
    - Add `totalTrips?: number` field (non-negative integer, default 0)
    - Ensure fields are optional (`?`) for backward compatibility with existing records
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Update seed data in `lib/data/helpers.ts` with realistic performance values
    - Add `rating`, `onTimePercent`, and `totalTrips` values to all existing seed helper records
    - Ensure variety in values (e.g., ratings from 3.2–4.5, onTimePercent from 78–95, totalTrips from 8–47)
    - Ensure all seed records also have `employmentType`, `monthlyBaseSalary`, `baseRatePerTrip` fields populated for payroll tab testing
    - _Requirements: 1.5_

- [x] 2. Create helper utility functions
  - [x] 2.1 Create `lib/services/helper-utils.ts` with pure utility functions
    - Implement `applyHelperDefaults(helper)` — returns helper with `rating ?? 0`, `onTimePercent ?? 100`, `totalTrips ?? 0`
    - Implement `computeHelperCounts(helpers)` — returns `{ total, active, off_duty, on_leave }` counts
    - Implement `formatRating(rating: number)` — returns string formatted to one decimal place (e.g., "4.0")
    - Implement `getHelperTripCount(helper, tripCountMap)` — returns `helper.totalTrips` if > 0, else `tripCountMap[helper.id] ?? 0`
    - Implement `resolveHelperVehicle(helper, drivers, vehicles)` — returns `{ driver?, vehicle? }` via chain resolution
    - Implement `filterHelpers(helpers, search, statusFilter)` — AND logic: name/phone case-insensitive partial match + status filter
    - Implement `getHelperTrips(trips, helperId)` — returns filtered trips sorted by date descending
    - Implement `findActiveTrip(trips, helperId)` — returns first trip with active status (in_transit, loaded, vehicle_dispatched, driver_assigned)
    - Implement `computeTotalEarned(summaries)` — returns sum of netPay for paid summaries
    - Implement `computeProgressWidth(value, max)` — returns `(value / max) * 100` clamped to 0–100
    - _Requirements: 1.4, 2.4, 3.2, 3.4, 3.5, 4.1, 4.4, 11.2, 11.3, 11.4, 13.3, 13.4, 14.1, 14.3, 16.1_

  - [x] 2.2 Write property tests for helper utility functions (Properties 1–6)
    - **Property 1: Backward compatibility defaults** — verify `applyHelperDefaults` produces correct defaults for missing fields
    - **Validates: Requirements 1.4**
    - **Property 2: KPI status count computation** — verify counts match actual statuses and sum equals total
    - **Validates: Requirements 2.4**
    - **Property 3: Rating formatting** — verify output always has exactly one decimal place for any value in [0, 5]
    - **Validates: Requirements 3.2**
    - **Property 4: Trip count source logic** — verify fallback logic (totalTrips > 0 uses field, else uses map)
    - **Validates: Requirements 3.4**
    - **Property 5: Vehicle resolution chain** — verify correct resolution through driver→vehicle chain
    - **Validates: Requirements 3.5, 12.2**
    - **Property 6: Combined filter logic** — verify AND logic produces exactly matching results
    - **Validates: Requirements 4.1, 4.4, 4.5**

  - [x] 2.3 Write property tests for helper utility functions (Properties 10–16)
    - **Property 10: Progress bar width computation** — verify `(value / max) * 100` clamped to [0, 100]
    - **Validates: Requirements 11.2, 11.3**
    - **Property 11: Trip count derivation** — verify completed/delayed counts from filtered trips
    - **Validates: Requirements 11.4**
    - **Property 12: Trip history filtering and sorting** — verify filter by helperId and descending date sort
    - **Validates: Requirements 13.3, 13.4**
    - **Property 13: Total earned computation** — verify sum of netPay for paid summaries only
    - **Validates: Requirements 14.1**
    - **Property 14: Payroll summaries filtering and sorting** — verify filter by helperId and descending endDate sort
    - **Validates: Requirements 14.3**
    - **Property 15: Active trip selection** — verify returns first trip matching active statuses
    - **Validates: Requirements 16.1**
    - **Property 16: POD indicator logic** — verify truthy `podSubmittedAt` produces icon, falsy produces dash
    - **Validates: Requirements 20.1**

- [x] 3. Checkpoint - Ensure type extensions and utilities compile correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement AddHelperSheet component
  - [x] 4.1 Create `components/forms/AddHelperSheet.tsx`
    - Follow the same component structure and prop interface as AddDriverSheet
    - Accept `open`, `onOpenChange`, and optional `editHelper` props
    - Implement zod schema with required Name (max 100) and Phone fields, optional Email, Address, Emergency Contact, Notes (max 500)
    - Include Status dropdown (Active, Off Duty, On Leave), Assigned Driver dropdown (populated from `useDriverStore` with "None" option), Employment Type dropdown (Per Trip, Monthly, Hybrid)
    - Conditionally show Monthly Salary (when monthly/hybrid) and Per Trip Rate (when per_trip/hybrid)
    - Include Rate per KM (optional numeric) and Commission % (optional 0–100)
    - Show inline validation errors below invalid fields on submit attempt
    - In add mode: heading "Add Helper", empty form, calls `addHelper` on submit, toast "Helper {name} added"
    - In edit mode: heading "Edit Helper", pre-populated fields, calls `updateHelper` on submit, toast "Helper {name} updated"
    - Close without saving on Cancel click or outside click
    - Render as full-width sheet on viewports below 768px
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 18.4, 19.4_

  - [x] 4.2 Write property test for form validation (Property 9)
    - **Property 9: Form validation rejects empty required fields**
    - Test that any submission with empty `name` or empty `phone` returns validation errors
    - Test that valid submissions pass validation
    - **Validates: Requirements 8.5**

- [x] 5. Implement Helper List Page
  - [x] 5.1 Rewrite `app/(app)/helpers/page.tsx` as full-featured list page
    - "use client" directive; import from useHelperStore, useDriverStore, useFleetStore, useTripStore
    - Implement PageHeader with breadcrumbs (Operations > Helpers), title "Helper Management", subtitle "Manage loaders, helpers, and assistant crew assigned to drivers", and "Add Helper" button
    - Implement KPI_Panel with 4 KpiCard components (Total Helpers, Active, Off Duty, On Leave) using `computeHelperCounts`
    - KPI panel: 2-column grid below 768px, 4-column grid on md+
    - Implement filter toolbar with search input (case-insensitive name/phone match, clear button) and status dropdown (All Statuses, Active, Off Duty, On Leave)
    - Implement data table with columns: Helper (avatar + name + phone), Assigned Driver, Vehicle (resolved), Rating (star + value), On-Time % (progress bar + value), Trips (count), Status (badge), Actions (dropdown)
    - Table minimum width 860px with horizontal scroll on smaller viewports
    - Implement result count footer "Showing X of Y helper(s)"
    - Wire AddHelperSheet for add (from header button) and edit (from row action)
    - Implement row actions dropdown: View Profile (navigates to `/helpers/{id}`), Edit Helper, separator, Set Active/Off Duty/On Leave (conditional), separator, Delete Helper (destructive)
    - Implement status change with toast "{helper name} marked as {new status}"
    - Implement delete confirmation dialog with warning icon, "Remove Helper" title, helper name in description, Cancel and "Remove Helper" destructive buttons
    - On delete confirm: remove from store, toast "Helper {name} removed"
    - Implement empty states: no matches (Users icon + adjust criteria message), zero helpers (add first helper message + Add Helper button)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4, 18.1, 18.2, 18.5, 19.1, 19.2, 19.3, 19.6_

  - [x] 5.2 Write property tests for store operations (Properties 7–8)
    - **Property 7: Status change updates store** — verify only status field changes, all other fields preserved
    - **Validates: Requirements 6.1, 6.2**
    - **Property 8: Delete removes helper** — verify helper removed, all other helpers unchanged
    - **Validates: Requirements 7.3**

- [x] 6. Checkpoint - Ensure list page renders and all interactions work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Helper Detail Page — Profile and Analytics
  - [x] 7.1 Rewrite `app/(app)/helpers/[id]/page.tsx` with profile hero and performance sections
    - "use client" directive; import from useHelperStore, useDriverStore, useFleetStore, useTripStore, usePayrollPeriodStore, useDriverPayrollProfileStore
    - Implement PageHeader with breadcrumbs (Operations > Helpers > {name}), title as helper name, subtitle as employment type
    - PageHeader actions: Back button (→ /helpers), Edit button (opens AddHelperSheet edit mode), Delete button (destructive icon-only, opens confirmation dialog)
    - Implement stat row with 4 StatCard components: Status (color variant), On-Time Rate (%), Total Trips (count), Rating (X / 5)
    - Implement profile hero card: avatar (initials, 20x20 rounded, brand-navy bg), name + status badge, info grid (Phone, Email, Address, Emergency Contact, Hire Date, Employment Type, Assigned Driver, Assigned Vehicle)
    - Info grid: 3-column on desktop, 1-column below 768px
    - Display "Unassigned" / "—" for missing driver/vehicle
    - Implement Performance_Card: "Performance Analytics" title, on-time delivery progress bar (teal), rating progress bar (amber, star icon), 2-column metric boxes (Completed Trips on teal bg, Delayed Trips on amber bg)
    - Implement Vehicle_Card alongside Performance_Card in 2-column grid (stacks on mobile)
    - Vehicle_Card: resolve via driver→vehicle chain, show truck icon, plate, details (brand, model, year), status badge, type badge, "View Vehicle" button (→ /fleet/{id})
    - Vehicle_Card empty states: "No vehicle assigned" (no driver) or "Driver has no vehicle assigned" (driver exists, no vehicle)
    - Implement delete confirmation dialog matching list page pattern
    - On delete confirm: remove from store, toast, navigate to /helpers
    - Handle helper not found: show "Helper not found" message with Back button
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 17.1, 17.2, 17.3, 18.1, 18.3, 18.7, 19.1, 19.5, 19.6_

- [x] 8. Implement Helper Detail Page — Tabs
  - [x] 8.1 Implement Tabs component with Trip History tab
    - Add Tabs component with four tabs: "Trip History ({count})", "Payroll Summary", "Payroll Settings", "Active Trip"
    - Tab list: `overflow-x-auto` and `whitespace-nowrap` for narrow viewports
    - Trip History table columns: Trip ID (clickable → /trips/{id}), Route (pickup → dropoff), Helper Rate (currency from helperRate or helperFee), Status (badge), POD (document icon if podSubmittedAt truthy, else "—"), Approval (badge for completed/delivered trips)
    - POD column between Status and Approval columns
    - POD icon clickable → navigates to trip detail
    - Source data from Trip_Store filtered by helper's ID, sorted newest first
    - Table minimum width 740px with horizontal scroll
    - Empty state: Route icon + "No trip history."
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 18.6, 20.1, 20.2, 20.3_

  - [x] 8.2 Implement Payroll Summary tab
    - Display total earned amount (sum of paid summaries' netPay) formatted as currency, bold
    - Table columns: Period (name), Mode, Trips (count), Trip Earnings (currency), Incentives (green, +prefix), Deductions (red, −prefix), Net Pay (bold currency), Status (badge: success/paid, info/approved, neutral/draft)
    - Source from usePayrollPeriodStore summaries filtered by `s.driverId === helper.id`, sorted by period endDate descending
    - Clicking a row navigates to `/payroll/{payrollPeriodId}`
    - Empty state: Wallet icon + "No payroll records yet." + "Run a payroll period to see earnings here."
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 19.6_

  - [x] 8.3 Implement Payroll Settings tab
    - Display payroll configuration card with "Payroll Settings" title and Settings icon
    - Rate cards grid: Employment Type (capitalized), Monthly Salary (currency, when applicable), Per Trip Rate (currency, when applicable), Per KM Rate (when applicable), Commission % (when applicable)
    - Government deduction tiles: SSS, PhilHealth, Pag-IBIG, Withholding Tax — green checkmark for enabled, gray alert for disabled
    - Source from useDriverPayrollProfileStore if profile exists for helper; fallback to helper's inline rate fields
    - Empty state: Settings icon + "No payroll profile configured." + link to Payroll module
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 8.4 Implement Active Trip tab
    - Search Trip_Store for trip where `helperId` matches AND status is one of: "in_transit", "loaded", "vehicle_dispatched", "driver_assigned"
    - When found: display trip ID (bold, teal), route (pickup → dropoff), status badge (info variant), ETA (formatted or "—"), "View Trip Detail" button (→ /trips/{id})
    - Empty state: Route icon + "No active trip assigned."
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 9. Checkpoint - Ensure detail page renders with all tabs functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Design system consistency and responsive polish
  - [x] 10.1 Verify and polish design system consistency across both pages
    - Confirm PageHeader usage with correct props (title, subtitle, breadcrumbs, actions)
    - Confirm KpiCard usage from `components/dashboard/KpiCard.tsx`
    - Confirm all shadcn/ui components imported from `components/ui/` (Card, Badge, Button, Input, Select, Dialog, Sheet, Tabs, DropdownMenu, Avatar)
    - Confirm `formatCurrency` from `lib/utils` used for all monetary values
    - Confirm brand design tokens: teal primary, navy text, gray-50 table headers, brand-border dividers, shadow-card on cards
    - Confirm StatCard and InfoRow helper components match driver detail page class names and sizing
    - Confirm no new external dependencies introduced
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [x] 10.2 Verify responsive behavior at all breakpoints
    - KPI panel: 2-col below 768px, 4-col on md+
    - Performance + Vehicle cards: stacked below 768px, side-by-side on md+
    - AddHelperSheet: full-width below 768px
    - Data tables: horizontal scroll with min-width (860px list, 740px trip history)
    - Tabs: overflow-x-auto + whitespace-nowrap
    - Profile hero info grid: 3-col desktop → 1-col below 768px
    - All content accessible from 320px to 2560px viewport width
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [x] 11. Final checkpoint - Full feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already has shadcn/ui, Zustand, react-hook-form, zod, lucide-react, and sonner — no new dependencies needed
- Existing Zustand stores (useHelperStore, useDriverStore, useFleetStore, useTripStore, usePayrollPeriodStore, useDriverPayrollProfileStore) are used as-is
- The `lib/services/` directory may already exist from other features; helper-utils.ts is new
- The `components/forms/AddHelperSheet.tsx` is new, following AddDriverSheet pattern
- Vehicle resolution always follows the chain: helper → driver → vehicle (helpers never own vehicles directly)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "7.1"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["10.1", "10.2"] }
  ]
}
```
