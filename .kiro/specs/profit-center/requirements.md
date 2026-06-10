# Requirements Document

## Introduction

The Profit Center page is a per-vehicle profitability analytics dashboard within the Finance & HR section of the NexLogistics fleet management platform. It provides fleet administrators with immediate visibility into which trucks are generating profit and which are operating at a loss. The page derives all data from existing stores — trips (revenue via fare), expenses (fuel, tolls, cash advances), maintenance (service costs), helpers (helper fees), and drivers (driver pay) — requiring no new data entry. It is a purely computed, read-only analytics view that aggregates costs against revenue on a per-vehicle basis, with time period filtering, KPI summaries, and visual charts for trend analysis.

## Glossary

- **Profit_Center_Dashboard**: The analytics page at `app/(app)/profit-center/page.tsx` serving as the primary interface for per-vehicle profitability analysis.
- **Fleet_Store**: The Zustand store (`useFleetStore`) providing vehicle records including plate number, brand, model, type, and status.
- **Trip_Store**: The Zustand store (`useTripStore`) providing trip records including fare (revenue), vehicleId, driverId, helperId, helperFee, driverRate, otherFees, distanceKm, and status.
- **Expense_Store**: The Zustand store (`useExpenseStore`) providing expense records including vehicleId, category (fuel, repair, toll, cash_advance, other), amount, liters, and date.
- **Maintenance_Store**: The Zustand store (`useMaintenanceStore`) providing maintenance records including vehicleId, cost, status, and completedAt.
- **Helper_Store**: The Zustand store (`useHelperStore`) providing helper records.
- **Driver_Store**: The Zustand store (`useDriverStore`) providing driver records.
- **Profitability_Engine**: The computation logic that aggregates revenue and expenses per vehicle to produce profit/loss figures.
- **Vehicle_Profit_Card**: A row or card component displaying one vehicle's revenue, total expenses, and net profit/loss.
- **KPI_Panel**: The section displaying fleet-wide profitability key performance indicators.
- **Period_Filter**: The date range filtering control allowing users to select weekly, monthly, quarterly, or custom time periods.
- **Revenue_Chart**: A chart visualization showing revenue trends over time.
- **Cost_Distribution_Chart**: A chart visualization showing the breakdown of expenses by category.
- **Profit_Trend_Chart**: A chart visualization showing profit/loss trends per vehicle or fleet-wide over time.
- **Vehicle_Detail_Drawer**: A slide-over panel showing detailed profit breakdown for a selected vehicle.
- **Export_Service**: The utility responsible for generating CSV exports of profitability data.

## Requirements

### Requirement 1: Dashboard Layout and Page Structure

**User Story:** As a fleet administrator, I want the Profit Center page to have a clear, professional SaaS layout with visual hierarchy, so that I can quickly assess fleet profitability at a glance.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a PageHeader containing a page title "Profit Center", a subtitle "Per-vehicle profitability analytics", and an actions area containing the Period_Filter and an Export button.
2. THE Profit_Center_Dashboard SHALL organize content in a vertical layout with the following order from top to bottom: KPI_Panel, Period_Filter toolbar, main analytics area containing charts and the vehicle profitability table.
3. THE Profit_Center_Dashboard SHALL use the NexLogistics brand colors (teal primary, navy text, brand-border, shadow-card) and existing Tailwind CSS design tokens such that no color value outside the defined brand token set appears in the rendered output.
4. THE Profit_Center_Dashboard SHALL apply shadcn/ui Card components with brand shadow-card elevation and rounded borders for the KPI_Panel, chart sections, and vehicle table sections.
5. WHEN the viewport width is less than 768px, THE Profit_Center_Dashboard SHALL stack all layout sections into a single column and the KPI_Panel SHALL display its cards in a 2-column grid.
6. WHILE the Profit_Center_Dashboard is computing profitability data from stores, THE Profit_Center_Dashboard SHALL display skeleton placeholders matching the dimensions of the KPI_Panel and main analytics area until computation completes.
7. THE Profit_Center_Dashboard SHALL be accessible at the route `/profit-center` within the `app/(app)/` directory structure.

