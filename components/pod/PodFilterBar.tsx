"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PodFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  driverFilter: string | null;
  onDriverFilterChange: (driverId: string | null) => void;
  drivers: Array<{ id: string; name: string }>;
  resultCount: number;
}

export function PodFilterBar({
  search,
  onSearchChange,
  driverFilter,
  onDriverFilterChange,
  drivers,
  resultCount,
}: PodFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(search);

  // Keep local search in sync with external search prop changes
  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search input at 300ms using useEffect + setTimeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 100); // max 100 characters
    setLocalSearch(value);
  };

  const handleDriverChange = (value: string) => {
    // "all" is used as the sentinel value for "All Drivers"
    onDriverFilterChange(value === "all" ? null : value);
  };

  return (
    <Card
      className={cn(
        "shadow-card rounded-lg p-4",
        "dark:bg-[#172033] dark:border-gray-700"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          "md:flex-row md:items-center md:gap-4"
        )}
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="Search by Trip ID, Driver, or Receiver..."
            value={localSearch}
            onChange={handleSearchChange}
            maxLength={100}
            className={cn(
              "pl-9",
              "dark:bg-[#0B1220] dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
            )}
            aria-label="Search POD records"
          />
        </div>

        {/* Driver Filter Dropdown */}
        <div className="w-full md:w-[200px]">
          <Select
            value={driverFilter ?? "all"}
            onValueChange={handleDriverChange}
          >
            <SelectTrigger
              className={cn(
                "dark:bg-[#0B1220] dark:border-gray-600 dark:text-gray-100"
              )}
              aria-label="Filter by driver"
            >
              <SelectValue placeholder="All Drivers" />
            </SelectTrigger>
            <SelectContent
              className={cn(
                "dark:bg-[#172033] dark:border-gray-600"
              )}
            >
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accessible result count announcement */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Showing {resultCount} {resultCount === 1 ? "result" : "results"}
      </div>
    </Card>
  );
}
