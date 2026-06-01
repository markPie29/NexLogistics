# NexLogistics — Principal Full-Stack Project Context
### For Project Manager AI Context & Stakeholder Reference
**Version:** 1.0 · **Date:** June 2026 · **Authored by:** Engineering Lead  
**Classification:** Internal — Product & Engineering

---

## 1. What Is This Product?

**NexLogistics** is a **white-label SaaS fleet & logistics management platform** built for Philippine trucking and logistics companies. It is a fully-featured, multi-role web application that a logistics business uses to manage their entire operation — from dispatching trucks to paying drivers, invoicing clients, and tracking live GPS.

The product is built **once as a master codebase** and **sold / deployed multiple times** to different companies under their own brand name, logo, and color identity. Each deployment is called a **tenant**. A tenant sees only their own data, their own company name, and their own currency/locale settings — all without us changing a single line of code.

### The Business Model

```
NexVision Innovations (us — the software vendor)
    │
    ├── NexLogistics.com  ← our own flagship instance (storeKey: "nex")
    ├── SKLogistics       ← white-labeled for SK Logistics (storeKey: "skl")
    └── MTSTrucking       ← white-labeled for MTS Trucking (storeKey: "mts")
         ... (unlimited future tenants)
```

We sell:
- **Monthly SaaS subscription** per tenant company
- **One-time setup / onboarding** fee (branding, data migration)
- **Optional add-on modules** (Warehouse, Route Optimization, AI Insights)

Each tenant gets:
- Their own Vercel deployment with their domain
- Their brand name / logo / colors (via environment variables)
- Isolated data (all localStorage keys are prefixed per tenant)
- Ability to turn features ON or OFF via the Platform Admin panel

---

## 2. Product Purpose — What Problem We Solve

Filipino logistics / trucking companies today manage their operations with:
- WhatsApp groups for dispatch coordination
- Excel spreadsheets for payroll and expenses
- Paper waybills for proof of delivery
- Manual call-based GPS tracking

**NexLogistics replaces all of this** with one integrated web platform:

| Old Way | NexLogistics Way |
|---------|-----------------|
| WhatsApp dispatch | Live Dispatch Center with Kanban board |
| Google Maps sharing | Live GPS map with real-time vehicle pings |
| Excel payroll | Per-trip payroll engine with PH government deductions |
| Paper waybill / DR | Digital Proof of Delivery (photo + signature capture) |
| Paper invoices | AR Billing with invoices, payments, credit notes |
| Phone-based client updates | Client Portal — clients track their own shipments |
| Gut-feel maintenance | PMS reminders with odometer tracking |

---

## 3. Repository Structure

### Three Parallel Repositories (all identical code, different brand config)

| Repo | GitHub | Branch | Tenant storeKey | Brand Default |
|------|--------|--------|----------------|---------------|
| **NexLogistics** | `mozhdeveloper/NexLogistics` | `main` | `nex` | NexLogistics |
| **SKLogistics** | `mozhdeveloper/sk-logistics-FMS` | `master` | `skl` | SKLogistics |
| **MTSTrucking** | `mozhdeveloper/mts-trucking-FMS` | `main` | `mts` | MTSTrucking |

> **Rule:** All bug fixes and features are developed in **NexLogistics first**, then synced to SK and MTS. The only file that differs intentionally between repos is `lib/config/brand.ts`.

### Codebase Folder Structure