### Requirement 2: Profitability Computation Engine

**User Story:** As a fleet administrator, I want the system to accurately compute per-vehicle profit and loss by aggregating revenue and all expense categories, so that I can trust the data for business decisions.

#### Acceptance Criteria

1. THE Profitability_Engine SHALL compute revenue per vehicle by summing the `fare` field of all Trip_Store records where `vehicleId` matches the vehicle and `status` is "delivered" or "completed", within the selected time period.
2. THE Profitability_Engine SHALL compute fuel cost per vehicle by summing the `amount` field of all Expense_Store records where `vehicleId` matches and `category` is "fuel", within the selected time period.
3. THE Profitability_Engine SHALL compute maintenance cost per vehicle by summing the `cost` field of all Maintenance_Store records where `vehicleId` matches and `status` is "completed" and `completedAt` falls within the selected time period, treating records with no cost value as zero.
4. THE Profitability_Engine SHALL compute helper fees per vehicle by summing the `helperFee` field of all Trip_Store records where `vehicleId` matches and `helperFee` is defined, within the selected time period.
5. THE Profitability_Engine SHALL compute driver pay per vehicle by summing the `driverRate` field of all Trip_Store records where `vehicleId` matches and `driverRate` is defined, within the selected time period.
6. THE Profitability_Engine SHALL compute other operating costs per vehicle by summing the `amount` field of all Expense_Store records where `vehicleId` matches and `category` is "toll", "cash_advance", or "other", plus the sum of all `otherFees[].amount` values from Trip_Store records where `vehicleId` matches, within the selected time period.
7. THE Profitability_Engine SHALL compute total expenses per vehicle as the sum of fuel cost, maintenance cost, helper fees, driver pay, and other operating costs.
8. THE Profitability_Engine SHALL compute net profit per vehicle as revenue minus total expenses, where a positive value indicates profit and a negative value indicates loss.
9. THE Profitability_Engine SHALL compute profit margin percentage per vehicle as (net profit divided by revenue) multiplied by 100, rounded to one decimal place.
10. IF a vehicle has zero revenue within the selected time period, THEN THE Profitability_Engine SHALL display the profit margin as "N/A" instead of computing a division by zero.
11. THE Profitability_Engine SHALL include only vehicles from the Fleet_Store with status "available", "in_trip", or "maintenance" in the profitability calculations, excluding vehicles with status "inactive" unless a completed trip references their vehicleId within the period.

### Requirement 3: Fleet-Wide KPI Panel

**User Story:** As a fleet administrator, I want to see fleet-wide profitability KPIs at the top of the page, so that I can immediately understand overall financial health.

#### Acceptance Criteria

1. THE KPI_Panel SHALL display five metric cards: Total Fleet Revenue, Total Fleet Expenses, Net Fleet Profit, Fleet Profit Margin (percentage), and Vehicle Count (active vehicles with at least one trip in the period).
2. THE KPI_Panel SHALL compute Total Fleet Revenue by summing revenue across all vehicles computed by the Profitability_Engine within the selected time period.
3. THE KPI_Panel SHALL compute Total Fleet Expenses by summing total expenses across all vehicles computed by the Profitability_Engine within the selected time period.
4. THE KPI_Panel SHALL compute Net Fleet Profit as Total Fleet Revenue minus Total Fleet Expenses.
5. THE KPI_Panel SHALL compute Fleet Profit Margin as (Net Fleet Profit divided by Total Fleet Revenue) multiplied by 100, rounded to one decimal place.
6. IF Total Fleet Revenue is zero, THEN THE KPI_Panel SHALL display the Fleet Profit Margin as "N/A".
7. THE KPI_Panel SHALL format all monetary values using PHP peso currency format (₱ symbol, en-PH locale, two decimal places) via the existing `formatCurrency` utility.
8. THE KPI_Panel SHALL render in a responsive grid: 2 columns on viewports below 768px, 3 columns on viewports between 768px and 1024px, and 5 columns on viewports 1024px and above.
9. WHEN the Net Fleet Profit is positive, THE KPI_Panel SHALL display the Net Fleet Profit card value in green; WHEN negative, THE KPI_Panel SHALL display it in red.
10. THE KPI_Panel SHALL display a comparison indicator on each monetary KPI card showing percentage change relative to the previous equivalent time period (e.g., previous month when current month is selected), with an upward arrow for increase and a downward arrow for decrease.

