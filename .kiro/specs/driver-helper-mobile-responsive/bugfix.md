# Bugfix Requirements Document

## Introduction

The driver user pages (driver dashboard, earnings, settings) and helper management pages (helpers list, helper detail) are not fully mobile responsive. Interactive elements have touch targets below the 44×44px accessibility minimum, layouts break on narrow/landscape viewports, momentum scrolling is missing, safe-area insets are inconsistent, and horizontal tables lack scroll indicators. These issues make the app difficult to use on phones and tablets.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Helpers List page is viewed on a mobile device THEN the page has no viewport height handling (`min-h-[100dvh]`), causing inconsistent scroll behavior and potential white-space gaps

1.2 WHEN a user taps the table action dropdown trigger on the Helpers List page on mobile THEN the touch target is only 32×32px (`w-8 h-8`), below the 44×44px minimum accessibility requirement

1.3 WHEN the "Add Helper" dialog opens on a mobile viewport THEN the form fields grid (`grid-cols-2`, `grid-cols-3`) remains multi-column and becomes cramped/unusable on narrow screens

1.4 WHEN the Helpers List KPI cards grid is viewed below 640px THEN the `grid-cols-2 md:grid-cols-4` layout can still feel cramped without proper gap adjustments for small screens

1.5 WHEN the filter row (search + status select) is viewed on narrow mobile screens THEN the `flex-col md:flex-row` layout does not give the status select a full-width treatment, making it awkwardly narrow

1.6 WHEN the Helper Detail page tabs are viewed on mobile THEN the tab bar uses `overflow-x-auto` without touch-optimized scrolling properties (`-webkit-overflow-scrolling: touch`, scroll snap, fade indicators)

1.7 WHEN tables inside Helper Detail tabs are horizontally scrolled on mobile THEN there is no visual indicator (gradient fade or scrollbar hint) that more content exists to the right

1.8 WHEN action buttons in the Helper Detail header are viewed on narrow screens THEN they don't wrap gracefully, potentially overflowing or being cut off

1.9 WHEN the Helper Detail stat cards grid is viewed on very narrow screens THEN the `grid-cols-2 md:grid-cols-4` layout needs smaller gap/padding adjustments for sub-360px viewports

1.10 WHEN the Helper Detail profile hero card is viewed on screens narrower than 360px THEN the flex layout with the 80px avatar and info grid breaks, causing text overflow

1.11 WHEN the Driver Earnings page is viewed on an iPhone with a home indicator THEN the fixed bottom nav uses no `safe-area-inset-bottom` padding, causing the nav to overlap system UI

1.12 WHEN the Driver Earnings page bottom nav is compared to the DriverNav component THEN it uses a different implementation (inline fixed nav vs. the reusable `DriverNav` component with proper safe-area handling)

1.13 WHEN the Driver Earnings hero card currency value (`text-4xl`) is viewed on screens below 360px THEN the large formatted peso amount can overflow or get truncated

1.14 WHEN the Driver Main page "View all" buttons are tapped on mobile THEN the touch target height is adequate (`min-h-[44px]`) but some quick action buttons and summary card icon containers are only 32-36px, below the minimum

1.15 WHEN any of the affected pages are scrolled on iOS devices THEN momentum scrolling is not explicitly enabled via `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain`, causing jerky scrolling and pull-to-refresh interference

1.16 WHEN horizontally scrollable tables on the Helpers List or Helper Detail pages are encountered THEN there is no visual affordance (gradient overlay, scroll indicator) to signal that horizontal scrolling is available

1.17 WHEN any of the affected pages are viewed in landscape orientation on a phone THEN content may be cut off vertically without proper min-height and scroll container handling

1.18 WHEN the Driver Main page outer container does not specify `min-h-[100dvh]` THEN the page may not fill the viewport correctly on devices with dynamic browser chrome

### Expected Behavior (Correct)

2.1 WHEN the Helpers List page is viewed on a mobile device THEN the system SHALL use `min-h-[100dvh]` on the page container to ensure proper viewport height handling

2.2 WHEN a user taps the table action dropdown trigger on the Helpers List page on mobile THEN the system SHALL provide a minimum touch target of 44×44px (`min-w-[44px] min-h-[44px]`)