```
NexLogistics/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Login page (public, no sidebar)
│   │   └── login/page.tsx
│   ├── (app)/                    # Protected app shell (requires auth)
│   │   ├── layout.tsx            # Sidebar + Topbar chrome
│   │   ├── dashboard/            # Super Admin / Company Admin home
│   │   ├── dispatcher/           # Dispatcher-role real-time ops panel
│   │   ├── accounting/           # Accounting-role finance overview
│   │   ├── fleet/                # Vehicle management
│   │   ├── drivers/              # Driver management
│   │   ├── helpers/              # Helper (loader) management
│   │   ├── trips/                # Trip list + new trip wizard + Kanban dispatch
│   │   ├── approvals/            # Trip rate approval queue (Super Admin only)
│   │   ├── partners/             # Subcontractor / hauler management
│   │   ├── gps/                  # Live GPS tracking map
│   │   ├── pms/                  # Preventive Maintenance System
│   │   ├── pod/                  # Proof of Delivery
│   │   ├── expenses/             # Fuel & Expense log
│   │   ├── payroll/              # Driver & helper payroll system
│   │   ├── attendance/           # Attendance calendar
│   │   ├── billing/              # AR invoices, payments, credit notes
│   │   ├── reports/              # Analytics & reporting
│   │   ├── clients/              # Client / customer management
│   │   ├── client-portal/        # Client-facing shipment + invoice portal
│   │   ├── calendar/             # Department event calendar
│   │   ├── documents/            # File document management
│   │   ├── company-admin/        # Company management (Company Admin role)
│   │   ├── settings/             # User preferences & system settings
│   │   ├── ai-insights/          # AI predictive analytics (preview)
│   │   ├── warehouse/            # Warehouse management (preview)
│   │   ├── routes/               # Route optimization (preview)
│   │   └── platform-admin/       # HIDDEN — NexVision internal admin panel
│   ├── layout.tsx                # Root HTML + metadata (reads BRAND config)
│   ├── error.tsx                 # Error boundary
│   ├── global-error.tsx          # Root-level crash boundary
│   ├── not-found.tsx             # 404 page
│   └── loading.tsx               # Suspense loading screen
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar (reads BRAND.name)
│   │   └── Topbar.tsx            # Header with notifications, user menu
│   ├── ui/                       # shadcn/ui component library
│   ├── charts/                   # Recharts wrappers (KPI sparklines, bar, pie)
│   ├── maps/                     # Leaflet live GPS map
│   ├── driver/                   # Driver-role specific views
│   └── ...                       # Feature-specific components
│
├── lib/
│   ├── config/
│   │   ├── brand.ts              # ★ WHITE-LABEL: brand, locale, currency config
│   │   └── routes.ts             # ★ All route path constants (ROUTES.*)
│   ├── store/
│   │   ├── index.ts              # Main Zustand store (fleet, trips, billing, etc.)
│   │   ├── auth.ts               # Auth store (login, session, role)
│   │   ├── features.ts           # Feature flag store (24 toggleable features)
│   │   ├── payroll.ts            # Payroll-specific state
│   │   ├── partners.ts           # Subcontractor state
│   │   ├── helpers.ts            # Helper (loader) state
│   │   ├── documents.ts          # Document management state
│   │   ├── calendar.ts           # Calendar event state
│   │   └── client-portal.ts      # Client portal state
│   ├── auth/
│   │   └── roles.ts              # Role definitions, NAV_ITEMS, DEFAULT_LANDING
│   ├── data/
│   │   └── users.ts              # Seed demo users (6 roles + platform owner)
│   ├── types.ts                  # ★ All TypeScript domain types
│   └── utils.ts                  # cn(), formatNumber(), formatPercent(), relativeTime()
│
├── docs/                         # Internal planning & branding docs (not shipped)
├── public/                       # Static assets
├── .env.example                  # Environment variable template
├── .eslintrc.json                # ESLint config
├── vercel.json                   # Vercel deployment config
├── tailwind.config.ts            # Tailwind with brand color tokens
├── tsconfig.json                 # TypeScript strict mode
└── package.json                  # Node 20.x, npm scripts
```

---

## 4. Technology Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Framework** | Next.js App Router | 14.2.5 | File-system routing, SSR/SSG ready, Vercel-native |
| **Language** | TypeScript (strict) | 5.x | Type safety, scalable codebase |
| **Styling** | Tailwind CSS | 3.x | Utility-first, brand token system |
| **Component Library** | shadcn/ui + Radix UI | — | Accessible, unstyled base components |
| **State Management** | Zustand + persist | 4.x | Simple, performant, localStorage persistence |
| **Forms** | react-hook-form + Zod | 7.x / 3.x | Validated forms, type-safe schemas |
| **Charts** | Recharts | 2.x | KPI charts, sparklines, analytics |
| **Maps** | Leaflet + react-leaflet | 1.9 / 4.x | Open-source GPS maps |
| **Drag & Drop** | @dnd-kit | 6.x | Kanban dispatch board |
| **Icons** | Lucide React | 0.424 | Consistent icon system |
| **Animations** | Framer Motion | 11.x | Page transitions |
| **Dates** | date-fns | 3.x | Date formatting, calculations |
| **Toasts** | Sonner | — | Notification system |
| **Deployment** | Vercel | — | Zero-config Next.js hosting |
| **Runtime** | Node.js | 20.x (enforced) | LTS stable |

