"use client";

/**
 * PMS Vehicle History Panel
 *
 * Slide-over drawer showing a vehicle's complete maintenance history.
 * Includes summary stats, a mini activity timeline, and a paginated record list.
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import { useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { computeVehicleStats } from "@/lib/services/pms-utils";
import type { MaintenanceRecord, Vehicle, MaintenanceStatus } from "@/lib/services/pms-types";

const PAGE_SIZE = 50;

const STATUS_BADGE_VARIANT: Record<MaintenanceStatus, "danger" | "warning" | "info" | "success"> = {
  overdue: "danger",
  due_soon: "warning",
  upcoming: "info",
  completed: "success",
};

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  upcoming: "Upcoming",
  completed: "Completed",
};

interface PmsVehicleHistoryPanelProps {
  vehicleId: string;
  records: MaintenanceRecord[];
  vehicle: Vehicle | undefined;
  open: boolean;
  onClose: () => void;
}

/**
 * Format a date string for display (e.g. "Jan 15, 2025").
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Compute monthly activity counts for the last 12 months.
 * Returns an array of { label, count } for the mini timeline.
 */
function computeMonthlyActivity(records: MaintenanceRecord[]): { label: string; count: number }[] {
  const now = new Date();
  const months: { label: string; key: string; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ label, key, count: 0 });
  }

  for (const record of records) {
    const date = new Date(record.dueDate);
    if (isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = months.find((m) => m.key === key);
    if (month) month.count++;
  }

  return months.map(({ label, count }) => ({ label, count }));
}

export function PmsVehicleHistoryPanel({
  records,
  vehicle,
  open,
  onClose,
}: PmsVehicleHistoryPanelProps) {
  const [page, setPage] = useState(0);

  // Stats
  const stats = useMemo(() => computeVehicleStats(records), [records]);

  // Monthly activity for mini timeline
  const monthlyActivity = useMemo(() => computeMonthlyActivity(records), [records]);
  const maxCount = useMemo(
    () => Math.max(...monthlyActivity.map((m) => m.count), 1),
    [monthlyActivity]
  );

  // Sort records reverse chronological (newest first by completedAt or dueDate)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateA = new Date(a.completedAt || a.dueDate).getTime();
      const dateB = new Date(b.completedAt || b.dueDate).getTime();
      return dateB - dateA;
    });
  }, [records]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / PAGE_SIZE);
  const paginatedRecords = sortedRecords.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  // Reset page when panel opens with new data
  useMemo(() => setPage(0), [records]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Vehicle Service History</SheetTitle>
        </SheetHeader>

        {/* Empty state */}
        {records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-12">
            <Wrench className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No service history available for this vehicle
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
            {/* Summary header */}
            <div className="space-y-1.5">
              {vehicle && (
                <>
                  <p className="text-xl font-bold text-brand-navy dark:text-white">{vehicle.plate}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Odometer: {vehicle.odometer.toLocaleString()} km
                  </p>
                </>
              )}
              <div className="flex items-center gap-4 pt-1 text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Lifetime cost:{" "}
                  <span className="font-semibold text-brand-navy dark:text-white">
                    {formatCurrency(stats.lifetimeCost)}
                  </span>
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Completed:{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {stats.completedCount}
                  </span>
                </span>
              </div>
            </div>

            {/* Mini timeline - last 12 months */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Activity (last 12 months)
              </p>
              <div className="flex items-end gap-1 h-10">
                {monthlyActivity.map((month, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-0.5"
                  >
                    <div
                      className="w-full rounded-sm bg-brand-teal/70 transition-all"
                      style={{
                        height: month.count > 0
                          ? `${Math.max((month.count / maxCount) * 100, 12)}%`
                          : "2px",
                        opacity: month.count > 0 ? 1 : 0.3,
                      }}
                      title={`${month.label}: ${month.count} record${month.count !== 1 ? "s" : ""}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {monthlyActivity.map((month, idx) => (
                  <span
                    key={idx}
                    className="flex-1 text-center text-[9px] text-gray-400 dark:text-gray-500"
                  >
                    {month.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Record list */}
            <div className="flex-1 space-y-2">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 dark:border-white/10 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-navy dark:text-white truncate">
                      {record.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(record.completedAt || record.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {record.cost != null ? formatCurrency(record.cost) : "—"}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                      {STATUS_LABEL[record.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
