import { useEffect, useMemo, useRef } from "react";
import { DayPicker, type DayButtonProps, type Matcher } from "react-day-picker";
import { addMonths, format, isBefore, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_ORDER } from "./activity-config";
import type { Activity } from "./types";
import { toDateKey } from "./utils";

interface ActivityMonthCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  onToday: () => void;
  byDate: Map<string, Activity[]>;
  todayKey: string;
  minDate: Date;
  maxDate: Date;
}

/**
 * Navigation is rendered by us and the month is controlled, instead of relying on
 * DayPicker's absolutely-positioned nav (which the caption was covering, so clicks never landed).
 */
export function ActivityMonthCalendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  onToday,
  byDate,
  todayKey,
  minDate,
  maxDate,
}: ActivityMonthCalendarProps) {
  const canGoPrev = isBefore(startOfMonth(minDate), startOfMonth(month));
  const canGoNext = isBefore(startOfMonth(month), startOfMonth(maxDate));
  const today = new Date();
  const showToday = !isSameDay(selected, today) || !isSameMonth(month, today);

  // Custom modifiers are read by ActivityDayButton to draw the dots.
  const modifiers = useMemo(() => {
    const pending = (date: Date) =>
      byDate.get(toDateKey(date))?.filter((a) => a.status === "pending") ?? [];

    const result: Record<string, Matcher> = {
      overdue: (date) => toDateKey(date) < todayKey && pending(date).length > 0,
      allDone: (date) => {
        const list = byDate.get(toDateKey(date));
        return !!list && list.every((a) => a.status === "completed");
      },
    };
    for (const type of ACTIVITY_TYPE_ORDER) {
      result[`type:${type}`] = (date) => pending(date).some((a) => a.type === type);
    }
    return result;
  }, [byDate, todayKey]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between pl-1">
        <p className="text-sm font-semibold" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </p>
        <div className="flex items-center gap-0.5">
          {showToday && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onToday}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canGoPrev}
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canGoNext}
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <DayPicker
        mode="single"
        required
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        startMonth={minDate}
        endMonth={maxDate}
        disabled={[{ before: minDate }, { after: maxDate }]}
        hideNavigation
        showOutsideDays
        fixedWeeks
        modifiers={modifiers}
        components={{ DayButton: ActivityDayButton }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex",
          weekday: "flex-1 py-1 text-center text-[11px] font-medium text-muted-foreground",
          week: "mt-1 flex",
          day: "flex flex-1 items-center justify-center p-0",
        }}
      />
    </div>
  );
}

function ActivityDayButton({ day, modifiers, className, children, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Required for DayPicker keyboard navigation when supplying a custom DayButton.
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const types = ACTIVITY_TYPE_ORDER.filter((type) => modifiers[`type:${type}`]).slice(0, 3);

  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg text-xs tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        modifiers.selected
          ? "bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          : "hover:bg-muted",
        modifiers.today && !modifiers.selected && "font-semibold text-primary ring-1 ring-inset ring-border",
        modifiers.outside && !modifiers.selected && "text-muted-foreground/45",
        modifiers.disabled && "pointer-events-none opacity-30",
        className
      )}
    >
      {children}

      {(types.length > 0 || modifiers.allDone) && (
        <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5" aria-hidden>
          {modifiers.overdue ? (
            <span className="size-1 rounded-full bg-destructive" />
          ) : types.length > 0 ? (
            types.map((type) => (
              <span key={type} className={cn("size-1 rounded-full", ACTIVITY_TYPES[type].dot)} />
            ))
          ) : (
            <span
              className={cn(
                "size-1 rounded-full",
                modifiers.selected ? "bg-primary-foreground/50" : "bg-muted-foreground/40"
              )}
            />
          )}
        </span>
      )}
    </button>
  );
}