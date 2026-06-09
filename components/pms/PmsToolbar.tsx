"use client";

import * as React from "react";
import { Search, Table2, Calendar, Download, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { MaintenanceStatus } from "@/lib/types";

/**
 * PmsToolbar – Filter controls, search, view toggle, and export dropdown.
 *
 * Requirements: 1.2, 1.4, 3.4, 3.5, 3.6, 7.1, 10.1, 15.1, 15.4
 */

interface PmsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: MaintenanceStatus[];
  onStatusFilterChange: (statuses: MaintenanceStatus[]) => void;
  dateRange: { start?: string; end?: string };
  onDateRangeChange: (range: { start?: string; end?: string }) => void;
  viewMode: "table" | "calendar";
  onViewModeChange: (mode: "table" | "calendar") => void;
  onExport: (format: "csv" | "pdf") => void;
  filteredCount: number;
}

const STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "due_soon", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

export function PmsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  onExport,
  filteredCount,
}: PmsToolbarProps) {
  const handleStatusToggle = (status: MaintenanceStatus) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  return (
    <Card className="border-brand-border bg-white dark:bg-card shadow-card">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search vehicles or services..."
              className="pl-9"
              aria-label="Search vehicles or services"
            />
          </div>

          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Status</span>
                {statusFilter.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-teal text-white text-xs font-medium">
                    {statusFilter.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilter.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start || ""}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, start: e.target.value || undefined })
              }
              className="w-36"
              aria-label="Start date filter"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end || ""}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, end: e.target.value || undefined })
              }
              className="w-36"
              aria-label="End date filter"
            />
          </div>

          {/* Spacer to push right-aligned items */}
          <div className="flex-1 hidden md:block" />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-brand-border dark:border-white/10 p-0.5">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("table")}
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("calendar")}
              aria-label="Calendar view"
              aria-pressed={viewMode === "calendar"}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtered Count */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredCount} records
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