### Requirement 4: Time Period Filtering

**User Story:** As a fleet administrator, I want to filter profitability data by time period, so that I can analyze performance across different timeframes.

#### Acceptance Criteria

1. THE Period_Filter SHALL provide preset period options: "This Week", "This Month", "This Quarter", and "Custom Range".
2. THE Period_Filter SHALL default to "This Month" on initial page load.
3. WHEN "Custom Range" is selected, THE Period_Filter SHALL display a date range picker allowing the user to specify a start date and end date.
4. WHEN a period is selected, THE Profit_Center_Dashboard SHALL recompute all KPIs, charts, and the vehicle profitability table using only records whose dates fall within the selected period.
5. THE Period_Filter SHALL determine record inclusion by comparing: trip `createdAt` for revenue, expense `date` for expenses, and maintenance `completedAt` for maintenance costs.
6. IF no records exist within the selected time period, THEN THE Profit_Center_Dashboard SHALL display all KPI values as ₱0.00, all charts as empty states with a "No data for selected period" message, and the vehicle table with zero rows showing an empty state illustration.
7. THE Period_Filter SHALL display the currently selected period as readable text (e.g., "Jun 1 – Jun 30, 2025") next to the filter control.

### Requirement 5: Per-Vehicle Profitability Table

**User Story:** As a fleet administrator, I want to see a sortable table of all vehicles with their profit/loss breakdown, so that I can quickly identify which trucks are making money and which are losing money.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a table with columns: Vehicle (plate number and type), Revenue, Fuel Cost, Maintenance, Driver Pay, Helper Fees, Other Costs, Total Expenses, Net Profit/Loss, and Margin (%).
2. WHEN a column header is clicked, THE table SHALL sort records by that column in ascending order; clicking the same column header again SHALL reverse to descending order.
3. THE table SHALL default to sorting by Net Profit/Loss in descending order (most profitable vehicles first).
4. THE table SHALL display the Net Profit/Loss value in green text with a positive prefix (+) when profitable, and in red text with a negative prefix (−) when operating at a loss.
5. THE table SHALL display the Margin column with a color-coded Badge: green for margins above 20%, amber for margins between 0% and 20%, and red for negative margins.
6. THE table SHALL provide a text search input that performs case-insensitive partial matching against the vehicle plate number, filtering results in real time.
7. WHEN a vehicle row is clicked, THE Vehicle_Detail_Drawer SHALL open displaying a detailed breakdown of that vehicle's profitability.
8. THE table SHALL paginate records with a default page size of 10 rows and provide options for 10, 25, or 50 rows per page.
9. IF the Fleet_Store contains vehicles with no trips or expenses in the selected period, THEN THE table SHALL still display those vehicles with ₱0.00 for all monetary columns and "N/A" for the margin.
10. THE table SHALL display a summary footer row showing fleet-wide totals for Revenue, each expense category, Total Expenses, Net Profit/Loss, and overall Margin.

### Requirement 6: Vehicle Detail Drawer

**User Story:** As a fleet administrator, I want to drill into a specific vehicle's profitability details, so that I can understand exactly where costs are coming from and identify optimization opportunities.

#### Acceptance Criteria

