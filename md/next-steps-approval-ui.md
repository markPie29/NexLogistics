# Next Steps: Admin-Side Approval UI for Employee Portal

## Context

An Employee Self-Service Portal was just built as a client-side demo app (Zustand + localStorage, no real backend). The following was completed:

- 9 Zustand stores in `employee-portal.ts` handle all request types: Leave, Undertime, Cash Advance, Uniform, PPE, Liquidation, and Loan
- Each store has a working `approve(id, stepRole, by, notes)` method and a `defaultSteps()` approval chain factory
- The employee-facing side is fully built at `app/(app)/employee-portal/` with 6 pages
- Request submission and approval step chain display already work on the employee side

**What's missing:** The admin-side UI that lets HR, Executive Officer-in-Charge (EOIC), and Owner click approve or reject on pending requests. The stores fully support this — it just needs a UI surface.

---

## What to Build

### 1. New Admin Approvals Page

**Route:** `app/(app)/approvals/employee-requests/page.tsx`
(or extend the existing `/approvals` page if one already exists — check first)

This page is only accessible to users with roles: `hr`, `executive_officer_in_charge`, `owner`, `admin`.

Add a nav item for this in the existing sidebar under Approvals (or alongside it), following the same pattern as other nav items in `roles.ts`.

---

### 2. Page Layout

Use the existing UI component patterns in the codebase (shadcn/ui, Tailwind). Do not introduce new dependencies.

The page should have:

**Tab bar** across the top with one tab per request type:
- Leave
- Undertime
- Cash Advance
- Uniform
- PPE
- Liquidation
- Loan

Each tab shows a filterable list/table of all requests of that type, across all employees.

---

### 3. Request List / Table

Columns per row (adapt field names to match the actual store types):

| Column | Notes |
|---|---|
| Employee Name | Look up from `useEmployeeProfileStore` by `employeeId` |
| Date Submitted | `createdAt` or equivalent |
| Type | (implicit from the tab, but useful if doing a unified view) |
| Status | `pending`, `approved`, `rejected` — styled as a badge |
| Current Step | Which approval step is next (first step where `approvedAt` is null) |
| Actions | Approve / Reject buttons — only shown if the logged-in user's role matches the current step's `role` field |

---

### 4. Approve / Reject Flow

When the logged-in user clicks **Approve** or **Reject** on a request:

1. Open a confirmation dialog (use existing Dialog/Modal component pattern)
2. Dialog shows: request summary, current step label, optional notes textarea
3. On confirm, call the appropriate store method:

```ts
// Approve
store.approve(requestId, stepRole, currentUser.id, notes)

// Reject — add a reject() method to stores if not already present, following the same signature
store.reject(requestId, stepRole, currentUser.id, notes)
```

4. Close the dialog and refresh the list from the store

---

### 5. Adding `reject()` to Stores (if missing)

Check `employee-portal.ts`. If `reject(id, stepRole, by, notes)` does not exist on any store, add it using the same pattern as `approve()`. The rejected step should set:

```ts
{
  approvedAt: new Date().toISOString(),
  approvedBy: by,
  notes,
  status: 'rejected'   // or equivalent field on ApprovalStep
}
```

And set the parent request's top-level `status` to `'rejected'`.

---

### 6. Role-Gating Logic

The logged-in user should only see the Approve/Reject buttons on a request if:

```ts
currentStep.role === currentUser.role
```

If their role doesn't match the current pending step, show the row as read-only. They can still see the request details.

---

### 7. Request Detail Drawer/Dialog (optional but recommended)

Clicking a row (not the action buttons) should open a side drawer or dialog showing:
- Full request details (all fields from the request type)
- Full approval chain with step statuses (same chain display already built on the employee side — reuse that component if it exists)

---

## Files to Touch

| File | Change |
|---|---|
| `app/(app)/approvals/employee-requests/page.tsx` | Create this page |
| `stores/employee-portal.ts` | Add `reject()` to any store missing it |
| `roles.ts` | Add nav item for the new page (restrict to `hr`, `eoic`, `owner`, `admin`) |
| Existing approvals layout/index | Link to new page if approvals section already exists |

---

## Constraints

- Client-side only — no API calls, no backend. All data from Zustand stores.
- Follow existing component and file patterns exactly — do not introduce new libraries.
- TypeScript strict — 0 errors after changes.
- Do not modify employee-facing portal pages.
- Demo user for testing admin side: check `users.ts` for an existing `hr` or `owner` role user, or add one following the `u-010` pattern.

---

## Acceptance Criteria

- [ ] HR, EOIC, and Owner can log in and see all pending employee requests grouped by type
- [ ] Each role only sees Approve/Reject on steps assigned to their role
- [ ] Approving/rejecting a step updates the store and re-renders correctly
- [ ] Fully rejected requests show `rejected` status on both the admin page and the employee's request history
- [ ] TypeScript: 0 errors across all modified/created files
