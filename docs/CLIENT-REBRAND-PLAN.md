# Client Rebrand & Clone Plan
## NexLogistics → SK Logistics & MTS Trucking Incorporated

> **Goal:** Create two production-ready, fully-branded white-label clones of the NexLogistics platform — one for **SK Logistics Services** and one for **MTS Trucking Incorporated** — to be sold as separate SaaS deployments to each client.

> **Source:** `C:\Users\jcuad\OneDrive\Documents\NexLogistics`
> **Target 1:** `C:\Users\jcuad\OneDrive\Documents\SKLogistics`
> **Target 2:** `C:\Users\jcuad\OneDrive\Documents\MTSTrucking`

---

## 1. Strategy Overview

We are NOT creating a multi-tenant fork. Each client gets:
- An **independent codebase** (separate folder, separate Git repo, separate Vercel project).
- A **fully rebranded UI** (colors, typography, logo, copy, demo data).
- The **same MVP feature set** as NexLogistics (trips, fleet, dispatch, GPS, payroll, partners, billing, reports, client portal, driver portal).
- Their **own seeded demo data** (company name, fleet IDs, sample clients).

This approach lets each client own their fork, request custom features without affecting the other, and lets us upsell separately.

---

## 2. Phase 1 — Mechanical Clone (Both Projects)

For **each** target (SKLogistics, MTSTrucking), do the following:

### 2.1 Copy the source

```powershell
# SK Logistics
Copy-Item -Path "C:\Users\jcuad\OneDrive\Documents\NexLogistics" `
          -Destination "C:\Users\jcuad\OneDrive\Documents\SKLogistics" `
          -Recurse -Exclude @("node_modules",".next",".git","tsconfig.tsbuildinfo")

# MTS Trucking
Copy-Item -Path "C:\Users\jcuad\OneDrive\Documents\NexLogistics" `
          -Destination "C:\Users\jcuad\OneDrive\Documents\MTSTrucking" `
          -Recurse -Exclude @("node_modules",".next",".git","tsconfig.tsbuildinfo")
```

### 2.2 Initialize fresh Git repo in each clone

```powershell
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"
git init
git add -A
git commit -m "chore: initial fork from NexLogistics platform"

cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"
git init
git add -A
git commit -m "chore: initial fork from NexLogistics platform"
```

### 2.3 Install dependencies in each

```powershell
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"; npm install
cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"; npm install
```

---

## 3. Phase 2 — Identity Refactor

Both projects need the following replaced everywhere. Use **VS Code Find & Replace across files** (`Ctrl+Shift+H`), respect case.

### 3.1 Global text replacements

| Find (NexLogistics) | SK Logistics replacement | MTS Trucking replacement |
|---|---|---|
| `NexLogistics` | `SKLogistics` | `MTSTrucking` |
| `NexVision Innovations` | `SK Logistics Services` | `MTS Trucking Incorporated` |
| `NexVision` | `SK Logistics` | `MTS Trucking` |
| `nexlogistics.demo` | `sklogistics.demo` | `mtstrucking.demo` |
| `NEX-101` … `NEX-110` | `SKL-101` … `SKL-110` | `MTS-101` … `MTS-110` |
| `nex-` (localStorage keys) | `skl-` | `mts-` |

### 3.2 Files that need direct edits

- [`package.json`](package.json) → `"name"` field
- [`app/layout.tsx`](app/layout.tsx) → `metadata.title`, `metadata.description`, `nex-ui` localStorage key
- [`app/(auth)/login/page.tsx`](app/%28auth%29/login/page.tsx) → all demo emails, logo letter (N → S / M)
- [`lib/store/index.ts`](lib/store/index.ts) → `resetAllDemoData()` localStorage key list (`nex-*` → `skl-*` / `mts-*`)
- All `persist({ name: "nex-..." })` blocks across `lib/store/*.ts`
- [`projectmvp.md`](projectmvp.md) — keep as feature reference, append client name to title

### 3.3 Search-and-replace verification command

After bulk replace, run this to make sure no stale `nex` references remain:

```powershell
Select-String -Path .\app\**\*.tsx,.\lib\**\*.ts,.\components\**\*.tsx -Pattern "nex|Nex|NEX" -CaseSensitive
```

---

## 4. Phase 3 — Visual Rebrand

### 4.1 SK Logistics Branding

**Source:** [sklogisticsbranding.md](sklogisticsbranding.md)

**Color tokens** — replace the `brand:` block in [`tailwind.config.ts`](tailwind.config.ts):