1. WHEN a vehicle row is clicked in the profitability table, THE Vehicle_Detail_Drawer SHALL open as a slide-over drawer from the right side displaying the selected vehicle's detailed profit breakdown.
2. THE Vehicle_Detail_Drawer SHALL display a header showing the vehicle plate number, brand, model, and type from the Fleet_Store.
3. THE Vehicle_Detail_Drawer SHALL display a profit summary section showing total revenue, total expenses, and net profit/loss for the selected vehicle within the active time period, formatted in PHP peso currency.
4. THE Vehicle_Detail_Drawer SHALL display an expense breakdown section showing each cost category (fuel, maintenance, driver pay, helper fees, tolls, parking, other) as a labeled row with amount and percentage of total expenses.
5. THE Vehicle_Detail_Drawer SHALL display a list of the most recent 10 trips for the vehicle within the period, showing trip ID, date, route (pickup to dropoff address), fare, and associated costs.
6. THE Vehicle_Detail_Drawer SHALL display a fuel efficiency metric showing total fuel cost divided by total distance traveled (cost per km), where total distance is the sum of `distanceKm` from all trips for that vehicle in the period.
7. IF total distance is zero, THEN THE Vehicle_Detail_Drawer SHALL display the fuel efficiency metric as "N/A".
8. WHEN the close button is clicked or the Escape key is pressed, THE Vehicle_Detail_Drawer SHALL close and return focus to the vehicle row that triggered the drawer.

### Requirement 7: Revenue vs Expenses Chart

**User Story:** As a fleet administrator, I want to see revenue vs expenses over time in a chart, so that I can identify trends and seasonal patterns in fleet profitability.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a line chart or bar chart showing fleet-wide revenue and total expenses over time within the selected period.
2. THE Revenue_Chart SHALL aggregate data points by week when the period is "This Month" or shorter, and by month when the period is "This Quarter" or a custom range exceeding 31 days.
3. THE Revenue_Chart SHALL display revenue as one data series (teal color) and total expenses as a second data series (red/coral color), both on the same Y-axis scaled to PHP peso values.
4. THE Revenue_Chart SHALL display the Y-axis formatted with the ₱ symbol and abbreviated values (e.g., "₱50K", "₱1.2M") for readability.
5. THE Revenue_Chart SHALL display a tooltip on hover showing the exact revenue amount, expense amount, and net profit/loss for the hovered data point, formatted in full PHP peso currency.
6. THE Revenue_Chart SHALL use the existing recharts library with ResponsiveContainer for responsive sizing.
7. IF fewer than 2 data points exist for the selected period, THEN THE Revenue_Chart SHALL display a message "Not enough data to show trends" instead of rendering a chart.

### Requirement 8: Cost Distribution Chart

**User Story:** As a fleet administrator, I want to see how operating costs are distributed across expense categories, so that I can identify which cost areas are consuming the most resources.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a donut or pie chart showing the fleet-wide distribution of expenses by category within the selected time period.
2. THE Cost_Distribution_Chart SHALL display the following categories as separate segments: Fuel, Maintenance, Driver Pay, Helper Fees, Tolls, and Other.
3. THE Cost_Distribution_Chart SHALL display each segment with a distinct color and a legend showing category name, total amount (formatted in ₱), and percentage of total expenses.
4. THE Cost_Distribution_Chart SHALL display the total expenses amount in the center of the donut chart.
5. THE Cost_Distribution_Chart SHALL display a tooltip on hover showing the category name, exact amount, and percentage.
6. IF all expense categories have zero values within the selected period, THEN THE Cost_Distribution_Chart SHALL display an empty state message instead of rendering an empty chart.

### Requirement 9: Profit Trend Chart

