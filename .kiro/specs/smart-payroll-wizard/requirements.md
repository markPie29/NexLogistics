# Requirements Document

## Introduction

Redesign the existing payroll run wizard at `app/(app)/payroll/run/page.tsx` into a smarter, more professional, Philippine-compliant step-by-step payroll generation experience. The current wizard has 5 steps (Period → Eligible Trips → Compute Earnings → Adjustments → Review & Generate) but lacks smart defaults, proper validation gating, and a polished HR-grade user experience. The redesign introduces intelligent period detection, prominent pending-trip warnings with blocking thresholds, Philippine BIR 2026 statutory deduction schedules (SSS, PhilHealth, Pag-IBIG, Withholding Tax), one-time adjustment workflows, duplicate detection, and audit trail generation. The wizard targets payroll administrators operating within a Philippine logistics company using Next.js 14, TypeScript, Tailwind, shadcn/ui, and Zustand stores.

## Glossary

- **Payroll_Wizard**: The redesigned 5-step payroll run page at `app/(app)/payroll/run/page.tsx`, guiding the user through period definition, trip validation, earnings computation, adjustments, and final review.
- **Period_Step**: Step 1 of the Payroll_Wizard responsible for smart detection and configuration of the payroll cutoff period.
- **Trip_Validation_Step**: Step 2 of the Payroll_Wizard responsible for showing eligible trips per employee and blocking on pending approvals.
- **Compute_Step**: Step 3 of the Payroll_Wizard responsible for calculating gross pay, statutory deductions, and net pay per employee.
- **Adjustment_Step**: Step 4 of the Payroll_Wizard responsible for adding one-time incentives and deductions before final review.
- **Review_Step**: Step 5 of the Payroll_Wizard responsible for final compliance checks, duplicate detection, and payroll generation.
- **Payroll_Period**: A date range representing a pay cutoff (semi-monthly in Philippine standard), stored via `usePayrollPeriodStore`.
- **Cutoff_A**: The first semi-monthly pay period covering the 1st through the 15th of a month.
- **Cutoff_B**: The second semi-monthly pay period covering the 16th through the last day of a month.
- **Pay_Date**: The date employees receive payment, typically 5 calendar days after the cutoff end date.
- **Trip_Store**: The Zustand store (`useTripStore`) managing trip records including approval status.
- **Driver_Store**: The Zustand store (`useDriverStore`) managing driver records.
- **Helper_Store**: The Zustand store (`useHelperStore`) managing helper records.
- **Office_Staff_Store**: The Zustand store (`useOfficeStaffStore`) managing office employee records.
- **Payroll_Period_Store**: The Zustand store (`usePayrollPeriodStore`) managing payroll period records and summaries.
- **Payroll_Profile**: A driver's payroll configuration including pay mode, base salary, and statutory contribution toggles, stored via `useDriverPayrollProfileStore`.
- **Statutory_Deductions**: Philippine government-mandated deductions: SSS (4.5% employee share, max ₱1,350), PhilHealth (2.5% employee share, max ₱2,500), Pag-IBIG (2%, max ₱200), and Withholding Tax (BIR TRAIN Law 2026 monthly brackets).
- **Wizard_State**: The transient client-side state persisted across wizard steps using React component state or Zustand, ensuring data is not lost during back/next navigation.
- **Audit_Trail**: A record of who generated the payroll, when, and what parameters were used, stored alongside the Payroll_Period.
- **Pending_Trip**: A trip with `approvalStatus` of "pending" that has not yet been approved or rejected.
- **Blocking_Threshold**: A configurable count of pending trips above which the wizard prevents the user from proceeding past the Trip_Validation_Step.

## Requirements

### Requirement 1: Smart Period Detection

**User Story:** As a payroll administrator, I want the wizard to automatically detect and pre-fill the next payroll period based on existing closed periods and the current date, so that I save time and avoid manual date entry errors.

#### Acceptance Criteria

