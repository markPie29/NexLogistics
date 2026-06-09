# Requirements Document

## Introduction

Redesign the Proof of Delivery (POD) page at `/pod` into a professional, modern SaaS dashboard that serves two distinct audiences: admin/dispatchers on desktop and drivers/helpers on mobile. The current implementation provides basic card lists for pending and captured PODs. The redesign elevates the experience to a premium logistics operations tool with role-based views, enhanced data visualization, professional spacing, proper light/dark mode contrast, and full brand consistency using shadcn/ui components and the NexLogistics design system. The page remains functionally connected to the driver/helper POD capture workflow.

## Glossary

- **POD_Dashboard**: The redesigned Proof of Delivery page at `app/(app)/pod/page.tsx`, serving as the primary interface for POD management across all roles.
- **Admin_View**: The desktop-optimized layout displayed to users with "admin" or "dispatcher" roles, providing a comprehensive overview of all POD activity across all drivers.
- **Driver_View**: The mobile-optimized layout displayed to users with "driver" or "helper" roles, providing a personal POD queue and capture workflow.
- **KPI_Panel**: The section displaying key metric cards summarizing POD status counts and completion rates.
- **POD_Table**: The enhanced data table component displaying POD records with sorting, filtering, and row-level actions in the Admin_View.
- **POD_Card_List**: The mobile-friendly card-based list displaying POD items in the Driver_View.
- **POD_Detail_Drawer**: A slide-over drawer displaying the full details of a captured POD including signature, photos, receiver info, GPS coordinates, and notes.
- **Status_Filter_Bar**: The toolbar section containing search, status filters, driver filters, and date range controls.
- **Summary_Banner**: The prominent section in the Driver_View header displaying pending and captured counts as summary pills.
- **Pod_Store**: The Zustand store (`usePodStore`) managing proof of delivery records.
- **Trip_Store**: The Zustand store (`useTripStore`) providing trip data for cross-referencing delivery status.
- **Driver_Store**: The Zustand store (`useDriverStore`) providing driver data for assignment resolution.
- **Auth_Store**: The Zustand store (`useAuthStore`) providing user role information for view routing.
- **Driver_Nav**: The bottom navigation component used in the mobile Driver_View.
- **Driver_Sidebar**: The slide-over sidebar menu used in the mobile Driver_View.

## Requirements

### Requirement 1: Role-Based View Routing

**User Story:** As a system user, I want the POD page to automatically display the appropriate interface for my role, so that I see the most relevant layout and functionality for my workflow.

#### Acceptance Criteria

1. WHEN a user with a "super_admin", "company_admin", or "dispatcher" role navigates to the `/pod` route, THE POD_Dashboard SHALL render the Admin_View layout designed for viewports 768px and above.
2. WHEN a user with a "driver" or "helper" role navigates to the `/pod` route, THE POD_Dashboard SHALL render the Driver_View layout designed for viewports below 768px.
3. THE POD_Dashboard SHALL read the current user role from the Auth_Store to determine which view to render.
4. IF the Auth_Store returns no user or a role not listed in criteria 1 or 2 (e.g., "accounting", "client"), THEN THE POD_Dashboard SHALL render the Admin_View as the default fallback.
5. WHILE the Auth_Store is hydrating from persisted storage and the user role is not yet available, THE POD_Dashboard SHALL display a loading skeleton matching the Admin_View dimensions until the role is resolved and the correct view can be rendered.

### Requirement 2: Admin View Dashboard Layout and Visual Hierarchy

**User Story:** As a dispatcher, I want the POD page to have a clear visual hierarchy with a modern SaaS layout, so that I can quickly assess POD status across all drivers at a glance.

#### Acceptance Criteria