### Data Storage (Current MVP State)
- **All data is stored in `localStorage` via Zustand `persist`** — no backend, no database
- This is **intentional for MVP** — allows instant demo, no infrastructure cost, sell first
- Every localStorage key is prefixed with the tenant's `storeKey` (e.g. `nex-fleet`, `skl-fleet`) to prevent data collision between tenants on the same browser
- **Database-ready architecture:** All data is in typed TypeScript interfaces. Connecting a real DB (Supabase / PostgreSQL) means replacing Zustand store actions with API calls — the UI components don't change

---

## 5. User Roles & Permissions

The system has **6 user roles**. Each role gets a different navigation set and default landing page.

| Role | Default Landing | Access Summary |
|------|----------------|----------------|
| `super_admin` | `/dashboard` | Full access to everything — fleet, trips, payroll, billing, reports, approvals |
| `company_admin` | `/dashboard` | Same as super_admin but cannot access trip rate approvals |
| `dispatcher` | `/dispatcher` | Dispatch center, trips, fleet view, GPS, POD, driver/helper management |
| `driver` | `/driver` | Only their own trip, GPS status, earnings — mobile-optimized view |
| `accounting` | `/accounting` | Finance overview, payroll, billing, expenses, partners, attendance |
| `client` | `/client-portal/overview` | Client portal only — their shipments, invoices, reports |

### Special Hidden Role: Platform Owner
- Email: `platform@nex.internal`
- Bypasses all feature flag restrictions
- Sees `/platform-admin` entry in sidebar (hidden from all other roles)
- Can toggle any feature on/off for the tenant from the Platform Admin panel
- Credential never exposed to tenant users

### Demo Credentials (for all current tenants)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@nexlogistics.demo` | `Admin123!` |
| Company Admin | `operations@nexlogistics.demo` | `Ops123!` |
| Dispatcher | `dispatcher@nexlogistics.demo` | `Dispatch123!` |
| Driver | `driver.mark@nexlogistics.demo` | `Driver123!` |
| Accounting | `finance@nexlogistics.demo` | `Finance123!` |
| Client | `client@nexlogistics.demo` | `Client123!` |
| Platform Owner | `platform@nex.internal` | `NexPlatform@2025!` |

> ⚠️ **Security note:** Passwords in demo mode are stored as `_demoPassword` on seed user objects — they are never persisted to any external store or transmitted over network. The field is marked `@internal` and typed as optional.

---

## 6. Feature Modules — Complete List

The system has **24 toggleable feature modules**. Each can be enabled/disabled per tenant from the Platform Admin panel.

### Operations (10 features)

| Feature | Route | Description |
|---------|-------|-------------|
| **Fleet Management** | `/fleet` | Vehicle CRUD — add, edit, archive vehicles. Status tracking (available / in trip / maintenance / inactive). Vehicle ownership (company-owned vs subcontractor). |
| **Driver Management** | `/drivers` | Driver CRUD, license tracking, performance stats, payroll profile, employment type (per-trip / monthly / hybrid). |
| **Helper Management** | `/helpers` | Loader/assistant CRUD, assignment to drivers, payroll basis. |
| **Trip & Dispatch** | `/trips` | Trip list with status pipeline, new trip wizard (8-step form), Kanban dispatch board. Full audit log per trip. |
| **Trip Rate Approvals** | `/approvals` | Super Admin approval queue for trips with non-standard driver rates. Rate locked at trip creation, released only after approval. |
| **Subcon Partners** | `/partners` | Third-party hauler management — CRUD, resource requests (diesel, cash advance), payout tracking. |
| **Live GPS Tracking** | `/gps` | Real-time map showing all active vehicles. Color-coded by status. Click-to-detail. |
| **PMS / Maintenance** | `/pms` | Preventive maintenance scheduling. Due-soon / overdue alerts by date or odometer. |
| **Proof of Delivery** | `/pod` | Digital POD capture — camera photo + signature pad + GPS coordinates. Admin list with filter by trip/date. |
| **Dispatch Center** | `/dispatcher` | Dispatcher-role landing — live KPI counters, active trip list, quick-assign tools. |

