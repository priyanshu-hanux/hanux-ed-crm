import { Fragment, useMemo } from "react";
import { CalendarClock, CheckCircle2, Plus, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityList } from "./activity-item";
import { EmptyState } from "./empty-state";
import type { Activity, AgendaGroupKey } from "./types";
import { formatDayLabel } from "./utils";

const EMPTY: Record<AgendaGroupKey, { title: string; description: string; icon: LucideIcon; cta?: string }> = {
  overdue: {
    title: "Nothing overdue",
    description: "Every activity is on schedule.",
    icon: CheckCircle2,
  },
  today: {
    title: "Nothing due today",
    description: "Schedule a call or follow-up to keep deals moving.",
    icon: Sun,
    cta: "New activity",
  },
  upcoming: {
    title: "Nothing upcoming",
    description: "Plan your next touchpoints so no lead goes cold.",
    icon: CalendarClock,
    cta: "Schedule activity",
  },
};

interface AgendaViewProps {
  group: AgendaGroupKey;
  activities: Activity[];
  todayKey: string;
  onToggleComplete: (id: string) => void;
  onOpenActivity?: (activity: Activity) => void;
  onCreate: () => void;
}

export function AgendaView({
  group,
  activities,
  todayKey,
  onToggleComplete,
  onOpenActivity,
  onCreate,
}: AgendaViewProps) {
  // Upcoming is split by day so the date isn't repeated on every row.
  const days = useMemo(() => {
    if (group !== "upcoming") return null;
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const list = map.get(a.date);
      if (list) list.push(a);
      else map.set(a.date, [a]);
    }
    return [...map.entries()];
  }, [group, activities]);

  if (activities.length === 0) {
    const empty = EMPTY[group];
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={
          empty.cta && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onCreate}>
              <Plus className="size-3.5" />
              {empty.cta}
            </Button>
          )
        }
      />
    );
  }

  const listProps = { todayKey, onToggleComplete, onOpen: onOpenActivity };

  return (
    <div className="h-full overflow-y-auto px-2 py-2 [scrollbar-width:thin]">
      {days ? (
        days.map(([date, items]) => (
          <Fragment key={date}>
            <h4 className="sticky top-0 z-10 flex items-center justify-between bg-layout px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground first:pt-0">
              {formatDayLabel(date, todayKey)}
              <span className="tabular-nums">{items.length}</span>
            </h4>
            <ActivityList activities={items} {...listProps} />
          </Fragment>
        ))
      ) : (
        // Overdue rows show their date (in red) via ActivityItem; today rows show time only.
        <ActivityList activities={activities} {...listProps} />
      )}
    </div>
  );
}