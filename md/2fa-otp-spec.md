# Two-Factor Authentication (2FA) — OTP Modal Feature Specification

> **Agent Role:** Act as a software developer extending an existing logistics company web application.

---

## Agent Directives

1. **Context First, Code Second** — Before writing anything, read the existing codebase thoroughly. Understand how each of the 9 login pages is built, what form components and modal components are already in use, and what the existing UI/UX patterns look like. Do not start implementation until full context is gathered.

2. **Understand Each Role** — Before implementing, read the existing codebase to understand what each of the 9 roles does, what dashboards they access, what permissions they have, and how their login pages are currently structured. The OTP modal behavior is the same for all roles, but knowing each role ensures the post-login redirect and user data (e.g. phone number field) are handled correctly per role.

3. **UI Must Match Exactly** — All new components (modal, OTP input, helper text) must use the existing design system. Same colors, typography, spacing, button styles, input styles, and modal pattern already used in the project. Do not introduce any new third-party UI libraries or custom styles that deviate from the existing brand.

4. **Keep It Simple** — This is a demo/prototype implementation. There is no real SMS gateway integration. The OTP is generated and displayed directly in the modal so users can understand how the 2FA flow works. Keep the code clean and minimal.

5. **One Shared Implementation** — Write one reusable OTP modal component and one shared logic utility. Apply it across all 9 login pages. Do not duplicate the modal or logic per role.

---

## Feature Summary

After a user submits their credentials on any of the 9 login pages, a modal appears informing them that an OTP has been sent to their registered phone number. The user must enter the OTP to complete login. For demo purposes, the generated OTP is displayed within the modal itself so users can see and enter it without a real SMS being sent.

---

## Roles Covered

This must be applied to all 9 login pages. Before implementing, take full context on what each role does in the system — their responsibilities, dashboard access, permissions, and data scope — so the post-OTP redirect and any role-specific user data (e.g. phone number source) are handled correctly.

| # | Role | Context to Gather |
|---|---|---|
| 1 | **Super Admin** | Highest privilege. Likely manages all roles, system settings, and global config. Confirm what dashboard they land on and where their user record stores the phone number. |
| 2 | **Company Admin** | Likely manages a specific company's data, users, and operations. Confirm scope of access and their user/profile table. |
| 3 | **Dispatcher** | Likely assigns and monitors trips, drivers, and helpers. Confirm their dashboard and phone number field in their profile. |
| 4 | **Driver** | Field role. Likely has a mobile-friendly dashboard for trip tracking. Confirm how their profile is structured and where their contact number is stored. |
| 5 | **Helper** | Field role alongside Driver. Confirm if they share the same user table/model as Driver or have a separate one. |
| 6 | **Accounting / HR** | Likely handles payroll, payslips, cash advances, leave approvals, and HR documents. Confirm their role permissions and user record structure. |
| 7 | **Client Portal** | External-facing role for clients to track shipments or manage requests. Confirm if they are on the same user table as internal staff or a separate client/contact table. |
| 8 | **Subcon Partner** | Likely a subcontractor or partner company with limited access. Confirm their data model and what they can see/do in the system. |
| 9 | **Employee Portal** | Internal employees (office, driver, helper) accessing their own payslips, requests, and HR documents. Confirm how they are differentiated from the Driver and Helper roles above. |

> **Agent instruction:** For each role, locate the corresponding user model, profile table, login page/component, and post-login redirect in the codebase before proceeding. Do not assume — read and confirm.

---

## User Flow

```
User fills in login credentials and clicks "Login"
        ↓
System validates credentials (existing auth logic — do not change)
        ↓
If credentials are valid:
  Generate a random 6-digit OTP
  Show OTP modal
        ↓
Modal displays:
  "We sent an OTP to this number: [masked phone number]"
  OTP input field (6 digits)
  [DEMO ONLY] "Your OTP is: XXXXXX" shown below the input
        ↓
User reads the demo OTP and types it into the input field
        ↓
User clicks "Verify" / "Confirm"
        ↓
OTP matches → Complete login, redirect to role's dashboard
OTP does not match → Show inline error, allow retry
```

---

## Modal Content & Structure

> Use the existing modal component in the project. Do not build a custom modal from scratch.

### Modal Elements (in order)

1. **Modal Title** — e.g. "Verify Your Identity" — match the title style of existing modals in the project
2. **Message Text** — `"We sent an OTP to this number: •••• •••• XXXX"` (mask all but last 4 digits of the registered phone number)
3. **OTP Input Field** — Single input or segmented 6-box input, whichever pattern the existing UI system already supports
4. **Demo OTP Helper Text** — Displayed directly below the input field:
   > `[Demo Only] Your OTP is: XXXXXX`
   - Style using the existing muted / secondary text style so it reads as a helper note, not primary content
   - This line exists purely so demo users and evaluators can complete the flow without a real SMS
5. **Primary Action Button** — "Verify" or "Confirm" — use the existing primary button style
6. **Secondary Option** — "Back" or "Cancel" — dismisses the modal and returns to the login form without creating a session; use existing secondary button or link style
7. **Inline Error State** — If OTP entered is incorrect, display an error message below the input using the existing form validation / error style

---

## OTP Logic (Demo Implementation)

- Generate a **random 6-digit number** on the frontend immediately after credential validation succeeds
- Store it temporarily in **component state only** — not in localStorage, sessionStorage, cookies, or the database
- Display it in the demo helper text inside the modal
- On "Verify", compare the user's typed input against the stored OTP value
- On match → call the existing post-auth function (session creation, token storage, redirect) — do not rewrite this logic
- On mismatch → show inline error, allow the user to retry without regenerating the OTP
- If the modal is closed or cancelled, clear the OTP from state — a fresh one is generated if the user submits credentials again

---

## Implementation Checklist for Agent

Work through all of these before writing any code:

**Roles & Data**
- [ ] Read and understand what each of the 9 roles does in the system before touching any login page
- [ ] Confirm where each role's phone number is stored (field name, table/model) — this is what gets masked in the modal message
- [ ] Confirm the post-login redirect route for each role — the OTP verify step must redirect correctly per role

**Existing Codebase Patterns**
- [ ] How are the 9 login pages currently structured? Shared component with role config, or separate pages per role?
- [ ] Do any login pages share a common base component or layout? If yes, the modal wiring may only need to happen once
- [ ] What modal component does the project already use? Use only that — do not build a new one
- [ ] What input component is used in existing forms? Use the same for the OTP field
- [ ] What are the primary and secondary button styles? Use them for Verify and Cancel
- [ ] What is the existing inline error / form validation display pattern? Use it for the wrong OTP message
- [ ] What is the existing muted / secondary text style? Use it for the demo OTP helper text
- [ ] Where exactly in the current login flow does credential validation end and session creation begin? Insert the OTP step between those two points

---

## What NOT to Do

- Do not integrate a real SMS gateway — this is demo only
- Do not store the OTP in a database, localStorage, sessionStorage, or cookies
- Do not build a new modal component if one already exists in the project
- Do not apply different OTP UI or behavior per role — the modal must look and behave identically across all 9
- Do not rewrite or alter the existing credential validation or session/token logic — only insert the OTP step between them
- Do not show the full phone number — always mask it, showing only the last 4 digits
- Do not add third-party OTP or auth libraries unless the project already uses them
- Do not begin implementation without first reading and understanding all 9 roles and their existing login pages
