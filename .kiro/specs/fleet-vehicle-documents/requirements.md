# Requirements Document

## Introduction

Implement a complete Documents and Permits management system for the vehicle detail page in the NexLogistics fleet management platform. The existing Documents tab at `/fleet/[id]` currently shows an empty placeholder. This feature replaces that placeholder with a fully functional CRUD interface for managing Philippine logistics-specific vehicle documents (OR/CR, Insurance, LTFRB Franchise, etc.) and permits (City Permits, Mayor's Permit, Barangay Clearance, Special Permits). The system tracks expiry dates with visual indicators, supports simulated file uploads with metadata, and includes realistic seed data for demo purposes.

## Glossary

- **Documents_Tab**: The "Documents" tab content area within the vehicle detail page at `app/(app)/fleet/[id]/page.tsx`, replacing the current empty state placeholder.
- **Vehicle_Document**: A record representing a regulatory or operational document associated with a specific vehicle (e.g., OR/CR, Insurance Certificate, LTFRB Franchise).
- **Vehicle_Permit**: A record representing a government-issued permit associated with a specific vehicle (e.g., City Permit, Mayor's Permit, Barangay Clearance, Special Permit).
- **Document_Store**: The Zustand store (`useVehicleDocumentStore`) managing vehicle document and permit records with persistence.
- **Document_Form**: The slide-over drawer component used for creating and editing vehicle documents.
- **Permit_Form**: The slide-over drawer component used for creating and editing vehicle permits.
- **Expiry_Indicator**: A visual Badge component showing the expiry status of a document or permit (expired, expiring soon, valid).
- **Document_Category**: A classification type for vehicle documents: OR/CR, Insurance, LTFRB Franchise, LTO Registration.
- **Permit_Category**: A classification type for vehicle permits: City Permit, Barangay Clearance, Mayor's Permit, Special Permit (Hazmat), Special Permit (Overweight), Special Permit (Oversized).
- **File_Attachment**: Simulated file metadata associated with a document or permit record (file name, file size in bytes, upload date).
- **Fleet_Store**: The existing Zustand store (`useFleetStore`) providing vehicle data.

## Requirements

### Requirement 1: Vehicle Document Data Model and Store

**User Story:** As a fleet manager, I want vehicle documents to be stored persistently in the application state, so that I can manage document records without losing data between sessions.

#### Acceptance Criteria

1. THE Document_Store SHALL store Vehicle_Document records with the following fields: id (unique string), vehicleId (string referencing Fleet_Store), category (Document_Category), documentNumber (string, maximum 50 characters), issuedDate (ISO date string), expiryDate (ISO date string), issuingAuthority (string, maximum 100 characters), notes (optional string, maximum 500 characters), fileAttachment (optional File_Attachment object containing fileName string, fileSize number in bytes, and uploadedAt ISO date string), createdAt (ISO date string), and updatedAt (ISO date string).
2. THE Document_Store SHALL store Vehicle_Permit records with the following fields: id (unique string), vehicleId (string referencing Fleet_Store), category (Permit_Category), permitNumber (string, maximum 50 characters), issuedDate (ISO date string), expiryDate (ISO date string), issuingAuthority (string, maximum 100 characters), coverageArea (optional string, maximum 100 characters, indicating the city or municipality for City Permits), notes (optional string, maximum 500 characters), fileAttachment (optional File_Attachment object containing fileName string, fileSize number in bytes, and uploadedAt ISO date string), createdAt (ISO date string), and updatedAt (ISO date string).
3. THE Document_Store SHALL persist all records using Zustand persist middleware with the storage key following the existing pattern (`${BRAND.storeKey}-vehicle-documents`).
4. THE Document_Store SHALL provide methods: addDocument, updateDocument, deleteDocument, addPermit, updatePermit, and deletePermit that update the persisted state.
5. WHEN addDocument or addPermit is called, THE Document_Store SHALL generate a unique id using the pattern `vd-${Date.now().toString(36)}` for documents and `vp-${Date.now().toString(36)}` for permits, and set createdAt and updatedAt to the current ISO timestamp.
6. WHEN updateDocument or updatePermit is called, THE Document_Store SHALL update only the provided fields and set updatedAt to the current ISO timestamp.

### Requirement 2: Document Categories for Philippine Logistics

**User Story:** As a fleet manager operating in the Philippines, I want document categories specific to Philippine logistics regulations, so that I can accurately classify vehicle paperwork per local requirements.

#### Acceptance Criteria

1. THE Document_Store SHALL support the following Document_Category values: "OR/CR" (Official Receipt and Certificate of Registration), "Insurance" (comprehensive or third-party liability), "LTFRB Franchise" (Land Transportation Franchising and Regulatory Board Certificate of Public Convenience), and "LTO Registration" (Land Transportation Office annual registration).
2. THE Document_Store SHALL support the following Permit_Category values: "City Permit" (municipal business or route permit), "Barangay Clearance" (barangay-level clearance for operations), "Mayor's Permit" (local government unit business permit), "Special Permit (Hazmat)" (for hazardous materials transport), "Special Permit (Overweight)" (for exceeding standard weight limits), and "Special Permit (Oversized)" (for exceeding standard dimension limits).
3. THE Document_Form SHALL display Document_Category options in a dropdown select with labels matching the category names defined in acceptance criterion 1.
4. THE Permit_Form SHALL display Permit_Category options in a dropdown select with labels matching the category names defined in acceptance criterion 2.

### Requirement 3: Create Vehicle Document

**User Story:** As a fleet manager, I want to add new documents to a vehicle record, so that I can keep track of all active registrations and certifications.

#### Acceptance Criteria

1. WHEN the "Add Document" button is clicked within the Documents_Tab, THE Document_Form SHALL open as a slide-over Sheet from the right side of the screen with the heading "Add Document" and all form fields empty.
2. THE Document_Form SHALL display the following fields: Category (required dropdown select from Document_Category values), Document Number (required text input, maximum 50 characters), Issued Date (required date picker), Expiry Date (required date picker), Issuing Authority (required text input, maximum 100 characters), Notes (optional textarea, maximum 500 characters), and File Upload (optional simulated file picker).
3. WHEN the form is submitted with valid data, THE Document_Form SHALL call Document_Store.addDocument with the vehicleId set to the current vehicle's id, close the Sheet, and display a success toast notification for 5 seconds.
4. IF any required field (Category, Document Number, Issued Date, Expiry Date, Issuing Authority) is empty on submission, THEN THE Document_Form SHALL display an inline validation error below each invalid field and SHALL NOT close the Sheet.
5. IF the Expiry Date is earlier than or equal to the Issued Date, THEN THE Document_Form SHALL display a validation error on the Expiry Date field indicating that it must be after the Issued Date.
6. WHEN the user clicks "Cancel" or clicks outside the Sheet, THE Document_Form SHALL close without saving changes.

### Requirement 4: Create Vehicle Permit

**User Story:** As a fleet manager, I want to add new permits to a vehicle record, so that I can track all government-issued permits required for legal operation.

#### Acceptance Criteria

1. WHEN the "Add Permit" button is clicked within the Documents_Tab, THE Permit_Form SHALL open as a slide-over Sheet from the right side of the screen with the heading "Add Permit" and all form fields empty.
2. THE Permit_Form SHALL display the following fields: Category (required dropdown select from Permit_Category values), Permit Number (required text input, maximum 50 characters), Issued Date (required date picker), Expiry Date (required date picker), Issuing Authority (required text input, maximum 100 characters), Coverage Area (optional text input, maximum 100 characters), Notes (optional textarea, maximum 500 characters), and File Upload (optional simulated file picker).
3. WHEN "City Permit" is selected as the Category, THE Permit_Form SHALL display the Coverage Area field with placeholder text "e.g., Quezon City, Manila, Makati".
4. WHEN a category other than "City Permit" is selected, THE Permit_Form SHALL hide the Coverage Area field.
5. WHEN the form is submitted with valid data, THE Permit_Form SHALL call Document_Store.addPermit with the vehicleId set to the current vehicle's id, close the Sheet, and display a success toast notification for 5 seconds.
6. IF any required field (Category, Permit Number, Issued Date, Expiry Date, Issuing Authority) is empty on submission, THEN THE Permit_Form SHALL display an inline validation error below each invalid field and SHALL NOT close the Sheet.
7. IF the Expiry Date is earlier than or equal to the Issued Date, THEN THE Permit_Form SHALL display a validation error on the Expiry Date field indicating that it must be after the Issued Date.

### Requirement 5: Read and Display Documents and Permits

**User Story:** As a fleet manager, I want to view all documents and permits for a vehicle in an organized list, so that I can quickly assess the vehicle's compliance status.

#### Acceptance Criteria

1. WHEN the Documents_Tab is active, THE Documents_Tab SHALL display two sections: "Documents" and "Permits", each with their own heading and "Add" action button.
2. THE Documents_Tab SHALL filter Document_Store records to show only records matching the current vehicle's id.
3. THE Documents_Tab SHALL display each Vehicle_Document in a Card layout showing: category (as a Badge), document number, issuing authority, issued date, expiry date, Expiry_Indicator badge, and file attachment name (if present).
4. THE Documents_Tab SHALL display each Vehicle_Permit in a Card layout showing: category (as a Badge), permit number, issuing authority, issued date, expiry date, coverage area (for City Permits), Expiry_Indicator badge, and file attachment name (if present).
5. THE Documents_Tab SHALL sort documents and permits by expiry date in ascending order (soonest expiry first) so that items requiring attention appear at the top.
6. IF no documents exist for the vehicle, THEN THE Documents_Tab SHALL display an empty state message "No documents added yet" with a prompt to add the first document.
7. IF no permits exist for the vehicle, THEN THE Documents_Tab SHALL display an empty state message "No permits added yet" with a prompt to add the first permit.

### Requirement 6: Update Vehicle Document

**User Story:** As a fleet manager, I want to edit existing document records, so that I can correct errors or update information when documents are renewed.

#### Acceptance Criteria

1. WHEN the edit action is triggered on a Vehicle_Document card, THE Document_Form SHALL open pre-populated with the document's current data and the heading "Edit Document".
2. WHEN the edit form is submitted with valid data, THE Document_Form SHALL call Document_Store.updateDocument with only the modified fields and the document's id, close the Sheet, and display a success toast notification.
3. THE Document_Form SHALL disable the submit button until at least one field value differs from the original values.
4. IF validation errors exist on submission in edit mode, THEN THE Document_Form SHALL display inline errors and SHALL NOT close the Sheet or update the store.

### Requirement 7: Update Vehicle Permit

**User Story:** As a fleet manager, I want to edit existing permit records, so that I can update information when permits are renewed or corrected.

#### Acceptance Criteria

1. WHEN the edit action is triggered on a Vehicle_Permit card, THE Permit_Form SHALL open pre-populated with the permit's current data and the heading "Edit Permit".
2. WHEN the edit form is submitted with valid data, THE Permit_Form SHALL call Document_Store.updatePermit with only the modified fields and the permit's id, close the Sheet, and display a success toast notification.
3. THE Permit_Form SHALL disable the submit button until at least one field value differs from the original values.
4. WHEN "City Permit" is the selected category in edit mode, THE Permit_Form SHALL display and pre-populate the Coverage Area field.

### Requirement 8: Delete Vehicle Document and Permit

**User Story:** As a fleet manager, I want to remove outdated or erroneous document and permit records, so that the vehicle's document list stays accurate and uncluttered.

#### Acceptance Criteria

1. WHEN the delete action is triggered on a Vehicle_Document card, THE Documents_Tab SHALL display a confirmation Dialog with the message "Are you sure you want to delete this document? This action cannot be undone." and the document's category and number for identification.
2. WHEN the user confirms deletion of a Vehicle_Document, THE Documents_Tab SHALL call Document_Store.deleteDocument with the document's id and display a success toast notification.
3. WHEN the delete action is triggered on a Vehicle_Permit card, THE Documents_Tab SHALL display a confirmation Dialog with the message "Are you sure you want to delete this permit? This action cannot be undone." and the permit's category and number for identification.
4. WHEN the user confirms deletion of a Vehicle_Permit, THE Documents_Tab SHALL call Document_Store.deletePermit with the permit's id and display a success toast notification.
5. IF the user cancels the delete confirmation Dialog, THEN THE Documents_Tab SHALL close the Dialog without modifying any records.

### Requirement 9: Expiry Date Tracking and Visual Indicators

**User Story:** As a fleet manager, I want to see at a glance which documents and permits are expired or expiring soon, so that I can prioritize renewals and avoid operating with lapsed paperwork.

#### Acceptance Criteria

1. THE Expiry_Indicator SHALL display a red "Expired" Badge when the document or permit expiryDate is before today's date.
2. THE Expiry_Indicator SHALL display an amber "Expiring Soon" Badge when the document or permit expiryDate is within 30 days from today (inclusive of today, exclusive of the 31st day).
3. THE Expiry_Indicator SHALL display a green "Valid" Badge when the document or permit expiryDate is more than 30 days from today.
4. THE Documents_Tab SHALL display a summary bar at the top showing counts: total documents and permits, number expired, and number expiring soon for the current vehicle.
5. WHEN one or more documents or permits are expired, THE Documents_Tab summary bar SHALL use a red/danger visual style for the expired count.
6. WHEN one or more documents or permits are expiring within 30 days, THE Documents_Tab summary bar SHALL use an amber/warning visual style for the expiring soon count.
7. THE Expiry_Indicator SHALL not use color as the sole means of conveying status; each Badge SHALL include the text label ("Expired", "Expiring Soon", or "Valid") alongside the color.

### Requirement 10: Simulated File Upload

**User Story:** As a fleet manager, I want to attach scanned copies of documents and permits, so that I can keep digital records alongside the metadata.

#### Acceptance Criteria

1. THE Document_Form and Permit_Form SHALL include a file upload area that accepts a simulated file selection (no actual upload to a server).
2. WHEN a user selects a file, THE Document_Form or Permit_Form SHALL capture and display the file name, file size (formatted in KB or MB), and set the uploadedAt timestamp to the current ISO date.
3. THE Document_Form and Permit_Form SHALL accept file types: PDF, JPEG, PNG, with a maximum simulated file size of 10 MB (10,485,760 bytes).
4. IF the selected file exceeds 10 MB, THEN THE Document_Form or Permit_Form SHALL display a validation error "File size must not exceed 10 MB" and SHALL NOT attach the file.
5. IF a file is already attached to an existing record being edited, THE Document_Form or Permit_Form SHALL display the current file name and size with an option to replace or remove the attachment.
6. WHEN a document or permit card in the Documents_Tab has a File_Attachment, THE Documents_Tab SHALL display a file icon with the file name and formatted file size.

### Requirement 11: Seed Data for Demo

**User Story:** As a product stakeholder reviewing the demo, I want vehicles to have pre-populated documents and permits with realistic Philippine logistics data, so that the feature appears functional out of the box.

#### Acceptance Criteria

1. THE Document_Store SHALL initialize with seed data containing at least 3 Vehicle_Document records and 3 Vehicle_Permit records per vehicle for the first 4 vehicles in the Fleet_Store seed data.
2. THE seed data SHALL include at minimum: one OR/CR document, one Insurance document, one LTFRB Franchise document, one LTO Registration document, one City Permit, one Mayor's Permit, and one Barangay Clearance distributed across the seeded vehicles.
3. THE seed data SHALL use realistic Philippine issuing authorities: "Land Transportation Office (LTO)" for LTO Registration, "Land Transportation Franchising and Regulatory Board (LTFRB)" for LTFRB Franchise, Philippine insurance company names (e.g., "Pioneer Insurance", "Malayan Insurance") for Insurance, city/municipality names for City Permits (e.g., "City of Manila", "Quezon City LGU"), and "Barangay [name]" for Barangay Clearance.
4. THE seed data SHALL include a mix of expiry statuses: at least 2 records with expired dates, at least 2 records with expiry dates within 30 days from a reference date, and the remainder with valid future dates beyond 30 days.
5. THE seed data SHALL include File_Attachment metadata on at least 50% of the seeded records, using realistic file names (e.g., "OR-CR-ABC1234-2024.pdf", "insurance-cert-2024.pdf", "ltfrb-franchise-CPC.pdf").
6. THE seed data SHALL use realistic document and permit numbers following Philippine formats (e.g., "MV-2024-12345" for OR/CR, "CPC-2024-000123" for LTFRB, "BP-2024-001" for Barangay Clearance).

### Requirement 12: Documents Tab Layout and Visual Design

**User Story:** As a fleet manager, I want the Documents tab to be visually consistent with the rest of the NexLogistics application, so that the experience feels cohesive and professional.

#### Acceptance Criteria

1. THE Documents_Tab SHALL use the NexLogistics design system: brand-teal (#66B2B2) for primary accents, brand-navy (#0B1220) for headings, shadow-card elevation for cards, rounded-2xl for card borders, and border-brand-border for separators.
2. THE Documents_Tab SHALL organize content with a summary bar at the top, followed by the "Documents" section, then the "Permits" section, each with a section heading and an action button aligned to the right.
3. THE Documents_Tab SHALL display document and permit records in a responsive grid: 1 column on viewports below 768px, 2 columns on viewports 768px and above.
4. THE Documents_Tab SHALL use shadcn/ui components (Card, Badge, Button, Sheet, Dialog, Input, Select, Label) from the existing `components/ui/` directory.
5. WHILE the viewport width is below 768px, THE Document_Form and Permit_Form SHALL render as a full-screen Sheet instead of a partial-width side drawer.
6. THE Documents_Tab SHALL ensure all interactive elements (buttons, cards, form inputs) have a minimum touch target of 44x44 CSS pixels on mobile viewports.
7. THE Documents_Tab SHALL maintain a minimum 4.5:1 contrast ratio for all text against its background per WCAG AA standards.

### Requirement 13: Accessibility

**User Story:** As a user who relies on assistive technologies, I want the Documents tab to be fully accessible, so that I can manage vehicle documents regardless of ability.

#### Acceptance Criteria

1. THE Documents_Tab SHALL ensure all interactive elements are reachable and operable using keyboard navigation (Tab, Enter, Escape, Arrow keys) in a logical reading order.
2. WHILE the Document_Form or Permit_Form Sheet is open, THE Sheet SHALL trap focus so that Tab and Shift+Tab cycle only through focusable elements within the Sheet, and WHEN closed, SHALL return focus to the triggering element.
3. THE Documents_Tab SHALL provide aria-label attributes for all icon-only buttons (edit, delete, file upload).
4. IF a form validation error occurs, THEN THE Document_Form or Permit_Form SHALL associate each error message with its input using aria-describedby and set aria-invalid="true" on each invalid field.
5. THE Expiry_Indicator Badges SHALL include accessible text that conveys status without relying on color alone.
6. THE delete confirmation Dialog SHALL use role="alertdialog" and focus the confirmation button when opened.
7. THE summary bar counts SHALL use aria-label attributes that provide screen reader context (e.g., "2 expired documents and permits").

