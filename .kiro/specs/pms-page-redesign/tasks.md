# Implementation Plan: PMS Page Redesign

## Overview

Transform the existing basic PMS page into a premium SaaS dashboard with enhanced analytics, multi-view data interface, bulk operations, vehicle history, cost analytics, and export capabilities. Implementation follows a bottom-up approach: pure utility functions first, then UI components from leaf to root, then full page orchestration.

## Tasks

- [x] 1. Set up project structure and shared utilities
  - [x] 1.1 Add missing shadcn/ui components (Calendar, Checkbox) to `components/ui/`
    - Run `npx shadcn-ui@latest add calendar checkbox` or manually create the components following shadcn/ui patterns
    - Ensure Calendar component supports month navigation, today highlighting, and date selection
    - Ensure Checkbox component supports checked, unchecked, and indeterminate states
    - _Requirements: 14.1_

  - [x] 1.2 Create PMS utility functions in `lib/services/pms-utils.ts`
    - Implement `computeStatusCounts(records)` — returns counts for overdue, due_soon, upcoming, completed
    - Implement `computeWeeklySparkline(records, status, weeks=8)` — returns weekly count array for sparkline
    - Implement `computeMonthlyCosts(records, months=6)` — returns monthly cost aggregation array
    - Implement `computeMonthOverMonth(records)` — returns current/previous month comparison with percentage change or "N/A"
    - Implement `computeServiceTypeCosts(records, months=6)` — returns breakdown by service type with totals and percentages
    - Implement `computeVehicleStats(records)` — returns lifetime cost sum and completed count for a vehicle
    - Implement `findMostOverdue(records)` — returns the overdue record with earliest dueDate
    - Implement `formatCurrency(amount)` — returns PHP ₱ formatted string using en-PH locale
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5, 8.2_

  - [x] 1.3 Create PMS filter, sort, and pagination utilities in `lib/services/pms-filters.ts`
    - Implement `filterRecords(records, vehicles, { search, statuses, dateRange })` — combined AND filter logic
    - Implement `sortRecords(records, vehicles, column, direction)` — multi-column sort with plate resolution
    - Implement `paginateRecords(records, pageSize, currentPage)` — returns page slice, total pages, total count
    - Implement `toggleSelectAll(currentPageIds, selectedIds)` — returns updated Set with select-all/deselect-all logic
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 4.1_

  - [x] 1.4 Create form validation utility in `lib/services/pms-validation.ts`
    - Implement `validateScheduleForm(data: ScheduleFormData)` — returns ScheduleFormErrors or null
    - Implement `isFormDirty(current, initial)` — returns boolean if any field differs
    - Validate: vehicleId required, type 1-100 chars, dueDate today or future, dueOdometer 0-9999999, cost 0.01-99999999.99, notes max 500 chars
    - _Requirements: 5.2, 5.6, 5.7, 5.9_

  - [x] 1.5 Create export service in `lib/services/pms-export.ts`
    - Implement `generateCsv(records, vehicles)` — generates CSV string with proper escaping and header row
    - Implement `exportPmsReport({ records, vehicles, format })` — triggers browser download for CSV; PDF uses browser print/canvas approach
    - Implement `generateExportFilename(format)` — returns `pms-report-{YYYY-MM-DD}.{csv|pdf}`
    - CSV columns: Vehicle Plate, Service Type, Due Date, Due Odometer, Cost, Status, Completed At, Notes
    - PDF: A4 layout with NexLogistics branding header, timestamp, table of records
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 1.6 Create PMS TypeScript interfaces in `lib/services/pms-types.ts`
    - Define `PmsFilters`, `PmsSort`, `CalendarEvent`, `WeeklyCount`, `MonthlyCost`, `ServiceTypeCost`
    - Define `ScheduleFormData`, `ScheduleFormErrors`
    - Define `PmsPageState` interface consolidating all local state
    - Re-export relevant types from `lib/types.ts` (MaintenanceRecord, Vehicle, MaintenanceStatus)
    - _Requirements: 14.2, 14.5_