### Finance & HR (6 features)

| Feature | Route | Description |
|---------|-------|-------------|
| **Fuel & Expenses** | `/expenses` | Expense log by category (fuel, repair, toll, cash advance). Charts, vendor tracking, trip linkage. |
| **Payroll** | `/payroll` | Philippine payroll system. Multiple modes: fixed salary, fixed+trip hybrid, per-trip, per-delivery, percentage commission. Trip rates with distance tiers, cargo multipliers. Government deductions (SSS, PhilHealth, Pag-IBIG, withholding tax). Payroll period management — draft → approved → paid. |
| **Attendance** | `/attendance` | Driver attendance calendar grid. Mark present/absent/on-leave per day. |
| **Billing & Invoices** | `/billing` | Full AR system — invoices with line items, VAT, payments, credit notes, recurring invoice scheduling. |
| **Finance Overview** | `/accounting` | Accounting-role dashboard — KPI summary of revenue, expenses, payroll, outstanding AR. |
| **Department Calendar** | `/calendar` | Multi-department event calendar (Operations, Finance, HR, Maintenance). |

### Sales & Customer (2 features)

| Feature | Route | Description |
|---------|-------|-------------|
| **Client Management** | `/clients` | Client/customer CRUD — contact info, industry, linked trips and invoices. |
| **Client Portal** | `/client-portal` | Client-facing sub-app: shipment tracking with status timeline, invoice list, reports. Clients only see their own data. |

### Reports & Analytics (2 features)

| Feature | Route | Description |
|---------|-------|-------------|
| **Reports & Analytics** | `/reports` | 10+ report types — trip reports, revenue analysis, expense breakdown, driver performance, fleet utilization, fuel trends, client revenue, POD compliance, payroll summary. Date range filter + CSV export. |
| **AI Insights** | `/ai-insights` | Predictive insights panel — fuel anomalies, driver risk scoring, maintenance forecasting, route cost analysis. (Preview — data is currently simulated.) |

### Admin (4 features)

| Feature | Route | Description |
|---------|-------|-------------|
| **Documents** | `/documents` | File management — upload, categorize, share documents. Recycle bin. Category filters. |
| **Company Management** | `/company-admin` | Company overview, user roster, branch management. Company Admin role only. |
| **Warehouse** | `/warehouse` | Warehouse operations module. *(Preview — Coming Phase 3)* |
| **Route Optimization** | `/routes` | Automated multi-stop route planning. *(Preview — Coming Phase 3)* |

---

## 7. White-Label Architecture

This is the **core engineering selling point** of the product. Here is how it works:

### Single Config File Controls Everything

```typescript
// lib/config/brand.ts — THE ONLY FILE THAT DIFFERS BETWEEN TENANTS

export const BRAND = {
  name:        env("NEXT_PUBLIC_BRAND_NAME",        "NexLogistics"),
  title:       env("NEXT_PUBLIC_BRAND_TITLE",       "Nex Logistics"),
  tagline:     env("NEXT_PUBLIC_BRAND_TAGLINE",     "Enterprise Fleet & Trip Management"),
  company:     env("NEXT_PUBLIC_BRAND_COMPANY",     "NEX Logistics Inc."),
  storeKey:    env("NEXT_PUBLIC_BRAND_STORE_KEY",   "nex"),   // ← tenant data namespace
  vendor:      env("NEXT_PUBLIC_BRAND_VENDOR",      "NexVision Innovations"),
  supportEmail: env("NEXT_PUBLIC_BRAND_SUPPORT_EMAIL", "support@nexlogistics.example"),
  description: env("NEXT_PUBLIC_BRAND_DESCRIPTION", "Premium logistics platform."),
}

export const LOCALE = {
  tag:              "en-PH",   // ← change for non-PH tenants
  currency:         "PHP",     // ← change for non-PH tenants
  currencySymbol:   "₱",
  phoneCountryCode: "+63",
  timezone:         "Asia/Manila",
}
```

