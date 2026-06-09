"use client";

/**
 * POD Data Table
 *
 * Enhanced data table with Tabs (Awaiting / Captured), sorting, pagination,
 * and responsive card layout below 768px.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10, 9.2, 9.6, 11.1, 11.2, 11.5, 11.8
 */

import Link from "next/link";
import {
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Camera,
  ArrowUpDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDeliveryDate,
  formatPodDate,
} from "@/lib/utils/pod-helpers";
import type { AwaitingPodRow, CapturedPodRow } from "@/lib/utils/pod-helpers";

interface PodDataTableProps {
  activeTab: "awaiting" | "captured";
  onTabChange: (tab: "awaiting" | "captured") => void;
  awaitingRecords: AwaitingPodRow[];
  capturedRecords: CapturedPodRow[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewPod: (podId: string) => void;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export function PodDataTable({
  activeTab,
  onTabChange,
  awaitingRecords,
  capturedRecords,
  sortColumn,
  sortDirection,
  onSort,
  currentPage,
  pageSize,
  onPageChange,
  onViewPod,
}: PodDataTableProps) {
  const records = activeTab === "awaiting" ? awaitingRecords : capturedRecords;
  const totalCount = records.length;
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = records.slice(startIndex, startIndex + pageSize);

  function getAriaSortValue(column: string): "ascending" | "descending" | undefined {
    if (sortColumn !== column) return undefined;
    return sortDirection === "asc" ? "ascending" : "descending";
  }

  return (
    <Card className="dark:bg-brand-navy-light dark:border-gray-700">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as "awaiting" | "captured")}
        className="p-4"
      >
        <TabsList>
          <TabsTrigger value="awaiting">Awaiting POD</TabsTrigger>
          <TabsTrigger value="captured">Captured</TabsTrigger>
        </TabsList>

        <TabsContent value="awaiting">
          {awaitingRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border dark:border-gray-700">
                      <SortableHeader
                        label="Trip ID"
                        column="tripId"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("tripId")}
                      />
                      <SortableHeader
                        label="Driver Name"
                        column="driverName"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("driverName")}
                      />
                      <SortableHeader
                        label="Pickup Address"
                        column="pickupAddress"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("pickupAddress")}
                      />
                      <SortableHeader
                        label="Dropoff Address"
                        column="dropoffAddress"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("dropoffAddress")}
                      />
                      <SortableHeader
                        label="Delivery Date"
                        column="deliveryDate"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("deliveryDate")}
                      />
                      <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pageRows as AwaitingPodRow[]).map((row) => (
                      <tr
                        key={row.tripId}
                        className="border-b border-brand-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <td className="px-3 py-3 font-medium text-brand-navy dark:text-white">
                          {row.tripId}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300">
                          {row.driverName}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300" title={row.pickupAddress}>
                          {truncate(row.pickupAddress, 40)}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300" title={row.dropoffAddress}>
                          {truncate(row.dropoffAddress, 40)}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300">
                          {formatDeliveryDate(row.deliveryDate)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="warning">Awaiting POD</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Button variant="link" size="sm" asChild>
                            <Link href={`/pod/${row.tripId}`}>Capture</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {(pageRows as AwaitingPodRow[]).map((row) => (
                  <MobileAwaitingCard key={row.tripId} row={row} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="captured">
          {capturedRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border dark:border-gray-700">
                      <SortableHeader
                        label="Trip ID"
                        column="tripId"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("tripId")}
                      />
                      <SortableHeader
                        label="Driver Name"
                        column="driverName"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("driverName")}
                      />
                      <SortableHeader
                        label="Receiver Name"
                        column="receiverName"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("receiverName")}
                      />
                      <SortableHeader
                        label="Capture Date"
                        column="captureDate"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        ariaSortValue={getAriaSortValue("captureDate")}
                      />
                      <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Evidence
                      </th>
                      <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pageRows as CapturedPodRow[]).map((row) => (
                      <tr
                        key={row.podId}
                        className="border-b border-brand-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <td className="px-3 py-3 font-medium text-brand-navy dark:text-white">
                          {row.tripId}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300">
                          {row.driverName}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300">
                          {row.receiverName}
                        </td>
                        <td className="px-3 py-3 text-brand-gray dark:text-gray-300">
                          {formatPodDate(row.captureDate)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {row.hasSignature && (
                              <PenLine className="w-4 h-4 text-brand-teal" aria-label="Signature captured" />
                            )}
                            {row.photoCount > 0 && (
                              <span className="flex items-center gap-0.5 text-brand-gray dark:text-gray-300">
                                <Camera className="w-4 h-4" aria-label="Photos captured" />
                                <span className="text-xs">{row.photoCount}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="success">Captured</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPod(row.podId)}
                            aria-label={`View POD details for Trip ${row.tripId}`}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {(pageRows as CapturedPodRow[]).map((row) => (
                  <MobileCapturedCard key={row.podId} row={row} onViewPod={onViewPod} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-brand-border dark:border-gray-700 mt-4">
            <span className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "record" : "records"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-brand-navy dark:text-white font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Tabs>
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────

interface SortableHeaderProps {
  label: string;
  column: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  ariaSortValue: "ascending" | "descending" | undefined;
}

function SortableHeader({
  label,
  column,
  sortColumn,
  sortDirection: _sortDirection,
  onSort,
  ariaSortValue,
}: SortableHeaderProps) {
  return (
    <th
      scope="col"
      aria-sort={ariaSortValue}
      className="px-3 py-3 text-left font-medium text-muted-foreground"
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-brand-navy dark:hover:text-white transition-colors"
        onClick={() => onSort(column)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <ArrowUpDown
          className={cn(
            "w-3.5 h-3.5",
            sortColumn === column
              ? "text-brand-teal"
              : "text-muted-foreground/50"
          )}
        />
      </button>
    </th>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">
        No matching records found
      </p>
    </div>
  );
}

function MobileAwaitingCard({ row }: { row: AwaitingPodRow }) {
  return (
    <div className="rounded-xl border border-brand-border dark:border-gray-700 bg-white dark:bg-brand-navy-light p-4 min-w-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-medium text-brand-navy dark:text-white text-sm truncate min-w-0">
          {row.tripId}
        </span>
        <Badge variant="warning">Awaiting POD</Badge>
      </div>
      <p className="text-xs text-brand-gray dark:text-gray-300 truncate mb-1">
        {truncate(row.driverName, 20)}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {formatDeliveryDate(row.deliveryDate)}
      </p>
      <Button variant="default" size="sm" asChild className="w-full min-h-[44px]">
        <Link href={`/pod/${row.tripId}`}>Capture</Link>
      </Button>
    </div>
  );
}

function MobileCapturedCard({
  row,
  onViewPod,
}: {
  row: CapturedPodRow;
  onViewPod: (podId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border dark:border-gray-700 bg-white dark:bg-brand-navy-light p-4 min-w-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-medium text-brand-navy dark:text-white text-sm truncate min-w-0">
          {row.tripId}
        </span>
        <Badge variant="success">Captured</Badge>
      </div>
      <p className="text-xs text-brand-gray dark:text-gray-300 truncate mb-1">
        {row.driverName}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {formatPodDate(row.captureDate)}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full min-h-[44px]"
        onClick={() => onViewPod(row.podId)}
        aria-label={`View POD details for Trip ${row.tripId}`}
      >
        View
      </Button>
    </div>
  );
}
