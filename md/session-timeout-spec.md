# Session Timeout / Auto Logout Guard — Feature Specification

> **Agent Role:** Act as a software developer extending an existing logistics company web application.

---

## Agent Directives

1. **Context First, Code Second** — Before writing a single line of code, read and understand the existing codebase fully. Identify how auth, sessions, and route guards are currently implemented across all roles. Do not assume — verify.

2. **Keep It Simple** — Implement the simplest solution that works. No over-engineering. Reuse existing patterns, hooks, middleware, and utilities already present in the codebase.

3. **UI Alignment** — Any UI elements introduced (e.g. timeout warning modal, countdown) must match the existing design system — same components, colors, typography, and interaction patterns used elsewhere in the app.

4. **Apply to All 9 Roles** — The session timeout guard must work consistently across every role in the system. Do not write separate implementations per role. Write one shared, reusable solution.

---

## Feature Summary

Automatically log out any authenticated user after a configurable period of inactivity. Before logging out, show a warning so the user has a chance to stay logged in. The timeout duration is configurable from a single place and applies to all roles uniformly.

---

## Roles Covered

This guard must apply to all 9 roles without exception:

1. Super Admin
2. Admin
3. Executive Officer-in-Charge
4. Human Resources
5. Client Relations Specialist
6. Office Employee
7. Driver
8. Helper
9. Owner

---

## Behavior Specification

### Inactivity Detection

Track user activity via these browser events:

- `mousemove`
- `mousedown`
- `keydown`
- `touchstart`
- `scroll`

Any of these events reset the inactivity timer. If none occur within the configured timeout window, the warning phase begins.

### Timeout Flow

```
User is idle for [TIMEOUT - WARNING_DURATION]
        ↓
Show warning modal / banner with countdown
        ↓
User clicks "Stay Logged In"  →  Reset timer, dismiss warning
        ↓ (if no action)
Countdown reaches 0
        ↓
Clear session / token
Redirect to the role's respective login page
Show "You were logged out due to inactivity" message
```

---

## Configuration

All timeout values must be defined in a **single config file or environment variable block**. No magic numbers scattered across the code.

```
SESSION_TIMEOUT_MINUTES=30       # Idle time before warning appears
SESSION_WARNING_SECONDS=60       # Countdown duration of the warning
```

These values must be:
- Easy to change without touching component or guard logic
- Applied globally — changing them once affects all roles

---

## Implementation Checklist for Agent

Work through these before writing any code:

- [ ] What auth system is in use? (JWT, Laravel Sanctum, session cookies, etc.)
- [ ] Where are tokens or session data currently stored? (localStorage, cookie, Vuex/Redux/Pinia store, etc.)
- [ ] How does logout currently work for each role? Is there a shared logout function or separate ones?
- [ ] Where are route guards currently defined? (middleware, router hooks, HOC, layout wrappers, etc.)
- [ ] Is there an existing global layout or wrapper component shared across all role dashboards? If yes, that is the ideal place to mount the timeout logic.
- [ ] Does the existing codebase have an idle/activity detection utility already? If so, reuse it.
- [ ] What component is used for modals or alert dialogs? Use the same one for the warning prompt.
- [ ] Are environment variables / config files already structured? Follow the same pattern for the new timeout config values.
- [ ] What does each role's login route look like? The logout redirect must go to the correct login page per role.

---

## Implementation Approach (Simple, Shared)

> The agent should choose the exact implementation based on the existing stack. The following is a guideline — adapt to what is already in the codebase.

### Step 1 — Config

Define timeout values in one place (`.env`, config file, or constants file — whichever the project already uses).

### Step 2 — Single Reusable Hook or Utility

Create one `useSessionTimeout` hook (or equivalent utility for the framework in use) that:
- Listens for activity events
- Resets a timer on each event
- Triggers the warning state when the idle threshold is hit
- Triggers logout when the countdown expires
- Cleans up event listeners on unmount

### Step 3 — Mount in the Shared Layout

Find the existing shared layout or wrapper component that all role dashboards already use. Mount the session timeout hook there — **once**. This ensures all 9 roles are covered without duplicating code.

If there is no single shared layout (each role has its own), create a thin shared wrapper specifically for this guard and wrap each role's layout with it.

### Step 4 — Warning UI

Use the existing modal or dialog component to display:
- A clear message: *"You've been inactive. You will be logged out in X seconds."*
- A **Stay Logged In** button (resets the timer)
- An optional **Logout Now** button

Match the styling of existing modals exactly.

### Step 5 — Logout

On timeout, call the existing logout function/action. Do not write a new one. After clearing the session:
- Redirect the user to their role-specific login page
- Display an inactivity message on the login page (use query param, toast, or flash message — whichever the project already uses)

---

## What NOT to Do

- Do not write separate timeout logic for each role
- Do not hardcode timeout durations in components
- Do not create new UI components if an equivalent already exists
- Do not bypass the existing logout flow — hook into it
- Do not skip the warning step and log out immediately without notice
ENDOFFILE