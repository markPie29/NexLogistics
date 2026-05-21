# Platform Feature Flag System — Implementation Plan

## Overview

This document describes the **platform-level feature toggle architecture** for the FMS platform. It is intended for **internal use only** — not visible to clients.

The goal: as a platform seller, we can selectively show or hide any module before handing off a demo or deploying for a specific client. Each client may not need (or may not have paid for) every feature.

---

## User Hierarchy

| Level | Role | Access |
|-------|------|--------|
| **Platform Owner** (us) | `super_admin` + `isPlatformOwner: true` | Full access + Feature Flag Manager at `/platform-admin` |
| **Super Admin** (client's admin) | `super_admin` | All **enabled** features — cannot see feature flag controls |
| **Company Admin** | `company_admin` | All enabled features within their role |
| **Dispatcher / Accounting / Driver / Client** | other roles | Their role's enabled features only |

---

## How It Works

### Feature Store (`lib/store/features.ts`)
- Zustand store persisted under key `nex-feature-flags` in localStorage
- 24 feature keys, each a `boolean` (default: `true` = enabled)
- Exposes: `isEnabled(key)`, `toggle(key)`, `setFlag(key, value)`, `enableAll()`, `resetAll()`

### Sidebar Filtering (`components/layout/Sidebar.tsx`)
- Every nav item now has an optional `featureKey` property
- Sidebar filters: `items.filter(item => !item.featureKey || isEnabled(item.featureKey))`
- Platform Owner bypasses all filters — always sees every nav item

### Platform Admin Page (`app/(app)/platform-admin`)
- **Not linked in any sidebar or nav menu**
- Accessible only by navigating directly to `/platform-admin`
- Guarded: redirects to `/dashboard` if `user.isPlatformOwner !== true`
- Shows all 24 features grouped by category as toggle cards
- Changes take effect immediately (no save button — reactive store)

### Platform Owner Account
- Email: `platform@nex.internal`
- Password: `NexPlatform@2025!`
- Role: `super_admin` + `isPlatformOwner: true`
- **Never show this account in demo login screens or client docs**

---

## Feature Keys Reference

### Operations (10 features)
| Key | Label | What It Controls |
|-----|-------|-----------------|
| `fleet_management` | Fleet Management | Vehicle list, detail, add/edit |
| `driver_management` | Driver Management | Driver CRUD, detail, payroll profiles |
| `helper_management` | Helper Management | Loader/assistant CRUD |
| `trip_dispatch` | Trip & Dispatch | Trips list, Kanban board, new trip wizard |
| `trip_approvals` | Trip Rate Approvals | Rate approval queue (Super Admin only) |
| `subcon_partners` | Subcon Partners | Subcontractor CRUD + resource requests |
| `gps_tracking` | Live GPS Tracking | Real-time map |
| `pms_maintenance` | PMS / Maintenance | Maintenance scheduling |
| `proof_of_delivery` | Proof of Delivery | POD capture + admin list |
| `dispatch_center` | Dispatch Center | Dispatcher-role panel |

### Finance & HR (6 features)
| Key | Label | What It Controls |
|-----|-------|-----------------|
| `fuel_expenses` | Fuel & Expenses | Expense log with charts |
| `payroll` | Payroll | Full Philippine payroll module |
| `attendance` | Attendance | Driver attendance calendar |
| `billing_invoices` | Billing & Invoices | AR invoices, payments, credit notes, recurring |
| `accounting_overview` | Finance Overview | Accounting-role landing page |
| `department_calendar` | Department Calendar | Multi-dept calendar |

### Sales & Customer (2 features)
| Key | Label | What It Controls |
|-----|-------|-----------------|
| `client_management` | Client Management | Client CRUD |
| `client_portal` | Client Portal | Client-facing portal |

### Reports & Analytics (2 features)
| Key | Label | What It Controls |
|-----|-------|-----------------|
| `reports_analytics` | Reports & Analytics | 10 report types + CSV export |
| `ai_insights` | AI Insights | Predictive insights dashboard |

### Admin (4 features)
| Key | Label | What It Controls |
|-----|-------|-----------------|
| `documents` | Documents | Document management |
| `company_management` | Company Management | Company overview, users, branches |
| `warehouse` | Warehouse | Warehouse module (preview) |
| `route_optimization` | Route Optimization | Route planning (preview) |

---

## Usage Guide

### Before a Client Demo
1. Log in as Platform Owner: `platform@nex.internal` / `NexPlatform@2025!`
2. Navigate to `/platform-admin`
3. Disable any features the client's package doesn't include
4. Log out, then log in as `super_admin` to preview what the client sees
5. The client sees a clean sidebar with only their features visible

### Packaging Tiers (Example)
| Tier | Suggested Features |
|------|-------------------|
| **Starter** | fleet, drivers, trips, GPS, POD |
| **Standard** | + payroll, expenses, billing, reports |
| **Full** | All features enabled |
| **Custom** | Configure per client on `/platform-admin` |

### Resetting
- On the `/platform-admin` page, click **Reset** to re-enable all features
- Or clear `nex-feature-flags` from browser localStorage → DevTools → Application → Storage

---

## Current Project Audit Summary

### ✅ Complete & MVP-Ready (45 pages, 6 roles, 17 stores)

| Area | Status |
|------|--------|
| Fleet Management | ✅ Full CRUD, detail, history |
| Driver Management | ✅ Full CRUD, detail, edit/delete, mobile responsive |
| Helper Management | ✅ Full CRUD |
| Trip & Dispatch | ✅ List + Kanban + wizard |
| GPS Tracking | ✅ Simulated (no real device) |
| Proof of Delivery | ✅ Photo + signature (forwardRef fixed) |
| PMS / Maintenance | ✅ Scheduling + mark-complete |
| Billing & Invoices | ✅ 7 sub-pages fully functional |
| Philippine Payroll | ✅ Gov deductions, trip rates, periods |
| Partner Requests | ✅ Diesel / cash advance workflow |
| Client Portal | ✅ 6 sub-pages |
| Reports | ✅ 10 types + CSV |
| Feature Flag System | ✅ Implemented (this plan) |

### ⚠️ Demo/Partial
| Area | Notes |
|------|-------|
| GPS | Simulated pings — no real ELD/telematics API |
| AI Insights | Seeded data, "Coming soon" banner |
| Company Admin | Hardcoded demo users/branches |
| Attendance | Derived from driver data, no real clock-in/out |
| Settings | Profile save is a demo toast |

### 🔜 Future (Post-MVP)
- Real ELD / telematics integration
- HOS compliance tracking
- Client booking / trip request portal
- PWA / native driver mobile app
- Government compliance forms (SSS R3, BIR 2316)
- Vehicle document expiry alerts dashboard
- Vendor / supplier management
- IFTA fuel tax reporting

---

*Last updated: May 2026 — NexLogistics Platform*
