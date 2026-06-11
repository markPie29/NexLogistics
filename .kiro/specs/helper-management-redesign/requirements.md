# Requirements Document

## Introduction

Complete redesign of the Helper Management pages (`/helpers` list and `/helpers/[id]` detail) to match the quality, completeness, and professionalism of the existing Driver Management pages. The redesign introduces performance metrics (rating, on-time percentage, trip count), a tabbed detail view with Trip History, Payroll Summary, Payroll Settings, and Active Trip tabs, full CRUD via a side-sheet component, status quick-change actions, delete confirmations, POD history visibility, and consistent responsive design matching the NexLogistics design system.

## Glossary

- **Helper_List_Page**: The redesigned helper list page at `app/(app)/helpers/page.tsx`, displaying all helpers in a searchable, filterable data table with performance columns and inline actions.
- **Helper_Detail_Page**: The redesigned helper detail page at `app/(app)/helpers/[id]/page.tsx`, displaying a full profile, performance analytics, assigned vehicle (resolved through the helper's assigned driver), and tabbed content sections.
- **AddHelperSheet**: A slide-over sheet component at `components/forms/AddHelperSheet.tsx` used for creating new helpers and editing existing ones, following the same pattern as AddDriverSheet.
- **Helper_Store**: The Zustand store (`useHelperStore`) managing helper records with add, update, and delete operations.
- **Driver_Store**: The Zustand store (`useDriverStore`) providing driver data used to resolve assigned driver relationships and their vehicles.
- **Fleet_Store**: The Zustand store (`useFleetStore`) providing vehicle data resolved via a helper's assigned driver's `assignedVehicleId`.
- **Trip_Store**: The Zustand store (`useTripStore`) providing trip records filterable by `helperId`.
- **Helper_Payroll_Store**: The payroll computation utilities in `lib/store/payroll-helpers.ts` that build payroll summaries for helpers.
- **Payroll_Period_Store**: The Zustand store (`usePayrollPeriodStore`) providing payroll periods and summaries.
- **KPI_Panel**: The section at the top of the Helper_List_Page displaying key metrics (total, active, off duty, on leave) in card format with sparklines.
- **Performance_Card**: A card on the Helper_Detail_Page showing on-time delivery percentage, rating, completed trips, and delayed trips with visual progress indicators.
- **Vehicle_Card**: A card on the Helper_Detail_Page showing the vehicle assigned to the helper's driver (resolved via Driver_Store then Fleet_Store).
- **Helper**: The data model representing a helper/loader, extended with `rating`, `onTimePercent`, and `totalTrips` fields for performance tracking.

## Requirements

### Requirement 1: Helper Type Extension with Performance Fields

**User Story:** As a fleet manager, I want helpers to have performance metrics just like drivers, so that I can evaluate helper quality and make assignment decisions based on data.

#### Acceptance Criteria

1. THE Helper interface in `lib/types.ts` SHALL include a `rating` field of type number with a range of 0 to 5 (inclusive), defaulting to 0 for new helpers.
2. THE Helper interface SHALL include an `onTimePercent` field of type number with a range of 0 to 100 (inclusive), defaulting to 100 for new helpers.
3. THE Helper interface SHALL include a `totalTrips` field of type number with a minimum value of 0, defaulting to 0 for new helpers.
4. THE Helper_Store SHALL preserve backward compatibility such that existing helper records without the new fields render with the default values (rating: 0, onTimePercent: 100, totalTrips: 0).
5. THE seed data in `lib/data/helpers.ts` SHALL include realistic values for rating, onTimePercent, and totalTrips for all seed helper records.

### Requirement 2: Helper List Page Layout and Visual Hierarchy

**User Story:** As a fleet manager, I want the helper list page to have the same professional layout as the driver list page, so that the experience is consistent across all personnel management screens.

#### Acceptance Criteria

1. THE Helper_List_Page SHALL display a PageHeader containing breadcrumbs (Operations > Helpers), a title "Helper Management", a subtitle "Manage loaders, helpers, and assistant crew assigned to drivers", and an actions area containing an "Add Helper" primary button.
2. THE Helper_List_Page SHALL organize content in the following vertical order: PageHeader, KPI_Panel, filter toolbar (search input with clear button, status dropdown), data table, and result count footer.
3. THE Helper_List_Page SHALL use the NexLogistics brand design tokens (teal primary, navy text, gray-50 table header backgrounds, brand-border dividers, shadow-card elevation on cards) consistent with the Driver list page.
4. THE KPI_Panel SHALL display four metric cards: Total Helpers, Active, Off Duty, and On Leave, each with count values, appropriate icons, and sparkline visualizations.
5. THE KPI_Panel SHALL render in a 2-column grid on viewports below 768px and a 4-column grid on viewports 768px and above.

### Requirement 3: Helper List Data Table with Performance Columns

**User Story:** As a fleet manager, I want the helper table to show rating, on-time percentage, and trip count alongside assignment info, so that I can quickly assess helper performance from the list view.

#### Acceptance Criteria

1. THE Helper_List_Page data table SHALL display the following columns in order: Helper (avatar + name + phone), Assigned Driver, Vehicle (resolved from assigned driver's vehicle), Rating (star icon + numeric value), On-Time % (progress bar + percentage), Trips (count), Status (color-coded badge), and Actions (dropdown menu).
2. THE Rating column SHALL display a filled star icon in amber color followed by the rating value formatted to one decimal place.
3. THE On-Time column SHALL display a horizontal progress bar (minimum 64px width) filled to the corresponding percentage, followed by the numeric percentage value with a "%" suffix.
4. THE Trips column SHALL display the totalTrips value from the helper record, falling back to the count of trips from Trip_Store filtered by the helper's ID when totalTrips is 0.
5. THE Vehicle column SHALL resolve the vehicle by finding the helper's assigned driver from Driver_Store, then finding that driver's `assignedVehicleId` from Fleet_Store, and displaying the vehicle plate number in an info badge; WHEN no vehicle is resolvable, THE column SHALL display "—" in muted text.
6. THE Assigned Driver column SHALL display the driver's name in an info badge WHEN assigned, or "Unassigned" in muted italic text WHEN no driver is assigned.
7. THE Helper_List_Page data table SHALL set a minimum table width of 860px with horizontal scroll enabled on smaller viewports.

### Requirement 4: Helper List Search and Filtering

**User Story:** As a fleet manager, I want to search and filter helpers by name, phone, or status, so that I can quickly find specific helpers in the roster.

#### Acceptance Criteria

1. THE Helper_List_Page SHALL provide a search input that performs case-insensitive partial matching against helper name and phone number fields, filtering results as the user types.
2. THE search input SHALL display a clear button (X icon) WHEN the search field contains text; WHEN clicked, THE clear button SHALL reset the search field to empty and remove the search filter.
3. THE Helper_List_Page SHALL provide a status dropdown filter with options: All Statuses, Active, Off Duty, and On Leave.
4. THE Helper_List_Page SHALL combine the search filter and status filter using AND logic, displaying only helpers that satisfy both conditions simultaneously.
5. THE Helper_List_Page SHALL display a result count footer below the table showing "Showing X of Y helper(s)" where X is the filtered count and Y is the total count; THE footer SHALL only be visible when at least one helper exists.

### Requirement 5: Helper List Empty State

**User Story:** As a new user with no helpers, I want a clear empty state that guides me to add my first helper, so that I understand how to get started.

#### Acceptance Criteria

1. WHEN no helpers match the current search and filter criteria, THE Helper_List_Page SHALL display an empty state within the table area containing a Users icon (minimum 48px), a primary message "No helpers found", and a secondary message indicating the user should adjust search/filter criteria.
2. WHEN the helper store contains zero helpers (no search or filter applied), THE empty state secondary message SHALL read "Add your first helper to get started" and SHALL include an "Add Helper" button that opens the AddHelperSheet.
3. THE empty state SHALL be vertically centered within the table body area with a minimum vertical padding of 64px.

### Requirement 6: Helper List Inline Status Change

**User Story:** As a fleet manager, I want to quickly change a helper's status from the list page without opening the detail view, so that I can efficiently manage helper availability.

#### Acceptance Criteria

1. THE Helper_List_Page row actions dropdown SHALL include status change options: "Set Active" (WHEN current status is not active), "Set Off Duty" (WHEN current status is not off_duty), and "Set On Leave" (WHEN current status is not on_leave).
2. WHEN a status change action is selected, THE Helper_Store SHALL update the helper's status field to the selected value immediately.
3. WHEN a status change completes, THE Helper_List_Page SHALL display a toast notification reading "{helper name} marked as {new status}" for 5 seconds.
4. THE status change options SHALL be visually separated from the view/edit/delete options using a dropdown menu separator.

### Requirement 7: Helper List Delete with Confirmation

**User Story:** As a fleet manager, I want to delete helpers with a confirmation step, so that I do not accidentally remove active personnel records.

#### Acceptance Criteria

1. THE Helper_List_Page row actions dropdown SHALL include a "Delete Helper" option styled with destructive (red) coloring.
2. WHEN the "Delete Helper" action is selected, THE Helper_List_Page SHALL display a confirmation dialog containing a warning icon, the title "Remove Helper", a description reading "Are you sure you want to remove {helper name} from the roster? This action cannot be undone.", a "Cancel" button, and a "Remove Helper" destructive button.
3. WHEN the user confirms deletion, THE Helper_Store SHALL remove the helper record, THE dialog SHALL close, and THE Helper_List_Page SHALL display a toast notification reading "Helper {name} removed".
4. WHEN the user cancels or closes the dialog, THE Helper_List_Page SHALL close the dialog without modifying any records.

### Requirement 8: AddHelperSheet Component for Create and Edit

**User Story:** As a fleet manager, I want to add new helpers and edit existing ones through a consistent side-sheet interface, so that personnel management feels unified with the driver management workflow.

#### Acceptance Criteria

1. THE AddHelperSheet SHALL render as a slide-over sheet from the right side of the screen, matching the AddDriverSheet dimensions and animation pattern.
2. WHEN opened in add mode (no editHelper prop), THE AddHelperSheet SHALL display the heading "Add Helper" with all form fields empty and default values.
3. WHEN opened in edit mode (with editHelper prop), THE AddHelperSheet SHALL display the heading "Edit Helper" with all form fields pre-populated from the existing helper record.
4. THE AddHelperSheet form SHALL include the following fields: Name (required text, maximum 100 characters), Phone (required text), Email (optional text), Address (optional text), Emergency Contact (optional text), Status (dropdown: Active, Off Duty, On Leave), Assigned Driver (dropdown populated from Driver_Store with a "None" option), Employment Type (dropdown: Per Trip, Monthly, Hybrid), Monthly Salary (conditional on employment type, currency input), Per Trip Rate (conditional on employment type, currency input), Rate per KM (optional numeric), Commission % (optional numeric 0-100), and Notes (optional textarea, maximum 500 characters).
5. IF a required field (Name, Phone) is left empty on form submission, THEN THE AddHelperSheet SHALL display inline validation errors below each invalid field and SHALL NOT close the sheet.
6. WHEN the form is submitted with valid data in add mode, THE AddHelperSheet SHALL call Helper_Store.addHelper, close the sheet, and display a success toast notification reading "Helper {name} added".
7. WHEN the form is submitted with valid data in edit mode, THE AddHelperSheet SHALL call Helper_Store.updateHelper with the modified fields, close the sheet, and display a success toast notification reading "Helper {name} updated".
8. THE AddHelperSheet SHALL accept `open` and `onOpenChange` props for controlled open/close state, and an optional `editHelper` prop of type Helper for edit mode.
9. WHEN the user clicks "Cancel" or clicks outside the sheet, THE AddHelperSheet SHALL close without saving changes.

### Requirement 9: Helper List Sheet Integration

**User Story:** As a fleet manager, I want to add and edit helpers directly from the list page using the side sheet, so that I do not need to navigate away to manage personnel.

#### Acceptance Criteria

1. WHEN the "Add Helper" button in the PageHeader is clicked, THE Helper_List_Page SHALL open the AddHelperSheet in add mode.
2. THE Helper_List_Page row actions dropdown SHALL include an "Edit Helper" option that, WHEN clicked, opens the AddHelperSheet in edit mode with the selected helper's data.
3. THE Helper_List_Page row actions dropdown SHALL include a "View Profile" option that navigates to `/helpers/{id}`.
4. WHEN the AddHelperSheet is closed after a successful add or edit operation, THE Helper_List_Page table SHALL reflect the changes immediately without a page reload.

### Requirement 10: Helper Detail Page Layout and Profile Hero

**User Story:** As a fleet manager, I want the helper detail page to show a comprehensive profile overview matching the driver detail page, so that I have complete visibility into a helper's information at a glance.

#### Acceptance Criteria

1. THE Helper_Detail_Page SHALL display a PageHeader with breadcrumbs (Operations > Helpers > {helper name}), the helper's name as title, and a subtitle showing their employment type.
2. THE Helper_Detail_Page PageHeader actions SHALL include: a "Back" button navigating to `/helpers`, an "Edit" button opening the AddHelperSheet in edit mode, and a "Delete" button (destructive, icon-only) opening a delete confirmation dialog.
3. THE Helper_Detail_Page SHALL display a stat row with four StatCard components showing: Status (with color variant), On-Time Rate (percentage), Total Trips (count), and Rating (X / 5 format).
4. THE Helper_Detail_Page SHALL display a profile hero card containing: an avatar with the helper's initials (20x20 rounded square, brand-navy background, white text), the helper's name and status badge, and an information grid showing Phone, Email, Address, Emergency Contact, Hire Date, Employment Type, Assigned Driver name, and Assigned Vehicle plate (resolved through the driver).
5. IF the helper has no assigned driver, THE profile hero SHALL display "Unassigned" for the Assigned Driver field and "—" for the Assigned Vehicle field.

### Requirement 11: Helper Detail Performance Analytics Card

**User Story:** As a fleet manager, I want to see a helper's performance analytics visualized with progress bars and metrics, so that I can evaluate their reliability and contribution.

#### Acceptance Criteria

1. THE Helper_Detail_Page SHALL display a Performance_Card with the title "Performance Analytics" in a bordered card with brand styling.
2. THE Performance_Card SHALL display an on-time delivery progress bar showing the helper's `onTimePercent` value, with a label "On-Time Delivery", the percentage value, and a horizontal bar filled to the corresponding width using brand-teal color.
3. THE Performance_Card SHALL display a rating progress bar showing the helper's `rating` value, with a label "Helper Rating", a star icon, the numeric value formatted to one decimal (X.X / 5), and a horizontal bar filled proportionally using amber color.
4. THE Performance_Card SHALL display a 2-column grid of metric boxes: Completed Trips count (from Trip_Store filtered by helperId with status completed/delivered) on teal background, and Delayed Trips count (from Trip_Store filtered by helperId with status delayed) on amber background.

### Requirement 12: Helper Detail Assigned Vehicle Card

**User Story:** As a fleet manager, I want to see which vehicle a helper rides on (via their assigned driver), so that I can plan crew assignments and vehicle capacity.

#### Acceptance Criteria

1. THE Helper_Detail_Page SHALL display a Vehicle_Card alongside the Performance_Card in a 2-column grid (stacking on mobile).
2. THE Vehicle_Card SHALL resolve the vehicle by: finding the helper's `assignedDriverId` in Driver_Store, then resolving that driver's `assignedVehicleId` from Fleet_Store.
3. WHEN a vehicle is resolved, THE Vehicle_Card SHALL display: a truck icon in a teal-light rounded container, the vehicle plate number (large bold text), vehicle details (brand, model, year), status badge, vehicle type badge, and a "View Vehicle" button navigating to `/fleet/{vehicleId}`.
4. WHEN no vehicle is resolvable (no assigned driver, or driver has no vehicle), THE Vehicle_Card SHALL display an empty state with a truck icon, and the message "No vehicle assigned" (if no driver) or "Driver has no vehicle assigned" (if driver exists but has no vehicle).

### Requirement 13: Helper Detail Tabs — Trip History

**User Story:** As a fleet manager, I want to see a helper's complete trip history in a tabbed interface, so that I can review their work history and identify patterns.

#### Acceptance Criteria

1. THE Helper_Detail_Page SHALL display a Tabs component with four tabs: "Trip History ({count})", "Payroll Summary", "Payroll Settings", and "Active Trip".
2. THE Trip History tab SHALL display a data table with columns: Trip ID (clickable, navigates to `/trips/{id}`), Route (pickup address on first line, "→ dropoff address" on second line), Helper Rate (formatted as currency from `helperRate` or `helperFee` field), Status (color-coded badge), and Approval (badge shown only for completed/delivered trips).
3. THE Trip History table SHALL source data from Trip_Store filtered by the helper's ID (`t.helperId === helper.id`).
4. THE Trip History table SHALL be sortable by date (newest first by default) and provide horizontal scrolling with a minimum width of 740px.
5. WHEN the helper has no trip history, THE Trip History tab SHALL display an empty state with a Route icon and the message "No trip history."

### Requirement 14: Helper Detail Tabs — Payroll Summary

**User Story:** As a fleet manager, I want to see a helper's payroll history summarized by period, so that I can verify compensation and track earnings over time.

#### Acceptance Criteria

1. THE Payroll Summary tab SHALL display a header section showing total earned amount (sum of paid summaries' netPay) formatted as currency with bold styling.
2. THE Payroll Summary tab SHALL display a table with columns: Period (name), Mode (payroll mode), Trips (count), Trip Earnings (currency), Incentives (green, +prefix), Deductions (red, −prefix), Net Pay (bold currency), and Status (color-coded badge: success for paid, info for approved, neutral for draft).
3. THE Payroll Summary tab SHALL source data from Payroll_Period_Store summaries filtered by `s.driverId === helper.id` (the helper payroll reuses the driverId field), sorted by period end date descending.
4. WHEN the helper has no payroll summaries, THE tab SHALL display an empty state with a Wallet icon and the messages "No payroll records yet." and "Run a payroll period to see earnings here."
5. WHEN a payroll row is clicked, THE Helper_Detail_Page SHALL navigate to `/payroll/{payrollPeriodId}`.

### Requirement 15: Helper Detail Tabs — Payroll Settings

**User Story:** As a fleet manager, I want to view a helper's payroll configuration including rates and deductions, so that I can verify their compensation structure is correct.

#### Acceptance Criteria

1. THE Payroll Settings tab SHALL display the helper's payroll configuration in a card with the title "Payroll Settings" and a Settings icon.
2. THE Payroll Settings tab SHALL display rate cards in a grid showing: Employment Type (capitalized), Monthly Salary (formatted currency, shown when applicable), Per Trip Rate (formatted currency, shown when applicable), Per KM Rate (formatted, shown when applicable), and Commission % (shown when applicable).
3. THE Payroll Settings tab SHALL display government deduction indicators (SSS, PhilHealth, Pag-IBIG, Withholding Tax) as enabled/disabled tiles matching the driver page pattern, using green checkmark icons for enabled and gray alert icons for disabled.
4. IF the helper has a payroll profile in the Payroll_Period_Store, THE tab SHALL display that profile's configuration; IF no profile exists, THE tab SHALL display the helper's inline rate fields (monthlyBaseSalary, baseRatePerTrip, commissionPercent) from the Helper record.
5. WHEN no payroll configuration exists (neither profile nor inline rates), THE tab SHALL display an empty state with a Settings icon and message "No payroll profile configured." with a link to the Payroll module.

### Requirement 16: Helper Detail Tabs — Active Trip

**User Story:** As a fleet manager, I want to see if a helper is currently on an active trip, so that I know their real-time availability.

#### Acceptance Criteria

1. THE Active Trip tab SHALL search Trip_Store for a trip where `helperId` matches the helper's ID and the status is one of: "in_transit", "loaded", "vehicle_dispatched", or "driver_assigned".
2. WHEN an active trip is found, THE tab SHALL display: the trip ID (bold, teal color), the route (pickup → dropoff addresses), a status badge (info variant), the ETA (formatted datetime or "—" if unavailable), and a "View Trip Detail" button navigating to `/trips/{tripId}`.
3. WHEN no active trip is found, THE tab SHALL display an empty state with a Route icon and the message "No active trip assigned."

### Requirement 17: Helper Detail Delete Confirmation

**User Story:** As a fleet manager, I want delete confirmation on the detail page to prevent accidental helper removal, so that I maintain data integrity.

#### Acceptance Criteria

1. WHEN the delete button on the Helper_Detail_Page is clicked, THE page SHALL display a confirmation dialog matching the driver page pattern with a warning icon, "Remove Helper" title, confirmation description including the helper's name, a "Cancel" button, and a "Remove Helper" destructive button.
2. WHEN deletion is confirmed, THE Helper_Store SHALL remove the helper, THE page SHALL display a toast reading "Helper {name} removed", and THE page SHALL navigate to `/helpers`.
3. WHEN deletion is cancelled, THE dialog SHALL close without modifying any records.

### Requirement 18: Responsive Design

**User Story:** As a field supervisor, I want the helper management pages to work well on tablets and phones, so that I can manage helpers while on-site.

#### Acceptance Criteria

1. THE Helper_List_Page and Helper_Detail_Page SHALL render all content accessibly and operably at viewport widths from 320px to 2560px without loss of content or functionality.
2. WHILE the viewport width is below 768px, THE KPI_Panel SHALL render in a 2-column grid layout.
3. WHILE the viewport width is below 768px, THE Performance_Card and Vehicle_Card on the Helper_Detail_Page SHALL stack in a single column instead of side-by-side.
4. WHILE the viewport width is below 768px, THE AddHelperSheet SHALL render as a full-width sheet.
5. THE Helper_List_Page data table SHALL enable horizontal scrolling on viewports where the table exceeds the available width.
6. THE Helper_Detail_Page tabs list SHALL enable horizontal scrolling with `overflow-x-auto` and `whitespace-nowrap` to accommodate all tab labels on narrow viewports.
7. THE Helper_Detail_Page profile hero info grid SHALL transition from a 3-column layout to a 1-column layout on viewports below 768px.

### Requirement 19: Design System Consistency

**User Story:** As a developer, I want the helper pages to use the same components and patterns as the driver pages, so that the codebase remains maintainable and visually consistent.

#### Acceptance Criteria

1. THE Helper_List_Page and Helper_Detail_Page SHALL use shadcn/ui components (Card, Badge, Button, Input, Select, Dialog, Sheet, Tabs, DropdownMenu, Avatar) from the existing `components/ui/` directory.
2. THE Helper_List_Page SHALL use the existing PageHeader component from `components/layout/PageHeader.tsx` with title, subtitle, breadcrumbs, and actions props.
3. THE Helper_List_Page SHALL use the existing KpiCard component from `components/dashboard/KpiCard.tsx` for the KPI_Panel.
4. THE AddHelperSheet SHALL follow the same component structure, prop interface, and visual styling as the existing AddDriverSheet component.
5. THE Helper_Detail_Page SHALL implement StatCard and InfoRow helper components matching the driver detail page pattern (same class names, sizing, and brand token usage).
6. THE Helper_List_Page and Helper_Detail_Page SHALL use the `formatCurrency` utility from `lib/utils` for all monetary value formatting.
7. THE Helper pages SHALL NOT introduce new external dependencies beyond what exists in the project's `package.json`.

### Requirement 20: POD History Visibility

**User Story:** As a fleet manager, I want to see which Proof of Delivery documents a helper has been associated with, so that I can verify their participation in successful deliveries.

#### Acceptance Criteria

1. THE Trip History tab on the Helper_Detail_Page SHALL include a "POD" column that displays a document/check icon WHEN the trip has a POD record (trip has `podSubmittedAt` or associated POD document), or a dash "—" WHEN no POD exists.
2. WHEN a POD indicator is present and clicked, THE Helper_Detail_Page SHALL navigate to the POD detail or trip detail page showing the POD information.
3. THE POD column SHALL appear between the Status and Approval columns in the Trip History table.
