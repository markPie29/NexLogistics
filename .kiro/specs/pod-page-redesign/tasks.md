# Implementation Plan: POD Page Redesign

## Overview

Transform the existing basic POD page into a professional SaaS dashboard with role-based views (Admin and Driver), KPI metrics, an enhanced data table with tabs/filtering/sorting/pagination, a POD detail drawer, and a refined mobile driver experience. Implementation follows a bottom-up approach: pure utility functions first, then UI components from leaf to root, then full page orchestration and wiring.

## Tasks

- [x] 1. Create POD utility functions and helper module
  - [x] 1.1 Create `lib/utils/pod-helpers.ts` with KPI, derivation, and formatting utilities
    - Implement `computePodKpis(trips, pods)` — returns `{ awaitingCount, capturedTodayCount, completionRate }` where completionRate is null when no delivered/completed trips exist
    - Implement `deriveAwaitingRows(trips, pods, drivers)` — returns `AwaitingPodRow[]` for trips with status "delivered"/"completed" that have no matching POD
    - Implement `deriveCapturedRows(trips, pods, drivers)` — returns `CapturedPodRow[]` for trips that have a matching POD record
    - Implement `filterPodRows(rows, filters, tab)` — case-insensitive partial match on Trip ID, Driver Name, and Receiver Name (captured tab only); AND logic with driver filter
    - Implement `sortPodRows(rows, sort)` — locale-aware string comparison for text columns, chronological for dates; supports asc/desc
    - Implement `paginatePodRows(rows, pagination)` — returns `{ pageRows, totalPages, totalCount }` with page size of 10
    - Implement `computeDriverPodSummary(trips, pods, driverId)` — returns `{ pendingCount, capturedCount, awaitingTrips, capturedItems }`
    - Implement `resolveDriverName(driverId, drivers)` — returns driver name or "Unassigned" if not found/undefined
    - Implement `formatPodDate(isoString)` — returns "MMM DD, YYYY HH:mm" formatted using en-PH locale
    - Implement `formatDeliveryDate(isoString)` — returns "MMM DD, YYYY" formatted using en-PH locale
    - Implement `formatCount(n)` — returns locale-formatted string with thousands separators
    - Define TypeScript interfaces: `PodKpiData`, `AwaitingPodRow`, `CapturedPodRow`, `PodFilters`, `PodSort`, `PodPagination`, `DriverPodSummary`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.9, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10, 6.3, 7.8, 12.1, 12.2, 12.3, 12.4_