2.3 WHEN the "Add Helper" dialog opens on a mobile viewport THEN the system SHALL collapse multi-column grids to single-column (`grid-cols-1`) below the `sm` breakpoint for usable form fields

2.4 WHEN the Helpers List KPI cards grid is viewed below 640px THEN the system SHALL use appropriate gap and padding that prevent content from feeling cramped on small screens

2.5 WHEN the filter row is viewed on narrow mobile screens THEN the system SHALL stack the search input and status select vertically with each taking full width

2.6 WHEN the Helper Detail page tabs are viewed on mobile THEN the system SHALL provide smooth touch-scrollable tab navigation with `-webkit-overflow-scrolling: touch`, `overscroll-behavior-x: contain`, and a visual fade indicator for overflow

2.7 WHEN tables inside Helper Detail tabs are horizontally scrolled on mobile THEN the system SHALL display a gradient fade indicator on the right edge to signal scrollable content

2.8 WHEN action buttons in the Helper Detail header are viewed on narrow screens THEN the system SHALL wrap buttons gracefully using `flex-wrap` with appropriate gap spacing

2.9 WHEN the Helper Detail stat cards grid is viewed on very narrow screens THEN the system SHALL use responsive gap/padding that works down to 320px viewport width

2.10 WHEN the Helper Detail profile hero card is viewed on screens narrower than 360px THEN the system SHALL stack the avatar and info vertically, preventing text overflow

2.11 WHEN the Driver Earnings page is viewed on an iPhone with a home indicator THEN the system SHALL use `padding-bottom: env(safe-area-inset-bottom)` on the bottom navigation

2.12 WHEN the Driver Earnings page renders its bottom navigation THEN the system SHALL use the shared `DriverNav` component (or equivalent pattern with proper safe-area handling) for consistency

2.13 WHEN the Driver Earnings hero card currency value is viewed on screens below 360px THEN the system SHALL use responsive text sizing (e.g., `text-2xl sm:text-4xl`) to prevent overflow

2.14 WHEN interactive elements (buttons, links, dropdown triggers) on the Driver Main page are rendered THEN the system SHALL ensure all touch targets meet the minimum 44×44px requirement

2.15 WHEN any of the affected pages are scrolled on iOS devices THEN the system SHALL apply `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain` to scrollable containers for smooth momentum scrolling without pull-to-refresh interference

2.16 WHEN horizontally scrollable tables are present THEN the system SHALL display a visual scroll indicator (gradient fade on the trailing edge) to signal that more content is available

2.17 WHEN any of the affected pages are viewed in landscape orientation on a phone THEN the system SHALL use proper min-height (`min-h-[100dvh]`) and overflow-y scrolling so content is fully accessible

2.18 WHEN the Driver Main page outer container renders THEN the system SHALL use `min-h-[100dvh]` to fill the viewport correctly on devices with dynamic browser chrome

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Helpers List page is viewed on desktop (≥1024px) THEN the system SHALL CONTINUE TO display the multi-column table layout, KPI grid, and filter row in their current horizontal arrangement

3.2 WHEN the Helper Detail page is viewed on desktop THEN the system SHALL CONTINUE TO display tabs horizontally without fade indicators and tables without scroll hints (since they fit the viewport)

3.3 WHEN the Driver Main page dashboard is viewed on a standard mobile device (375px+) THEN the system SHALL CONTINUE TO render the existing card-based layout, quick actions grid, and trip details without visual regression

3.4 WHEN the Driver Settings page is viewed THEN the system SHALL CONTINUE TO function with its existing mobile-first layout, sticky header, and safe-area-aware DriverNav component

3.5 WHEN the "Add Helper" dialog is used on desktop THEN the system SHALL CONTINUE TO display the multi-column form grid layout as currently designed

3.6 WHEN the Driver Earnings page data and payroll calculations are rendered THEN the system SHALL CONTINUE TO display correct financial data, trip breakdowns, and payslip history without any data loss

3.7 WHEN navigation between driver pages (dashboard → earnings → settings) occurs THEN the system SHALL CONTINUE TO route correctly using the existing navigation patterns

3.8 WHEN the DriverNav component is rendered on pages that already use it (driver main, settings) THEN the system SHALL CONTINUE TO display and function identically to its current behavior