1. THE Admin_View SHALL display a PageHeader containing breadcrumbs (Operations > Proof of Delivery), a page title "Proof of Delivery" (maximum 40 characters), a subtitle "Manage delivery confirmations across all drivers" (maximum 80 characters), and an actions area that serves as a container for page-level action buttons (initially empty if no actions are defined for the current context).
2. THE Admin_View SHALL organize content in a vertical layout with a consistent gap of 24px between sections in the following order from top to bottom: PageHeader, KPI_Panel, Status_Filter_Bar containing search input and status filter controls, and the POD_Table occupying the remaining vertical space via flex-grow.
3. THE Admin_View SHALL use the NexLogistics brand colors (teal #66B2B2 for primary accents, navy #0B1220 for headings and text, brand-border #E5E7EB for separators) and existing Tailwind CSS design tokens such that no hardcoded color value outside the defined brand token set appears in the rendered output.
4. THE Admin_View SHALL apply shadcn/ui Card components with the brand shadow-card elevation and rounded-lg border radius for the KPI_Panel cards, filter bar container, and POD_Table container.
5. THE Admin_View SHALL maintain a minimum 4.5:1 contrast ratio for normal text (below 18px) and a minimum 3:1 contrast ratio for large text (18px and above) between text and background colors in both light and dark modes.
6. WHEN the viewport width is less than 768px, THE Admin_View SHALL stack all layout sections into a single column and the KPI_Panel SHALL display its cards in a 2-column grid.
7. WHILE the POD_Dashboard is loading data from Pod_Store and Trip_Store, THE Admin_View SHALL display skeleton placeholders matching the dimensions of the KPI_Panel and POD_Table until data resolves successfully or an error occurs, whichever comes first.
8. IF data loading from Pod_Store or Trip_Store fails, THEN THE Admin_View SHALL replace the skeleton placeholders with an error state displaying a message indicating the data could not be loaded and a "Retry" button that re-triggers the data fetch.

### Requirement 3: Admin KPI Panel

**User Story:** As a dispatcher, I want summary metrics at the top of the POD page, so that I can immediately understand the current state of delivery confirmations.

#### Acceptance Criteria

1. THE KPI_Panel SHALL display three metric cards: "Awaiting POD" count, "Captured Today" count, and "Completion Rate" percentage.
2. WHEN the Admin_View loads, THE KPI_Panel SHALL compute the "Awaiting POD" count by counting trips from Trip_Store with status "delivered" or "completed" that have no matching record in Pod_Store (matched by tripId).
3. WHEN the Admin_View loads, THE KPI_Panel SHALL compute the "Captured Today" count by counting Pod_Store records whose timestamp falls within the current calendar day (midnight to current time in the browser local timezone).
4. WHEN the Admin_View loads, THE KPI_Panel SHALL compute the "Completion Rate" as: (total Pod_Store records matching trips with status "delivered" or "completed" / total trips with status "delivered" or "completed") multiplied by 100, capped at a maximum of 100, rounded to the nearest integer, and displayed with a "%" suffix.
5. IF the denominator for Completion Rate is zero (no delivered or completed trips exist), THEN THE KPI_Panel SHALL display "N/A" instead of a percentage value.
6. WHILE the viewport width is 768px or above, THE KPI_Panel SHALL render its cards in a 3-column grid. WHILE the viewport width is below 768px, THE KPI_Panel SHALL render its cards in a single horizontally-scrollable row with CSS scroll-snap alignment on each card.
7. THE KPI_Panel SHALL use the status-warning color (#F59E0B) as the icon accent for "Awaiting POD", the status-success color (#10B981) for "Captured Today", and the brand-teal color (#66B2B2) for "Completion Rate".
8. WHEN Pod_Store or Trip_Store data changes after the initial load, THE KPI_Panel SHALL recompute and update all three metric values within the same render cycle without requiring a page reload or manual refresh.
9. THE KPI_Panel SHALL display count values of 1,000 or greater with locale-appropriate thousands separators (e.g., "1,234") and SHALL support counts in the range of 0 to 99,999.

### Requirement 4: Admin POD Data Table

**User Story:** As a dispatcher, I want to view, sort, and filter all POD records in a table, so that I can efficiently manage delivery confirmations across the fleet.

#### Acceptance Criteria

1. THE POD_Table SHALL display two sections via shadcn/ui Tabs component: an "Awaiting POD" tab and a "Captured" tab.
2. THE "Awaiting POD" tab SHALL display columns: Trip ID, Driver Name (resolved from Driver_Store using the trip's driverId), Pickup Address (truncated with ellipsis beyond 40 characters), Dropoff Address (truncated with ellipsis beyond 40 characters), Delivery Date (trip updated timestamp formatted as "MMM DD, YYYY"), and an Actions column containing a "Capture" link button navigating to `/pod/{tripId}`.
3. THE "Captured" tab SHALL display columns: Trip ID, Driver Name, Receiver Name, Capture Date (POD timestamp formatted as "MMM DD, YYYY HH:mm"), Evidence (a pen-line icon displayed when signatureDataUrl is present, and a camera icon followed by the photo count number displayed when photoDataUrls contains at least one entry), and an Actions column containing a "View" button that opens the POD_Detail_Drawer.
4. WHEN the POD_Table initially renders, THE POD_Table SHALL sort records by Delivery Date (in the "Awaiting POD" tab) or Capture Date (in the "Captured" tab) in descending order (most recent first).
5. WHEN a column header is clicked, THE POD_Table SHALL sort records by that column in ascending order; clicking the same column header again SHALL reverse to descending order.
6. THE POD_Table SHALL provide a text search input (maximum 100 characters) in the Status_Filter_Bar that performs case-insensitive partial matching against Trip ID and Driver Name fields on both tabs, and additionally against the Receiver Name field on the "Captured" tab, filtering results within 300 milliseconds of the last keystroke.
7. THE POD_Table SHALL provide a driver dropdown filter populated with all drivers from Driver_Store, allowing selection of a specific driver to show only their POD records; when no driver is selected all records SHALL be displayed.
8. WHEN no records match the active filters, THE POD_Table SHALL display an empty state with a ClipboardCheck icon and a message indicating no matching records were found.
9. THE POD_Table SHALL display a Status column in both tabs using color-coded Badge components with visible text labels: an amber/warning Badge with text "Awaiting POD" for items in the awaiting tab, and an emerald/success Badge with text "Captured" for items in the captured tab.
10. THE POD_Table SHALL paginate records with a default page size of 10 rows; WHEN records exceed 10, THE POD_Table SHALL display previous and next page buttons, the current page number, and total record count below the table.

### Requirement 5: POD Detail Drawer

**User Story:** As a dispatcher, I want to view the full details of a captured POD including signature and photos, so that I can verify delivery confirmation quality without leaving the page.

#### Acceptance Criteria

1. WHEN the "View" button is clicked on a captured POD row, THE POD_Detail_Drawer SHALL open as a slide-over sheet from the right side of the screen with a width of 480px on viewports 768px and above, or full-screen width on viewports below 768px.
2. THE POD_Detail_Drawer SHALL display the following information: Trip ID, Receiver Name, Receiver Contact (if available), Capture Timestamp (formatted as "MMM DD, YYYY HH:mm" using en-PH locale), GPS Coordinates (latitude and longitude displayed to 6 decimal places), and Notes (if available).
3. THE POD_Detail_Drawer SHALL display the signature image (from signatureDataUrl) rendered at a maximum width of 100% of the drawer content area with a bordered container and a "Signature" label.
4. THE POD_Detail_Drawer SHALL display all captured photos (from photoDataUrls array) in a grid layout (2 columns) with each photo rendered as a thumbnail; WHEN a thumbnail is clicked, THE POD_Detail_Drawer SHALL open the photo in a centered overlay lightbox displaying the image at its intrinsic resolution (up to a maximum of 90% viewport width and 90% viewport height), with a close button and Escape key to dismiss.
5. IF the signatureDataUrl field is empty or undefined, THEN THE POD_Detail_Drawer SHALL display a placeholder message "No signature captured" in place of the signature image.
6. IF the photoDataUrls array is empty or undefined, THEN THE POD_Detail_Drawer SHALL display a placeholder message "No photos captured" in place of the photo grid.
7. THE POD_Detail_Drawer SHALL provide a close button and support closing via the Escape key, returning focus to the triggering "View" button upon close.
8. IF the signatureDataUrl or any entry in photoDataUrls fails to load (broken or invalid image data), THEN THE POD_Detail_Drawer SHALL display a fallback placeholder with the text "Image failed to load" in place of the broken image.

### Requirement 6: Driver/Helper Mobile View Layout

**User Story:** As a driver, I want a mobile-optimized POD interface that matches the existing driver app design patterns, so that I can quickly access and manage my delivery confirmations on my phone.

#### Acceptance Criteria

1. THE Driver_View SHALL display a sticky header at the top of the viewport with a brand-navy (#0B1220) background containing a hamburger menu button (opening Driver_Sidebar), the NE[X] LOGISTICS brand mark centered, and a notification bell icon with an unread count badge displaying the numeric count up to 99 and "99+" for counts exceeding 99, or hidden when the count is zero.
2. THE Driver_View SHALL display a title banner below the header with a brand-navy background containing a FileImage icon in a brand-teal/10 background container, the title "Proof of Delivery", a subtitle "Capture delivery confirmations", and Summary_Banner pills showing pending and captured counts.
3. THE Summary_Banner SHALL display two pills: an amber-styled pill showing "{count} Pending" and an emerald-styled pill showing "{count} Captured", where counts reflect only the current driver's assignments (filtered by driverId from Auth_Store or first driver in Driver_Store), displaying "0" when no items exist in that category.
4. THE Driver_View SHALL display a scrollable content area between the sticky header/title banner and the bottom navigation, where content scrolls beneath the sticky header with the header remaining visible at all times, containing the POD_Card_List organized into "Awaiting POD" and "Captured" sections.
5. THE Driver_View SHALL display the Driver_Nav bottom navigation component with "pod" as the active tab, positioned fixed at the bottom of the viewport with safe area insets (env(safe-area-inset-bottom)) for devices with home indicators.
6. THE Driver_View SHALL use full device viewport height (100dvh) and prevent overscroll bounce behavior via CSS overscroll-behavior: none.
7. THE Driver_View SHALL ensure all interactive elements (hamburger menu button, notification bell, POD cards, navigation tabs) have a minimum touch target size of 44x44 CSS pixels.
8. IF the Auth_Store provides no driverId and Driver_Store contains no drivers, THEN THE Driver_View SHALL display the Summary_Banner with both counts as "0" and the POD_Card_List SHALL show the empty states for both sections.

### Requirement 7: Driver POD Card List

**User Story:** As a driver, I want to see my pending and completed PODs as easy-to-scan cards, so that I can quickly identify which deliveries need confirmation and review my completed captures.

#### Acceptance Criteria

1. THE POD_Card_List "Awaiting POD" section SHALL display a section header with the text "Awaiting POD" and a count badge showing the total number of pending items; each card SHALL display the Trip ID, dropoff address (truncated with ellipsis using single-line overflow hidden when text exceeds the card content width), and an "Awaiting Capture" status pill in amber styling (amber-100 background, amber-700 text).
2. WHEN a pending POD card is tapped, THE Driver_View SHALL navigate to `/pod/{tripId}` to initiate the POD capture flow; the entire card surface SHALL be the tappable area and SHALL meet the minimum 44x44 CSS pixel touch target requirement.
3. THE POD_Card_List "Captured" section SHALL display a section header with the text "Captured" and a count badge showing the total number of captured items; each card SHALL display the Trip ID, receiver name (truncated with ellipsis if exceeding one line), capture date and time (formatted as "MMM DD, YYYY • HH:mm" using en-PH locale), and a "Done" status pill in emerald styling (emerald-100 background, emerald-700 text).
4. IF the "Awaiting POD" section has zero items, THEN THE POD_Card_List SHALL display an empty state card with a CheckCircle2 icon, bold text "All caught up!", and subtitle "No deliveries need a POD right now."
5. IF the "Captured" section has zero items, THEN THE POD_Card_List SHALL display an empty state card with a ClipboardCheck icon and text "No PODs captured yet."
6. THE POD_Card_List cards SHALL use white backgrounds with rounded-2xl corners, gray-100 borders, and shadow-sm elevation consistent with the existing driver page card pattern.
7. THE POD_Card_List pending cards SHALL include a chevron-right icon (16x16px) in a brand-teal/10 circular container (36x36px, fully rounded) on the right side indicating the card is tappable.
8. THE POD_Card_List "Awaiting POD" section SHALL order cards by trip delivery date in ascending order (oldest first) so that the most urgent deliveries appear at the top; the "Captured" section SHALL order cards by capture timestamp in descending order (most recent first).

### Requirement 8: Dark Mode Support

**User Story:** As a user who works night shifts or prefers dark interfaces, I want the POD page to fully support dark mode, so that I can use it comfortably in low-light environments.

#### Acceptance Criteria

1. WHEN dark mode is enabled via the class strategy on the document root element, THE POD_Dashboard SHALL apply dark color variants to all components in both Admin_View and Driver_View.
2. WHILE dark mode is active, THE Admin_View SHALL use dark background colors (navy-light #172033 for cards, brand-navy #0B1220 for page background) via Tailwind dark: variants and CSS custom properties.
3. WHILE dark mode is active, THE Admin_View SHALL ensure all normal text (below 18px) maintains a minimum 4.5:1 contrast ratio and all large text (18px and above), icons, and interactive element borders maintain a minimum 3:1 contrast ratio against their respective dark background colors.
4. WHILE dark mode is active, THE POD_Table SHALL use border colors that maintain a minimum 3:1 contrast ratio against the card background (#172033), and alternating row backgrounds SHALL differ from the base row background by a minimum 3:1 contrast ratio between the row text and each row background color.
5. WHILE dark mode is active, THE Driver_View header and title banner (already using brand-navy backgrounds) SHALL maintain their appearance unchanged since they are inherently dark-themed.
6. WHILE dark mode is active, THE Driver_View scrollable content area SHALL use a dark gray background (brand-navy #0B1220) instead of gray-50, and POD cards SHALL use navy-light (#172033) backgrounds with border colors that maintain a minimum 3:1 contrast ratio against the card background.
7. WHEN the user toggles dark mode, THE POD_Dashboard SHALL apply the new color scheme to all visible components within 100 milliseconds without requiring a page reload.
8. WHILE dark mode is active, THE POD_Dashboard SHALL render status Badge components (amber for "Awaiting POD", emerald for "Captured") with background and text color combinations that maintain a minimum 4.5:1 contrast ratio between badge text and badge background, and a minimum 3:1 contrast ratio between the badge outer edge and the surrounding dark background.

### Requirement 9: Responsive Design

**User Story:** As a user accessing the POD page from various devices, I want the interface to adapt gracefully to different screen sizes, so that functionality is preserved regardless of device.

#### Acceptance Criteria

1. THE Admin_View SHALL render all content as accessible and operable at viewport widths from 320px to 2560px without horizontal scrolling or content overflow.
2. WHILE the Admin_View viewport width is below 768px, THE POD_Table SHALL transform into a card-based list layout displaying one record per card with Trip ID, Driver Name (truncated with ellipsis at 20 characters), Status badge, and primary action button visible per card.
3. WHILE the Admin_View viewport width is below 768px, THE KPI_Panel SHALL render in a horizontally scrollable single row with snap points on each card.
4. WHILE the Admin_View viewport width is below 768px, THE POD_Detail_Drawer SHALL render as a full-screen sheet instead of a side drawer.
5. THE Driver_View SHALL constrain content to a maximum width of 448px centered horizontally on viewports 448px and wider, and SHALL fill the full viewport width on viewports below 448px.
6. WHILE the Admin_View viewport width is below 768px, THE POD_Dashboard SHALL ensure that no interactive element is smaller than 44x44 CSS pixels.
7. WHILE the Admin_View viewport width is below 768px, THE Status_Filter_Bar SHALL stack its controls vertically in a single column with the search input displayed first at full width, followed by filter controls each rendered at full width.

### Requirement 10: Component Architecture and Design System Consistency

**User Story:** As a developer, I want the POD page to use consistent, reusable components from the NexLogistics design system, so that the codebase remains maintainable and visually cohesive with the rest of the application.

#### Acceptance Criteria

1. THE POD_Dashboard SHALL use shadcn/ui components (Card, Badge, Button, Tabs, Sheet, Table, Input, Select) from the existing `components/ui/` directory as the foundation for all UI elements, and SHALL NOT create custom components that duplicate the functionality of an existing shadcn/ui component.
2. THE POD_Dashboard SHALL use the existing PageHeader component from `components/layout/PageHeader.tsx` for the Admin_View header, passing title, subtitle, and breadcrumbs props.
3. THE POD_Dashboard SHALL use the existing DriverNav component from `components/driver/DriverNav.tsx` and DriverSidebar component from `components/driver/DriverSidebar.tsx` for the Driver_View mobile navigation.
4. THE POD_Dashboard SHALL organize page-specific components in a `components/pod/` directory, where each file contains a single exported component prefixed with "Pod" (e.g., PodKpiPanel, PodTable, PodDetailDrawer, DriverPodList), each responsible for one UI concern, following the same naming convention used in `components/pms/`.
5. THE POD_Dashboard SHALL manage all local UI state (filters, selected tab, drawer open state, sidebar open state) using React useState hooks within the page component, SHALL NOT introduce new Zustand stores for POD-page-only UI state, and SHALL consume existing Zustand stores (e.g., useAuthStore, useDriverStore) only for shared application state.
6. THE POD_Dashboard SHALL NOT introduce new external dependencies beyond what is already in the project's package.json.
7. THE POD_Dashboard SHALL use the existing utility function `cn()` from `lib/utils` for conditional class merging throughout all components.
8. THE POD_Dashboard SHALL use the `@/` path alias for all imports referencing project modules (e.g., `@/components/ui/card`, `@/lib/utils`), and SHALL NOT use relative paths that traverse above the component's own directory.

### Requirement 11: Accessibility

**User Story:** As a user who relies on assistive technologies, I want the POD page to be accessible, so that I can manage delivery confirmations regardless of ability.

#### Acceptance Criteria

1. THE POD_Dashboard SHALL ensure all interactive elements are reachable and operable using keyboard navigation alone (Tab, Enter, Escape, Arrow keys) in a logical reading order matching the visual layout sequence from top to bottom and left to right.
2. THE POD_Table SHALL use semantic HTML table elements (table, thead, tbody, tr, th, td) with scope="col" attributes on all column header (th) elements within thead.
3. WHILE the POD_Detail_Drawer is open, THE POD_Detail_Drawer SHALL trap focus within the drawer and return focus to the triggering element upon close.
4. THE POD_Dashboard SHALL provide aria-label attributes for all icon-only buttons (hamburger menu, notification bell, chevron actions, close buttons) with labels that describe the button's action (e.g., "Open navigation menu", "View notifications", "View POD details", "Close drawer").
5. THE POD_Dashboard SHALL not use color as the sole means of conveying POD status; all status indicators SHALL include visible text labels (e.g., "Pending", "Done", "Awaiting Capture") alongside color.
6. THE Driver_View cards that function as navigation links SHALL use semantic button or anchor elements with accessible names that include the Trip ID and action context (e.g., "Capture POD for Trip {tripId}").
7. WHEN the POD_Detail_Drawer opens, THE POD_Detail_Drawer SHALL announce its title to screen readers using aria-labelledby referencing the drawer heading element and SHALL set role="dialog" with aria-modal="true".
8. WHEN the POD_Table sort order changes, THE POD_Table SHALL indicate the current sort column and direction using aria-sort attribute values ("ascending" or "descending") on the active column header.
9. WHEN filter or search actions update the visible record count in the POD_Table, THE POD_Dashboard SHALL announce the updated result count to screen readers using an aria-live="polite" region within 500 milliseconds of the content update.

### Requirement 12: Data Integration and State Management

**User Story:** As a developer, I want the POD page to correctly read from and connect to existing Zustand stores, so that data flows consistently and the page reflects real-time state.

#### Acceptance Criteria

1. THE POD_Dashboard SHALL read trip data from Trip_Store, filtering trips with status "delivered" or "completed" to determine which trips need POD capture.
2. THE POD_Dashboard SHALL read POD records from Pod_Store and match them to trips using the tripId field to determine which trips have captured PODs.
3. THE POD_Dashboard SHALL read driver data from Driver_Store to resolve driverId fields on trips to driver names for display in the Admin_View; IF a trip's driverId is undefined or does not match any driver in Driver_Store, THEN THE POD_Dashboard SHALL display "Unassigned" as the driver name for that trip.
4. THE Driver_View SHALL filter trips to show only those assigned to the current driver by matching the trip's driverId to the driverId field from the Auth_Store user object; IF the Auth_Store user object has no driverId, THEN THE Driver_View SHALL fall back to the first driver's id in Driver_Store; IF Driver_Store contains zero drivers, THEN THE Driver_View SHALL display an empty state indicating no driver profile is linked.
5. WHEN a new POD is captured (added to Pod_Store via the `/pod/{tripId}` capture page), THE POD_Dashboard SHALL reflect the updated counts and move the trip from "Awaiting POD" to "Captured" reactively through Zustand store subscription on the next React render cycle, without requiring a manual page refresh or polling interval.
6. IF Trip_Store contains zero trips with status "delivered" or "completed", THEN THE POD_Dashboard SHALL display an empty state message indicating no deliveries require POD management in the Admin_View POD_Table area, and an empty state card in the Driver_View POD_Card_List area.
