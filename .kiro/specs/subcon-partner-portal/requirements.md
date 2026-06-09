# Requirements Document

## Introduction

This feature introduces a new "partner" user role and dedicated portal for Subcontractor/Partner users in the NexLogistics application. Currently, partner data is managed exclusively by admins through the Subcon Partners page. This feature enables partners to log in themselves and access a self-service portal where they can view their assigned trips, submit funding requests, track earnings/payouts, and manage their profile — mirroring the pattern established by the Client Portal and Driver Portal.

## Glossary

- **Partner_Portal**: The dedicated web portal accessible to users with the "partner" role, providing self-service access to trip data, requests, earnings, and profile management.
- **Partner_User**: A system user with the "partner" role, representing a subcontractor or third-party hauler company.
- **Partner_Request**: A funding request (diesel, cash advance, or other) submitted by a partner for approval by admin staff.
- **Partner_Payout**: A payment owed or made to a partner for a completed trip, tracked via the trip's partnerPayoutStatus field.
- **Role_Type**: The TypeScript union type defining all valid user roles in the system.
- **Navigation_System**: The centralized NAV_ITEMS array and supporting functions (navForRole, DEFAULT_LANDING, ROLE_LABEL) that control sidebar navigation and routing per role.
- **Login_Page**: The demo login page displaying role cards with credentials for instant role-based access.
- **Auth_Store**: The Zustand authentication store managing user sessions and role-based login.

## Requirements

### Requirement 1: Partner Role Definition

**User Story:** As a system architect, I want to add a "partner" role to the type system, so that partner users can be authenticated and routed correctly.

#### Acceptance Criteria

1. THE Role_Type SHALL include "partner" as a valid role value.
2. THE User interface SHALL include a "partnerId" field of type string that is present when the user's role is "partner", following the same pattern as "driverId" for "driver", "helperId" for "helper", and "clientId" for "client".
3. THE ROLE_LABEL mapping SHALL define the display name "Subcon Partner" for the "partner" role.
4. THE DEFAULT_LANDING mapping SHALL define "/partner-portal/overview" as the default landing page for the "partner" role.
5. WHEN a user with role "partner" authenticates, THE system SHALL resolve the user record including the partnerId field and route the user to the default landing page "/partner-portal/overview".

### Requirement 2: Partner Portal Navigation

**User Story:** As a partner user, I want dedicated navigation items in my sidebar, so that I can access all portal sections relevant to my operations.

#### Acceptance Criteria

1. THE Navigation_System SHALL include the following navigation items restricted to the "partner" role: Overview, My Trips, Requests, Earnings, Profile, and Settings.
2. THE Navigation_System SHALL route the "Overview" item to "/partner-portal/overview".
3. THE Navigation_System SHALL route the "My Trips" item to "/partner-portal/trips".
4. THE Navigation_System SHALL route the "Requests" item to "/partner-portal/requests".
5. THE Navigation_System SHALL route the "Earnings" item to "/partner-portal/earnings".
6. THE Navigation_System SHALL route the "Profile" item to "/partner-portal/profile".
7. THE Navigation_System SHALL route the "Settings" item to "/partner-portal/settings".
8. WHEN a partner user is logged in, THE Navigation_System SHALL display only partner-specific navigation items (plus Settings which is available to all roles).

### Requirement 3: Login Page Integration

**User Story:** As a demo user, I want a partner role card on the login page, so that I can quickly log in as a partner to explore the portal.

#### Acceptance Criteria

1. THE Login_Page SHALL display a "Subcon Partner" role card as the 8th card in the ROLE_CARDS array, showing the card title "SUBCON PARTNER", a subtitle, a description of partner portal capabilities, the demo email address, and the demo password.
2. THE Auth_Store SHALL include a seed partner user in the seedUsers array with the "partner" role, a partnerId field linking to an existing partner entity from the partners seed data, an email in the format "[name]@nexlogistics.demo", and a _demoPassword value following the existing pattern (capitalized role name + "123!").
3. WHEN the "Subcon Partner" role card login button is clicked, THE Login_Page SHALL authenticate the user via the loginAsRole function and redirect to "/partner-portal/overview" as defined in DEFAULT_LANDING for the "partner" role.
4. THE Login_Page quick access section SHALL include a "Subcon Partner" entry in the QUICK_ACCESS array with a role value of "partner", a label of "Subcon Partner", the matching demo password code, an icon, and a color class, following the same structure as existing quick access entries.

### Requirement 4: Partner Portal Overview Dashboard

**User Story:** As a partner user, I want a dashboard showing my key metrics at a glance, so that I can quickly understand my current operational status.

#### Acceptance Criteria

