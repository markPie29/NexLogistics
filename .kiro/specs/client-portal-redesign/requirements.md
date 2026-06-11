# Requirements Document

## Introduction

The Client Portal is a dedicated section of the NexLogistics platform for users with the `client` role. It must function as a unified, professional view into a client's logistics activity — showing real shipments (trips), real invoices, real documents, and real support tickets, all pulled from the same Zustand stores that power the admin side. Currently, the portal operates on a completely isolated `useClientPortalStore` with hardcoded US-location dummy data that has no connection to the rest of the system. This redesign eliminates that isolated store and connects the portal to the core system stores, filtered by the authenticated user's `clientId`. All data must be Philippine-realistic (Filipino names, PH addresses, ₱ currency, `en-PH` locale). The UI must be consistent with the rest of the platform — shadcn/ui components, brand colors (teal `#66B2B2`, navy `#0B1220`), Lucide icons, proper spacing, and professional principal-level UI/UX orientation.

## Glossary

- **Client_Portal**: The set of pages under `/client-portal/*` accessible only to users with `role === "client"`
- **Authenticated_Client**: The logged-in user whose `user.clientId` links to a record in `useClientStore`
- **Trip_Store**: The global `useTripStore` containing all trips for all clients
- **Invoice_Store**: The global `useInvoiceStore` containing all invoices for all clients
- **Client_Store**: The global `useClientStore` containing all client records
- **Billing_Payment_Store**: The global `useBillingPaymentStore` for payment records
- **Portal_Layout**: The `layout.tsx` component that wraps all client portal sub-pages
- **Brand_Colors**: Teal (`#66B2B2`) as primary action color, Navy (`#0B1220`) for headings/text
- **PH_Locale**: `en-PH` locale, `PHP` currency, `Asia/Manila` timezone, Philippine addresses and names
- **shadcn_UI**: The Radix-based component library (Card, Badge, Button, Dialog, Tabs, Table, etc.)

## Requirements

### Requirement 1: Eliminate Isolated Client Portal Store

**User Story:** As a client user, I want the portal to show my real logistics data, so that I see the same shipments, invoices, and documents that the operations team manages for me.

#### Acceptance Criteria

1. WHEN the Client_Portal loads, THE Client_Portal SHALL read trip data from Trip_Store filtered by the Authenticated_Client's `clientId`
2. WHEN the Client_Portal loads, THE Client_Portal SHALL read invoice data from Invoice_Store filtered by the Authenticated_Client's `clientId`
3. WHEN the Client_Portal loads, THE Client_Portal SHALL read payment data from Billing_Payment_Store filtered by the Authenticated_Client's `clientId`
4. THE Client_Portal SHALL NOT maintain a separate `useClientPortalStore` for shipments, invoices, or documents that duplicates data from core stores
5. THE Client_Portal SHALL retain a lightweight portal-specific store only for portal-only entities (support tickets, report exports, notification preferences) that do not exist in core stores

### Requirement 2: Philippine-Realistic Seed Data

**User Story:** As a client user, I want to see realistic Philippine logistics data, so that the demo feels authentic to our local operations.

#### Acceptance Criteria

1. THE Trip_Store seed data SHALL include trips with `clientId: "c-001"` using Philippine pickup/dropoff addresses (Metro Manila, Pampanga, Laguna, Batangas, Bulacan, Cavite)
2. THE Invoice_Store seed data SHALL include invoices with `clientId: "c-001"` using PHP amounts formatted with `₱` symbol and `en-PH` locale
3. THE Client_Portal seed data for support tickets SHALL reference Filipino contact names, Philippine locations, and realistic logistics scenarios (e.g., EDSA traffic delay, port congestion at Manila International Container Terminal)
4. THE Client_Portal seed data for documents SHALL reference Philippine document types (Bill of Lading, Delivery Receipt, OR/CR, BIR 2307, Certificate of Insurance) with Filipino uploader names
5. IF the Authenticated_Client's `clientId` matches "c-001", THEN THE Client_Portal SHALL display data for "ABC Construction Inc." with contact person "Engr. Robert Lim"

### Requirement 3: Currency and Locale Formatting

**User Story:** As a client user, I want all monetary values displayed in Philippine Peso with proper formatting, so that financial data is unambiguous.

#### Acceptance Criteria

1. THE Client_Portal SHALL format all monetary values using the `formatCurrency` utility from `@/lib/utils` which uses `en-PH` locale and `PHP` currency
2. THE Client_Portal SHALL display dates using `Asia/Manila` timezone via `toLocaleDateString("en-PH")` or equivalent Intl formatting
3. THE Client_Portal SHALL display phone numbers in Philippine format (e.g., `(02) 8888-1234` for landlines, `0917 xxx xxxx` for mobile)
4. IF an invoice amount is displayed, THEN THE Client_Portal SHALL show it as `₱XX,XXX.XX` format (e.g., `₱245,760.00`)

