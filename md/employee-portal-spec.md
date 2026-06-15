2-3: Fixed "More Filter" function in Fleet Management# Employee Self-Service Portal — System Specification

> **Agent Role:** Act as a software developer building a feature extension for an existing logistics company web application.

---

## Agent Directives

1. **Role** — You are a software developer extending an existing logistics platform for a logistics company. Write code and make decisions as an experienced fullstack developer would.

2. **Separate Login Page** — The Employee Dashboard must have its own dedicated login page, consistent with the existing role-based login structure of the platform (Super Admin, Admin, Driver, Helper, etc.). Do not merge it into an existing login flow — treat it as a new portal entry point under the same authentication system.

3. **UI/UX Alignment** — All UI elements (buttons, forms, tables, modals, navigation, color schemes, typography, spacing) must match the existing design system of the website. Do not introduce new design patterns unless the existing system has no equivalent. When in doubt, replicate what already exists.

4. **Context-First Rule** — Before writing any code or making implementation decisions, gather full context:
   - Review the existing codebase structure (routes, auth middleware, role guards, component library, API conventions)
   - Identify how other role dashboards (Admin, Driver, etc.) are built and follow the same pattern
   - Check the existing DB schema for relevant tables (employees, users, roles, trips, payroll, etc.)
   - Ask clarifying questions if any part of the existing system is unclear before proceeding

---

## System Context

This portal is a new role-based view added to an existing logistics platform. It serves internal company employees and must integrate cleanly with the platform's current auth, routing, and UI layer.

### Existing Role-Based Login Structure

The platform already supports separate login portals or role guards for:

- Super Admin
- Admin
- Driver
- Helper
- *(others as defined in the existing system)*

The Employee Dashboard is a **new addition** to this list. It should follow the exact same login page pattern, session/token handling, and route guard approach used by the existing roles.

---

## Payroll Cutoff Rules

| Employee Type | Cutoff Period | Payday |
|---|---|---|
| Office Employees | 29th – 13th | 15th |
| Office Employees | 14th – 28th | 30th / 31st |
| Driver / Helper | Weekly | Every Saturday |

---

## Employee Types

| Type | Notes |
|---|---|
| Office Employee | Standard cut-off payroll, no trip tracking |
| Driver | Weekly pay, has trip history section |
| Helper | Weekly pay, has trip history section |

The dashboard content displayed must adapt based on the logged-in employee's type.

---

## Login Page Requirements

- Separate URL/route from other role logins (e.g. `/employee/login` or consistent with existing naming convention)
- Same visual layout, logo placement, form styling, and error handling as existing login pages
- Authenticates against the same user/auth system — differentiated by role or employee type
- On successful login, redirects to the Employee Dashboard (`/employee/dashboard` or equivalent)
- Unauthorized access to the dashboard route must redirect back to the employee login page (same guard pattern as other roles)

---

## Dashboard Widgets

Displayed on the employee home screen after login:

- Pending requirements
- Total trips — week / month / year *(Driver & Helper only)*
- Earnings for the week

---

## Main Sections

### 1. This Week's Summary

| Sub-section | Description |
|---|---|
| Earnings | Summary of earnings for the current week or cut-off |
| Incentives | Incentives entered by Executive Officer-in-Charge / Owner; read-only for employee |
| Cash Advances / Vale | All approved Cash Advances / Vale for the current period; read-only |
| Payslip | Printable and downloadable payslip for the current week or cut-off |

---

### 2. Virtual Credentials

| Item | Details |
|---|---|
| Company ID | Employee can view and scan their company ID; upload supported |
| Health Card | Employee can view and scan their health card; upload supported |

---

### 3. Trips *(Driver / Helper only)*

- Full history of trips from day one of portal use
- Records are tagged by the **Client Relations Specialist** — employees cannot self-log trips
- Hidden entirely for Office Employee type

---

### 4. Requests

Employees submit requests through forms in this section. All forms are editable on submission and viewable after. Each follows an approval workflow before taking effect.

