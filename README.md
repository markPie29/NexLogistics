# NexLogistics — Fleet & Trip Management Platform

A premium, white-label logistics / fleet management platform built with **Next.js 14 App Router**, **TypeScript**, **Zustand**, and **Tailwind CSS**.

This MVP ships ready for demos and is sold as a **white-label** product (currently deployed for NexLogistics, SKLogistics, and MTSTrucking).

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

The dev script clears `.next` automatically (workaround for OneDrive cache corruption).

### Demo credentials

The login screen shows quick-access cards for every role. Direct login also works:

| Role          | Email                       | Password         |
|---------------|-----------------------------|------------------|
| Super Admin   | `admin@nexlogistics.com`    | `Admin123!`      |
| Company Admin | `ops@nexlogistics.com`      | `Ops123!`        |
| Dispatcher    | `dispatch@nexlogistics.com` | `Dispatch123!`   |
| Accounting    | `finance@nexlogistics.com`  | `Finance123!`    |
| Driver        | `driver@nexlogistics.com`   | `Driver123!`     |
| Client        | `client@abc.com`            | `Client123!`     |

### Hidden Platform Owner (white-label control)

| Email                   | Password           |
|-------------------------|--------------------|
| `platform@nex.internal` | `NexPlatform@2025!`|

The platform owner sees a **Feature Flags** link in the sidebar and can also access `/platform-admin` directly via URL. Use this to toggle which modules each client sees before a demo or handoff.

See [platform-feature-plan.md](./platform-feature-plan.md) for full details.

---

## Project Structure

```
app/
  (app)/                  # Authenticated app routes (sidebar + topbar)
    dashboard/            # Role-aware landing pages
    fleet/                # Vehicle CRUD
    drivers/              # Driver CRUD
    helpers/              # Loader / assistant CRUD
    trips/                # Trips list + Kanban dispatch
    trips/dispatch/       # Drag-and-drop dispatch board
    pms/                  # Preventive maintenance
    pod/                  # Proof of delivery (photo + signature)
    expenses/             # Fuel & operating expenses
    payroll/              # Philippine payroll (gov deductions, trip rates)
    attendance/           # Driver attendance calendar
    billing/              # AR invoices, payments, credit notes, recurring
    clients/              # Client / customer CRUD
    client-portal/        # Client-facing tracking, invoices, support
    reports/              # 10 report types + CSV export
    documents/            # Document management + categories + recycle bin
    platform-admin/       # 🔒 Hidden — feature flag dashboard
    settings/             # Profile, theme
  (auth)/
    login/                # Login page

components/
  layout/                 # Sidebar, Topbar, PageHeader
  ui/                     # shadcn/ui primitives
  dashboard/              # KPI cards, charts
  forms/                  # Add/edit sheets
  maps/                   # Live GPS map (Leaflet)
  driver/                 # Driver mobile app components
  client-portal/          # Client portal widgets

lib/
  store/                  # Zustand stores (persisted with `nex-*` keys)
  data/                   # Demo seed data
  auth/                   # Role + permission logic
  config/brand.ts         # 🌟 White-label config (one place to rebrand)
  types.ts                # Shared TypeScript types
  utils.ts                # `cn()` and helpers
```

---

## White-Labeling for a New Client

This product is designed to be **rebranded with one config change**.

### Option A — Environment variables (recommended)

Copy `.env.example` to `.env.local` and override:

```env
NEXT_PUBLIC_BRAND_NAME=AcmeFleet
NEXT_PUBLIC_BRAND_TITLE=Acme Fleet
NEXT_PUBLIC_BRAND_TAGLINE=Smart Trucking, Smarter Operations
NEXT_PUBLIC_BRAND_COMPANY=Acme Fleet Solutions Inc.
NEXT_PUBLIC_BRAND_STORE_KEY=acme
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_CURRENCY_SYMBOL=$
NEXT_PUBLIC_LOCALE=en-US
```

### Option B — Edit defaults

Edit `lib/config/brand.ts` to change brand defaults committed in source.

### Option C — Per-feature toggling

Log in as Platform Owner → `/platform-admin` → toggle any of 24 feature modules off. The client's sidebar updates instantly.

See [platform-feature-plan.md](./platform-feature-plan.md) for tier packaging examples (Starter / Standard / Full).

---

## Available Scripts

| Command          | Description                                   |
|------------------|-----------------------------------------------|
| `npm run dev`    | Start dev server (clears `.next` first)       |
| `npm run build`  | Production build                              |
| `npm run start`  | Run production build                          |
| `npm run lint`   | Run ESLint                                    |
| `npx tsc --noEmit` | Type-check only                             |

---

## Tech Stack

- **Next.js 14** (App Router, RSC where useful, TypeScript strict)
- **Zustand + persist** — client state, persisted in `localStorage`
- **Tailwind CSS** — utility styling, brand tokens (`brand-navy`, `brand-teal`)
- **shadcn/ui** — accessible component primitives
- **react-hook-form + Zod** — form state + validation
- **Sonner** — toast notifications
- **Lucide-react** — icons
- **date-fns** — date utilities
- **Leaflet** — GPS map
- **Recharts** — KPI charts

---

## Production Roadmap

This is currently a **client-side MVP** suitable for demos and sales.

### Phase 1 — Sell-Ready (current)
- ✅ All 24 modules functional
- ✅ RBAC + 24 feature flags
- ✅ White-label brand config
- ✅ Error boundaries, 404, loading states
- ✅ Mobile-responsive

### Phase 2 — Production Backend
- 🔜 Supabase / PostgreSQL backend
- 🔜 JWT auth + multi-tenant isolation
- 🔜 Real GPS / ELD telematics integration
- 🔜 Payment processor (Stripe / GCash)
- 🔜 Audit logging
- 🔜 Test coverage (Vitest + Playwright)

### Phase 3 — Self-Service White-Label
- 🔜 Customer config dashboard (logo upload, theme, features)
- 🔜 Automated multi-tenant deployment
- 🔜 Compliance forms (BIR 2316, SSS R3 for PH; IFTA for US)

---

## Repos in Lockstep

This codebase is mirrored to three repos:

- **NexLogistics** — primary (this repo)
- **SKLogistics** — `github.com/mozhdeveloper/sk-logistics-FMS`
- **MTSTrucking** — `github.com/mozhdeveloper/mts-trucking-FMS`

Changes are copied via PowerShell and pushed independently. Future work: GitHub Actions for automated mirror.

---

## License

Proprietary © NexVision Innovations. All rights reserved.
