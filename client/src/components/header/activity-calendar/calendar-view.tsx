import { useEffect, useRef, useState } from "react";
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ActivityList } from "./activity-item";
import { ActivityMonthCalendar } from "./activity-month-calendar";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_ORDER } from "./activity-config";
import { EmptyState } from "./empty-state";
import type { Activity } from "./types";
import { toDateKey } from "./utils";
import { appIcons } from "@/configs/icons";

interface CalendarViewProps {
  byDate: Map<string, Activity[]>;
  todayKey: string;
  selectedDate: Date;
  month: Date;
  minDate: Date;
  maxDate: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (month: Date) => void;
  onToday: () => void;
  onToggleComplete: (id: string) => void;
  onOpenActivity?: (activity: Activity) => void;
  onCreate: (date: Date) => void;
}

/**
 * Two steps: month grid -> click a date -> that day's list (with back).
 * Only one step is mounted at a time, so hidden content is never focusable.
 */
export function CalendarView(props: CalendarViewProps) {
  const [showDay, setShowDay] = useState(false);

  const openDay = (date: Date) => {
    props.onSelectDate(date);
    setShowDay(true);
  };

  return showDay ? (
    <DayPanel {...props} onBack={() => setShowDay(false)} />
  ) : (
    <MonthPanel {...props} onPickDate={openDay} />
  );
}

/* ---------------------------------- Month --------------------------------- */

function MonthPanel({
  byDate,
  todayKey,
  selectedDate,
  month,
  minDate,
  maxDate,
  onMonthChange,
  onToday,
  onPickDate,
}: CalendarViewProps & { onPickDate: (date: Date) => void }) {
  return (
    <div className="flex h-full flex-col animate-in fade-in-0 slide-in-from-left-4 duration-200 motion-reduce:animate-none">
      <div className="flex-1 px-3">
        <ActivityMonthCalendar
          selected={selectedDate}
          onSelect={onPickDate}
          month={month}
          onMonthChange={onMonthChange}
          onToday={onToday}
          byDate={byDate}
          todayKey={todayKey}
          minDate={minDate}
          maxDate={maxDate}
        />
      </div>

      <Separator />

      {/* Legend explains the dots on the grid */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[11px] text-muted-foreground">
        {ACTIVITY_TYPE_ORDER.map((type) => (
          <span key={type} className="inline-flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", ACTIVITY_TYPES[type].dot)} />
            {ACTIVITY_TYPES[type].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-destructive" />
          Overdue
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------- Day ---------------------------------- */

function DayPanel({
  byDate,
  todayKey,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
  onToggleComplete,
  onOpenActivity,
  onCreate,
  onBack,
}: CalendarViewProps & { onBack: () => void }) {
  const backRef = useRef<HTMLButtonElement>(null);

  // Move focus into the new view for keyboard and screen-reader users.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  const key = toDateKey(selectedDate);
  const activities = byDate.get(key) ?? [];
  const count = activities.length;
  const isToday = key === todayKey;

  const prevDay = addDays(selectedDate, -1);
  const nextDay = addDays(selectedDate, 1);
  const canPrev = !isBefore(startOfDay(prevDay), startOfDay(minDate));
  const canNext = !isAfter(startOfDay(nextDay), startOfDay(maxDate));

  return (
    <div className="flex h-full flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200 motion-reduce:animate-none">
      <div className="flex items-center gap-1 px-2 pb-2">
        <Button
          ref={backRef}
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onBack}
          aria-label="Back to calendar"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="min-w-0 flex-1 pl-0.5">
          <p className="truncate text-sm font-semibold" aria-live="polite">
            {isToday ? "Today" : format(selectedDate, "EEEE")}
            <span className="ml-1.5 font-normal text-muted-foreground">
              {format(selectedDate, isToday ? "EEE, MMM d" : "MMM d, yyyy")}
            </span>
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {count === 0 ? "No activities" : `${count} ${count === 1 ? "activity" : "activities"}`}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          disabled={!canPrev}
          onClick={() => onSelectDate(prevDay)}
          aria-label="Previous day"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          disabled={!canNext}
          onClick={() => onSelectDate(nextDay)}
          aria-label="Next day"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Separator />

      {/* key re-runs the entrance animation when stepping between days */}
      <div key={key} className="min-h-0 flex flex-col justify-between overflow-y-auto px-2 py-2 scrollbar-thin animate-in fade-in-0 duration-150 motion-reduce:animate-none">
        {count > 0 ? (
          <>
            <ActivityList
              activities={activities}
              todayKey={todayKey}
              onToggleComplete={onToggleComplete}
              onOpen={onOpenActivity}
            />
            <Button
              variant="default"
              className="gap-2 mx-2 mt-4 mb-2 px-2 text-sm text-primary-foreground"
              onClick={() => onCreate(selectedDate)}
            >
              <appIcons.add />
              Add activity
            </Button>
          </>
        ) : (
          <EmptyState
            title="Nothing scheduled"
            description={`No calls, meetings or follow-ups on ${format(selectedDate, "MMM d")}.`}
            action={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => onCreate(selectedDate)}
              >
                <Plus className="size-3.5" />
                Schedule for {format(selectedDate, "MMM d")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}