| Request Type | Approvers |
|---|---|
| Uniform Request | Executive Officer-in-Charge → Owner |
| PPE Request | Executive Officer-in-Charge → Owner |
| Cash Advance / Vale | HR → Executive Officer-in-Charge → Owner |
| Leave Form | HR → Executive Officer-in-Charge → Owner |
| Undertime Form | HR → Executive Officer-in-Charge → Owner |

Request statuses to track: `Pending`, `Approved`, `Rejected`.

---

### 5. HR Section

HR-issued documents appear here. The employee cannot create these — they are pushed from the HR side of the platform.

| Document | Employee Action |
|---|---|
| Incident Report (IR) | View only |
| Notice to Explain (NTE) | View + submit written explanation/response |
| Notice of Decision (NOD) | View only |
| Written Warning (WW) | View only |
| Suspension Notice (SN) | View only |
| Termination Notice | View only |

---

## Forms Reference

All forms follow the existing platform form component patterns. Use the same input components, validation behavior, and submission flow as other forms in the system.

### Form 1 — Leave Form

**Label:** Leave Details

| Field | Input Type |
|---|---|
| Inclusive Dates | Calendar picker (From – To) |
| Type of Leave | Dropdown |
| Reason/s | Text area |
| Signature | Employee name (typed or drawn, match existing pattern) |

---

### Form 2 — Undertime Form

**Label:** Undertime Details

| Field | Input Type |
|---|---|
| Inclusive Dates | Calendar picker |
| Type of Undertime | Dropdown |
| Indicate Time | Clock / time picker |
| Reason/s | Text area |
| Signature | Employee name |

---

### Form 3 — Cash Advance / Vale Request Form

**Label:** Cash Advance Details

| Field | Input Type |
|---|---|
| Date | Calendar picker |
| Amount | Numeric input (Philippine Peso) |
| Purpose | Text area |
| Signature | Employee name |

---

### Form 4 — Uniform Request Form

**Label:** Uniform Details

| Field | Input Type |
|---|---|
| Date | Calendar picker |
| Uniform Size | Dropdown |
| Reason | Text area |
| Signature | Employee name |

---

### Form 5 — PPE Request Form

**Label:** PPE Details

| Field | Input Type |
|---|---|
| Date | Calendar picker |
| PPE | Dropdown |
| Reason | Text area |
| Signature | Employee name |

---

### Form 6 — Liquidation Form 2A

**Label:** Liquidation Form Details

| Field | Input Type |
|---|---|
| Date | Calendar picker |
| Amount for Liquidation | Numeric input (Philippine Peso) |
| Item | Text input |
| Signature | Employee name |

---

### Form 7 — Loan Request Form

**Label:** Loan Details

| Field | Input Type |
|---|---|
| Date | Calendar picker |
| Type of Loan | Dropdown |
| Reason | Text area |
| Signature | Employee name |

---

## Roles & Permissions Summary

| Role | Capabilities |
|---|---|
| Employee (Office) | Login via employee portal, view dashboard, submit forms, view HR documents, respond to NTE |
| Employee (Driver/Helper) | Same as Office + view trip history |
| Client Relations Specialist | Tag and log trip records for Driver/Helper employees |
| Human Resources | Issue IR, NTE, NOD, WW, SN, Termination Notice; first-level approval for Cash Advance, Leave, Undertime |
| Executive Officer-in-Charge | Input incentives; second-level approval for all requests |
| Owner | Final approval for all requests |

---

## Implementation Checklist for Agent

Before writing any code, confirm the following with the existing codebase:

- [ ] What is the existing auth system? (JWT, session, Sanctum, etc.)
- [ ] How are role-based route guards currently implemented?
- [ ] What is the existing login page component/template to replicate?
- [ ] What UI component library / design system is in use?
- [ ] What is the existing API structure (REST endpoints, naming conventions)?
- [ ] What DB tables exist for employees, users, roles, payroll, and trips?
- [ ] Are there existing patterns for multi-step approval workflows?
- [ ] How are printable/downloadable documents (payslips) currently handled elsewhere in the system?
