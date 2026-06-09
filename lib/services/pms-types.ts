/**
 * PMS (Preventive Maintenance Schedule) page TypeScript interfaces.
 *
 * Defines local types used exclusively by the PMS page and its components.
 * Re-exports relevant shared types from @/lib/types for convenience.
 *
 * Requirements: 14.2, 14.5
 */

// ─── Re-exports from shared types ────────────────────────────────────────────
export type {
  MaintenanceRecord,
  MaintenanceStatus,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";

// ─── Filter State ────────────────────────────────────────────────────────────

/** Active filter state for the PMS data table and calendar views. */
export interface PmsFilters {
  search: string;
  statuses: import("@/lib/types").MaintenanceStatus[];
  dateRange: { start?: string; end?: string };
}

// ─── Sort State ──────────────────────────────────────────────────────────────

/** Active sort configuration for the PMS data table. */
export interface PmsSort {
  column: "plate" | "type" | "dueDate" | "dueOdometer" | "cost" | "status";
  direction: "asc" | "desc";
}

// ─── Calendar View Types ─────────────────────────────────────────────────────

/** A maintenance record mapped to a calendar event for rendering. */
export interface CalendarEvent {
  record: import("@/lib/types").MaintenanceRecord;
  vehiclePlate: string;
  date: string; // ISO date (YYYY-MM-DD)
  label: string; // "{plate} - {type}"
  statusColor: string;
}

// ─── KPI / Analytics Types ───────────────────────────────────────────────────

/** Weekly count data point for KPI sparkline visualizations. */
export interface WeeklyCount {
  week: string; // ISO week identifier (e.g. "2025-W03")
  count: number;
}

/** Monthly cost data point for cost analytics charts. */
export interface MonthlyCost {
  month: string; // YYYY-MM
  label: string; // Short month name (e.g. "Jan", "Feb")
  total: number;
}

/** Service type cost breakdown entry. */
export interface ServiceTypeCost {
  type: string;
  total: number;
  percentage: number;
}

// ─── Schedule Form Types ─────────────────────────────────────────────────────

/** Form data shape for the Add/Edit Schedule modal. */
export interface ScheduleFormData {
  vehicleId: string;
  type: string;
  dueDate: string;
  dueOdometer?: number;
  cost?: number;
  notes?: string;
}

/** Validation error messages for the Schedule form fields. */
export interface ScheduleFormErrors {
  vehicleId?: string;
  type?: string;
  dueDate?: string;
  dueOdometer?: string;
  cost?: string;
  notes?: string;
}

// ─── Page State ──────────────────────────────────────────────────────────────

/** Consolidated local state for the PMS page component. */
export interface PmsPageState {
  // Filters
  search: string;
  statusFilter: import("@/lib/types").MaintenanceStatus[];
  dateRange: { start?: string; end?: string };

  // View mode
  viewMode: "table" | "calendar";

  // Sort
  sortColumn: PmsSort["column"];
  sortDirection: PmsSort["direction"];

  // Pagination
  pageSize: 10 | 25 | 50;
  currentPage: number;

  // Selection (bulk actions)
  selectedIds: Set<string>;

  // Modal state
  modalState: {
    open: boolean;
    mode: "add" | "edit";
    record?: import("@/lib/types").MaintenanceRecord;
  };

  // Vehicle history panel
  vehicleHistoryId: string | null;

  // Alert banner
  alertDismissed: boolean;

  // Cost analytics
  costAnalyticsCollapsed: boolean;
}