- [x] 2. Checkpoint - Ensure utility functions compile and logic is sound
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement KPI Panel and Filter Bar components
  - [x] 3.1 Create `components/pod/PodKpiPanel.tsx`
    - Accept props: `awaitingCount`, `capturedTodayCount`, `completionRate`
    - Render 3 shadcn/ui Card components: "Awaiting POD" (amber #F59E0B icon), "Captured Today" (emerald #10B981 icon), "Completion Rate" (teal #66B2B2 icon)
    - Display "N/A" when completionRate is null; otherwise display rounded integer with "%" suffix
    - Format counts using `formatCount` for locale thousands separators
    - Responsive: 3-column grid on md+, horizontally scrollable row with CSS scroll-snap on mobile
    - Apply brand shadow-card elevation and rounded-lg border radius
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 3.2 Create `components/pod/PodFilterBar.tsx`
    - Accept props: `search`, `onSearchChange`, `driverFilter`, `onDriverFilterChange`, `drivers`, `resultCount`
    - Search input with max 100 characters, debounced at 300ms
    - Driver dropdown filter using shadcn/ui Select populated from drivers array; "All Drivers" option clears filter
    - aria-live="polite" region announcing result count changes
    - Responsive: stacks vertically below 768px
    - _Requirements: 4.6, 4.7, 9.7, 11.9_

- [x] 4. Implement Data Table and Detail Drawer components
  - [x] 4.1 Create `components/pod/PodDataTable.tsx`
    - Accept props: `activeTab`, `onTabChange`, `awaitingRecords`, `capturedRecords`, `sortColumn`, `sortDirection`, `onSort`, `currentPage`, `pageSize`, `onPageChange`, `onViewPod`
    - Render shadcn/ui Tabs with "Awaiting POD" and "Captured" tabs
    - Awaiting tab columns: Trip ID, Driver Name, Pickup Address (truncated 40 chars), Dropoff Address (truncated 40 chars), Delivery Date, Actions ("Capture" link to `/pod/{tripId}`)
    - Captured tab columns: Trip ID, Driver Name, Receiver Name, Capture Date, Evidence (pen-line icon for signature, camera icon + photo count), Actions ("View" button)
    - Semantic HTML table with scope="col" on all th elements
    - aria-sort on active sorted column header
    - Color-coded Badge: amber for awaiting, emerald for captured (with text labels)
    - Pagination controls: prev/next buttons, current page, total count (10 rows per page)
    - Empty state with ClipboardCheck icon when no records match
    - Transforms to card-based layout below 768px with 44x44px touch targets
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10, 9.2, 9.6, 11.1, 11.2, 11.5, 11.8_

  - [x] 4.2 Create `components/pod/PodDetailDrawer.tsx`
    - Accept props: `open`, `pod`, `tripId`, `onClose`
    - Uses shadcn/ui Sheet component (side="right"), 480px width on md+, full-screen on mobile
    - Displays: Trip ID, Receiver Name, Receiver Contact, Capture Timestamp (en-PH locale), GPS Coordinates (6 decimal places), Notes
    - Signature image with bordered container and "Signature" label; "No signature captured" placeholder when missing
    - Photo grid (2 columns) with thumbnails; lightbox overlay on click (90vw/90vh max, close button + Escape)
    - "No photos captured" placeholder when photoDataUrls is empty
    - Image error fallback: "Image failed to load"
    - Focus trap, Escape key close, returns focus to triggering button
    - aria-labelledby, role="dialog", aria-modal="true"
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.4, 11.3, 11.4, 11.7_

- [x] 5. Implement Driver View components
  - [x] 5.1 Create `components/pod/DriverPodList.tsx`
    - Accept props: `user`, `trips`, `pods`, `drivers`
    - Full 100dvh layout with overscroll-none
    - Sticky brand-navy header with hamburger (opens DriverSidebar), NE[X] LOGISTICS brand mark, notification bell with unread count (99+ overflow)
    - Title banner with FileImage icon in brand-teal/10 container, "Proof of Delivery" title, subtitle, Summary_Banner pills
    - Summary pills: amber "{count} Pending", emerald "{count} Captured" (filtered by current driver)
    - Scrollable content area with PodCardList
    - Integrates DriverNav (active="pod") and DriverSidebar
    - Filters trips to current driver: driverId from Auth_Store, fallback to first driver in Driver_Store
    - All interactive elements: 44x44px minimum touch targets
    - Max-width 448px container centered
    - Dark mode: content area uses brand-navy background, cards use navy-light
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 8.5, 8.6, 9.5, 10.3, 11.4, 11.6, 12.4_

  - [x] 5.2 Create `components/pod/PodCardList.tsx`
    - Accept props: `awaitingTrips`, `capturedTrips`, `onCapture`
    - "Awaiting POD" section: section header with count badge, cards with Trip ID, dropoff address (truncated), "Awaiting Capture" amber pill, chevron-right icon in teal/10 circle (36x36px); ordered by delivery date ascending
    - "Captured" section: section header with count badge, cards with Trip ID, receiver name, capture date ("MMM DD, YYYY • HH:mm" en-PH), "Done" emerald pill; ordered by capture timestamp descending
    - Empty states: "All caught up!" with CheckCircle2 icon (awaiting), "No PODs captured yet." with ClipboardCheck icon (captured)
    - White cards with rounded-2xl, gray-100 border, shadow-sm
    - Entire card surface tappable (44x44px min), navigates to `/pod/{tripId}`
    - Accessible button/anchor elements with Trip ID context in aria-label
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.4, 11.6_

- [x] 6. Checkpoint - Ensure all components compile and render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Admin View orchestrator component
  - [x] 7.1 Create `components/pod/PodAdminView.tsx`
    - Accept props: `trips`, `pods`, `drivers`
    - Orchestrates full Admin layout: PageHeader → PodKpiPanel → PodFilterBar → PodDataTable → PodDetailDrawer
    - Computes KPIs using `computePodKpis`
    - Derives awaiting/captured rows using `deriveAwaitingRows`/`deriveCapturedRows`
    - Manages local state: activeTab, search, driverFilter, sortColumn, sortDirection, currentPage, pageSize, drawerOpen, selectedPodId
    - Applies filter → sort → paginate pipeline using utility functions
    - Handles "View" action: opens PodDetailDrawer with selected POD data
    - Recomputes all derived data reactively when store data changes
    - PageHeader: breadcrumbs ["Operations", "Proof of Delivery"], title, subtitle
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 3.8, 4.4, 4.5, 10.2, 10.5, 12.5_

- [x] 8. Refactor page.tsx and wire everything together
  - [x] 8.1 Replace `app/(app)/pod/page.tsx` with role-based routing orchestrator
    - "use client" directive; import PodAdminView and DriverPodList from `components/pod/`
    - Read from usePodStore (pods), useTripStore (trips), useDriverStore (drivers), useAuthStore (user), useUiStore (darkMode, notifications)
    - Role check: admin/dispatcher/fallback → PodAdminView; driver/helper → DriverPodList
    - Display loading skeleton while Auth_Store is hydrating
    - Pass store data as props to the selected view component
    - Apply dark mode class via useUiStore
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.5, 10.6, 10.7, 10.8, 12.1, 12.2, 12.5_

- [x] 9. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Accessibility, dark mode, and responsive polish
  - [x] 10.1 Add comprehensive accessibility attributes across all POD components
    - Ensure all interactive elements are keyboard navigable (Tab, Enter, Escape, Arrow keys) in logical order
    - Add aria-label on all icon-only buttons (hamburger, bell, chevron, close, sort headers)
    - Verify semantic table markup with scope="col" attributes
    - Verify focus trap in PodDetailDrawer (Sheet)
    - Verify aria-live region announces filter result count
    - Ensure color is never the sole status indicator (all badges have text labels)
    - Verify 44x44px touch targets on mobile for both views
    - Verify aria-sort attribute updates on column sort
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [x] 10.2 Verify and polish dark mode across all POD components
    - Ensure all components use Tailwind dark: variants correctly
    - Admin View: dark backgrounds (navy-light #172033 for cards, brand-navy #0B1220 for page)
    - Verify 4.5:1 contrast ratio for normal text, 3:1 for large text/icons in dark mode
    - Verify POD_Table border colors maintain 3:1 contrast against card background
    - Driver View header/banner (already dark-themed) remains unchanged
    - Driver View content area: brand-navy background, cards use navy-light with proper border contrast
    - Badge components maintain proper contrast in dark mode
    - Dark mode toggle applies within 100ms without page reload
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x] 10.3 Verify responsive design across all breakpoints
    - Admin View renders correctly 320px–2560px without horizontal scroll
    - KPI Panel: 3-col grid on md+, scroll-snap row on mobile
    - POD Table: transforms to card layout below 768px
    - POD Detail Drawer: full-screen below 768px
    - Filter Bar: stacks vertically below 768px
    - Driver View: max-width 448px centered, full width below 448px
    - All interactive elements ≥ 44x44px on mobile
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 11. Write property-based tests for POD utility functions
  - [ ]* 11.1 Write property test for KPI computation (Property 1)
    - **Property 1: KPI computation correctness**
    - Test with arbitrary Trip[] and ProofOfDelivery[] arrays using fast-check
    - Verify awaitingCount = delivered/completed trips without matching POD
    - Verify capturedTodayCount = PODs with timestamp in today's calendar day
    - Verify completionRate = (matched pods / total delivered-completed) * 100, capped at 100, null when denominator is 0
    - Verify awaiting + matched = total delivered/completed trips
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [ ]* 11.2 Write property test for count formatting (Property 2)
    - **Property 2: Count formatting round-trip**
    - Test with arbitrary integers in [0, 99999]
    - Verify formatCount produces string with locale separators
    - Verify parsing non-separator characters back yields original integer
    - **Validates: Requirements 3.9**

  - [ ]* 11.3 Write property test for table sorting (Property 3)
    - **Property 3: Admin table sorting produces correct order**
    - Test with arbitrary AwaitingPodRow[] or CapturedPodRow[] and any sortable column
    - Verify ascending: each element's sort key ≤ next element's sort key
    - Verify descending: each element's sort key ≥ next element's sort key
    - Verify sorted array has same elements as input (no additions/omissions)
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 11.4 Write property test for combined filter logic (Property 4)
    - **Property 4: Combined filter logic (search + driver)**
    - Test with arbitrary rows, search strings (0–100 chars), and driver filters
    - Verify result contains exactly rows matching both search AND driver filter criteria
    - Verify no row outside the intersection appears in results
    - **Validates: Requirements 4.6, 4.7**

  - [ ]* 11.5 Write property test for pagination boundaries (Property 5)
    - **Property 5: Pagination boundaries**
    - Test with arbitrary N records and page size 10
    - Verify totalPages = ⌈N/10⌉
    - Verify each page (except last) has exactly 10 records
    - Verify last page has N mod 10 records (or 10 if evenly divisible)
    - Verify union of all pages = original array with no duplicates/omissions
    - **Validates: Requirements 4.10**

  - [ ]* 11.6 Write property test for driver POD summary (Property 6)
    - **Property 6: Driver POD summary computation**
    - Test with arbitrary trips, pods, and driverId
    - Verify pendingCount = driver's delivered/completed trips without POD
    - Verify capturedCount = driver's trips with matching POD
    - Verify pending + captured = total delivered/completed trips for driver
    - **Validates: Requirements 6.3, 12.4**

  - [ ]* 11.7 Write property test for driver card ordering (Property 7)
    - **Property 7: Driver card ordering**
    - Test with arbitrary awaiting trips for a driver
    - Verify cards ordered by delivery date ascending (each ≤ next)
    - Test with arbitrary captured items for a driver
    - Verify cards ordered by POD timestamp descending (each ≥ next)
    - **Validates: Requirements 7.8**

  - [ ]* 11.8 Write property test for driver name resolution (Property 8)
    - **Property 8: Driver name resolution**
    - Test with arbitrary driverId and Driver[] array
    - Verify: if driverId matches a driver, resolved name = driver.name
    - Verify: if driverId is undefined or no match, resolved name = "Unassigned"
    - **Validates: Requirements 12.3**

- [x] 12. Final checkpoint - Full feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check with Vitest
- Unit tests validate specific examples and edge cases
- The project already has shadcn/ui, lucide-react, and Tailwind — no new dependencies needed
- Existing Zustand stores (usePodStore, useTripStore, useDriverStore, useAuthStore, useUiStore) are used as-is without modification
- All local POD UI state uses React useState hooks per Requirement 10.5
- The `components/pod/` directory is new and will be created with the first component
- The `lib/utils/pod-helpers.ts` file is new and will be created in the existing `lib/utils/` directory

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["3.1", "3.2"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["7.1"] },
    { "id": 4, "tasks": ["8.1"] },
    { "id": 5, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 6, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8"] }
  ]
}
```
