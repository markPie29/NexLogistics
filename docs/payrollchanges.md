[5/13/2026 8:47 AM] SOLO: NEX LOGISTICS — DRIVER PER-TRIP PAYROLL SYSTEM

Full Technical & Operational Explanation for Development Team


---

OBJECTIVE

Build a payroll module specifically designed for logistics operations in the Philippines where drivers can be paid using:

Fixed Salary

Per Trip

Per Delivery

Incentive-Based

Hybrid Payroll (Recommended)


The system must automatically calculate driver earnings based on completed trips while still supporting manual accounting adjustments.


---

IMPORTANT CONCEPT

This is NOT a normal office HR payroll.

This is:

OPERATIONS-BASED PAYROLL

Payroll is directly connected to:

trips

dispatch

deliveries

GPS

operations

incentives

penalties



---

RECOMMENDED PAYROLL MODEL

For Philippine logistics operations, implement:

HYBRID PAYROLL

Base Salary
+ Trip Earnings
+ Incentives
+ Allowances
- Deductions
= Net Pay

This should be the default system design.


---

MODULE STRUCTURE

Create:

Payroll Module
│
├── Payroll Dashboard
├── Payroll Rules
├── Trip Rates
├── Payroll Periods
├── Driver Earnings
├── Incentives
├── Deductions
├── Payroll Approval
├── Payslips
├── Payroll Reports
└── Payroll Settings


---

1. PAYROLL TYPES

System must support multiple payroll computation modes.

Table: payroll_modes

id
mode_name
description
status


---

Supported Modes

Mode Description

Fixed Salary Regular office-style payroll
Fixed + Trip Incentive Base salary + trip earnings
Per Trip Only Earnings only from trips
Per Delivery Paid per successful drop
Percentage Commission % of trip revenue
Custom Hybrid Admin-configurable



---

2. DRIVER PAYROLL PROFILE

Each driver must have payroll configuration.

Table: driver_payroll_profiles

id
driver_id
payroll_mode_id
base_salary
daily_rate
trip_incentive_enabled
overtime_enabled
allowance_enabled
sss_enabled
philhealth_enabled
pagibig_enabled
tax_enabled
status


---

DRIVER PROFILE UI

In Driver Profile Page:

Payroll Settings Section

Fields:

Payroll Mode

Base Salary

Daily Rate

Per Trip Enabled

Incentives Enabled

Government Deductions Enabled

Overtime Enabled



---

3. TRIP RATE MANAGEMENT

This is VERY important.

System must allow admin to define trip rates.


---

Trip Rate Types

Option A — Fixed Route Rate

Example:

Route Vehicle Rate

Manila → Pampanga 6 Wheeler ₱2,500
Manila → Bicol 10 Wheeler ₱8,000



---

Option B — Rate Per KM

Example:

Vehicle Type Rate

Motorcycle ₱3/km
Van ₱6/km
Truck ₱12/km



---

Option C — Per Delivery

Example:

₱120 per successful drop


---

Table: trip_rates

id
company_id
rate_name
vehicle_type
route_origin
route_destination
rate_type
fixed_rate
rate_per_km
rate_per_delivery
extra_stop_fee
night_differential
holiday_rate
status


---

rate_type values

fixed
per_km
per_delivery
percentage
hybrid


---

4. PAYROLL-ELIGIBLE TRIPS

VERY IMPORTANT LOGIC.

Trips should ONLY count toward payroll if:

trip.status = COMPLETED

AND

trip.approval_status = APPROVED


---

Trip Approval Workflow

Trip Created
↓
Trip Assigned
↓
Trip Completed
↓
Dispatcher Review
↓
Operations Approval
↓
Payroll Eligible


---

Add Fields To Trips Table

trips

approval_status
approved_by
approved_at
payroll_processed


---

approval_status values

pending
approved
rejected


---

5. AUTOMATIC TRIP EARNINGS

Once trip becomes:

COMPLETED + APPROVED

System should automatically generate:

Trip Payroll Record


---

Table: trip_payroll

id
trip_id
driver_id
trip_rate_id
base_trip_amount
distance_amount
delivery_amount
incentive_amount
deduction_amount
final_amount
approval_status
approved_by
payroll_period_id
created_at


---

COMPUTATION LOGIC

Example:

Base Trip Rate = ₱2,500
Fuel Incentive = ₱300
Holiday Bonus = ₱500
Penalty = ₱200

Final = ₱3,100


---

6. INCENTIVES SYSTEM

System must support incentives.


---

Table: incentives

id
driver_id
trip_id
type
amount
notes
created_by
created_at


---

Incentive Types

Type Example