### What Changes Per Tenant (Only Environment Variables)

```env
# .env.local for SK Logistics tenant
NEXT_PUBLIC_BRAND_NAME=SKLogistics
NEXT_PUBLIC_BRAND_TITLE=SK Logistics
NEXT_PUBLIC_BRAND_COMPANY=SK Logistics Corp.
NEXT_PUBLIC_BRAND_STORE_KEY=skl
NEXT_PUBLIC_BRAND_SUPPORT_EMAIL=support@sklogistics.ph
```

### What Automatically Updates From BRAND Config

| Where It Shows | What Reads BRAND |
|---------------|-----------------|
| Browser tab title | `app/layout.tsx` — `metadata.title` |
| Open Graph / SEO | `app/layout.tsx` — `metadata.openGraph` |
| Sidebar logo text | `components/layout/Sidebar.tsx` |
| Page metadata | `app/layout.tsx` |
| localStorage namespace | All persisted Zustand stores use `${BRAND.storeKey}-*` |
| Platform Admin session key | `app/(app)/platform-admin/page.tsx` |
| All currency displays | `lib/utils.ts` re-exports `formatCurrency` from brand config |

### Data Isolation (Multi-Tenancy)

Every Zustand store uses the tenant's `storeKey` as a prefix:

```
nex-fleet         ← NexLogistics fleet data
skl-fleet         ← SKLogistics fleet data (separate, no collision)
mts-fleet         ← MTS Trucking fleet data (separate, no collision)

nex-auth          ← NexLogistics session
skl-auth          ← SKLogistics session (separate)
```

Persisted stores include: `fleet`, `drivers`, `trips`, `maintenance`, `expenses`, `payroll`, `clients`, `pods`, `ui`, `invoices`, `billing-payments`, `credit-notes`, `recurring`, `feature-flags`, `auth`, `helpers`, `partners`, `documents`, `calendar`, `client-portal`.

---

## 8. Platform Admin — The Vendor Control Panel

The **Platform Admin** (`/platform-admin`) is a **hidden page** only accessible to `platform@nex.internal`. It is NOT listed in any tenant user's navigation.

### What It Does

1. **Feature Flag Dashboard** — Toggle any of the 24 feature modules ON or OFF for the current tenant deployment. Changes are instant (no restart required), persisted to localStorage.

2. **Login Gate** — Protected by a separate sessionStorage PIN (not the main app auth). Session expires on tab close.

3. **Use Cases:**
   - Turn off `ai_insights` for a tenant that didn't purchase that add-on
   - Enable `warehouse` for a tenant that just upgraded
   - Demo to a prospect with only the features relevant to them
   - Troubleshoot a feature by toggling it off and on

### Security Model
- Sidebar entry only renders if `user.isPlatformOwner === true`
- Feature flag access checks bypass `isPlatformOwner` flag
- Session key is `${BRAND.storeKey}-platform-session` (tenant-namespaced)
- No network calls — entirely client-side for the MVP

---

## 9. Data Model Overview

All domain types are defined in `lib/types.ts`. Below is the entity map:

```
User ──────────────────┐
  role: Role           │
  isPlatformOwner      │
                       │
Vehicle ───────────────┤        Trip ──────────────────────────┐
  status               │          clientId → Client            │
  ownership (co/subcon)│          driverId → Driver            │
  partnerId → Partner  │          vehicleId → Vehicle          │
                       │          helperId → Helper            │
Driver ─────────────── ┤          partnerId → Partner          │
  employmentType       │          approvalStatus               │
  payrollProfile       │          statusLogs[]                 │
                       │          otherFees[]                  │
Helper ────────────────┤          podId → ProofOfDelivery      │
  assignedDriverId     │          payrollProcessed             │
                       │                                       │
Partner (Subcon) ──────┘        ProofOfDelivery                │
  PartnerRequest[]                tripId → Trip ───────────────┘
                                  photo + signature + GPS

Client ────────────────────────── Invoice ─── InvoiceLineItem[]
                                   ├── BillingPayment[]
                                   ├── CreditNote[]
                                   └── RecurringInvoice

PayrollPeriod ─── PayrollRecord ── TripRate (locks rates at trip creation)
                                    ├── DistanceTier[]
                                    └── CargoMultiplier[]

MaintenanceRecord → Vehicle
Expense → Vehicle / Driver / Trip
GpsPing → Vehicle
CalendarEvent
Document
```

