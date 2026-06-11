# Implementation Plan: Fleet Vehicle Documents & Permits

## Overview

Implement a complete CRUD interface for managing Philippine logistics-specific vehicle documents and permits within the existing vehicle detail page Documents tab. The implementation adds a dedicated Zustand store, utility functions, seed data, and a set of React components following existing codebase patterns.

## Tasks

- [ ] 1. Define types, utility functions, and seed data
  - [ ] 1.1 Add VehicleDocument, VehiclePermit, FileAttachment types and category unions to `lib/types.ts`
    - Add `DocumentCategory`, `PermitCategory`, `FileAttachment`, `VehicleDocument`, `VehiclePermit` type definitions
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ] 1.2 Create utility functions in `lib/utils/vehicle-documents.ts`
    - Implement `getExpiryStatus(expiryDate: string): ExpiryStatus`
    - Implement `computeSummaryCounts(docs, permits): { total, expired, expiringSoon }`
    - Implement `formatFileSize(bytes: number): string`
    - Export `ExpiryStatus` type and all constants (DOCUMENT_CATEGORIES, PERMIT_CATEGORIES)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.2, 10.6_

  - [ ] 1.3 Create seed data file `lib/data/vehicle-documents.ts`
    - Export `seedVehicleDocuments` and `seedVehiclePermits` arrays
    - At least 3 documents + 3 permits per vehicle for v-101, v-102, v-103, v-104
    - Include all document/permit categories across the dataset
    - Mix of expiry statuses: ≥2 expired, ≥2 expiring within 30 days, remainder valid
    - Realistic Philippine issuing authorities, document numbers, and file attachment metadata on ≥50% of records
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 2. Create the Zustand store
  - [ ] 2.1 Create `lib/store/vehicle-documents.ts` with `useVehicleDocumentStore`
    - Implement state interface with documents/permits arrays
    - Implement addDocument, updateDocument, deleteDocument methods
    - Implement addPermit, updatePermit, deletePermit methods
    - ID generation: `vd-${Date.now().toString(36)}` for docs, `vp-${Date.now().toString(36)}` for permits
    - Set createdAt/updatedAt on add; update only updatedAt on update
    - Persist with `${BRAND.storeKey}-vehicle-documents` key
    - Initialize with seed data from `lib/data/vehicle-documents.ts`
    - Include reset() method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 2.2 Export store from `lib/store/index.ts`
    - Add re-export of `useVehicleDocumentStore` from `./vehicle-documents`
    - Add store key to `resetAllDemoData` cleanup list
    - _Requirements: 1.3_

- [ ] 3. Checkpoint - Ensure store and utilities compile
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Build presentational components
  - [ ] 4.1 Create `components/fleet/ExpiryIndicator.tsx`
    - Badge component showing "Expired" (red), "Expiring Soon" (amber), or "Valid" (green)
    - Uses `getExpiryStatus` utility
    - Always includes text label alongside color (accessibility)
    - _Requirements: 9.1, 9.2, 9.3, 9.7, 13.5_

  - [ ] 4.2 Create `components/fleet/DocumentsSummaryBar.tsx`
    - Displays total, expired (red/danger style), and expiring soon (amber/warning style) counts
    - Uses `aria-label` on each count for screen readers
    - _Requirements: 9.4, 9.5, 9.6, 13.7_

  - [ ] 4.3 Create `components/fleet/VehicleDocumentCard.tsx`
    - Card layout: category badge, document number, issuing authority, dates, expiry indicator, file info
    - Edit/Delete icon buttons with `aria-label` and min 44×44px touch targets
    - Uses brand styling: rounded-2xl, shadow-card, border-brand-border
    - _Requirements: 5.3, 5.6, 10.6, 12.1, 12.6, 13.3_

  - [ ] 4.4 Create `components/fleet/VehiclePermitCard.tsx`
    - Same as document card plus `coverageArea` for City Permits
    - Edit/Delete icon buttons with `aria-label` and min 44×44px touch targets
    - _Requirements: 5.4, 5.7, 10.6, 12.1, 12.6, 13.3_

  - [ ] 4.5 Create `components/fleet/DeleteConfirmDialog.tsx`
    - Confirmation dialog with `role="alertdialog"`
    - Shows item category and number for identification
    - Focus confirmation button on open
    - Escape or Cancel closes without action
    - _Requirements: 8.1, 8.3, 8.5, 13.6_

