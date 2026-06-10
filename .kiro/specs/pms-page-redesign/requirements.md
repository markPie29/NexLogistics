# Requirements Document

## Introduction

Redesign the Preventive Maintenance Schedule (PMS) page of the NexLogistics fleet management platform into a professional, modern SaaS dashboard. The current implementation provides basic table-based record viewing with minimal filtering. The redesign elevates the experience to a premium fleet maintenance tool with enhanced analytics, multiple data views, bulk operations, responsive layout, and full brand consistency using shadcn/ui components and the NexLogistics design system.

## Glossary

- **PMS_Dashboard**: The redesigned Preventive Maintenance Schedule page at `app/(app)/pms/page.tsx`, serving as the primary interface for fleet maintenance management.
- **KPI_Panel**: The section displaying key performance indicator cards with trend data and sparkline visualizations.
- **Maintenance_Table**: The enhanced data table component displaying maintenance records with sorting, pagination, and row-level actions.
- **Schedule_Modal**: The modal or drawer component used for creating and editing maintenance schedule records.
- **Calendar_View**: An alternative visualization showing maintenance schedules on a timeline or calendar layout.
- **Vehicle_History_Panel**: A detail panel showing the complete service history for a selected vehicle.
- **Cost_Analytics_Section**: A section displaying maintenance cost breakdowns, trends, and budget insights.
- **Export_Service**: The utility responsible for generating PDF and CSV exports of maintenance data.
- **Alert_Banner**: A prominent notification component highlighting overdue or critical maintenance items.
- **Maintenance_Store**: The Zustand store (`useMaintenanceStore`) managing maintenance record state.
- **Fleet_Store**: The Zustand store (`useFleetStore`) providing vehicle data for cross-referencing.
- **Bulk_Action_Toolbar**: A contextual toolbar that appears when multiple table rows are selected, providing batch operations.

## Requirements

### Requirement 1: Dashboard Layout and Visual Hierarchy

