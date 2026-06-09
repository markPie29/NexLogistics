"use client";
import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CalendarProps {
  /** The currently selected date */
  selected?: Date;
  /** Callback when a date is selected */
  onSelect?: (date: Date) => void;
  /** The month currently displayed (controlled) */
  month?: Date;
  /** Callback when the displayed month changes */
  onMonthChange?: (month: Date) => void;
  /** Minimum selectable date */
  fromDate?: Date;
  /** Maximum selectable date */
  toDate?: Date;
  /** Additional class names for the root element */
  className?: string;
  /** Custom day cell render function */
  renderDay?: (date: Date, props: DayRenderProps) => React.ReactNode;
}

export interface DayRenderProps {
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  isDisabled: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar({
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  fromDate,
  toDate,
  className,
  renderDay,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(
    controlledMonth ?? selected ?? new Date()
  );

  const currentMonth = controlledMonth ?? internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const goToPreviousMonth = () => handleMonthChange(subMonths(currentMonth, 1));
  const goToNextMonth = () => handleMonthChange(addMonths(currentMonth, 1));

  // Build the calendar grid: start from the first day of the week containing the 1st of the month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

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

  const isDayDisabled = (date: Date): boolean => {
    if (fromDate && date < fromDate) return true;
    if (toDate && date > toDate) return true;
    return false;
  };

  return (
    <div className={cn("p-3", className)}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-2">
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
          className="text-sm font-medium text-brand-gray"
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

      {/* Calendar grid */}
      <table
        className="w-full border-collapse"
        role="grid"
        aria-label={`Calendar for ${format(currentMonth, "MMMM yyyy")}`}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday}
                scope="col"
                className="py-1.5 text-xs font-medium text-brand-gray/60 text-center"
                aria-label={weekday}
              >
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <tr key={weekIdx}>
              {week.map((date, dayIdx) => {
                const dayIsToday = isToday(date);
                const dayIsSelected = selected ? isSameDay(date, selected) : false;
                const dayIsCurrentMonth = isSameMonth(date, currentMonth);
                const dayIsDisabled = isDayDisabled(date);

                const dayRenderProps: DayRenderProps = {
                  isSelected: dayIsSelected,
                  isToday: dayIsToday,
                  isCurrentMonth: dayIsCurrentMonth,
                  isDisabled: dayIsDisabled,
                };

                if (renderDay) {
                  return (
                    <td
                      key={dayIdx}
                      role="gridcell"
                      aria-label={format(date, "EEEE, MMMM d, yyyy")}
                      aria-selected={dayIsSelected}
                      aria-disabled={dayIsDisabled}
                    >
                      {renderDay(date, dayRenderProps)}
                    </td>
                  );
                }

                return (
                  <td
                    key={dayIdx}
                    role="gridcell"
                    aria-label={format(date, "EEEE, MMMM d, yyyy")}
                    aria-selected={dayIsSelected}
                    aria-disabled={dayIsDisabled}
                    className="p-0 text-center"
                  >
                    <button
                      type="button"
                      disabled={dayIsDisabled}
                      onClick={() => !dayIsDisabled && onSelect?.(date)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                        "hover:bg-brand-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50",
                        !dayIsCurrentMonth && "text-brand-gray/30",
                        dayIsCurrentMonth && "text-brand-gray",
                        dayIsToday &&
                          "bg-brand-teal/10 text-brand-teal font-semibold",
                        dayIsSelected &&
                          "bg-brand-teal text-white hover:bg-brand-teal-dark",
                        dayIsDisabled &&
                          "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                      aria-label={format(date, "EEEE, MMMM d, yyyy")}
                      tabIndex={dayIsDisabled ? -1 : 0}
                    >
                      {format(date, "d")}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
