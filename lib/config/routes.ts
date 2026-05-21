/**
 * Centralised route constants.
 * Use ROUTES.* everywhere instead of magic strings to keep
 * refactoring and white-label path overrides in one place.
 */
export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // Root redirect
  HOME: "/",

  // Core operations
  DASHBOARD: "/dashboard",
  FLEET: "/fleet",
  DRIVERS: "/drivers",
  HELPERS: "/helpers",
  TRIPS: "/trips",
  TRIPS_NEW: "/trips/new",
  TRIPS_DISPATCH: "/trips/dispatch",
  APPROVALS: "/approvals",
  GPS: "/gps",
  PMS: "/pms",
  POD: "/pod",
  PARTNERS: "/partners",
  DISPATCHER: "/dispatcher",

  // Driver portal
  DRIVER: "/driver",
  DRIVER_EARNINGS: "/driver/earnings",

  // Finance
  EXPENSES: "/expenses",
  PAYROLL: "/payroll",
  ATTENDANCE: "/attendance",
  BILLING: "/billing",

  // Reporting
  REPORTS: "/reports",
  AI_INSIGHTS: "/ai-insights",
  ACCOUNTING: "/accounting",

  // CRM / Client
  CLIENTS: "/clients",
  CLIENT_PORTAL: "/client-portal",
  CLIENT_PORTAL_OVERVIEW: "/client-portal/overview",
  CLIENT_PORTAL_TRIPS: "/client-portal/trips",
  CLIENT_PORTAL_INVOICES: "/client-portal/invoices",
  CLIENT_PORTAL_REPORTS: "/client-portal/reports",

  // Admin & settings
  COMPANY_ADMIN: "/company-admin",
  CALENDAR: "/calendar",
  DOCUMENTS: "/documents",
  WAREHOUSE: "/warehouse",
  ROUTE_OPTIMIZATION: "/routes",
  SETTINGS: "/settings",

  // Platform owner
  PLATFORM_ADMIN: "/platform-admin",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