- [x] 2. Checkpoint - Ensure utility functions compile and unit logic is sound
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement KPI and Alert components
  - [x] 3.1 Create `components/pms/PmsKpiPanel.tsx`
    - Accept `records: MaintenanceRecord[]` prop
    - Compute status counts using `computeStatusCounts`
    - Compute 8-week sparkline data per status using `computeWeeklySparkline`
    - Compute current month cost total using `computeMonthlyCosts`
    - Render 5 KpiCard components (Overdue, Due Soon, Upcoming, Completed, Monthly Cost)
    - Apply pulsing red animation on Overdue card when count > 0 (CSS animate-pulse, 2s cycle)
    - Responsive grid: 2 columns below 768px, 5 columns on md+
    - Format cost using `formatCurrency` (₱ en-PH locale)
    - Handle empty records gracefully (0 counts, ₱0.00)
    - Add visually hidden text descriptions for sparklines (metric name, value, trend) for screen readers
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 11.3, 15.5_

  - [x] 3.2 Create `components/pms/PmsAlertBanner.tsx`
    - Accept props: overdueRecords, vehicles, dismissed, onDismiss, onViewAll
    - Render only when overdue count > 0 and not dismissed
    - Display total overdue count and most-overdue item (earliest dueDate) plate + service type
    - "View All Overdue" button triggers onViewAll callback
    - Dismiss button hides banner; uses `role="alert"` and `aria-live="polite"`
    - Use Card with destructive/danger background styling
    - Do not render in DOM when no overdue records
    - _Requirements: 1.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 15.7_

- [x] 4. Implement Toolbar and Bulk Action components
  - [x] 4.1 Create `components/pms/PmsToolbar.tsx`
    - Accept props: search, onSearchChange, statusFilter, onStatusFilterChange, dateRange, onDateRangeChange, viewMode, onViewModeChange, onExport, filteredCount
    - Search input with Search icon, performs live filtering (min 1 char)
    - Status multi-select dropdown (overdue, due_soon, upcoming, completed)
    - Date range filter with start/end date pickers
    - View toggle buttons (Table / Calendar) with icon indicators
    - Export dropdown button with "Export as CSV" and "Export as PDF" options
    - Wrap in Card with brand shadow and rounded-2xl
    - All controls keyboard accessible, aria-labels on icon-only buttons
    - _Requirements: 1.2, 1.4, 3.4, 3.5, 3.6, 7.1, 10.1, 15.1, 15.4_

  - [x] 4.2 Create `components/pms/PmsBulkActionToolbar.tsx`
    - Accept props: selectedCount, onMarkComplete, onDelete, onExportSelected, onClearSelection
    - Render only when selectedCount > 0
    - Display "{N} items selected" with clear selection button
    - "Mark Complete" button triggers bulk status update
    - "Delete" button opens confirmation Dialog with record count; confirm triggers onDelete, cancel preserves state
    - "Export Selected" button triggers onExportSelected (CSV of selected rows)
    - Uses `aria-live="polite"` to announce selection count changes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 15.10_

- [x] 5. Implement Data Table component
  - [x] 5.1 Create `components/pms/PmsDataTable.tsx`
    - Accept props: records, vehicles, sortColumn, sortDirection, onSort, selectedIds, onSelectionChange, pageSize, currentPage, onPageChange, onPageSizeChange, onEditRecord, onDeleteRecord, onVehicleClick
    - Semantic HTML table: `<table>`, `<thead>`, `<th scope="col">`, `<tbody>`, `<td>`
    - Columns: Checkbox, Vehicle (clickable plate), Service Type, Due Date, Due Odometer, Estimated Cost, Status (Badge), Actions (Edit/Delete)
    - Sortable column headers with click-to-sort and direction indicator
    - Checkbox per row + select-all in header (current page only)
    - Color-coded status Badges: red=overdue, amber=due_soon, blue=upcoming, green=completed (with text labels, not color-only)
    - Vehicle plate clickable to open history panel; inactive vehicles shown muted with "inactive" label
    - Unresolved vehicleId shown raw with "unavailable" indicator
    - Pagination controls: page size selector (10/25/50), page navigation, "Page X of Y (Z records)"
    - Empty state with illustration, message, and "Clear Filters" button
    - Below 768px: transforms to card-based list layout (one card per record showing plate, type, due date, status)
    - 44x44px minimum touch targets on mobile
    - _Requirements: 1.6, 3.1, 3.2, 3.3, 3.8, 3.9, 3.10, 4.1, 11.2, 11.5, 13.1, 13.3, 13.5, 15.1, 15.2, 15.4, 15.8_