---

## 10. Trip Lifecycle — Most Complex Business Process

The **trip** is the central entity. Here is its full lifecycle:

```
1. SCHEDULED          ← Trip created via new-trip wizard
      ↓                  Rate locked (driverRate, helperRate, partnerRate)
2. PENDING_RATE_APPROVAL  ← If rate is non-standard → Super Admin must approve
      ↓ (approved)
3. DRIVER_ASSIGNED    ← Driver + vehicle assigned
      ↓
4. VEHICLE_DISPATCHED ← Dispatcher confirms truck left yard
      ↓
5. LOADED             ← Cargo loaded confirmation
      ↓
6. IN_TRANSIT         ← Moving to destination
      ↓
7. DELIVERED          ← Arrived, pending POD
      ↓ (POD captured)
8. COMPLETED          ← POD confirmed, trip locked
      ↓
   Payroll period picks up completed trips → PayrollRecord generated
```

### Rate Approval Gate (Phase 5)
- When a new trip is created with a driver rate outside the configured `TripRate` range, its `approvalStatus` is set to `pending_rate_approval`
- The trip appears in `/approvals` queue (Super Admin only)
- Super Admin can approve or reject with notes
- The `rateApprovedBy`, `rateApprovedAt`, `rateApprovalNotes` fields audit this

---

## 11. Payroll System — Philippine-Specific Logic

The payroll module is designed specifically for Philippine trucking companies:

### Employment Types
- **`fixed_salary`** — Pure monthly base (₱/month)
- **`fixed_plus_trip`** — Base salary + per-trip incentives (most common)
- **`per_trip`** — Pure trip-based earnings, no base
- **`per_delivery`** — Paid per successful POD confirmation
- **`percentage`** — % commission of trip fare

### Trip Rate Engine (`TripRate`)
Each rate rule defines:
- Vehicle type (6-wheeler, van, trailer, etc.)
- Route origin/destination (or `*` wildcard)
- Rate type: fixed, per_km, per_ton, per_unit, percentage
- **Distance tiers** with multipliers (e.g. 50-150km = ×1.15)
- **Cargo multipliers** by type (e.g. hazmat = ×1.5)
- **Driver vs helper split** (e.g. driver gets 70%, helper 30%)

### Payroll Period Workflow
1. Create period (start date → end date)
2. System aggregates all `completed` trips in that window
3. Apply applicable `TripRate` rules → compute `driverRate` per trip
4. Apply `Incentive` bonuses and `Deduction` items (SSS, PhilHealth, Pag-IBIG, cash advances)
5. Generate `PayrollRecord` per driver with `baseSalary + incentives - deductions = net`
6. Approve period → mark all records as `approved`
7. Mark paid → `paidAt` timestamp locked

---

## 12. Billing System

Full AR (Accounts Receivable) system for billing clients:

### Invoice Flow
```
Draft → Sent → Partially Paid / Paid → (Overdue if past dueDate)
                         ↓
                   BillingPayment recorded (bank/GCash/cash/check)
                         ↓
                   CreditNote issued (if dispute/reversal)
```

### Recurring Invoices
- Template-based auto-generation on weekly / monthly / quarterly / yearly schedule
- `lastGenerated` + `totalGenerated` tracked for audit

### VAT Support
- Philippine 12% VAT computed at invoice level
- `subtotal`, `vatRate`, `vatAmount`, `totalAmount`, `paidAmount`, `balance` all separate fields

---

## 13. Client Portal

A **separate sub-app within the same codebase** accessible only to `client` role users:

