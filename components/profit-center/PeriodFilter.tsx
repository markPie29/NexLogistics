"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { PeriodPreset, DateRange } from "@/lib/profit-center/types";
import { formatPeriodLabel } from "@/lib/profit-center/computations";

interface PeriodFilterProps {
  period: PeriodPreset;
  onPeriodChange: (preset: PeriodPreset) => void;
  customRange: DateRange | null;
  onCustomRangeChange: (range: DateRange) => void;
  resolvedRange: DateRange;
}

export function PeriodFilter({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
  resolvedRange,
}: PeriodFilterProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetChange = (value: string) => {
    onPeriodChange(value as PeriodPreset);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={period} onValueChange={handlePresetChange}>
        <SelectTrigger
          className="w-[160px] h-9 text-sm"
          aria-label="Select time period"
        >
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this_week">This Week</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
          <SelectItem value="this_quarter">This Quarter</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {period === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
              <CalendarIcon className="w-4 h-4" />
              {customRange
                ? formatPeriodLabel(customRange)
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex gap-2 p-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Start</p>
                <Calendar
                  selected={customRange?.start}
                  onSelect={(date) => {
                    if (date) {
                      const end = customRange?.end ?? date;
                      onCustomRangeChange({ start: date, end: end < date ? date : end });
                    }
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">End</p>
                <Calendar
                  selected={customRange?.end}
                  onSelect={(date) => {
                    if (date) {
                      const start = customRange?.start ?? date;
                      onCustomRangeChange({ start: start > date ? date : start, end: date });
                      setCalendarOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <span className="text-xs text-muted-foreground hidden sm:inline">
        {formatPeriodLabel(resolvedRange)}
      </span>
    </div>
  );
}
