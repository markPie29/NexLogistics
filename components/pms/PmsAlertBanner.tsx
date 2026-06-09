"use client";

import { AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findMostOverdue } from "@/lib/services/pms-utils";
import type { MaintenanceRecord, Vehicle } from "@/lib/services/pms-types";

/**
 * PmsAlertBanner — Danger alert for overdue maintenance items.
 *
 * Renders only when there are overdue records and the banner has not been dismissed.
 * Displays the count of overdue items and highlights the most-overdue record.
 *
 * Requirements: 1.2, 8.1–8.7, 15.7
 */

export interface PmsAlertBannerProps {
  overdueRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  dismissed: boolean;
  onDismiss: () => void;
  onViewAll: () => void;
}

export function PmsAlertBanner({
  overdueRecords,
  vehicles,
  dismissed,
  onDismiss,
  onViewAll,
}: PmsAlertBannerProps) {
  // Render nothing if no overdue records or banner is dismissed
  if (overdueRecords.length === 0 || dismissed) {
    return null;
  }

  const mostOverdue = findMostOverdue(overdueRecords);

  // Resolve vehicle plate for the most-overdue record
  const resolvedPlate = mostOverdue
    ? vehicles.find((v) => v.id === mostOverdue.vehicleId)?.plate ??
      mostOverdue.vehicleId
    : null;

  return (
    <Card
      role="alert"
      aria-live="polite"
      className="relative bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Alert icon */}
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            {overdueRecords.length} overdue maintenance{" "}
            {overdueRecords.length === 1 ? "item" : "items"}
          </p>

          {mostOverdue && resolvedPlate && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1 truncate">
              Most overdue: {resolvedPlate} — {mostOverdue.type}
            </p>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={onViewAll}
          >
            View All Overdue
          </Button>
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
          onClick={onDismiss}
          aria-label="Dismiss overdue alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