| Section | What Clients See |
|---------|-----------------|
| `/client-portal/overview` | KPI cards: total trips, active shipments, outstanding balance, total spend |
| `/client-portal/trips` | Their shipments with live status, status timeline, driver/vehicle info |
| `/client-portal/invoices` | Their invoices with payment history, download |
| `/client-portal/reports` | Revenue trend, shipment stats, expense breakdown |

All data is filtered to `clientId` — clients never see data belonging to other clients.

---

## 14. Development Workflow

### Branch Strategy
- All work happens on the default branch (`main` / `master`)
- No feature branch strategy yet (MVP phase — single developer)
- Phase 2 will introduce: `develop` → `staging` → `main` GitFlow

### Sync Protocol (Three-Repo Rule)
1. Develop and test in **NexLogistics** first
2. Run `npx tsc --noEmit` → must be EXIT:0
3. Copy modified files to **SKLogistics** and **MTSTrucking** (using `Copy-Item -LiteralPath` for paths with parentheses)
4. Run TS check on SK and MTS
5. Commit all 3 with the same commit message
6. Push all 3

> ⚠️ **Never overwrite `lib/config/brand.ts`** when syncing — each repo has its own with the correct `storeKey`.

### PowerShell Notes (Windows)
- No `&&` operator — use `;` to chain commands
- Use `Copy-Item -LiteralPath` for paths containing `(app)` or `[id]`
- Terminal runs line-by-line interactively — use `.ps1` script files for multi-line logic

### Available Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server (also clears `.next` cache first) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type check (must pass before any push) |

---

## 15. MVP Status & What's Not Built Yet

### What IS Complete (Fully Working MVP)

| Module | Status |
|--------|--------|
| Authentication (all 6 roles + platform owner) | ✅ Complete |
| Fleet Management (CRUD, status, ownership) | ✅ Complete |
| Driver Management (CRUD, profiles, stats) | ✅ Complete |
| Helper / Loader Management | ✅ Complete |
| Trip & Dispatch (wizard, Kanban, lifecycle) | ✅ Complete |
| Trip Rate Approvals queue | ✅ Complete |
| Subcontractor Partners (CRUD, requests) | ✅ Complete |
| Live GPS Tracking (Leaflet map, mock pings) | ✅ Complete |
| PMS / Preventive Maintenance | ✅ Complete |
| Proof of Delivery (photo + signature) | ✅ Complete |
| Fuel & Expenses | ✅ Complete |
| Philippine Payroll Engine | ✅ Complete |
| Attendance Calendar | ✅ Complete |
| Billing & Invoices (full AR) | ✅ Complete |
| Reports & Analytics (10 report types) | ✅ Complete |
| Client Management | ✅ Complete |
| Client Portal (overview, trips, invoices, reports) | ✅ Complete |
| Department Calendar | ✅ Complete |
| Document Management | ✅ Complete |
| AI Insights (preview / simulated) | ✅ Preview |
| Platform Admin + Feature Flags (24 toggles) | ✅ Complete |
| White-label brand config | ✅ Complete |
| Error boundaries + 404 + loading states | ✅ Complete |
| SEO metadata | ✅ Complete |
| Vercel deployment config | ✅ Complete |

### What Is NOT Built Yet (Phase 2 / 3)

| Item | Phase | Notes |
|------|-------|-------|
| Real database (PostgreSQL / Supabase) | Phase 2 | Replace Zustand persist with API |
| Authentication backend (JWT / NextAuth) | Phase 2 | Replace seed user array |
| API routes (`app/api/`) | Phase 2 | REST or tRPC |
| File upload (S3 / Cloudflare R2) | Phase 2 | POD photos, documents |
| Real GPS integration (hardware device API) | Phase 2 | Replace mock pings |
| Email notifications | Phase 2 | Trip status alerts, invoice reminders |
| Push notifications (PWA) | Phase 2 | Mobile driver alerts |
| Multi-company / multi-tenant per single DB | Phase 2 | Row-level security |
| Tests (Vitest + Playwright) | Phase 2 | Unit + E2E |
| Warehouse module (full) | Phase 3 | Currently preview UI only |
| Route Optimization (full) | Phase 3 | Currently preview UI only |
| AI Insights (real ML) | Phase 3 | Currently simulated data |
| Mobile app (React Native) | Phase 3 | Driver app priority |

---