**User Story:** As a fleet administrator, I want to see the profit trend over time, so that I can understand whether fleet profitability is improving or declining.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display an area chart or bar chart showing net fleet profit over time within the selected period.
2. THE Profit_Trend_Chart SHALL aggregate data points by the same granularity as the Revenue_Chart (weekly for periods of 31 days or fewer, monthly for longer periods).
3. THE Profit_Trend_Chart SHALL color profit-positive data points or areas in green and profit-negative data points or areas in red.
4. THE Profit_Trend_Chart SHALL display a horizontal reference line at ₱0 to visually distinguish profit from loss.
5. THE Profit_Trend_Chart SHALL display a tooltip on hover showing the date range of the data point and the exact net profit/loss value formatted in PHP peso currency.
6. IF fewer than 2 data points exist for the selected period, THEN THE Profit_Trend_Chart SHALL display a message "Not enough data to show trends" instead of rendering a chart.

### Requirement 10: Top and Bottom Performers

**User Story:** As a fleet administrator, I want to quickly see which vehicles are the most and least profitable, so that I can take action on underperforming assets.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a "Top Performers" section showing the 5 vehicles with the highest net profit within the selected period, displaying vehicle plate, net profit amount (formatted in ₱), and profit margin percentage.
2. THE Profit_Center_Dashboard SHALL display a "Bottom Performers" section showing the 5 vehicles with the lowest net profit (or highest loss) within the selected period, displaying vehicle plate, net loss amount (formatted in ₱), and margin percentage.
3. THE "Top Performers" section SHALL display profit values in green and the "Bottom Performers" section SHALL display loss values in red.
4. WHEN a vehicle entry in either performer section is clicked, THE Vehicle_Detail_Drawer SHALL open for that vehicle.
5. IF fewer than 5 vehicles have data within the selected period, THEN each performer section SHALL display only the available vehicles.
6. IF no vehicles have any trips in the selected period, THEN both performer sections SHALL display an empty state message "No vehicle data for this period".

### Requirement 11: Fuel Consumption Analytics

**User Story:** As a fleet administrator, I want to see fuel consumption relative to trips and distance for each vehicle, so that I can identify fuel-inefficient trucks and optimize fuel spending.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL display a fuel efficiency section showing per-vehicle fuel metrics within the selected period.
2. THE fuel efficiency section SHALL compute cost per kilometer for each vehicle as total fuel expense divided by total trip distance (sum of `distanceKm` from Trip_Store records where `vehicleId` matches and trip falls within the period).
3. THE fuel efficiency section SHALL compute liters per trip for each vehicle as total fuel liters (sum of `liters` field from Expense_Store fuel records where `vehicleId` matches) divided by trip count (number of Trip_Store records where `vehicleId` matches within the period).
4. THE fuel efficiency section SHALL display a horizontal bar chart ranking vehicles by cost per kilometer from highest to lowest, using red for vehicles exceeding the fleet average and green for vehicles below the fleet average.
5. IF a vehicle has zero trip distance within the period, THEN THE fuel efficiency section SHALL display "N/A" for cost per kilometer for that vehicle.
6. IF a vehicle has no fuel expense records with a `liters` value, THEN THE fuel efficiency section SHALL display "N/A" for liters per trip for that vehicle.
7. THE fuel efficiency section SHALL display the fleet-wide average cost per kilometer as a reference line on the bar chart.

### Requirement 12: Export Functionality

**User Story:** As a fleet administrator, I want to export the profitability report as CSV, so that I can share the data with stakeholders or perform further analysis in spreadsheets.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL provide an "Export" button in the header actions area.
2. WHEN the Export button is clicked and the current period yields one or more vehicles with data, THE Export_Service SHALL generate a CSV file containing one row per vehicle with columns: Vehicle Plate, Vehicle Type, Revenue, Fuel Cost, Maintenance Cost, Driver Pay, Helper Fees, Other Costs, Total Expenses, Net Profit/Loss, Margin (%).
3. THE Export_Service SHALL include a summary row at the bottom with fleet-wide totals.
4. THE Export_Service SHALL name exported files using the pattern `profit-center-{YYYY-MM-DD}.csv`.
5. WHEN an export completes successfully, THE Profit_Center_Dashboard SHALL trigger a browser download and display a success toast notification for 5 seconds.
6. IF no vehicles have data within the selected period, THEN THE Profit_Center_Dashboard SHALL display an informational toast message "No data to export for the selected period" and SHALL NOT generate a file.

