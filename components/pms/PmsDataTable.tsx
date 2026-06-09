"use client";

import * as React from "react";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { MaintenanceRecord, Vehicle, MaintenanceStatus } from "@/lib/services/pms-types";
import { formatCurrency } from "@/lib/utils";

/**
 * PmsDataTable – Enhanced data table with sorting, pagination, checkboxes,
 * and responsive card layout for mobile.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 14.1
 */

interface PmsDataTableProps {
  records: MaintenanceRecord[];
  vehicles: Vehicle[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: 10 | 25 | 50) => void;
  onEditRecord: (record: MaintenanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  onVehicleClick: (vehicleId: string) => void;
  onRowClick?: (record: MaintenanceRecord) => void;
  onClearFilters?: () => void;
}

const STATUS_VARIANT_MAP: Record<MaintenanceStatus, "danger" | "warning" | "info" | "success"> = {
  overdue: "danger",
  due_soon: "warning",
  upcoming: "info",
  completed: "success",
};

const STATUS_LABEL_MAP: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  upcoming: "Upcoming",
  completed: "Completed",
};

interface ColumnDef {
  key: string;
  label: string;
  sortable: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "plate", label: "Vehicle", sortable: true },
  { key: "type", label: "Service Type", sortable: true },
  { key: "dueDate", label: "Due Date", sortable: true },
  { key: "dueOdometer", label: "Due Odometer", sortable: true },
  { key: "cost", label: "Est. Cost", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

function resolveVehicle(vehicleId: string, vehicles: Vehicle[]) {
  return vehicles.find((v) => v.id === vehicleId);
}

export function PmsDataTable({
  records,
  vehicles,
  sortColumn,
  sortDirection,
  onSort,
  selectedIds,
  onSelectionChange,
  pageSize,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  onEditRecord,
  onDeleteRecord,
  onVehicleClick,
  onRowClick,
  onClearFilters,
}: PmsDataTableProps) {
  // ─── Selection helpers ───────────────────────────────────────────────
  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id));
  const someSelected = records.some((r) => selectedIds.has(r.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all on current page
      const newIds = new Set(selectedIds);
      records.forEach((r) => newIds.delete(r.id));
      onSelectionChange(newIds);
    } else {
      // Select all on current page
      const newIds = new Set(selectedIds);
      records.forEach((r) => newIds.add(r.id));
      onSelectionChange(newIds);
    }
  };

  const handleSelectRow = (id: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    onSelectionChange(newIds);
  };

  // ─── Empty state ────────────────────────────────────────────────────
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-base font-medium text-brand-gray dark:text-gray-300 mb-2">
          No matching records found
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your filters or search criteria.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table (hidden below md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Maintenance records table">
          <thead>
            <tr className="border-b border-brand-border bg-gray-50/60 dark:bg-white/[0.03]">
              {/* Select-all checkbox */}
              <th scope="col" className="w-10 px-3 py-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all records"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-brand-gray dark:text-gray-300 whitespace-nowrap"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-brand-teal transition-colors"
                      onClick={() => onSort(col.key)}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      {sortColumn === col.key ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-right font-medium text-brand-gray dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const vehicle = resolveVehicle(record.vehicleId, vehicles);
              const isSelected = selectedIds.has(record.id);

              return (
                <tr
                  key={record.id}
                  className={`border-b border-brand-border/50 dark:border-white/10 hover:bg-gray-50/40 dark:hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    isSelected ? "bg-brand-teal-light/30 dark:bg-brand-teal/10" : ""
                  }`}
                  onClick={() => onRowClick?.(record)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectRow(record.id)}
                      aria-label={`Select record ${record.id}`}
                    />
                  </td>

                  {/* Vehicle */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    {vehicle ? (
                      <button
                        type="button"
                        onClick={() => onVehicleClick(record.vehicleId)}
                        className={`font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-teal/50 rounded ${
                          vehicle.status === "inactive"
                            ? "text-muted-foreground opacity-60"
                            : "text-brand-teal"
                        }`}
                      >
                        {vehicle.plate}
                        {vehicle.status === "inactive" && (
                          <span className="ml-1 text-xs text-muted-foreground">(inactive)</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">
                        {record.vehicleId}{" "}
                        <Badge variant="neutral">(unavailable)</Badge>
                      </span>
                    )}
                  </td>

                  {/* Service Type */}
                  <td className="px-3 py-3">{record.type}</td>

                  {/* Due Date */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {new Date(record.dueDate).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Due Odometer */}
                  <td className="px-3 py-3">
                    {record.dueOdometer != null
                      ? `${record.dueOdometer.toLocaleString()} km`
                      : "—"}
                  </td>

                  {/* Estimated Cost */}
                  <td className="px-3 py-3">
                    {record.cost != null ? formatCurrency(record.cost) : "—"}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <Badge variant={STATUS_VARIANT_MAP[record.status]}>
                      {STATUS_LABEL_MAP[record.status]}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditRecord(record)}
                        aria-label={`Edit maintenance record for ${vehicle?.plate || record.vehicleId}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteRecord(record.id)}
                        aria-label={`Delete maintenance record for ${vehicle?.plate || record.vehicleId}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (visible below md) */}
      <div className="md:hidden space-y-3">
        {records.map((record) => {
          const vehicle = resolveVehicle(record.vehicleId, vehicles);

          return (
            <Card key={record.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={selectedIds.has(record.id)}
                      onCheckedChange={() => handleSelectRow(record.id)}
                      aria-label={`Select record ${record.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                    />
                    <div className="min-w-0">
                      {vehicle ? (
                        <button
                          type="button"
                          onClick={() => onVehicleClick(record.vehicleId)}
                          className={`font-medium text-sm min-h-[44px] flex items-center hover:underline focus:outline-none focus:ring-2 focus:ring-brand-teal/50 rounded ${
                            vehicle.status === "inactive"
                              ? "text-muted-foreground opacity-60"
                              : "text-brand-teal"
                          }`}
                        >
                          {vehicle.plate}
                          {vehicle.status === "inactive" && (
                            <span className="ml-1 text-xs">(inactive)</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {record.vehicleId}{" "}
                          <Badge variant="neutral">(unavailable)</Badge>
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {record.type}
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT_MAP[record.status]}>
                    {STATUS_LABEL_MAP[record.status]}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(record.dueDate).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() => onEditRecord(record)}
                      aria-label={`Edit maintenance record for ${vehicle?.plate || record.vehicleId}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() => onDeleteRecord(record.id)}
                      aria-label={`Delete maintenance record for ${vehicle?.plate || record.vehicleId}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
        {/* Page Size Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val) as 10 | 25 | 50)}
          >
            <SelectTrigger className="w-[72px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Info */}
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({totalCount} records)
        </span>

        {/* Prev/Next Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="min-h-[44px] min-w-[44px]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