1. WHEN the Payroll_Wizard loads, THE Period_Step SHALL auto-detect the current date and determine whether the next period is Cutoff_A (1st–15th) or Cutoff_B (16th–last day of month) based on the Philippine semi-monthly standard.
2. THE Period_Step SHALL auto-generate the period name in the format "{Month} {startDay}-{endDay}, {year} · Cut-off {A|B}" using the detected cutoff dates.
3. THE Period_Step SHALL auto-compute the Pay_Date as 5 calendar days after the cutoff end date.
4. WHEN existing closed or paid periods exist in the Payroll_Period_Store, THE Period_Step SHALL determine the next sequential cutoff by identifying the most recently closed period and selecting the subsequent cutoff (Cutoff_A follows Cutoff_B of the previous month, Cutoff_B follows Cutoff_A of the same month).
5. WHEN the user modifies the start date or end date manually, THE Period_Step SHALL re-generate the period name and recalculate the Pay_Date automatically based on the new values.
6. THE Period_Step SHALL allow the user to override the auto-generated period name, start date, end date, and Pay_Date manually.
7. WHEN the auto-detected or user-entered period dates match an existing Payroll_Period in the Payroll_Period_Store with status "draft", "ready_for_review", "approved", "paid", or "closed", THE Period_Step SHALL display a prominent duplicate warning indicating that a period with overlapping dates already exists and its current status.
8. IF the detected period exactly matches an existing period with status "paid" or "closed", THEN THE Period_Step SHALL block proceeding to the next step with a message instructing the user to select a different date range.
9. THE Period_Step SHALL display explanatory helper text describing the Philippine semi-monthly cutoff standard and how the pay date is computed.

### Requirement 2: Eligible Trips Smart Validation

**User Story:** As a payroll administrator, I want to see which employees have trips ready for payroll and be warned about pending approvals, so that I do not accidentally exclude unapproved work from the pay run.

#### Acceptance Criteria

1. WHEN the user navigates to the Trip_Validation_Step, THE Payroll_Wizard SHALL display a list of all employees (drivers and helpers) who have at least one completed trip within the selected period date range or who are on a fixed-salary Payroll_Profile.
2. FOR EACH employee displayed, THE Trip_Validation_Step SHALL show the count of approved trips, pending trips, and total trips within the period date range.
3. WHEN any employee has one or more Pending_Trips within the period date range, THE Trip_Validation_Step SHALL display a prominent warning banner at the top of the step indicating the total count of pending trips across all employees.
4. THE Trip_Validation_Step SHALL provide a "Go to Trip Approvals" link that navigates to the approvals page so the user can resolve pending trips before proceeding.
5. THE Trip_Validation_Step SHALL allow the user to approve individual pending trips inline without leaving the wizard, using a single-click approve action per trip.
6. WHEN the total count of Pending_Trips across all employees exceeds the Blocking_Threshold, THE Trip_Validation_Step SHALL disable the "Next" button and display a blocking message stating that too many trips are pending approval.
7. THE Blocking_Threshold SHALL default to 5 pending trips and be configurable by the user within the wizard step via a settings control.
8. THE Trip_Validation_Step SHALL only include trips with `approvalStatus` equal to "approved" in the subsequent earnings computation, excluding pending and rejected trips.
9. THE Trip_Validation_Step SHALL filter out employees who have zero approved trips and are not on a fixed-salary or hybrid Payroll_Profile, showing only employees who will actually receive pay in this period.
10. WHEN no employees qualify for payroll in the selected period (zero approved trips and no fixed-salary employees), THE Trip_Validation_Step SHALL display an empty state message and disable the "Next" button.

### Requirement 3: Compute Earnings with Philippine Statutory Deductions

**User Story:** As a payroll administrator, I want the wizard to compute gross pay, apply all Philippine statutory deductions, and show a clear net pay breakdown per employee, so that I can verify correctness before generating payslips.

#### Acceptance Criteria