- [x] 6. Implement Calendar View component
  - [x] 6.1 Create `components/pms/PmsCalendarView.tsx`
    - Accept props: records, vehicles, onEventClick
    - Monthly calendar grid with day cells using ARIA grid/gridcell roles
    - Each event shows vehicle plate + service type label
    - Color-coded events by status (red, amber, blue, green) with text labels
    - Today highlighted with brand teal (#66B2B2) indicator
    - Month navigation arrows (previous/next month)
    - Overflow: show first 3 events per cell + "+N more" indicator; clicking overflow opens Popover with full list
    - Each gridcell has aria-label with date and event count
    - Clicking an event triggers onEventClick to open edit modal
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 12.4, 15.6_

- [x] 7. Checkpoint - Ensure table and calendar components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Schedule Modal and Vehicle History Panel
  - [x] 8.1 Create `components/pms/PmsScheduleModal.tsx`
    - Accept props: open, mode ("add"|"edit"), record, vehicles, onSubmit, onClose
    - Renders as shadcn/ui Sheet (slide-over drawer from right); full-screen sheet on mobile (<768px)
    - Heading: "Add Schedule" in add mode, "Edit Schedule" in edit mode
    - Form fields: Vehicle dropdown (filtered from FleetStore: available/in_trip/maintenance, sorted by plate), Service Type (text + suggestion list), Due Date (date picker, today or future only), Due Odometer (optional, 0-9999999), Estimated Cost (optional, ₱ format, 0.01-99999999.99), Notes (optional textarea, max 500 chars)
    - Inline validation using `validateScheduleForm`; aria-invalid and aria-describedby on invalid fields
    - Submit disabled until form is dirty (uses `isFormDirty`)
    - On submit: calls onSubmit with form data, closes drawer, toast notification
    - Cancel/outside click: closes without saving
    - Focus trap within the Sheet; return focus to trigger element on close
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 11.4, 13.2, 15.1, 15.3, 15.9_

  - [x] 8.2 Create `components/pms/PmsVehicleHistoryPanel.tsx`
    - Accept props: vehicleId, records, vehicle, open, onClose
    - Renders as shadcn/ui Sheet (slide-over drawer from right)
    - Summary header: plate number, brand/model/year, current odometer, lifetime cost (₱), completed count
    - Mini timeline: 12-month bar/dot visualization showing service count per month
    - Record list in reverse chronological order: service type, date, cost (₱), status badge
    - Paginated at 50 records per page
    - Empty state when vehicle has no records
    - Close on button click or Escape key
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 13.4_

- [x] 9. Implement Cost Analytics component
  - [x] 9.1 Create `components/pms/PmsCostAnalytics.tsx`
    - Accept props: records, collapsed, onToggleCollapse
    - Collapsible section (Card) with chevron toggle; defaults expanded; collapse state persisted in sessionStorage
    - Monthly bar chart (recharts BarChart): 6 months of maintenance cost aggregation
    - Service type breakdown (recharts PieChart or horizontal BarChart): total per type with percentage
    - Month-over-month comparison: current vs previous month total, percentage change with directional arrow and color (red increase, green decrease), "N/A" when previous = ₱0
    - All monetary values formatted with `formatCurrency` (₱ en-PH)
    - Empty state when no cost data exists in the 6-month window
    - Charts maintain 4.5:1 contrast in dark mode
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 12.2_

- [x] 10. Implement Page Orchestrator
  - [x] 10.1 Replace `app/(app)/pms/page.tsx` with new orchestrator component
    - "use client" directive; import all PMS components from `components/pms/`
    - Read from useMaintenanceStore (records), useFleetStore (vehicles), useUiStore (darkMode)
    - Initialize all local state: search, statusFilter, dateRange, viewMode, sortColumn/direction, pageSize, currentPage, selectedIds, modalState, vehicleHistoryId, alertDismissed (sessionStorage), costAnalyticsCollapsed (sessionStorage)
    - Wire PageHeader with breadcrumbs ["Operations", "PMS"], title, subtitle, "Add Schedule" button
    - Compose components in order: KpiPanel → AlertBanner → Toolbar → BulkActionToolbar → DataView (table or calendar) → CostAnalytics
    - Implement filter/sort/paginate pipeline using utility functions
    - Handle bulk operations: markComplete (updateRecord in loop + toast), delete (confirmation → deleteRecord in loop + toast), exportSelected (CSV of selected)
    - Handle add/edit: open modal → on submit → addRecord or updateRecord → close modal → toast
    - Handle vehicle click → open history panel
    - Handle alert dismiss (sessionStorage) with reappear on count change
    - Handle export: check filtered count > 0, call exportPmsReport, success/error toast
    - Apply skeleton placeholders while store is hydrating (max 5s)
    - Dark mode class applied via useUiStore; ensure no flash on reload
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.3, 4.4, 4.7, 4.8, 5.3, 5.4, 5.5, 7.1, 8.3, 8.5, 8.6, 10.5, 10.6, 10.7, 11.1, 11.6, 12.1, 12.6, 12.7, 14.3, 14.4, 14.5, 14.6_

- [x] 11. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Accessibility and dark mode polish
  - [x] 12.1 Add comprehensive accessibility attributes across all PMS components
    - Ensure all interactive elements are keyboard navigable (Tab, Enter, Escape, Arrow keys) in logical order
    - Add aria-label/aria-labelledby on all icon-only buttons
    - Verify semantic table markup with scope attributes
    - Verify focus trap in Schedule_Modal and VehicleHistoryPanel
    - Verify aria-live regions on AlertBanner and BulkActionToolbar
    - Ensure color is never the sole status indicator (all badges have text labels)
    - Verify 44x44px touch targets on mobile
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.7, 15.8, 15.10_

  - [x] 12.2 Verify and polish dark mode across all PMS components
    - Ensure all components use Tailwind dark: variants correctly
    - Verify Card backgrounds use brand navy-light (#172033) via --card CSS property
    - Verify chart colors maintain 4.5:1 contrast in dark mode
    - Verify AlertBanner uses destructive CSS property with proper contrast
    - Verify Calendar grid lines and text contrast in dark mode
    - Verify badge colors remain accessible in dark mode
    - Confirm no flash of wrong theme on page reload (useUiStore persistence)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 1.5_

- [x] 13. Final checkpoint - Full feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (none in this plan — all tasks are core implementation)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The project already has recharts, shadcn/ui, framer-motion, lucide-react — no new dependencies needed
- Existing Zustand stores (useMaintenanceStore, useFleetStore, useUiStore) are used as-is without modification
- All local PMS UI state uses React useState/useReducer per Requirement 14.5
- The `lib/services/` directory is new and will be created with the first utility file
- The `components/pms/` directory is new and will be created with the first component

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.6"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["3.1", "3.2", "4.1", "4.2"] },
    { "id": 3, "tasks": ["5.1", "6.1"] },
    { "id": 4, "tasks": ["8.1", "8.2", "9.1"] },
    { "id": 5, "tasks": ["10.1"] },
    { "id": 6, "tasks": ["12.1", "12.2"] }
  ]
}
```
