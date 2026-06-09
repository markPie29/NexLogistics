"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { MaintenanceRecord, Vehicle, MaintenanceStatus } from "@/lib/services/pms-types";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PmsCalendarViewProps {
  records: MaintenanceRecord[];
  vehicles: Vehicle[];
  onEventClick: (record: MaintenanceRecord) => void;
}

// ─── Status color mapping ────────────────────────────────────────────────────

const STATUS_COLORS: Record<MaintenanceStatus, { bg: string; text: string; label: string }> = {
  overdue: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", label: "Overdue" },
  due_soon: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", label: "Due Soon" },
  upcoming: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Upcoming" },
  completed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", label: "Completed" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveVehiclePlate(vehicleId: string, vehicles: Vehicle[]): string {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  return vehicle ? vehicle.plate : vehicleId;
}

interface CalendarEventItem {
  record: MaintenanceRecord;
  plate: string;
  label: string;
}

function getEventsForDate(
  date: Date,
  records: MaintenanceRecord[],
  vehicles: Vehicle[]
): CalendarEventItem[] {
  const dateStr = format(date, "yyyy-MM-dd");
  return records
    .filter((r) => {
      try {
        return format(parseISO(r.dueDate), "yyyy-MM-dd") === dateStr;
      } catch {
        return false;
      }
    })
    .map((r) => {
      const plate = resolveVehiclePlate(r.vehicleId, vehicles);
      return {
        record: r,
        plate,
        label: `${plate} - ${r.type}`,
      };
    });
}

// ─── Event Pill Component ────────────────────────────────────────────────────

function EventPill({
  event,
  onClick,
}: {
  event: CalendarEventItem;
  onClick: () => void;
}) {
  const colors = STATUS_COLORS[event.record.status];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full text-left rounded px-1.5 py-0.5 text-[10px] leading-tight font-medium truncate cursor-pointer",
        "hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50",
        colors.bg,
        colors.text
      )}
      title={`${event.label} (${colors.label})`}
      aria-label={`${event.label}, status: ${colors.label}`}
    >
      <span className="truncate block">{event.plate} {event.record.type}</span>
    </button>
  );
}

// ─── Overflow Popover ────────────────────────────────────────────────────────