### Requirement 4: Overview Dashboard Data Connection

**User Story:** As a client user, I want the overview dashboard to show accurate KPIs from my actual trips and invoices, so that I have a reliable at-a-glance view.

#### Acceptance Criteria

1. WHEN the overview page loads, THE Client_Portal SHALL compute "Total Shipments" from Trip_Store trips where `trip.clientId === user.clientId`
2. WHEN the overview page loads, THE Client_Portal SHALL compute "In Transit" count from trips with status `in_transit` or `loaded` or `vehicle_dispatched`
3. WHEN the overview page loads, THE Client_Portal SHALL compute "Delivered" count from trips with status `delivered` or `completed`
4. WHEN the overview page loads, THE Client_Portal SHALL compute "Outstanding Balance" from Invoice_Store invoices where `invoice.clientId === user.clientId` and `invoice.balance > 0`
5. THE Client_Portal overview SHALL display a "Recent Shipments" table showing the 5 most recent trips sorted by `createdAt` descending

### Requirement 5: Shipments Page — Trip Store Integration

**User Story:** As a client user, I want the shipments page to show my actual trip records with real status tracking, so that I can monitor deliveries in progress.

#### Acceptance Criteria

1. THE Client_Portal shipments page SHALL display all trips from Trip_Store where `trip.clientId === user.clientId`
2. THE Client_Portal shipments page SHALL map Trip statuses to client-friendly labels: `scheduled` → "Scheduled", `in_transit` → "In Transit", `delivered` → "Delivered", `completed` → "Completed", `delayed` → "Delayed", `cancelled` → "Cancelled"
3. WHEN a shipment row is selected, THE Client_Portal SHALL display trip detail including: pickup address, dropoff address, cargo description, weight, vehicle plate (derived from `vehicleId`), driver name (derived from `driverId`), and status timeline from `trip.statusLogs`
4. THE Client_Portal shipments page SHALL support filtering by status and searching by trip ID, pickup address, or dropoff address
5. THE Client_Portal shipments page SHALL display pickup and dropoff addresses as Philippine locations (not US cities)

### Requirement 6: Invoices Page — Invoice Store Integration

**User Story:** As a client user, I want the invoices page to show my actual invoices with real amounts and payment status, so that I can manage my account payables.

#### Acceptance Criteria

1. THE Client_Portal invoices page SHALL display all invoices from Invoice_Store where `invoice.clientId === user.clientId`
2. THE Client_Portal invoices page SHALL show invoice line items, subtotal, VAT (12%), VAT amount, total, paid amount, and outstanding balance
3. WHEN an invoice has status `overdue`, THE Client_Portal SHALL display it with a red warning indicator
4. THE Client_Portal invoices page SHALL support filtering by status (`paid`, `sent`, `overdue`, `partially_paid`, `draft`) and searching by invoice number
5. THE Client_Portal invoices page SHALL display amounts in `₱XX,XXX.XX` format using the `formatCurrency` utility

### Requirement 7: UI Consistency with shadcn/ui Components

**User Story:** As a client user, I want the portal to look and feel consistent with the rest of the NexLogistics platform, so that the experience is cohesive.

#### Acceptance Criteria

1. THE Client_Portal SHALL use the shadcn/ui `Dialog` component for all modal interactions instead of custom fixed-position overlays
2. THE Client_Portal SHALL use the shadcn/ui `Tabs` component for tab navigation within detail panels instead of custom button-based tabs
3. THE Client_Portal SHALL use the shadcn/ui `Table` component (with `TableHeader`, `TableBody`, `TableRow`, `TableCell`) for all data tables instead of raw HTML `<table>` elements
4. THE Client_Portal SHALL use `Select` from shadcn/ui for dropdown filters instead of raw `<select>` elements
5. THE Client_Portal SHALL use the shadcn/ui `Badge` component with consistent color mapping across all pages (success: green, warning: amber, danger: red, info: blue, neutral: gray)

### Requirement 8: Brand Color Consistency

**User Story:** As a client user, I want the portal's color scheme to match the NexLogistics brand, so that the interface feels professional and unified.

#### Acceptance Criteria

1. THE Client_Portal SHALL use brand teal (`#66B2B2`) as the primary action button color instead of `#008A56` green
2. THE Client_Portal SHALL use brand navy (`#0B1220`) for headings and emphasis text
3. THE Client_Portal SHALL use `brand-teal-light` (`#E6F2F2`) for highlighted backgrounds and hover states
4. THE Client_Portal SHALL use status colors from `tailwind.config.ts` for status indicators: success (`#10B981`), warning (`#F59E0B`), danger (`#EF4444`), info (`#3B82F6`)
5. THE Client_Portal SHALL NOT use hardcoded colors (`#008A56`, `#007045`, `#0E7490`) that are not defined in the brand configuration

