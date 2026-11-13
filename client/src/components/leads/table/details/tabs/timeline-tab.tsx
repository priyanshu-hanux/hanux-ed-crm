import { useMemo, useState } from "react";
import { CalendarDays, History } from "lucide-react";

import { cn } from "@/lib/utils";
import { ACTIVITY_CONFIG, TIMELINE_FILTERS } from "../activity-config";
import { Actor } from "../shared/actor";
import { EmptyState } from "../shared/empty-state";
import { InfoCard } from "../shared/info-card";
import { RelativeTime } from "../shared/relative-time";
import { TabBody } from "../shared/section";
import type { LeadActivity, LeadTabProps } from "../types";
import { dayLabel } from "../utils";

/** Everything that happened with the lead, newest first, one card per day */
export function TimelineTab({ record }: LeadTabProps) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TIMELINE_FILTERS.map((option) => [
          option.value,
          option.types.length === 0
            ? record.activities.length
            : record.activities.filter((activity) => option.types.includes(activity.type)).length,
        ])
      ),
    [record.activities]
  );

  const groups = useMemo(() => {
    const types = TIMELINE_FILTERS.find((f) => f.value === filter)?.types ?? [];
    const items = record.activities
      .filter((activity) => types.length === 0 || types.includes(activity.type))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    const byDay = new Map<string, LeadActivity[]>();
    for (const activity of items) {
      const label = dayLabel(new Date(activity.at));
      byDay.set(label, [...(byDay.get(label) ?? []), activity]);
    }
    return [...byDay.entries()];
  }, [record.activities, filter]);

  return (
    <TabBody>
      {/* Segmented filter */}
      <div className="scroll-zero overflow-x-auto">
        <div role="group" aria-label="Filter timeline" className="inline-flex gap-0.5 rounded-lg border bg-muted/50 p-0.5">
          {TIMELINE_FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
                <span className={cn("tabular-nums", active ? "text-muted-foreground" : "text-muted-foreground/60")}>
                  {counts[option.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={History} title="No activity here" description="Calls, emails, notes and status changes will show up here." />
      ) : (
        groups.map(([day, activities]) => (
          <InfoCard key={day} icon={CalendarDays} title={day} count={activities.length} bodyClassName="px-4 pt-4 pb-1">
            <ol>
              {activities.map((activity, index) => (
                <TimelineItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
              ))}
            </ol>
          </InfoCard>
        ))
      )}
    </TabBody>
  );
}

function TimelineItem({ activity, isLast }: { activity: LeadActivity; isLast: boolean }) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <li className="flex gap-3">
      {/* Icon column with the connector line to the next item */}
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full ring-1", config.className)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {!isLast && <span className="my-1 w-px flex-1 bg-border" aria-hidden="true" />}
      </div>

      <div className="min-w-0 flex-1 pb-4 pt-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-medium leading-6">
            <span className="sr-only">{config.label}: </span>
            {activity.title}
          </p>
          <RelativeTime iso={activity.at} className="shrink-0 pt-0.5 text-xs text-muted-foreground" />
        </div>
        {activity.description && (
          <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{activity.description}</p>
        )}
        {activity.actor && <Actor name={activity.actor} className="mt-2 text-xs text-muted-foreground" />}
      </div>
    </li>
  );
}