### Requirement 13: Responsive Design and Mobile Layout

**User Story:** As a fleet administrator accessing the system from a tablet, I want the Profit Center page to be fully usable on smaller viewports, so that I can check profitability data on the go.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL render all content as accessible and operable at viewport widths from 320px to 2560px without horizontal scrolling or loss of functionality.
2. WHILE the viewport width is below 768px, THE profitability table SHALL transform into a card-based list layout displaying one vehicle per card with plate number, revenue, total expenses, and net profit/loss visible per card.
3. WHILE the viewport width is below 768px, THE chart sections SHALL stack vertically and each chart SHALL occupy the full available width.
4. WHILE the viewport width is below 768px, THE Vehicle_Detail_Drawer SHALL render as a full-screen sheet instead of a side drawer.
5. WHILE the viewport width is below 768px, THE Profit_Center_Dashboard SHALL ensure all interactive elements have a minimum touch target size of 44x44 CSS pixels.
6. WHILE the viewport width is 1024px or above, THE charts SHALL render in a 2-column grid layout (Revenue vs Expenses chart alongside Cost Distribution chart).

### Requirement 14: Component Architecture and Design Consistency

**User Story:** As a developer, I want the Profit Center page to use reusable components from the NexLogistics design system and follow established patterns, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL use shadcn/ui components (Card, Badge, Button, Select, Sheet, Tabs, Tooltip) from the existing `components/ui/` directory as the foundation for all UI elements.
2. THE Profit_Center_Dashboard SHALL organize page-specific components in a `components/profit-center/` directory, where each file contains a single exported component responsible for one UI concern.
3. THE Profit_Center_Dashboard SHALL use the existing PageHeader component from `components/layout/PageHeader.tsx` for the page header.
4. THE Profit_Center_Dashboard SHALL use the existing `formatCurrency` utility from `@/lib/utils` for all PHP peso formatting.
5. THE Profit_Center_Dashboard SHALL use the existing recharts library for all chart visualizations without introducing new charting dependencies.
6. THE Profit_Center_Dashboard SHALL manage all local UI state (selected period, active tab, drawer open state, sort direction) using React useState or useReducer hooks and SHALL NOT create a new Zustand store for page-only UI state.
7. THE Profit_Center_Dashboard SHALL NOT introduce new external dependencies beyond what is already in the project's package.json.
8. THE Profit_Center_Dashboard SHALL use `useMemo` to cache profitability computations and recompute only when the underlying store data or selected time period changes.

### Requirement 15: Accessibility

**User Story:** As a user relying on assistive technologies, I want the Profit Center page to be fully accessible, so that I can access profitability analytics regardless of ability.

#### Acceptance Criteria

1. THE Profit_Center_Dashboard SHALL ensure all interactive elements are reachable and operable using keyboard navigation alone (Tab, Enter, Escape, Arrow keys) in a logical reading order.
2. THE profitability table SHALL use semantic HTML table elements (table, thead, tbody, tr, th, td) with scope attributes on column headers.
3. THE Profit_Center_Dashboard SHALL provide aria-label attributes for all icon-only buttons and non-text interactive elements.
4. THE chart visualizations SHALL provide a visually hidden text description summarizing the data trend for screen readers.
5. THE Profit_Center_Dashboard SHALL not use color as the sole means of conveying profit/loss status; all color-coded indicators SHALL include visible text labels (e.g., "+₱50,000" or "−₱12,000") or icons that communicate status independently of color.
6. WHEN the Vehicle_Detail_Drawer is open, THE Vehicle_Detail_Drawer SHALL trap focus within the drawer and return focus to the triggering element on close.
7. THE KPI_Panel cards SHALL include aria-label attributes describing the metric name and current value for screen readers.
8. THE Period_Filter controls SHALL be labeled with aria-label or associated label elements for screen reader identification.