**User Story:** As a fleet manager, I want the PMS page to have a clear visual hierarchy with a modern SaaS layout, so that I can quickly assess fleet maintenance health at a glance.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL display a PageHeader containing breadcrumbs (minimum 2 levels: parent section and current page), a page title (maximum 40 characters), a subtitle (maximum 80 characters), and an actions area with at least one primary action button.
2. THE PMS_Dashboard SHALL organize content in a vertical layout with the following order from top to bottom: KPI_Panel, Alert_Banner for critical items, a toolbar section containing a search input, status filter, and view toggles, and finally the main data area occupying the remaining vertical space.
3. THE PMS_Dashboard SHALL use the NexLogistics brand colors (teal #66B2B2 primary, navy #0B1220 text, #F5F7FA background) and existing Tailwind CSS design tokens such that no color value outside the defined brand token set appears in the rendered output.
4. THE PMS_Dashboard SHALL apply shadcn/ui Card components with the brand shadow-card elevation and rounded-2xl border radius for the KPI_Panel, Alert_Banner, toolbar, and main data area sections.
5. THE PMS_Dashboard SHALL maintain a minimum 4.5:1 contrast ratio for normal text (below 18px) and a minimum 3:1 contrast ratio for large text (18px and above) between text and background colors in both light and dark modes.
6. WHEN the viewport width is less than 768px, THE PMS_Dashboard SHALL stack all layout sections into a single column and the KPI_Panel SHALL display its cards in a 2-column grid.
7. WHILE the PMS_Dashboard is loading maintenance data, THE PMS_Dashboard SHALL display skeleton placeholders matching the dimensions of the KPI_Panel and main data area until data is available or a maximum of 5 seconds has elapsed.

### Requirement 2: Enhanced KPI Panel with Trends

**User Story:** As a fleet manager, I want the KPI cards to show trends and comparative data, so that I can understand whether maintenance health is improving or degrading over time.

#### Acceptance Criteria

1. THE KPI_Panel SHALL display four metric cards: Overdue count, Due Soon count, Upcoming count, and Completed count.
2. WHEN the PMS_Dashboard loads, THE KPI_Panel SHALL compute counts by filtering Maintenance_Store records by their status field (matching values: "overdue", "due_soon", "upcoming", "completed").
3. THE KPI_Panel SHALL display a sparkline visualization within each card showing the 8-week historical trend, where each data point represents the count for that status in the corresponding calendar week.
4. IF fewer than 8 weeks of historical data are available, THEN THE KPI_Panel SHALL render the sparkline using only the available data points (minimum 2 points) and display a flat line when fewer than 2 points exist.
5. THE KPI_Panel SHALL display a fifth summary card showing total maintenance cost for the current calendar month, computed by summing the cost field of all Maintenance_Store records with status "completed" and a completedAt date within the current month, treating records with no cost value as zero.
6. THE KPI_Panel SHALL format the total maintenance cost using PHP peso currency format (₱ symbol, en-PH locale, two decimal places, e.g. "₱12,500.00").
7. THE KPI_Panel SHALL render in a responsive grid: 2 columns on viewports below 768px, and 5 columns on viewports 768px and above.
8. WHEN the Overdue count is greater than zero, THE KPI_Panel SHALL apply a pulsing red indicator on the Overdue card that animates at a rate of one pulse cycle per 2 seconds.
9. IF all Maintenance_Store records are empty (zero total records), THEN THE KPI_Panel SHALL display all four count cards with a value of 0 and the cost card with "₱0.00".

### Requirement 3: Advanced Data Table

**User Story:** As an operations coordinator, I want to sort, filter, and paginate maintenance records, so that I can efficiently manage a large number of schedules.

#### Acceptance Criteria

1. THE Maintenance_Table SHALL display columns: Vehicle (plate number), Service Type, Due Date, Due Odometer, Estimated Cost, Status, and Actions (containing Edit and Delete buttons per row).
2. WHEN a column header is clicked, THE Maintenance_Table SHALL sort records by that column in ascending order; clicking the same column header again SHALL reverse to descending order; clicking a different column header SHALL sort by the new column in ascending order and reset the previous sort.
3. THE Maintenance_Table SHALL paginate records with a configurable page size (10, 25, or 50 rows per page), defaulting to 10 rows per page, and display the current page number, total page count, and total record count.
4. THE Maintenance_Table SHALL provide a text search input that performs case-insensitive partial matching against vehicle plate number and service type fields, filtering results after the user has entered at least 1 character.
5. THE Maintenance_Table SHALL provide a status dropdown filter allowing selection of one or multiple statuses (overdue, due_soon, upcoming, completed); when no status is selected, records of all statuses SHALL be displayed.
6. THE Maintenance_Table SHALL provide a date range filter allowing the user to specify a start date and end date for the Due Date column; IF only a start date is provided, THEN records with Due Date on or after the start date SHALL be shown; IF only an end date is provided, THEN records with Due Date on or before the end date SHALL be shown.
7. THE Maintenance_Table SHALL combine all active filters (text search, status filter, and date range filter) using AND logic, displaying only records that satisfy all active filter conditions simultaneously.
8. THE Maintenance_Table SHALL display the Status column using color-coded Badge components: red for overdue, amber for due_soon, blue for upcoming, green for completed.
9. WHEN no records match the active filters, THE Maintenance_Table SHALL display an empty state illustration with a message indicating no matching records were found and a "Clear Filters" button that resets all filters to their default state.
10. WHEN the PMS_Dashboard initially loads, THE Maintenance_Table SHALL display records sorted by Due Date in ascending order (nearest due date first) with all filters in their default (unfiltered) state.

### Requirement 4: Bulk Actions

**User Story:** As a fleet manager, I want to select multiple records and perform batch operations, so that I can efficiently manage maintenance tasks without editing them one by one.

#### Acceptance Criteria

1. THE Maintenance_Table SHALL provide a checkbox in each row and a select-all checkbox in the header that toggles selection of all rows on the current page only.
2. WHEN one or more rows are selected, THE Bulk_Action_Toolbar SHALL appear above the table displaying the count of selected items; WHEN all selections are cleared, THE Bulk_Action_Toolbar SHALL be hidden.
3. WHEN the "Mark Complete" action is triggered, THE Bulk_Action_Toolbar SHALL set the status of all selected records to "completed" with the current timestamp as completedAt, and then clear all selection checkboxes.
4. THE Bulk_Action_Toolbar SHALL provide a "Delete" action that displays a confirmation dialog showing the count of records to be deleted; WHEN the user confirms, THE Bulk_Action_Toolbar SHALL remove all selected records from the Maintenance_Store and clear all selection checkboxes.
5. IF the user cancels the delete confirmation dialog, THEN THE Bulk_Action_Toolbar SHALL close the dialog and preserve the current selection state without modifying any records.
6. THE Bulk_Action_Toolbar SHALL provide an "Export Selected" action that exports only the selected records to CSV format with columns matching the Maintenance_Table visible columns (Vehicle Plate, Service Type, Due Date, Due Odometer, Estimated Cost, Status).
7. WHEN a bulk action completes successfully, THE PMS_Dashboard SHALL display a toast notification for 5 seconds indicating success with the count of affected records.
8. IF a bulk action fails, THEN THE PMS_Dashboard SHALL display an error toast notification indicating the failure, preserve the current selection state, and not modify any records.

### Requirement 5: Add and Edit Maintenance Schedule

**User Story:** As an operations coordinator, I want to create new maintenance schedules and edit existing ones through a form, so that I can keep the PMS data accurate and up to date.

#### Acceptance Criteria

1. WHEN the "Add Schedule" button is clicked, THE Schedule_Modal SHALL open as a slide-over drawer from the right side of the screen with all form fields empty and the heading "Add Schedule".
2. THE Schedule_Modal SHALL display a form with fields: Vehicle (dropdown from Fleet_Store active vehicles), Service Type (text input, maximum 100 characters, with a suggestion list of common types: "Oil Change", "Tire Replacement", "Brake Check", "Engine Inspection", "Transmission Service", "Registration Renewal", "Trailer Axle Service"), Due Date (date picker that only allows today or future dates), Due Odometer (optional numeric input accepting values from 0 to 9,999,999 km), Estimated Cost (optional currency input formatted in PHP ₱ accepting values from 0.01 to 99,999,999.99), and Notes (optional textarea, maximum 500 characters).
3. WHEN the form is submitted with valid data in add mode, THE Schedule_Modal SHALL call Maintenance_Store.addRecord with the new record having its status set to "upcoming", close the drawer, and display a success toast notification.
4. WHEN a table row's edit action is clicked, THE Schedule_Modal SHALL open pre-populated with that record's data in edit mode with the heading "Edit Schedule".
5. WHEN the edit form is submitted with valid data, THE Schedule_Modal SHALL call Maintenance_Store.updateRecord with only the modified fields and close the drawer.
6. IF a required field (Vehicle, Service Type, Due Date) is left empty on submission, THEN THE Schedule_Modal SHALL display an inline validation error message below each invalid field indicating which field is required, and SHALL NOT close the drawer.
7. IF the Due Odometer or Estimated Cost field contains a non-numeric or out-of-range value on submission, THEN THE Schedule_Modal SHALL display an inline validation error below the invalid field indicating the accepted range.
8. WHEN the "Cancel" button is clicked or the user clicks outside the drawer, THE Schedule_Modal SHALL close the drawer and discard any unsaved changes without calling the Maintenance_Store.
9. WHILE the Schedule_Modal is open, THE Schedule_Modal SHALL disable the submit button until at least one field value differs from the initial state (empty for add mode, original values for edit mode).

### Requirement 6: Vehicle Service History

**User Story:** As a fleet manager, I want to view the complete maintenance history of a specific vehicle, so that I can make informed decisions about upcoming service needs and vehicle health.

#### Acceptance Criteria

1. WHEN a vehicle plate number is clicked in the Maintenance_Table, THE Vehicle_History_Panel SHALL open as a slide-over drawer from the right side of the screen displaying all maintenance records for that vehicle sourced from the Maintenance_Store.
2. THE Vehicle_History_Panel SHALL display records in reverse chronological order (newest first) with service type, date, cost (formatted in PHP ₱ using en-PH locale), and status badge for each entry.
3. THE Vehicle_History_Panel SHALL display a summary header showing the vehicle plate number, total lifetime maintenance cost (sum of all records regardless of status, formatted in PHP ₱ using en-PH locale), and total number of records with status "completed".
4. THE Vehicle_History_Panel SHALL display a mini timeline visualization showing the count of services per month over the past 12 months, rendered as a horizontal bar or dot indicator for each month.
5. WHEN the Vehicle_History_Panel is open, THE PMS_Dashboard SHALL allow the user to close the panel by clicking a close button or pressing the Escape key.
6. IF the selected vehicle has zero maintenance records in the Maintenance_Store, THEN THE Vehicle_History_Panel SHALL display an empty state message indicating no service history is available for the vehicle.
7. WHEN the Vehicle_History_Panel contains more than 50 records, THE Vehicle_History_Panel SHALL paginate the record list displaying 50 records per page with navigation to load additional entries.

### Requirement 7: Calendar and Timeline View

**User Story:** As a fleet manager, I want to see upcoming maintenance on a calendar or timeline, so that I can plan resources and avoid scheduling conflicts.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL provide a view toggle allowing the user to switch between "Table" view and "Calendar" view, and WHEN the view is toggled, THE PMS_Dashboard SHALL preserve any active filters (search text, status, date range) across both views.
2. WHEN "Calendar" view is selected, THE Calendar_View SHALL display maintenance records as events on a monthly calendar grid, where each event label shows the vehicle plate number and service type.
3. THE Calendar_View SHALL color-code events by status: red for overdue, amber for due_soon, blue for upcoming, green for completed.
4. WHEN an event on the Calendar_View is clicked, THE PMS_Dashboard SHALL open the Schedule_Modal in edit mode for that record.
5. THE Calendar_View SHALL display the current month by default and provide navigation arrows to move between months.
6. THE Calendar_View SHALL highlight today's date with a distinct visual indicator using the brand teal color.
7. IF a day cell contains more than 3 events, THEN THE Calendar_View SHALL display the first 3 events and a "+N more" overflow indicator (where N is the count of hidden events), and WHEN the overflow indicator is clicked, THE Calendar_View SHALL reveal the full list of events for that day in a popover.

### Requirement 8: Overdue Alert System

**User Story:** As a fleet manager, I want prominent alerts for overdue maintenance items, so that I do not miss critical service deadlines that could cause vehicle breakdowns.

#### Acceptance Criteria

1. WHEN one or more records in the Maintenance_Store have a status of "overdue", THE Alert_Banner SHALL display at the top of the main content area with a red/danger background.
2. WHILE the Alert_Banner is visible, THE Alert_Banner SHALL display the total count of overdue items and the vehicle plate and service type of the overdue record with the earliest dueDate (i.e., the most overdue item).
3. THE Alert_Banner SHALL provide a "View All Overdue" action button that, WHEN clicked, SHALL apply the "overdue" status filter to the Maintenance_Table and scroll the Maintenance_Table into view.
4. WHEN no records in the Maintenance_Store have an "overdue" status, THE Alert_Banner SHALL not render in the DOM.
5. WHEN the user clicks the dismiss control on the Alert_Banner, THE Alert_Banner SHALL be hidden for the remainder of the browser session.
6. IF the Alert_Banner has been dismissed and the overdue record count changes (increases or decreases), THEN THE Alert_Banner SHALL reappear with the updated count.
7. THE Alert_Banner SHALL use role="alert" and aria-live="polite" to announce overdue notifications to screen reader users.

### Requirement 9: Cost Tracking and Analytics

**User Story:** As a fleet manager, I want to see maintenance cost analytics, so that I can track spending, identify cost trends, and budget for future maintenance.

#### Acceptance Criteria

1. THE Cost_Analytics_Section SHALL display a bar or line chart showing monthly maintenance costs for the past 6 calendar months (including the current month), aggregating the `cost` field of all Maintenance_Store records whose `completedAt` or `dueDate` falls within each month, treating records with no cost value as ₱0.
2. THE Cost_Analytics_Section SHALL display a breakdown of costs by service type (the record `type` field) for the same 6-month period as the monthly chart, rendered as a horizontal bar chart or pie chart, showing each service type's total cost and its percentage of overall spend.
3. THE Cost_Analytics_Section SHALL display the total maintenance spend for the current calendar month and a comparison to the previous month shown as a percentage change value with a directional indicator (upward arrow for increase, downward arrow for decrease) and color coding (red for increase, green for decrease).
4. IF the previous month's total spend is ₱0, THEN THE Cost_Analytics_Section SHALL display the comparison as "N/A" instead of a percentage value.
5. THE Cost_Analytics_Section SHALL format all monetary values in PHP (₱) using the en-PH locale and the formatCurrency utility.
6. THE Cost_Analytics_Section SHALL be collapsible, defaulting to the expanded state on page load, and SHALL persist the user's expand/collapse preference for the duration of the browser session.
7. IF no records with a cost value exist in the 6-month period, THEN THE Cost_Analytics_Section SHALL display an empty state message indicating no cost data is available instead of rendering empty charts.

### Requirement 10: Export Functionality

**User Story:** As a fleet manager, I want to export maintenance data as PDF or CSV, so that I can share reports with stakeholders or keep offline records.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL provide an "Export" dropdown button in the toolbar area with options: "Export as CSV" and "Export as PDF".
2. WHEN "Export as CSV" is selected and the current filter yields one or more records, THE Export_Service SHALL generate a CSV file containing all currently filtered records (up to a maximum of 10,000 records) with columns: Vehicle Plate, Service Type, Due Date, Due Odometer, Cost, Status, Completed At, Notes.
3. WHEN "Export as PDF" is selected and the current filter yields one or more records, THE Export_Service SHALL generate a formatted PDF document in A4 page size with the NexLogistics branding header, generation timestamp, and the filtered records (up to a maximum of 10,000 records) presented in a table layout with columns: Vehicle Plate, Service Type, Due Date, Due Odometer, Cost, Status, Completed At, Notes.
4. THE Export_Service SHALL name exported files using the pattern `pms-report-{YYYY-MM-DD}.{csv|pdf}`.
5. WHEN an export completes successfully, THE PMS_Dashboard SHALL trigger a browser download and display a success toast notification for 5 seconds.
6. IF the current filter yields zero records when an export option is selected, THEN THE PMS_Dashboard SHALL display an informational message indicating that no records are available to export and SHALL NOT generate a file.
7. IF the Export_Service fails to generate the file, THEN THE PMS_Dashboard SHALL display an error toast notification for 5 seconds indicating that the export could not be completed, and no file shall be downloaded.

### Requirement 11: Responsive Design

**User Story:** As a field supervisor, I want to access the PMS dashboard from my tablet or phone, so that I can check maintenance schedules while on-site.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL render all navigation elements, data tables, KPI panels, and action controls as accessible and operable at viewport widths from 320px to 2560px without loss of content or functionality.
2. WHILE the viewport width is below 768px, THE Maintenance_Table SHALL transform into a card-based list layout displaying one record per card with the following fields visible per card: asset name, maintenance type, due date, and status.
3. WHILE the viewport width is below 768px, THE KPI_Panel SHALL render in a 2-column grid layout.
4. WHILE the viewport width is below 768px, THE Schedule_Modal SHALL render as a full-screen sheet instead of a side drawer.
5. WHILE the viewport width is below 768px, THE PMS_Dashboard SHALL ensure all interactive elements (buttons, checkboxes, links) have a minimum touch target size of 44x44 CSS pixels.
6. THE PMS_Dashboard SHALL not require horizontal scrolling at any supported viewport width.
7. WHILE the viewport width is below 768px, THE PMS_Dashboard SHALL provide a collapsible navigation menu that is accessible via a single tap on a visible menu icon positioned in the top header area.

### Requirement 12: Dark Mode Support

**User Story:** As a user who works night shifts, I want the PMS dashboard to respect dark mode preferences, so that I can use the tool comfortably in low-light environments.

#### Acceptance Criteria

1. WHEN dark mode is enabled via the useUiStore toggle, THE PMS_Dashboard SHALL add the "dark" class to the document root element and apply the dark color scheme through Tailwind CSS dark: variants and CSS custom properties defined in the .dark selector.
2. WHILE dark mode is active, THE PMS_Dashboard SHALL ensure all charts, badges, and status colors maintain a minimum 4.5:1 contrast ratio against their respective background colors per WCAG AA.
3. WHILE dark mode is active, THE PMS_Dashboard SHALL use the brand navy-light (#172033) as the card background color via the --card CSS custom property.
4. WHILE dark mode is active, THE PMS_Dashboard SHALL ensure the Calendar_View grid lines and text maintain a minimum 4.5:1 contrast ratio against the dark background.
5. WHILE dark mode is active, THE Alert_Banner SHALL use the destructive CSS custom property color that maintains a 4.5:1 contrast ratio against the dark card background.
6. WHEN the user reloads the page, THE PMS_Dashboard SHALL restore the previously selected dark mode preference from persisted useUiStore state without a visible flash of the opposite theme.
7. WHEN dark mode is toggled, THE PMS_Dashboard SHALL apply the new color scheme to all visible components within 100 milliseconds without requiring a page reload.

### Requirement 13: Integration with Fleet Store

**User Story:** As a fleet manager, I want the PMS page to display real vehicle data from the fleet system, so that maintenance schedules are always linked to actual registered vehicles.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL read vehicle data from the Fleet_Store (useFleetStore) to resolve vehicleId references to plate numbers and vehicle details (brand, model, year, and odometer).
2. THE Schedule_Modal vehicle dropdown SHALL only display vehicles from the Fleet_Store whose status is "available", "in_trip", or "maintenance", sorted alphabetically by plate number.
3. WHEN a vehicle's status is set to "inactive" in the Fleet_Store, THE Maintenance_Table SHALL still display its plate number for historical records using a visually muted style (reduced text opacity) and a label indicating the vehicle is inactive.
4. THE Vehicle_History_Panel SHALL display the vehicle's brand, model, year, and current odometer reading from the Fleet_Store alongside maintenance records.
5. IF a maintenance record references a vehicleId that cannot be resolved in the Fleet_Store, THEN THE Maintenance_Table SHALL display the raw vehicleId value with a visual indicator that the vehicle record is unavailable.

### Requirement 14: Component Architecture and Design System

**User Story:** As a developer, I want the PMS page to use reusable, well-structured components from the NexLogistics design system, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL use shadcn/ui components (Card, Badge, Button, Input, Select, Dialog, Sheet, Table, DropdownMenu, Tooltip) from the existing `components/ui/` directory as the foundation for all UI elements, and SHALL add Calendar and Checkbox shadcn/ui components to the `components/ui/` directory if they do not already exist.
2. THE PMS_Dashboard SHALL organize page-specific components in a `components/pms/` directory, where each file contains a single exported component responsible for one UI concern (e.g., filter panel, data table, detail modal, KPI section).
3. THE PMS_Dashboard SHALL use the existing PageHeader component from `components/layout/PageHeader.tsx`, passing at minimum a `title` prop and optionally `subtitle`, `breadcrumbs`, and `actions` props as defined by the existing PageHeaderProps interface.
4. THE PMS_Dashboard SHALL use the existing KpiCard component from `components/dashboard/KpiCard.tsx` for the KPI panel, passing props conforming to the existing KpiCardProps interface (label, value, icon required; trend, sparklineData, href optional), and extending the props interface only if the new props are backward-compatible with existing KpiCard usages.
5. THE PMS_Dashboard SHALL manage all local UI state (filters, selected rows, active view, modal open state) using React useState or useReducer hooks within the page component or a local context, and SHALL NOT use global state management (Zustand store) for PMS-page-only UI state.
6. THE PMS_Dashboard SHALL NOT introduce new external dependencies beyond what is already in the project's package.json, given that recharts is already available as the charting library.

### Requirement 15: Accessibility

**User Story:** As a user who relies on assistive technologies, I want the PMS dashboard to be fully accessible, so that I can perform all maintenance management tasks regardless of ability.

#### Acceptance Criteria

1. THE PMS_Dashboard SHALL ensure all interactive elements are reachable and operable using keyboard navigation alone (Tab, Enter, Escape, Arrow keys) in a logical reading order that follows the visual layout top-to-bottom, left-to-right.
2. THE Maintenance_Table SHALL use semantic HTML table elements (table, thead, tbody, tr, th, td) with scope="col" on column headers and scope="row" on row headers.
3. WHILE the Schedule_Modal is open, THE Schedule_Modal SHALL trap focus so that Tab and Shift+Tab cycle only through focusable elements within the modal, and WHEN the Schedule_Modal is closed, THE Schedule_Modal SHALL return focus to the element that triggered it.
4. THE PMS_Dashboard SHALL provide aria-label or aria-labelledby attributes for all icon-only buttons and non-text interactive elements.
5. THE KPI_Panel sparkline charts SHALL provide a visually hidden text description that includes the metric name, current value, and trend direction (increasing, decreasing, or stable) for screen readers.
6. THE Calendar_View SHALL use ARIA roles (grid, gridcell) and aria-label attributes on each gridcell that include the date and the count of associated maintenance events for screen readers.
7. WHEN one or more records have an "overdue" status, THE Alert_Banner SHALL use role="alert" to immediately announce overdue notification content to screen reader users without requiring user interaction.
8. THE PMS_Dashboard SHALL not use color as the sole means of conveying status information; all color-coded indicators (status badges, calendar events, KPI indicators) SHALL include a visible text label or icon that communicates the status independently of color.
9. IF a form validation error occurs in the Schedule_Modal, THEN THE Schedule_Modal SHALL programmatically associate each error message with its corresponding input field using aria-describedby, and SHALL set aria-invalid="true" on each invalid field.
10. WHEN the Bulk_Action_Toolbar appears or updates, THE Bulk_Action_Toolbar SHALL use aria-live="polite" to announce the count of selected items to screen reader users.