1. WHEN the user clicks "Compute Now" or enters the Compute_Step after previously computing, THE Compute_Step SHALL calculate earnings for each eligible employee by applying trip rates multiplied by their Payroll_Profile mode (per-trip, per-delivery, fixed salary, hybrid, or commission percentage).
2. THE Compute_Step SHALL apply Philippine Statutory_Deductions to each employee's gross pay: SSS at 4.5% of gross pay capped at ₱1,350, PhilHealth at 2.5% of gross pay capped at ₱2,500, Pag-IBIG at 2% of gross pay capped at ₱200 (applied only when gross pay exceeds ₱1,500), and Withholding Tax per BIR TRAIN Law 2026 monthly brackets applied to taxable income (gross pay minus SSS, PhilHealth, and Pag-IBIG contributions).
3. FOR EACH employee, THE Compute_Step SHALL display a row showing: employee name, trip count, base salary, trip earnings, incentives, gross pay, itemized deductions (SSS, PhilHealth, Pag-IBIG, tax, cash advance, other), total deductions, and net pay.
4. THE Compute_Step SHALL separate employees into categorized sections: Drivers, Helpers, and Office Staff, each with its own subtotal.
5. THE Compute_Step SHALL display a "Re-compute" button that recalculates all earnings and deductions when clicked, reflecting any data changes made since the last computation.
6. THE Compute_Step SHALL display a grand total row showing the sum of all net pay amounts across all employee categories.
7. THE Compute_Step SHALL apply commission calculations for employees whose Payroll_Profile mode is "percentage", computing commission as the configured percentage of total trip fares for the period.
8. WHEN any employee has a net pay of zero or negative, THE Compute_Step SHALL flag that employee with a visible error indicator and display a warning message explaining the condition.
9. WHEN any employee has zero gross pay despite having a Payroll_Profile, THE Compute_Step SHALL flag that employee with a visible warning indicator.
10. IF the computation detects duplicate employee entries (same employee ID appearing more than once), THEN THE Compute_Step SHALL display an error and block proceeding to the next step.
11. THE Compute_Step SHALL only allow proceeding to the Adjustment_Step after computation has been performed at least once.

### Requirement 4: One-Time Adjustments

**User Story:** As a payroll administrator, I want to add one-time bonuses, overtime pay, holiday pay, or deductions (cash advance recovery, absences, late penalties) before finalizing the payroll, so that the pay run reflects all compensation and deduction events for the period.

#### Acceptance Criteria

1. THE Adjustment_Step SHALL display two sections side by side: "Incentives" (left) and "Deductions" (right), each with an "Add" button that opens a dialog form.
2. WHEN the user clicks "Add" in the Incentives section, THE Adjustment_Step SHALL display a dialog allowing selection of an employee (driver or helper), incentive type (on-time delivery, fuel efficiency, extra stop, holiday trip, excellent rating, safety bonus, or other), amount in Philippine Peso, and optional notes.
3. WHEN the user clicks "Add" in the Deductions section, THE Adjustment_Step SHALL display a dialog allowing selection of an employee, deduction type (cash advance, fuel shortage, late delivery, vehicle damage, violation, uniform, or other), amount in Philippine Peso, and a required reason field.
4. THE Adjustment_Step SHALL display all incentives and deductions that fall within the current period date range and have not yet been locked to a previous Payroll_Period, showing employee name, type, amount, and notes/reason.
5. THE Adjustment_Step SHALL display a running total impact showing the net effect of all adjustments (total incentives minus total deductions) on the payroll.
6. WHEN the user adds a new incentive or deduction, THE Adjustment_Step SHALL persist the record to the respective Zustand store (useIncentiveStore or useDeductionStore) immediately.
7. THE Adjustment_Step SHALL display a reminder banner informing the user to go back to the Compute_Step and click "Re-compute" if adjustments were added, so that updated totals reflect in the final review.
8. THE Adjustment_Step SHALL support adding adjustments for helpers and office staff in addition to drivers.

### Requirement 5: Review and Generate with Compliance Checks

**User Story:** As a payroll administrator, I want a final review step that shows compliance status, detects duplicates, and allows me to generate the payroll with confidence, so that I produce accurate and BIR-compliant payslips.

#### Acceptance Criteria