### Requirement 9: Layout and Spacing Standards

**User Story:** As a client user, I want proper spacing and visual hierarchy, so that the interface is easy to scan and navigate.

#### Acceptance Criteria

1. THE Client_Portal layout SHALL use consistent spacing: `gap-6` between major sections, `gap-4` between cards within a section, `p-6` for card content padding
2. THE Client_Portal SHALL use a consistent KPI card pattern: icon top-right, label top-left, large value below, optional trend indicator
3. THE Client_Portal SHALL maintain a 16px (1rem) minimum touch target spacing between interactive elements
4. THE Client_Portal detail panels SHALL use consistent label-value grid layout with `grid-cols-[100px_1fr]` alignment across all pages
5. THE Client_Portal tables SHALL use consistent row height (`h-12`), font size (`text-sm` for body, `text-xs` for secondary text), and padding (`px-4 py-3`)

### Requirement 10: Portal Navigation and Tab Structure

**User Story:** As a client user, I want clear navigation between portal sections, so that I can quickly find shipments, invoices, documents, or support.

#### Acceptance Criteria

1. THE Portal_Layout SHALL include a tab navigation bar using shadcn/ui `Tabs` with tabs for: Overview, Shipments, Invoices, Documents, Reports, Support
2. THE Portal_Layout SHALL highlight the active tab based on the current URL path segment
3. THE Portal_Layout SHALL display the client company name and contact person in the header area, pulled from Client_Store using the Authenticated_Client's `clientId`
4. WHEN the user navigates to `/client-portal`, THE Client_Portal SHALL redirect to `/client-portal/overview`

### Requirement 11: Documents Page Integration

**User Story:** As a client user, I want the documents page to show relevant logistics documents tied to my shipments, so that I can access BOLs, receipts, and compliance files.

#### Acceptance Criteria

1. THE Client_Portal documents page SHALL display documents associated with trips where `trip.clientId === user.clientId`
2. THE Client_Portal documents page SHALL categorize documents as: Delivery (BOL, DR, POD), Compliance (Insurance, Permits), Financial (BIR 2307, SOA), Rate (Rate Confirmation)
3. THE Client_Portal documents page SHALL support filtering by category and document type (PDF, DOCX, XLSX)
4. THE Client_Portal documents page SHALL display Filipino uploader names and Philippine-relevant document descriptions
5. IF a document is less than 48 hours old, THEN THE Client_Portal SHALL display a "New" badge on the document row

### Requirement 12: Reports Page Data Accuracy

**User Story:** As a client user, I want reports to reflect my actual shipment and financial data, so that I can use them for internal tracking and audits.

#### Acceptance Criteria

1. THE Client_Portal reports page SHALL compute KPIs (total shipments, on-time rate, total spend) from Trip_Store and Invoice_Store filtered by `user.clientId`
2. THE Client_Portal reports page SHALL display a "Top Lanes" table derived from actual trip pickup/dropoff addresses grouped by route
3. THE Client_Portal reports page SHALL display Philippine route names (e.g., "Manila → Pampanga", "Makati → Laguna") instead of US city names
4. THE Client_Portal reports page SHALL calculate on-time delivery rate as: (trips with `delivered` or `completed` status) / (total trips excluding `scheduled` and `cancelled`) × 100

### Requirement 13: Support Page Functionality

**User Story:** As a client user, I want to create and track support tickets tied to my actual shipments and invoices, so that issues are resolved in context.

#### Acceptance Criteria

1. THE Client_Portal support page SHALL allow creating tickets with references to actual trip IDs or invoice numbers from the client's data
2. THE Client_Portal support page SHALL display ticket status (Open, In Progress, Resolved) with consistent badge styling
3. WHEN a ticket references a shipment, THE Client_Portal SHALL display the trip's current status alongside the ticket
4. THE Client_Portal support page SHALL retain a portal-specific ticket store since support tickets do not exist in core stores
5. THE Client_Portal support page SHALL display realistic Filipino support agent names and Philippine business-hours context

### Requirement 14: Responsive and Accessible Design

**User Story:** As a client user, I want the portal to work on tablet and desktop screens with proper accessibility, so that all team members can use it effectively.

#### Acceptance Criteria

1. THE Client_Portal SHALL use responsive grid layouts that collapse from multi-column (desktop) to single-column (tablet) at the `xl` breakpoint
2. THE Client_Portal SHALL ensure all interactive elements have visible focus indicators using the ring utility (`focus-visible:ring-2 ring-brand-teal`)
3. THE Client_Portal SHALL provide proper `aria-label` attributes on icon-only buttons
4. THE Client_Portal tables SHALL include proper `<thead>` scope attributes and row selection feedback
5. THE Client_Portal color contrast SHALL meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