On-Time Delivery ₱300
Fuel Efficiency ₱500
Extra Stop ₱250
Holiday Trip ₱1,000
Excellent Rating ₱200



---

7. DEDUCTIONS SYSTEM

VERY IMPORTANT.

Logistics companies frequently deduct:

cash advances
[5/13/2026 8:47 AM] SOLO: penalties

fuel shortages

damages



---

Table: deductions

id
driver_id
trip_id
type
amount
notes
status
created_by
created_at


---

Deduction Types

Type Example

Cash Advance ₱2,000
Fuel Shortage ₱500
Late Delivery ₱300
Vehicle Damage ₱1,500
Violation ₱200



---

8. PAYROLL PERIODS

Accounting creates payroll periods.


---

Table: payroll_periods

id
company_id
start_date
end_date
status
generated_by
approved_by
created_at


---

status values

draft
processing
approved
paid
closed


---

PAYROLL FLOW

Create Payroll Period
↓
Fetch Eligible Trips
↓
Compute Earnings
↓
Apply Incentives
↓
Apply Deductions
↓
Generate Payroll Summary
↓
Accounting Review
↓
Approval
↓
Payslip Generation


---

9. PAYROLL SUMMARY

Generate payroll summary per driver.


---

Table: payroll_summary

id
driver_id
payroll_period_id
base_salary
trip_earnings
incentives
allowances
deductions
gross_pay
net_pay
status


---

SAMPLE COMPUTATION

Base Salary = ₱8,000
Trip Earnings = ₱18,500
Incentives = ₱2,000
Allowances = ₱1,000
Deductions = ₱3,500

NET PAY = ₱26,000


---

10. DRIVER EARNINGS DASHBOARD

VERY IMPORTANT FEATURE.

Drivers should see transparency.


---

Driver Mobile View

Show:

Trips Completed
Pending Earnings
Approved Earnings
Incentives
Deductions
Estimated Payroll


---

This reduces:

payroll disputes

confusion

manual explanations

driver complaints



---

11. PAYROLL DASHBOARD

Admin/accounting dashboard should show:


---

KPI CARDS

Total Payroll
Pending Approval
Drivers Paid
Trip Earnings
Total Incentives
Total Deductions


---

CHARTS

Payroll Trend

Highest Earning Drivers

Most Expensive Routes

Incentive Distribution



---

12. PAYSLIP SYSTEM

Generate simple payslip preview.


---

Payslip Fields

Company Name
Driver Name
Payroll Period
Trips Completed
Trip Earnings
Incentives
Allowances
Deductions
Net Pay


---

PDF EXPORT

For MVP:

optional

basic export acceptable



---

13. PERMISSION STRUCTURE

Dispatcher

Can:

view trip payroll status

approve completed trips


Cannot:

edit payroll



---

Accounting

Can:

generate payroll

add deductions

approve payroll



---

Driver

Can:

view earnings

view trips

view deductions


Cannot:

edit records



---

14. IMPORTANT BUSINESS RULES


---

RULE 1

Trip must be:

COMPLETED


---

RULE 2

Trip must be:

APPROVED


---

RULE 3

Processed trips cannot be recalculated unless payroll reopened.


---

RULE 4

Every deduction must have:

reason

created_by

timestamp


VERY IMPORTANT legally.


---

15. FUTURE FEATURES (NOT MVP)

Do NOT build yet.

Add placeholder only.


---

Future Features

AI Payroll Analysis
Fuel Theft Detection
Trip Profitability
DOLE Compliance Automation
BIR Alphalist
Automatic Tax Computation
Driver Wallet
GCash Payroll
Biometric Integration
Fuel Card Integration
Advanced Incentive Engine


---

MVP PRIORITIES

MUST BUILD

✅ Payroll modes
✅ Trip rates
✅ Completed trip computation
✅ Incentives
✅ Deductions
✅ Payroll periods
✅ Payroll summary
✅ Driver earnings dashboard


---

OPTIONAL FOR MVP

⚠️ PDF export
⚠️ Government deductions
⚠️ Advanced tax computation
⚠️ Dynamic route pricing


---

DO NOT BUILD YET

❌ AI payroll engine
❌ Automatic fuel theft analysis
❌ Full DOLE compliance automation
❌ Dynamic payroll scripting engine
❌ Advanced accounting integrations


---

FINAL IMPORTANT NOTE

The payroll system must be:

logistics-first

NOT office HR-first.

This is your competitive advantage.

Because generic HRIS systems fail at:

per-trip payroll

operational incentives

dispatch-linked payroll

logistics workflow integration


This module alone can become:

one of your strongest selling points.