## 16. Architecture Quality Standards

The codebase follows these enforced standards:

| Standard | Implementation |
|----------|---------------|
| TypeScript strict mode | `tsconfig.json` — `strict: true`, no implicit any |
| No `any` types | ESLint `@typescript-eslint/no-explicit-any: warn` |
| No unused vars | ESLint `@typescript-eslint/no-unused-vars: warn` |
| No console.log in prod | ESLint `no-console: warn` (allow warn/error) |
| React hooks exhaustive deps | ESLint `react-hooks/exhaustive-deps: warn` |
| No hardcoded brand strings | All strings read from `BRAND.*` config |
| Route centralization | `ROUTES.*` exists in `lib/config/routes.ts`; call-site migration is in progress |
| No `password` in types | `User.password` removed — only `_demoPassword` (internal seed) |
| No `"use client"` in lib/ | Server-compatible library files only |
| Tenant data isolation | All Zustand persist keys = `${BRAND.storeKey}-*` |

---

## 17. Selling Points — How to Position This Product

### For Sales Conversations

**Primary Value Propositions:**

1. **"Replace 5 apps with 1"** — WhatsApp dispatch + Excel payroll + paper POD + manual invoicing + scattered GPS tracking, all in one platform with one login.

2. **"Your brand, not ours"** — The platform appears with the client's company name, not "NexLogistics". Clients never know it's a white-labeled product unless they ask.

3. **"Philippine payroll built-in"** — PH-specific SSS, PhilHealth, Pag-IBIG deductions, per-trip rates, distance tiers — built for how Filipino trucking companies actually pay drivers. No generic payroll software that needs to be reconfigured.

4. **"Client portal included"** — Clients can track their own shipments without calling dispatch. Reduces inbound calls by giving clients self-service visibility.

5. **"Turn features on/off"** — Sell what they need. Small 5-truck company? Turn off warehouse, route optimization, AI insights. Large 50-truck fleet? All features on. Same platform, tailored package.

6. **"No hardware required"** — GPS tracking works with existing smartphones (driver opens app, location updates). No ₱15,000 GPS device per vehicle required to get started.

7. **"Scales with the business"** — Start with demo data, upgrade to real database when ready. The UI and business logic don't change. Only the data layer gets swapped.

### Target Customer Profile
- Philippine logistics companies: 5 to 200 trucks
- Currently using manual/paper processes or disconnected tools
- Have at least one operations staff, one accounting/finance staff
- Monthly revenue: ₱500K to ₱50M+
- Pain: wasted time on manual coordination, disputes on payroll, no client visibility

### Pricing Direction (Suggested)
| Tier | Fleet Size | Price |
|------|-----------|-------|
| Starter | Up to 10 vehicles | ₱3,500/month |
| Growth | Up to 30 vehicles | ₱8,500/month |
| Enterprise | Unlimited | ₱18,000/month + setup |

---

## 18. Glossary

| Term | Meaning |
|------|---------|
| **Tenant** | A single company/client using the platform under their own brand |
| **storeKey** | Short code (e.g. `nex`, `skl`, `mts`) used as localStorage namespace prefix |
| **White-label** | Delivering a product under the buyer's brand instead of the maker's |
| **Platform Admin** | NexVision's internal admin interface hidden inside every tenant deployment |
| **Feature Flag** | A toggle that enables or disables a module for a specific tenant |
| **Seed Data** | Pre-populated demo data (vehicles, drivers, trips) for demo/onboarding |
| **MVP** | Minimum Viable Product — full UI + business logic, localStorage only (no real DB yet) |
| **Subcon / Partner** | Third-party trucking company hired to handle overflow trips |
| **DR / Waybill** | Delivery Receipt / Document number assigned to a trip |
| **POD** | Proof of Delivery — photo + signature confirmation at drop-off |
| **PMS** | Preventive Maintenance System — scheduled vehicle service tracking |
| **AR** | Accounts Receivable — billing system for client invoices |
| **App Router** | Next.js 14's routing system using `app/` directory (replaces old `pages/`) |
| **Zustand persist** | State management with automatic localStorage save/load |

---

*Document maintained by Engineering Lead. Update when significant architectural changes are made.*