```ts
brand: {
  red:        "#D31A21",  // Velocity Red — primary CTA
  "red-dark": "#A8141A",
  "red-light":"#FBE5E6",
  burgundy:   "#6A0B0B",  // Engine Burgundy — footer/secondary
  white:      "#FFFFFF",
  offwhite:   "#F8F9FA",  // Glacial Gray — alternating sections
  charcoal:   "#212529",  // Text
  border:     "#DEE2E6",
  // Aliases for backward compat with shared components
  teal:       "#D31A21",
  "teal-dark":"#A8141A",
  "teal-light":"#FBE5E6",
  navy:       "#212529",
  "navy-light":"#3A3F44",
  bg:         "#F8F9FA",
  gray:       "#212529",
},
```

**Add gradient utility:**
```ts
backgroundImage: {
  "brand-gradient": "linear-gradient(to right, #D31A21, #6A0B0B)",
},
```

**Fonts** — `app/layout.tsx`:
- Headings: **Montserrat** (Black/Bold Italic)
- Body: **Roboto**

**UI rules:**
- Primary buttons → `bg-brand-gradient` with uppercase Montserrat Bold
- Footer → solid `bg-brand-burgundy text-white`
- Sticky navbar → white background + bottom shadow
- Layout → alternating white / `bg-brand-offwhite` sections

### 4.2 MTS Trucking Branding

**Source:** [mtstruckingbranding.md](mtstruckingbranding.md)

**Color tokens** — replace the `brand:` block in [`tailwind.config.ts`](tailwind.config.ts):

```ts
brand: {
  black:    "#111111",  // Industrial Black — primary headings/bg
  red:      "#E3000F",  // Chevron Red — CTAs, accents
  "red-dark":"#B80009",
  "red-light":"#FCE5E7",
  charcoal: "#4A4A4A",  // Secondary buttons, dark borders
  steel:    "#7A7A7A",  // Muted text, inactive
  ash:      "#F4F4F5",  // Alt section backgrounds
  white:    "#FFFFFF",
  // Aliases for backward compat with shared components
  teal:     "#E3000F",
  "teal-dark":"#B80009",
  "teal-light":"#FCE5E7",
  navy:     "#111111",
  "navy-light":"#1F1F1F",
  bg:       "#F4F4F5",
  gray:     "#4A4A4A",
  border:   "#E5E7EB",
},
```

**Add industrial shadow utility:**
```ts
boxShadow: {
  industrial: "4px 4px 0px 0px rgba(17,17,17,1)",
  // keep existing card/card-hover/glow
},
```

**Fonts** — `app/layout.tsx`:
- Headings: **Montserrat** (Bold/Black, often UPPERCASE)
- Body: **Inter** (already used in NexLogistics — keep)

**UI rules:**
- Buttons → solid `bg-brand-red text-white` with `rounded-none` or `rounded-sm` (max 2px)
- Featured cards → `shadow-industrial` (hard-edged offset, not soft blur)
- Section dividers → diagonal/chevron pattern accents
- Hero typography → UPPERCASE Montserrat Black for impact

### 4.3 Logo / wordmark replacement

The login page renders an inline logo. Replace it per brand:

- **SK Logistics:** `S` letter on red gradient tile + wordmark `SK LOGISTICS` (Montserrat Black Italic, red gradient text), tagline `SERVICES`
- **MTS Trucking:** Three chevrons `>>>` (charcoal, steel, red) + wordmark `MTS` (Montserrat Black, uppercase), tagline `INCORPORATED`

A simple SVG/CSS logo per client lives at `components/Brand/Logo.tsx` — refactor the existing inline JSX in [`app/(auth)/login/page.tsx`](app/%28auth%29/login/page.tsx) into this shared component first, then swap per client.

### 4.4 Favicon / OG image
- Generate a 32×32 favicon and 1200×630 OG image per client and place in `public/`.
- Update `app/layout.tsx` `metadata.icons` and `metadata.openGraph`.

---

## 5. Phase 4 — Demo Data Reseed

Each client should boot with **their own** demo data so investors/clients see their company name, not Nex's.

### Files to edit
- [`lib/data/clients.ts`](lib/data/clients.ts) — sample customer accounts
- [`lib/data/drivers.ts`](lib/data/drivers.ts) — driver names (keep PH-style)
- [`lib/data/vehicles.ts`](lib/data/vehicles.ts) — fleet IDs (`SKL-101…` or `MTS-101…`), realistic plates
- [`lib/data/trips.ts`](lib/data/trips.ts) — sample trips referencing client fleet IDs
- [`lib/data/partners.ts`](lib/data/partners.ts) — keep PH partner names (universal)
- [`lib/data/payroll-config.ts`](lib/data/payroll-config.ts) — adjust company-tagged copy if any
- `lib/store/auth.ts` (if it hardcodes org name) — update display name

### Per-client tweaks

