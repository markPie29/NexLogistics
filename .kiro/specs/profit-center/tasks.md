# Implementation Plan: Profit Center

## Overview

Implement a read-only per-vehicle profitability analytics dashboard at `/profit-center`. The page derives all data from existing Zustand stores (fleet, trips, expenses, maintenance) using pure computation functions memoized with `useMemo`. No new stores, no new dependencies.

## Tasks

- [ ] 1. Create types and computation layer
  - [ ] 1.1 Create local types file at `lib/profit-center/types.ts`
    - Define PeriodPreset, DateRange, VehicleProfitability, FleetKPIs, ChartDataPoint, CostCategory, SortColumn, SortDirection interfaces
    - _Requirements: 2.1–2.11, 3.1–3.10, 14.1–14.8_

  - [ ] 1.2 Implement pure computation functions at `lib/profit-center/computations.ts`
    - Implement `resolveDateRange`, `getPreviousPeriod`, `getAggregationGranularity`
    - Implement `computeVehicleProfitability` — per-vehicle P&L aggregation
    - Implement `computeFleetKPIs` — fleet-wide totals with period-over-period deltas
    - Implement `computeChartData` — time-series bucketing (weekly/monthly)
    - Implement `computeCostDistribution` — expense category breakdown
    - Implement sort, search, pagination helpers
    - _Requirements: 2.1–2.11, 3.1–3.10, 4.1–4.7, 7.2, 9.2_

  - [ ] 1.3 Implement CSV export utility at `lib/profit-center/export-csv.ts`
    - Generate CSV with one row per vehicle plus summary row
    - Trigger browser download with filename `profit-center-{YYYY-MM-DD}.csv`
    - _Requirements: 12.1–12.6_

- [ ] 2. Checkpoint - Ensure computation layer is complete
  - Ensure all types compile, ask the user if questions arise.

- [ ] 3. Build UI components
  - [ ] 3.1 Create `components/profit-center/PeriodFilter.tsx`
    - Select presets (This Week, This Month, This Quarter, Custom Range)
    - Custom date range picker with start/end
    - Display currently selected period as readable text
    - _Requirements: 4.1–4.7_

  - [ ] 3.2 Create `components/profit-center/KpiPanel.tsx`
    - 5 KPI cards: Total Revenue, Total Expenses, Net Profit, Profit Margin, Active Vehicles
    - Color-coded profit/loss, period-over-period delta arrows
    - Responsive grid: 2 cols < 768px, 3 cols 768–1024, 5 cols >= 1024
    - _Requirements: 3.1–3.10, 15.7_

  - [ ] 3.3 Create `components/profit-center/ProfitTable.tsx`
    - Sortable columns, search filter, pagination (10/25/50)
    - Color-coded Net Profit (green/red), Margin badges (green/amber/red)
    - Summary footer row with fleet totals
    - Row click triggers vehicle detail drawer
    - Mobile card layout below 768px
    - _Requirements: 5.1–5.10, 13.2, 15.1–15.3_

  - [ ] 3.4 Create `components/profit-center/VehicleDetailDrawer.tsx`
    - Sheet/drawer with vehicle header, profit summary, expense breakdown
    - Recent 10 trips list, fuel efficiency metric
    - Accessible focus trap, Escape to close
    - _Requirements: 6.1–6.8, 15.6_

  - [ ] 3.5 Create `components/profit-center/RevenueExpensesChart.tsx`
    - recharts BarChart: revenue (teal) vs expenses (coral) over time
    - Y-axis with ₱ abbreviation, tooltips with full values
    - Empty state when < 2 data points
    - _Requirements: 7.1–7.7_

  - [ ] 3.6 Create `components/profit-center/CostDistributionChart.tsx`
    - recharts PieChart (donut): expense categories with legend
    - Center label showing total expenses
    - Empty state when all zeros
    - _Requirements: 8.1–8.6_

  - [ ] 3.7 Create `components/profit-center/ProfitTrendChart.tsx`
    - recharts AreaChart: net profit over time with ₱0 reference line
    - Green for positive, red for negative
    - Empty state when < 2 data points
    - _Requirements: 9.1–9.6_

  - [ ] 3.8 Create `components/profit-center/TopBottomPerformers.tsx`
    - Top 5 most profitable and Bottom 5 least profitable vehicles
    - Green/red values, click to open detail drawer
    - Empty state when no data
    - _Requirements: 10.1–10.6_

  - [ ] 3.9 Create `components/profit-center/FuelEfficiencyChart.tsx`
    - recharts horizontal BarChart: cost/km per vehicle
    - Red above fleet average, green below
    - Fleet average reference line
    - _Requirements: 11.1–11.7_

  - [ ] 3.10 Create `components/profit-center/ExportButton.tsx`
    - Export button with CSV download, success/error toast via sonner
    - _Requirements: 12.1–12.6_

- [ ] 4. Checkpoint - Ensure all components compile
  - Ensure all components compile with zero TypeScript errors, ask the user if questions arise.

- [ ] 5. Wire page together
  - [ ] 5.1 Create main page at `app/(app)/profit-center/page.tsx`
    - Orchestrate all components with useMemo computations
    - PageHeader with title, subtitle, actions (PeriodFilter + ExportButton)
    - KpiPanel → Charts (2-col grid) → TopBottomPerformers → FuelEfficiency → ProfitTable → VehicleDetailDrawer
    - All local state via useState, memoized computations
    - _Requirements: 1.1–1.7, 13.1–13.6, 14.1–14.8, 15.1–15.8_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure the page compiles, renders at `/profit-center`, and all TypeScript errors are resolved. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests included as this is a pure UI analytics page with computation functions — unit tests can be added later
- All computation is pure and memoized — no side effects, no new stores

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["3.1", "3.5", "3.6", "3.7", "3.9", "3.10"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "3.8"] },
    { "id": 4, "tasks": ["5.1"] }
  ]
}
```