- [ ] 5. Build form components
  - [ ] 5.1 Create `components/fleet/DocumentFormSheet.tsx`
    - Sheet (slide-over) with react-hook-form + zod validation
    - Fields: Category (Select), Document Number, Issued Date, Expiry Date, Issuing Authority, Notes, File Upload
    - Add mode: heading "Add Document", empty fields
    - Edit mode: heading "Edit Document", pre-populated fields, submit disabled until dirty
    - Validation: required fields, expiry > issued date, file ≤ 10MB (PDF/JPEG/PNG)
    - aria-invalid + aria-describedby on errors
    - Full-screen on mobile (<768px), right-side drawer on desktop
    - Calls store methods on success, fires toast via sonner
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3, 10.4, 10.5, 12.5, 13.1, 13.2, 13.4_

  - [ ] 5.2 Create `components/fleet/PermitFormSheet.tsx`
    - Same structure as DocumentFormSheet with permit-specific fields
    - Coverage Area field shown only when category is "City Permit" with placeholder text
    - Permit categories in Select dropdown
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3, 7.4, 10.1, 10.2, 10.3, 10.4, 10.5, 12.5, 13.1, 13.2, 13.4_

- [ ] 6. Create the tab orchestrator and integrate
  - [ ] 6.1 Create `components/fleet/VehicleDocumentsTab.tsx`
    - Root component rendered inside TabsContent value="docs"
    - Reads documents/permits from store filtered by vehicleId
    - Sorts by expiryDate ascending
    - Computes summary counts
    - Manages local sheet/dialog state (open, editing item, delete target)
    - Renders SummaryBar, Documents section, Permits section with headings and "Add" buttons
    - Responsive grid: 1 column <768px, 2 columns ≥768px
    - Renders DocumentFormSheet, PermitFormSheet, DeleteConfirmDialog
    - Handles CRUD callbacks: open form, close form, confirm delete
    - Passes toast notifications on successful operations
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 8.2, 8.4, 12.2, 12.3, 12.4, 13.1_

  - [ ] 6.2 Update `app/(app)/fleet/[id]/page.tsx` to replace docs tab placeholder
    - Import VehicleDocumentsTab component
    - Replace the empty-state Card in TabsContent value="docs" with `<VehicleDocumentsTab vehicleId={params.id} />`
    - _Requirements: 5.1, 12.4_

- [ ] 7. Final checkpoint - Ensure all code compiles and renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Property-based tests
  - [ ]* 8.1 Write property test for `getExpiryStatus` utility
    - **Property 8: Expiry status classification**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 8.2 Write property test for `formatFileSize` utility
    - **Property 10: File size formatting**
    - **Validates: Requirements 10.2, 10.6**

  - [ ]* 8.3 Write property test for `computeSummaryCounts` utility
    - **Property 9: Summary count aggregation**
    - **Validates: Requirements 9.4**

  - [ ]* 8.4 Write property test for store `addDocument`/`addPermit` ID generation
    - **Property 1: Add generates correct ID and timestamps**
    - **Validates: Requirements 1.5**

  - [ ]* 8.5 Write property test for store `updateDocument`/`updatePermit` partial update
    - **Property 2: Partial update preserves unmodified fields**
    - **Validates: Requirements 1.6**

  - [ ]* 8.6 Write property test for zod schema required field validation
    - **Property 3: Required field validation rejects empty values**
    - **Validates: Requirements 3.4, 4.6, 6.4**

  - [ ]* 8.7 Write property test for expiry date cross-validation
    - **Property 4: Expiry date must be after issued date**
    - **Validates: Requirements 3.5, 4.7**

  - [ ]* 8.8 Write property test for vehicle ID filtering
    - **Property 5: Vehicle ID filtering returns only matching records**
    - **Validates: Requirements 5.2**

  - [ ]* 8.9 Write property test for sort by expiry date
    - **Property 6: Records sort by expiryDate ascending**
    - **Validates: Requirements 5.5**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All components use existing shadcn/ui primitives — no new dependencies needed
- The store follows the same Zustand + persist pattern as useOfficeStaffStore and useFleetStore

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9"] }
  ]
}
```