1. THE Review_Step SHALL display a BIR compliance badge indicating that BIR 2026 contribution rates and TRAIN Law tax brackets have been applied, showing the specific rates: SSS 4.5% (max ₱1,350), PhilHealth 2.5% (max ₱2,500), Pag-IBIG 2% (max ₱200).
2. THE Review_Step SHALL display summary cards showing: period name, number of drivers, number of helpers, number of office staff, number of partner payouts, and grand total net pay.
3. WHEN any employee appears in multiple payroll periods covering the same date range (detected by comparing the current period dates against existing Payroll_Period records that contain a summary for the same employee ID), THE Review_Step SHALL display a duplicate flag warning for each affected employee.
4. THE Review_Step SHALL allow the user to click on individual employee entries to view and override their computed net pay amount before final generation.
5. WHEN the user clicks "Approve & Generate Payroll", THE Review_Step SHALL create a new Payroll_Period record with status "ready_for_review", store all computed payroll summaries and trip payroll records, lock all included trips to the new period (setting `payrollProcessed` to true), and lock all period-scoped incentives and deductions to the new period ID.
6. WHEN payroll generation completes successfully, THE Review_Step SHALL generate an Audit_Trail entry recording the generating user's name, timestamp, period details, employee count, and grand total amount.
7. WHEN payroll generation completes successfully, THE Review_Step SHALL navigate the user to the payroll period detail page and display a success toast notification.
8. IF the computation has not been performed (zero computed results), THEN THE Review_Step SHALL display a message instructing the user to return to the Compute_Step and disable the "Approve & Generate Payroll" button.
9. IF payroll generation fails due to a store error, THEN THE Review_Step SHALL display an error toast notification and remain on the Review_Step without navigating away.

### Requirement 6: Wizard Navigation and State Persistence

**User Story:** As a payroll administrator, I want the wizard to maintain my progress across steps with clear visual indicators and validation gating, so that I can navigate back and forth without losing data and always know where I am in the process.

#### Acceptance Criteria

1. THE Payroll_Wizard SHALL display a horizontal stepper showing all 5 steps as circular icons with labels: Period, Eligible Trips, Compute Earnings, Adjustments, and Review & Generate.
2. FOR EACH step in the stepper, THE Payroll_Wizard SHALL indicate the current step with a filled brand-navy background, completed steps with a filled emerald-green background and a checkmark icon, and future steps with a gray background.
3. THE Payroll_Wizard SHALL display "Back" and "Next" navigation buttons at the bottom of every step, with "Back" disabled on Step 1 and "Next" replaced by empty space on Step 5.
4. WHEN the user clicks "Next" on any step, THE Payroll_Wizard SHALL validate the current step's requirements before advancing: Step 1 requires a valid period name, start date, end date, and start date not after end date; Step 2 requires pending trips to be below the Blocking_Threshold; Step 3 requires computation to have been performed and no duplicate entries.
5. THE Payroll_Wizard SHALL persist all Wizard_State (period configuration, computed results, adjustments) in component state such that navigating between steps via Back/Next does not reset previously entered data.
6. WHEN the user clicks "Cancel" or navigates away, THE Payroll_Wizard SHALL return to the payroll list page at `/payroll` without creating any Payroll_Period records or modifying store data.
7. THE Payroll_Wizard SHALL display contextual help text, tips, and warnings within each step to guide the user through the payroll process in a manner consistent with professional HR/payroll systems.
8. THE Payroll_Wizard SHALL display a "Step X of 5" indicator in the footer navigation area to provide explicit progress awareness.

### Requirement 7: Smart Payroll Warnings and Error Detection

**User Story:** As a payroll administrator, I want the wizard to proactively detect and surface potential issues during computation, so that I can address errors before generating payslips.

#### Acceptance Criteria

1. WHEN computation is complete, THE Compute_Step SHALL evaluate all computed results and generate categorized warnings: errors (blocking), warnings (non-blocking), and informational notices.
2. WHEN any employee has a net pay of zero or negative, THE Compute_Step SHALL generate an error-level warning identifying the employee and the net pay amount.
3. WHEN any employee has zero gross pay despite having an active Payroll_Profile, THE Compute_Step SHALL generate a warning-level notice identifying the employee.
4. WHEN duplicate employee entries are detected (same employee ID computed more than once), THE Compute_Step SHALL generate an error-level warning and block proceeding to the next step.
5. WHEN any driver has completed trips in the period date range but no Payroll_Profile configured, THE Compute_Step SHALL generate an informational notice identifying the driver and recommending profile setup.
6. WHEN withholding tax has been computed for any employee, THE Compute_Step SHALL generate an informational notice referencing BIR 2026 TRAIN Law monthly brackets and recommending BIR Form 1601-C filing.
7. THE Compute_Step SHALL display all warnings in a dedicated "Smart Payroll Checks" section, grouped by severity (errors first, then warnings, then informational), with appropriate color coding (red for errors, amber for warnings, blue for informational).
