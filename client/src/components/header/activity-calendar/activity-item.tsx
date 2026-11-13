import { memo } from "react";
import { Check, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES } from "./activity-config";
import type { Activity } from "./types";
import { formatShortDate, formatTime } from "./utils";

export interface ActivityItemProps {
  activity: Activity;
  todayKey: string;
  /** Show the date next to the time (for lists spanning several days). */
  showDate?: boolean;
  onToggleComplete: (id: string) => void;
  onOpen?: (activity: Activity) => void;
}

export const ActivityItem = memo(function ActivityItem({
  activity,
  todayKey,
  showDate = false,
  onToggleComplete,
  onOpen,
}: ActivityItemProps) {
  const config = ACTIVITY_TYPES[activity.type];
  const Icon = config.icon;
  const completed = activity.status === "completed";
  const overdue = !completed && activity.date < todayKey;
  const hasQuickActions = Boolean(activity.phone || activity.email);

  return (
    <li className="group relative flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted focus-within:bg-muted">
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={completed ? `Mark "${activity.title}" as pending` : `Complete "${activity.title}"`}
        onClick={() => onToggleComplete(activity.id)}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-muted-foreground/40 hover:border-emerald-500"
        )}
      >
        {completed && <Check className="size-3" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(activity)}
            title={activity.description}
            className={cn(
              "min-w-0 flex-1 truncate text-left text-[13px] font-medium leading-5 outline-none focus-visible:underline",
              completed && "text-muted-foreground line-through"
            )}
          >
            {activity.title}
          </button>
          <span
            className={cn(
              "shrink-0 text-[11px] tabular-nums text-muted-foreground",
              overdue && "font-medium text-destructive"
            )}
          >
            {(showDate || overdue) && `${formatShortDate(activity.date)}, `}
            {formatTime(activity.time)}
          </span>
        </div>

        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-1 py-px font-medium",
              config.tone,
              completed && "opacity-60"
            )}
          >
            <Icon className="size-3" />
            {config.label}
          </span>
          <span className="truncate">
            {activity.contact}
            {activity.company && <span className="text-muted-foreground/70">, {activity.company}</span>}
          </span>
        </div>
      </div>

      {hasQuickActions && (
        <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 rounded-md bg-muted pl-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {activity.phone && (
            <Button asChild variant="ghost" size="icon" className="size-6">
              <a href={`tel:${activity.phone}`} aria-label={`Call ${activity.contact}`}>
                <Phone className="size-3" />
              </a>
            </Button>
          )}
          {activity.email && (
            <Button asChild variant="ghost" size="icon" className="size-6">
              <a href={`mailto:${activity.email}`} aria-label={`Email ${activity.contact}`}>
                <Mail className="size-3" />
              </a>
            </Button>
          )}
        </div>
      )}
    </li>
  );
});

interface ActivityListProps extends Omit<ActivityItemProps, "activity"> {
  activities: Activity[];
}

export function ActivityList({ activities, ...itemProps }: ActivityListProps) {
  return (
    <ul className="space-y-0.5">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} {...itemProps} />
      ))}
    </ul>
  );
}