| Item | SK Logistics | MTS Trucking |
|---|---|---|
| Demo emails | `*@sklogistics.demo` | `*@mtstrucking.demo` |
| Fleet IDs | `SKL-101` … `SKL-110` | `MTS-101` … `MTS-110` |
| Sample clients | Real PH SMEs (SM Supermalls, Jollibee, etc.) | Real PH manufacturers (San Miguel, URC, etc.) |
| Default city | Manila | Cebu / Davao (per their HQ) |

---

## 6. Phase 5 — Page-Level Copy Audit

Walk through every page and update any hard-coded "NexVision" / "NexLogistics" copy:

- [ ] `app/page.tsx` (landing/dashboard hero)
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(app)/layout.tsx` (sidebar header)
- [ ] `components/layout/Sidebar.tsx`
- [ ] `components/layout/PageHeader.tsx`
- [ ] All footer components
- [ ] All email templates / printed receipts (POD, invoices, payslips)
- [ ] Any seed `notes` fields that mention "Nex"

---

## 7. Phase 6 — Build, Test, Deploy

### 7.1 Build verification (per project)
```powershell
npm run build
```
Must produce: 50+ routes, 0 TypeScript errors, 0 ESLint errors.

### 7.2 Dev smoke test
```powershell
npm run dev
```
Visual checklist:
- [ ] Login page shows new logo + colors
- [ ] Sidebar shows new brand name
- [ ] Buttons use new primary color
- [ ] Page header gradient/accent matches brand
- [ ] Demo login works for all 5 roles
- [ ] Trips list, payroll wizard, partners, recurring invoices all render
- [ ] CSV export filename uses new brand prefix
- [ ] Browser tab title + favicon updated

### 7.3 Deploy
- Create a new GitHub repo per client (`sk-logistics-platform`, `mts-trucking-platform`).
- Connect to a separate Vercel project each.
- Set domains:
  - SK Logistics → `app.sklogistics.ph` (placeholder)
  - MTS Trucking → `app.mtstrucking.ph` (placeholder)

---

## 8. Phase 7 — Sales-Ready Polish

For each client, prepare a short demo script + sample data so the platform feels lived-in:

- 30+ historical trips (mix of completed, in-transit, scheduled)
- 5–10 invoices (paid, unpaid, overdue)
- 1 closed payroll period + 1 active draft period
- 2–3 recurring invoices
- A few subcon partner trips with pending payouts

---

## 9. Recommended Workflow & Sequencing

Do **SK Logistics first**, end-to-end, including deploy. Use what you learn (gotchas in Tailwind tokens, missed text strings, etc.) to make MTS Trucking faster.

Estimated effort breakdown:
1. Mechanical clone + git init: small
2. Identity refactor (text replace + verify): small
3. Tailwind palette + font swap: medium
4. Logo component + login page redesign: medium
5. Demo data reseed: medium
6. Page copy audit: small
7. Build + smoke test + Vercel deploy: small

---

## 10. Optional — Shared "Platform Core" Path (Future)

If maintaining two forks becomes painful, we can later extract NexLogistics into a private npm package (`@platform/core`) that both clients import, with brand tokens injected via CSS variables. **Do not do this for the initial sale** — keep things shippable.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Missed `nex-*` localStorage key → user data collision in browser | Run `Select-String` regex audit (Section 3.3) before deploy |
| Brand color contrast fails WCAG AA (esp. MTS pure black/red) | Test with Chrome DevTools accessibility tab; bump contrast where needed |
| Hard-coded "NexVision" copy in print/email templates | Grep all `*.tsx` after rebrand; check POD/invoice/payslip components specifically |
| Diverging features between forks → maintenance burden | Track shared improvements in this directory's `payrollchanges.md`-style log per project; cherry-pick |
| MTS uppercase headings break long Filipino names/addresses | Keep table cells in normal case; only apply UPPERCASE to hero titles |

---

## 12. Sign-off Checklist (per client)

- [ ] All `Nex*` strings removed
- [ ] All `nex-*` localStorage keys renamed
- [ ] Tailwind palette swapped + alias tokens preserved
- [ ] Fonts loaded per brand spec
- [ ] Logo component rendered in login + sidebar
- [ ] Favicon + OG image set
- [ ] Demo data reseeded with client-themed company/fleet
- [ ] `npm run build` clean
- [ ] `npm run dev` visual QA passed across all 50 routes
- [ ] New Git repo + Vercel project deployed
- [ ] Demo accounts shared with client

---

**Owner:** Jcuad
**Source platform version:** post-commit `fe4e22b` (May 13, 2026 — payroll + partners + recurring redesign)
**Target delivery:** SK Logistics first, MTS Trucking second