1. THE Partner_Portal overview page SHALL display KPI cards for: total assigned trips (all trips with the partner's partnerId regardless of status), active trips (trips with status "scheduled", "driver_assigned", "vehicle_dispatched", "loaded", "in_transit", or "delayed"), completed trips (trips with status "completed" or "delivered"), and pending payables (sum of partnerRate for trips where partnerPayoutStatus is "pending", formatted as ₱ in en-PH locale with two decimal places).
2. THE Partner_Portal overview page SHALL display a list of the 5 most recent trips (ordered by createdAt descending) with trip ID, route (pickup address → dropoff address), status, and createdAt date; IF the partner has fewer than 5 trips, THEN the list SHALL display all available trips.
3. THE Partner_Portal overview page SHALL display a summary of pending requests showing the count of PartnerRequest records with status "pending" and the total amount of those requests formatted as ₱ in en-PH locale with two decimal places.
4. THE Partner_Portal overview page SHALL display quick link cards to navigate to Trips, Requests, Earnings, and Profile sections, where each card is a clickable element that navigates to the corresponding section.
5. THE Partner_Portal overview page SHALL filter all displayed data (KPI cards, recent trips list, pending requests summary) to show only records where partnerId matches the currently logged-in partner's ID.
6. IF the logged-in partner has zero trips and zero pending requests, THEN THE Partner_Portal overview page SHALL display all KPI cards with a value of 0 (or ₱0.00 for the payables card), an empty recent trips list with a message indicating no trips are available, and a pending requests summary showing 0 count and ₱0.00 total.

### Requirement 5: Partner Trips Page

**User Story:** As a partner user, I want to view all trips assigned to my company, so that I can track delivery progress and manage my operations.

#### Acceptance Criteria

1. THE Partner_Portal trips page SHALL display a list of all trips where the trip's partnerId matches the logged-in partner's partnerId, sorted by pickup scheduled date in descending order (most recent first).
2. THE Partner_Portal trips page SHALL display for each trip: trip ID, client name (resolved from clientId), pickup address, dropoff address, pickup scheduled date, distance (km), status, and partner payout amount (the partnerRate field value; if partnerRate is not set, use partner's defaultRate or ratePerKm × distance).
3. THE Partner_Portal trips page SHALL provide filter controls for trip status with the following options: "All" (no status filter applied), "Active" (trips with status "scheduled", "driver_assigned", "vehicle_dispatched", "loaded", or "in_transit"), "Completed" (trips with status "completed"), and "Cancelled" (trips with status "cancelled").
4. THE Partner_Portal trips page SHALL provide a search input that performs case-insensitive partial matching against trip ID, pickup address, and dropoff address fields.
5. WHEN a trip row is clicked, THE Partner_Portal trips page SHALL display a detail view showing: trip ID, client name, pickup address, dropoff address, pickup and dropoff scheduled dates, distance (km), cargo type, cargo weight (kg), cargo units, status timeline (list of all statusLog entries showing status label and timestamp in chronological order), partner payout amount, and partner payout status (displaying "pending" or "paid").
6. IF the logged-in partner has zero trips matching their partnerId, THEN THE Partner_Portal trips page SHALL display an empty state message indicating no trips are currently assigned to the partner.

### Requirement 6: Partner Requests Page

**User Story:** As a partner user, I want to submit and track funding requests (diesel, cash advance, others), so that I can manage my operational cash flow.

#### Acceptance Criteria

1. THE Partner_Portal requests page SHALL display all partner requests belonging to the logged-in partner in reverse chronological order (newest requestedAt first), showing: date, type, amount (formatted in PHP ₱ using en-PH locale), reason, and status.
2. THE Partner_Portal requests page SHALL provide a "New Request" button that opens a form to submit a new request.
3. WHEN submitting a new request, THE Partner_Portal requests page SHALL require the user to select a request type (diesel, cash_advance, or other), enter an amount greater than zero, and optionally provide a reason.
4. IF a required field (type or amount) is empty or the amount is not greater than zero on submission, THEN THE Partner_Portal requests page SHALL display a validation error and SHALL NOT submit the request.
5. WHEN a new request is submitted with valid data, THE Partner_Portal requests page SHALL create the request with status "pending" and the current partner's partnerId, close the request form, and display the new request at the top of the list.
6. THE Partner_Portal requests page SHALL display status badges with a distinct background color for each status: pending (amber/warning), approved (blue/info), rejected (red/danger), and released (green/success).
7. THE Partner_Portal requests page SHALL provide filter controls for request status (all, pending, approved, rejected, released); WHEN a filter is selected, only requests matching the selected status SHALL be displayed.
8. IF the logged-in partner has zero requests matching the active filter, THEN THE Partner_Portal requests page SHALL display an empty state message.

### Requirement 7: Partner Earnings Page

**User Story:** As a partner user, I want to view my earnings and payment history, so that I can track revenue and reconcile payments.

#### Acceptance Criteria

1. THE Partner_Portal earnings page SHALL display summary KPIs: total earnings (all time), paid amount, pending/unpaid amount, and total trips completed, where all monetary values are formatted in PHP peso (₱ symbol, en-PH locale, two decimal places).
2. THE Partner_Portal earnings page SHALL display a table of trip payouts showing: trip ID, date completed, route (origin → destination), rate applied, payout amount (formatted in PHP ₱), and payout status (pending/paid), sorted by date completed in descending order (newest first).
3. THE Partner_Portal earnings page SHALL provide filter controls for payout status defaulting to "all", allowing selection of "all", "pending", or "paid".
4. IF a trip has partnerPayoutStatus "paid", THEN THE Partner_Portal earnings page SHALL display the payment date (partnerPayoutAt) formatted as a date value.
5. THE Partner_Portal earnings page SHALL calculate the payout amount for each trip using the following precedence: first use the trip's partnerRate field if defined and greater than zero; otherwise use the partner's defaultRate if defined and greater than zero; otherwise compute ratePerKm multiplied by the trip's distanceKm; if none yields a value greater than zero, display ₱0.00.
6. IF the authenticated partner has zero completed trips, THEN THE Partner_Portal earnings page SHALL display all KPI values as zero and show an empty state message in the table area.
7. THE Partner_Portal earnings page SHALL display only trips where the trip's partnerId matches the authenticated partner's ID and the trip status is "completed" or "delivered".

### Requirement 8: Partner Profile Page

**User Story:** As a partner user, I want to view my company profile and banking details, so that I can verify my information is correct.

#### Acceptance Criteria

1. THE Partner_Portal profile page SHALL display the partner's company information grouped in a "Profile" section: company name, contact person, phone, email, address, TIN, and vehicle types (displayed as a comma-separated list).
2. THE Partner_Portal profile page SHALL display the partner's banking details grouped in a "Banking" section: bank name and account number masked to show only the last 4 characters with all preceding characters replaced by asterisks (e.g., "****7791").
3. THE Partner_Portal profile page SHALL display the partner's rate configuration grouped in a "Rates" section: default rate and rate per km, formatted using PHP peso currency format (₱ symbol, en-PH locale, two decimal places).
4. THE Partner_Portal profile page SHALL display the partner's current status (active, suspended, inactive) using a color-coded Badge component: green for active, amber for suspended, and neutral for inactive.
5. THE Partner_Portal profile page SHALL present all information in a read-only format using Card components consistent with the application's design system.
6. IF an optional field (TIN, bank name, bank account number, default rate, or rate per km) has no value, THEN THE Partner_Portal profile page SHALL display a dash character ("—") in place of the missing value.

### Requirement 9: Partner Settings Page

**User Story:** As a partner user, I want a settings page, so that I can manage my account preferences.

#### Acceptance Criteria

1. THE Partner_Portal settings page SHALL display a profile section showing the partner user's full name, email address, and phone number.
2. THE Partner_Portal settings page SHALL provide a notification preferences section with toggles for notification categories.
3. THE Partner_Portal settings page SHALL follow the same layout pattern as the driver settings page.
4. WHEN the Log Out button is activated, THE Partner_Portal settings page SHALL clear the user's authentication session and redirect to the login page.

### Requirement 10: Portal Layout and Routing

**User Story:** As a partner user, I want the portal to have consistent layout and navigation patterns, so that the experience feels cohesive with the rest of the application.

#### Acceptance Criteria

1. THE Partner_Portal SHALL use a dedicated layout component at the route group level (app/(app)/partner-portal/layout.tsx) that renders a page title heading ("Partner Portal") and a descriptive subtitle summarizing the portal's purpose, followed by the child page content.
2. THE Partner_Portal layout SHALL use the same wrapper structure as the client-portal layout component: a container with vertical spacing between the header section and child content, and bottom padding.
3. WHEN a user navigates to the /partner-portal root path, THE Partner_Portal root page SHALL redirect to /partner-portal/overview using a server-side redirect.
4. IF a user does not have the "partner" role assigned, THEN THE Navigation_System SHALL exclude /partner-portal routes from the sidebar navigation items for that user by filtering on the roles array in the NAV_ITEMS configuration.
5. THE Partner_Portal pages SHALL use existing UI components from the application's design system (Card, Badge, Button, KpiCard, PageHeader) and SHALL NOT introduce custom replacements for these components.
6. WHEN the Partner_Portal entry is added to NAV_ITEMS, THE Navigation_System SHALL assign it to the "customer" group and restrict visibility to the "partner" role via the roles property.

### Requirement 11: Data Store Integration

**User Story:** As a developer, I want the partner portal to integrate with existing Zustand stores, so that data flows correctly from the shared state.

#### Acceptance Criteria

1. THE Partner_Portal SHALL read trip data from the existing useTripStore, filtering only trips whose partnerId field matches the current user's partnerId, and SHALL display an empty state when zero trips match.
2. THE Partner_Portal SHALL read partner request data from the existing usePartnerRequestStore, filtering only requests whose partnerId matches the current user's partnerId, and SHALL write new requests by calling addRequest with the current user's partnerId pre-filled.
3. THE Partner_Portal SHALL read the current partner's profile from the existing usePartnerStore by finding the partner whose id matches the current user's partnerId.
4. THE Auth_Store loginAsRole function SHALL support the "partner" role by returning a seed partner user whose partnerId references an existing Partner record in usePartnerStore.
5. WHEN the partner user logs in via loginAsRole("partner") or loginWithEmail with valid partner credentials, THE Auth_Store SHALL populate the user object with a partnerId field that matches the id of an existing Partner in usePartnerStore.