function OverflowPopover({
  events,
  overflowCount,
  onEventClick,
  dateLabel,
}: {
  events: CalendarEventItem[];
  overflowCount: number;
  onEventClick: (record: MaintenanceRecord) => void;
  dateLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full text-left text-[10px] font-medium text-brand-teal hover:text-brand-teal-dark px-1.5 py-0.5 rounded hover:bg-brand-teal/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50"
          aria-label={`Show ${overflowCount} more events for ${dateLabel}`}
        >
          +{overflowCount} more
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-h-60 overflow-y-auto p-3" align="start">
        <p className="text-xs font-semibold text-brand-navy dark:text-white mb-2">{dateLabel}</p>
        <div className="space-y-1.5">
          {events.map((event) => {
            const colors = STATUS_COLORS[event.record.status];
            return (
              <button
                key={event.record.id}
                type="button"
                onClick={() => onEventClick(event.record)}
                className={cn(
                  "w-full text-left rounded px-2 py-1.5 text-xs font-medium transition-opacity hover:opacity-80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50",
                  colors.bg,
                  colors.text
                )}
              >
                <span className="block truncate">{event.label}</span>
                <span className="text-[10px] opacity-70">{colors.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Mobile List View ────────────────────────────────────────────────────────

function MobileListView({
  records,
  vehicles,
  currentMonth,
  onEventClick,
}: {
  records: MaintenanceRecord[];
  vehicles: Vehicle[];
  currentMonth: Date;
  onEventClick: (record: MaintenanceRecord) => void;
}) {
  // Filter records for the current month
  const monthRecords = records.filter((r) => {
    try {
      const date = parseISO(r.dueDate);
      return isSameMonth(date, currentMonth);
    } catch {
      return false;
    }
  });

  // Sort by date
  const sorted = [...monthRecords].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-brand-gray/60">
        No maintenance events this month.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((record) => {
        const plate = resolveVehiclePlate(record.vehicleId, vehicles);
        const colors = STATUS_COLORS[record.status];
        const dateObj = parseISO(record.dueDate);
        return (
          <button
            key={record.id}
            type="button"
            onClick={() => onEventClick(record)}
            className={cn(
              "w-full text-left p-3 rounded-lg border border-brand-border dark:border-white/10",
              "hover:shadow-sm transition-shadow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-navy dark:text-white truncate">
                  {plate} — {record.type}
                </p>
                <p className="text-xs text-brand-gray/70 dark:text-white/60 mt-0.5">
                  {format(dateObj, "EEE, MMM d")}
                </p>
              </div>
              <Badge
                className={cn(colors.bg, colors.text, "whitespace-nowrap")}
              >
                {colors.label}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Calendar Grid (Desktop) ─────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({
  currentMonth,
  records,
  vehicles,
  onEventClick,
}: {
  currentMonth: Date;
  records: MaintenanceRecord[];
  vehicles: Vehicle[];
  onEventClick: (record: MaintenanceRecord) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Build weeks
  const weeks: Date[][] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const MAX_VISIBLE_EVENTS = 3;

  return (
    <div
      role="grid"
      aria-label={`Maintenance calendar for ${format(currentMonth, "MMMM yyyy")}`}
      className="border border-brand-border dark:border-white/10 rounded-xl overflow-hidden"
    >
      {/* Weekday Headers */}
      <div role="row" className="grid grid-cols-7 border-b border-brand-border dark:border-white/10">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            role="columnheader"
            className="py-2 text-center text-xs font-medium text-brand-gray/60 dark:text-white/50 border-r last:border-r-0 border-brand-border dark:border-white/10"
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Date Cells */}
      {weeks.map((week, weekIdx) => (
        <div
          key={weekIdx}
          role="row"
          className="grid grid-cols-7 border-b last:border-b-0 border-brand-border dark:border-white/10"
        >
          {week.map((date, dayIdx) => {
            const dayIsToday = isToday(date);
            const dayIsCurrentMonth = isSameMonth(date, currentMonth);
            const events = getEventsForDate(date, records, vehicles);
            const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
            const overflowCount = events.length - MAX_VISIBLE_EVENTS;
            const dateLabel = format(date, "EEEE, MMMM d, yyyy");

            return (
              <div
                key={dayIdx}
                role="gridcell"
                aria-label={`${dateLabel}, ${events.length} event${events.length !== 1 ? "s" : ""}`}
                className={cn(
                  "min-h-[100px] p-1.5 border-r last:border-r-0 border-brand-border dark:border-white/10 relative",
                  !dayIsCurrentMonth && "bg-gray-50/50 dark:bg-white/[0.02]",
                  dayIsToday && "ring-2 ring-inset ring-[#66B2B2]"
                )}
              >
                {/* Day Number */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-0.5",
                    !dayIsCurrentMonth && "text-brand-gray/30 dark:text-white/20",
                    dayIsCurrentMonth && "text-brand-gray dark:text-white/80",
                    dayIsToday && "bg-[#66B2B2] text-white font-semibold"
                  )}
                >
                  {format(date, "d")}
                </span>

                {/* Events */}
                <div className="space-y-0.5">
                  {visibleEvents.map((event) => (
                    <EventPill
                      key={event.record.id}
                      event={event}
                      onClick={() => onEventClick(event.record)}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <OverflowPopover
                      events={events}
                      overflowCount={overflowCount}
                      onEventClick={onEventClick}
                      dateLabel={format(date, "MMMM d, yyyy")}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PmsCalendarView({ records, vehicles, onEventClick }: PmsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());

  const goToPreviousMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <Card className="p-4 dark:bg-brand-navy dark:border-white/10">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2
          className="text-base font-semibold text-brand-navy dark:text-white"
          aria-live="polite"
        >
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          aria-label="Next month"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs" aria-label="Status legend">
        {(Object.entries(STATUS_COLORS) as [MaintenanceStatus, typeof STATUS_COLORS[MaintenanceStatus]][]).map(
          ([status, colors]) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-sm", colors.bg, "border border-current", colors.text)} />
              <span className="text-brand-gray dark:text-white/70">{colors.label}</span>
            </span>
          )
        )}
      </div>

      {/* Desktop: Calendar Grid */}
      <div className="hidden md:block">
        <CalendarGrid
          currentMonth={currentMonth}
          records={records}
          vehicles={vehicles}
          onEventClick={onEventClick}
        />
      </div>

      {/* Mobile: Simplified List View */}
      <div className="block md:hidden">
        <MobileListView
          records={records}
          vehicles={vehicles}
          currentMonth={currentMonth}
          onEventClick={onEventClick}
        />
      </div>
    </Card>
  );
}
