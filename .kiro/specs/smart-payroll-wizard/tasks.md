# Implementation Plan: Smart Payroll Wizard

## Overview

Surgical upgrade of the existing payroll run wizard at `app/(app)/payroll/run/page.tsx`. Extract pure utility functions into `lib/payroll/wizard-utils.ts` and enhance the wizard page with smart period detection, blocking thresholds, enhanced warnings, duplicate detection, and audit trail generation. Reuse the existing computation engine (`buildDriverSummary`, `computeGovernmentDeductions`, `getEligibleTripsForDriver`) without modification.

## Tasks

- [ ] 1. Create utility module with pure functions
  - [ ] 1.1 Create `lib/payroll/wizard-utils.ts` with period detection, formatting, and overlap functions
    - Implement `detectPeriodFromDate(date)` — Cutoff A (1st-15th) or B (16th-last day)
    - Implement `detectNextPeriodFromHistory(periods)` — sequential detection from closed periods
    - Implement `formatPeriodName(startDate, endDate)` — "{Month} {day}-{day}, {year} · Cut-off {A|B}"
    - Implement `computePayDate(endDate)` — endDate + 5 calendar days
    - Implement `detectPeriodOverlap(startDate, endDate, existingPeriods)` — overlap + blocking check
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8_

  - [ ] 1.2 Add employee eligibility, blocking, adjustments, warnings, duplicates, and grand total functions
    - Implement `filterEligibleEmployees(drivers, helpers, profiles, trips, startDate, endDate)` — eligibility with trip counts
    - Implement `isBlockedByPendingTrips(pendingCount, threshold)` — blocking logic
    - Implement `computeAdjustmentImpact(incentives, deductions, startDate, endDate)` — net impact
    - Implement `detectCrossPeriodDuplicates(...)` — duplicate employee detection across periods
    - Implement `generateSmartWarnings(computed, trips, profiles, drivers)` — categorized warnings sorted by severity
    - Implement `computeGrandTotal(...)` — sum across all categories
    - _Requirements: 2.1, 2.6, 2.9, 4.4, 4.5, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 3.6_

- [ ] 2. Upgrade wizard page — Step 1 (Period) enhancements
  - [ ] 2.1 Integrate smart period detection into Step 1
    - Import wizard-utils, replace inline `defaultPeriod()` with `detectNextPeriodFromHistory` (fallback to `detectPeriodFromDate`)
    - Add overlap warning display using `detectPeriodOverlap`
    - Block "Next" when overlap is blocking (paid/closed period)
    - Show existing period status in overlap warning
    - _Requirements: 1.1, 1.4, 1.7, 1.8, 6.4_

- [ ] 3. Upgrade wizard page — Step 2 (Eligible Trips) enhancements
  - [ ] 3.1 Add blocking threshold control and pending trip banner
    - Add `blockingThreshold` state (default: 5) with inline settings control
    - Show pending trips summary banner at top of step
    - Block "Next" when total pending > threshold using `isBlockedByPendingTrips`
    - Add "Go to Trip Approvals" link when pending > 0
    - Filter out employees with zero approved trips and no fixed profile using `filterEligibleEmployees`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 6.4_

- [ ] 4. Upgrade wizard page — Step 3 (Compute) enhancements
  - [ ] 4.1 Add smart warnings section using `generateSmartWarnings`
    - Replace inline warning generation with utility function call
    - Display categorized warnings (errors red, warnings amber, info blue)
    - Add "Re-compute" button label update
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 5. Upgrade wizard page — Step 4 (Adjustments) enhancements
  - [ ] 5.1 Add adjustment impact display and helper/office staff support in dialogs
    - Display running total impact using `computeAdjustmentImpact`
    - Add reminder banner to re-compute after adding adjustments
    - Extend employee selector in incentive/deduction dialogs to include helpers and office staff
    - _Requirements: 4.4, 4.5, 4.7, 4.8_

- [ ] 6. Upgrade wizard page — Step 5 (Review & Generate) enhancements
  - [ ] 6.1 Add cross-period duplicate detection, individual override, and audit trail
    - Add `detectCrossPeriodDuplicates` call and display duplicate flags
    - Add individual net pay override capability (click to edit)
    - Generate audit trail notes on submit (employee count, grand total)
    - _Requirements: 5.3, 5.4, 5.6_

- [ ] 7. Final checkpoint
  - Ensure all files compile cleanly with getDiagnostics, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The existing computation engine (buildDriverSummary, computeGovernmentDeductions) is NOT modified
- No new Zustand stores or routes are created — all state lives in React component state
- The existing 5-step wizard structure is preserved and enhanced surgically

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["7"] }
  ]
}
```
