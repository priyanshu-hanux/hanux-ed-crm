import { useCallback, useMemo, useState } from "react";
import { addYears, endOfYear, isSameMonth, startOfMonth } from "date-fns";
import { ArrowRight, CalendarDays, ListChecks } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { appIcons } from "@/configs/icons";
import { cn } from "@/lib/utils";

import { AgendaView } from "./agenda-view";
import { CalendarView } from "./calendar-view";
import { MOCK_ACTIVITIES } from "./mock-data";
import type { Activity, ActivityStats, ActivityStatus, AgendaGroupKey } from "./types";
import { useActivities } from "./use-activities";
import {
  LIST_TABS,
  PANEL_DEFAULTS,
  resolveListTab,
  type ActivityView,
  type ListTabSetting,
} from "./view-config";

export interface FollowUpCalendarProps {
  /** Initial activities. Swap `useActivities` for your data layer (React Query etc.) in production. */
  activities?: Activity[];
  /** View on first open; afterwards the user's last choice is remembered. */
  defaultView?: ActivityView;
  /** List tab picked on every open. "auto" = most urgent tab that has items. */
  defaultListTab?: ListTabSetting;
  onCreateActivity?: (date: Date) => void;
  onOpenActivity?: (activity: Activity) => void;
  onStatusChange?: (id: string, status: ActivityStatus) => void;
  onViewAll?: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const DEFAULT_MIN_DATE = new Date(2026, 0, 1);

export function FollowUpCalendar({
  activities: initialActivities = MOCK_ACTIVITIES,
  defaultView = PANEL_DEFAULTS.view,
  defaultListTab = PANEL_DEFAULTS.listTab,
  onCreateActivity,
  onOpenActivity,
  onStatusChange,
  onViewAll,
  minDate = DEFAULT_MIN_DATE,
  maxDate,
}: FollowUpCalendarProps) {
  const { byDate, agenda, stats, todayKey, toggleComplete } = useActivities(initialActivities, {
    onStatusChange,
  });

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ActivityView>(defaultView);
  const [listTab, setListTab] = useState<AgendaGroupKey>(() => resolveListTab(defaultListTab, stats));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const resolvedMaxDate = useMemo(() => maxDate ?? endOfYear(addYears(new Date(), 2)), [maxDate]);
  const dueCount = stats.overdue + stats.dueToday;

  const handleToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setMonth(startOfMonth(today));
  }, []);

  /**
   * On every open: the list tab is re-resolved (so "auto" reflects current data, even if it
   * loaded while closed) and the calendar returns to today. The view itself is kept.
   * The tab is NOT re-resolved while open, so completing the last overdue item doesn't
   * yank the user to another tab.
   */
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setListTab(resolveListTab(defaultListTab, stats));
        handleToday();
      }
      setOpen(next);
    },
    [defaultListTab, stats, handleToday]
  );

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    // Clicking an outside day (e.g. Nov 1 in October) moves the view to that month.
    setMonth((current) => (isSameMonth(date, current) ? current : startOfMonth(date)));
  }, []);

  const handleCreate = useCallback(
    (date: Date = new Date()) => {
      if (onCreateActivity) onCreateActivity(date);
      else console.info("Create activity for", date.toDateString());
    },
    [onCreateActivity]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative"
              aria-label={dueCount > 0 ? `Activities, ${dueCount} due` : "Activities"}
            >
              <appIcons.calendarTime />
              {dueCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white",
                    stats.overdue > 0 ? "bg-red-500" : "bg-primary"
                  )}
                >
                  {dueCount > 9 ? "9+" : dueCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{summaryText(stats)}</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={12}
        collisionPadding={12}
        className="flex max-h-[min(480px,calc(100dvh-130px))] w-95 max-w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden rounded-xl border-border/60 bg-layout p-0 shadow-xl"
      >
        {/* Outer tabs: view mode (list / calendar). Triggers live in the header. */}
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as ActivityView)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight">Activities</h3>
              <p
                className={cn(
                  "mt-0.5 truncate text-xs",
                  stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {summaryText(stats)}
              </p>
            </div>

            <TabsList className="h-10 rounded-full px-1 py-2" aria-label="View">
              <ViewTabTrigger value="list" label="List view">
                <ListChecks className="size-4" />
              </ViewTabTrigger>
              <ViewTabTrigger value="calendar" label="Calendar view">
                <CalendarDays className="size-4" />
              </ViewTabTrigger>
            </TabsList>
          </header>

          <Separator />

          <div className="flex h-105 min-h-0 shrink flex-col">
            <TabsContent value="list" className="mt-0 flex min-h-0 flex-1 flex-col">
              {/* Inner tabs: which slice of the agenda. */}
              <Tabs
                value={listTab}
                onValueChange={(value) => setListTab(value as AgendaGroupKey)}
                className="flex min-h-0 flex-1 flex-col gap-0"
              >
                <div className="px-3 pt-3">
                  <TabsList
                    className="grid h-8 w-full px-1"
                    style={{ gridTemplateColumns: `repeat(${LIST_TABS.length}, minmax(0, 1fr))` }}
                  >
                    {LIST_TABS.map(({ value, label, count, urgent }) => {
                      const n = count(stats);
                      return (
                        <TabsTrigger key={value} value={value} className="h-7 gap-1.5 text-xs">
                          {label}
                          {n > 0 && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 text-[10px] leading-4 tabular-nums",
                                urgent ? "bg-red-500 text-white" : "bg-muted-foreground/15"
                              )}
                            >
                              {n}
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {LIST_TABS.map(({ value }) => (
                  <TabsContent key={value} value={value} className="mt-0 min-h-0 flex-1 overflow-hidden">
                    <AgendaView
                      group={value}
                      activities={agenda[value]}
                      todayKey={todayKey}
                      onToggleComplete={toggleComplete}
                      onOpenActivity={onOpenActivity}
                      onCreate={() => handleCreate()}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 pt-3 min-h-0 flex-1 overflow-hidden">
              <CalendarView
                byDate={byDate}
                todayKey={todayKey}
                selectedDate={selectedDate}
                month={month}
                minDate={minDate}
                maxDate={resolvedMaxDate}
                onSelectDate={handleSelectDate}
                onMonthChange={setMonth}
                onToday={handleToday}
                onToggleComplete={toggleComplete}
                onOpenActivity={onOpenActivity}
                onCreate={handleCreate}
              />
            </TabsContent>
          </div>
        </Tabs>

        {onViewAll && (
          <>
            <Separator />
            <Button
              variant="ghost"
              className="h-10 shrink-0 justify-between rounded-none px-4 text-xs font-medium"
              onClick={() => {
                setOpen(false);
                onViewAll();
              }}
            >
              View all activities
              <ArrowRight className="size-3.5" />
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function summaryText({ overdue, dueToday }: ActivityStats): string {
  if (overdue > 0 && dueToday > 0) return `${overdue} overdue, ${dueToday} due today`;
  if (overdue > 0) return `${overdue} overdue`;
  if (dueToday > 0) return `${dueToday} due today`;
  return "You're all caught up";
}

function ViewTabTrigger({
  value,
  label,
  children,
}: {
  value: ActivityView;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <TabsTrigger
            value={value}
            aria-label={label}
            className="size-7 flex-none rounded-full p-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {children}
          </TabsTrigger>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}