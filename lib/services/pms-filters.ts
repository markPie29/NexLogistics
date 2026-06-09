/**
 * PMS filter, sort, and pagination utilities.
 *
 * Pure functions for client-side data manipulation of maintenance records.
 * All functions return new arrays/objects (no mutation).
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 4.1
 */

import type {
  MaintenanceRecord,
  Vehicle,
  PmsFilters,
  PmsSort,
} from "./pms-types";

// ─── Filter ──────────────────────────────────────────────────────────────────

/**
 * Filter maintenance records using combined AND logic across search, statuses,
 * and date range criteria.
 *
 * - search: case-insensitive partial match against resolved vehicle plate AND record.type
 * - statuses: if non-empty, only include records whose status is in the array; if empty, include all
 * - dateRange: start/end bounds for dueDate (inclusive)
 */
export function filterRecords(
  records: MaintenanceRecord[],
  vehicles: Vehicle[],
  filters: PmsFilters
): MaintenanceRecord[] {
  const { search, statuses, dateRange } = filters;
  const searchLower = search.toLowerCase();

  // Build a vehicleId → plate lookup map for efficient resolution
  const plateMap = new Map<string, string>();
  for (const v of vehicles) {
    plateMap.set(v.id, v.plate);
  }

  return records.filter((record) => {
    // Search filter: case-insensitive partial match on plate OR type
    if (searchLower) {
      const plate = (plateMap.get(record.vehicleId) ?? "").toLowerCase();
      const type = record.type.toLowerCase();
      if (!plate.includes(searchLower) && !type.includes(searchLower)) {
        return false;
      }
    }

    // Status filter: if non-empty array, record.status must be in set
    if (statuses.length > 0 && !statuses.includes(record.status)) {
      return false;
    }

    // Date range filter
    if (dateRange.start && record.dueDate < dateRange.start) {
      return false;
    }
    if (dateRange.end && record.dueDate > dateRange.end) {
      return false;
    }

    return true;
  });
}

// ─── Sort ────────────────────────────────────────────────────────────────────

/** Custom ordering for maintenance statuses. */
const STATUS_ORDER: Record<string, number> = {
  overdue: 0,
  due_soon: 1,
  upcoming: 2,
  completed: 3,
};

/**
 * Sort maintenance records by the given column and direction.
 * Returns a new sorted array without mutating the input.
 *
 * For "plate" column: resolves vehicleId to vehicle.plate, then sorts alphabetically.
 * For "type": alphabetical sort.
 * For "dueDate": ISO string comparison (lexicographic works for ISO dates).
 * For "dueOdometer": numeric sort (undefined treated as 0).
 * For "cost": numeric sort (undefined treated as 0).
 * For "status": sort by custom status order (overdue=0, due_soon=1, upcoming=2, completed=3).
 */
export function sortRecords(
  records: MaintenanceRecord[],
  vehicles: Vehicle[],
  column: PmsSort["column"],
  direction: PmsSort["direction"]
): MaintenanceRecord[] {
  // Build a vehicleId → plate lookup map
  const plateMap = new Map<string, string>();
  for (const v of vehicles) {
    plateMap.set(v.id, v.plate);
  }

  const multiplier = direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case "plate": {
        const plateA = (plateMap.get(a.vehicleId) ?? "").toLowerCase();
        const plateB = (plateMap.get(b.vehicleId) ?? "").toLowerCase();
        comparison = plateA.localeCompare(plateB);
        break;
      }
      case "type": {
        comparison = a.type.toLowerCase().localeCompare(b.type.toLowerCase());
        break;
      }
      case "dueDate": {
        comparison = a.dueDate.localeCompare(b.dueDate);
        break;
      }
      case "dueOdometer": {
        const odomA = a.dueOdometer ?? 0;
        const odomB = b.dueOdometer ?? 0;
        comparison = odomA - odomB;
        break;
      }
      case "cost": {
        const costA = a.cost ?? 0;
        const costB = b.cost ?? 0;
        comparison = costA - costB;
        break;
      }
      case "status": {
        const orderA = STATUS_ORDER[a.status] ?? 99;
        const orderB = STATUS_ORDER[b.status] ?? 99;
        comparison = orderA - orderB;
        break;
      }
    }

    return comparison * multiplier;
  });
}

// ─── Pagination ──────────────────────────────────────────────────────────────

/**
 * Paginate an array of records.
 *
 * @param records - Full array of records to paginate
 * @param pageSize - Number of items per page
 * @param currentPage - 1-indexed page number
 * @returns Object with the page slice, total page count, and total record count
 */
export function paginateRecords<T>(
  records: T[],
  pageSize: number,
  currentPage: number
): { data: T[]; totalPages: number; totalCount: number } {
  const totalCount = records.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Clamp currentPage to valid range
  const page = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = records.slice(startIndex, endIndex);

  return { data, totalPages, totalCount };
}

// ─── Select All Toggle ───────────────────────────────────────────────────────

/**
 * Toggle select-all for the current page.
 *
 * If ALL currentPageIds are already in selectedIds → remove them all (deselect).
 * Otherwise → add them all (select).
 *
 * Returns a new Set (does not mutate input).
 */
export function toggleSelectAll(
  currentPageIds: string[],
  selectedIds: Set<string>
): Set<string> {
  const allSelected = currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  const newSet = new Set(selectedIds);

  if (allSelected) {
    // Deselect all current page IDs
    for (const id of currentPageIds) {
      newSet.delete(id);
    }
  } else {
    // Select all current page IDs
    for (const id of currentPageIds) {
      newSet.add(id);
    }
  }

  return newSet;
}
