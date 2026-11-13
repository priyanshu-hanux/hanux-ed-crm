import { isBefore, isToday } from "date-fns";

import { cn } from "@/lib/utils";
import { dayLabel } from "../utils";

/** A due date as a pill: red when overdue, amber when due today, neutral otherwise */
export function DueBadge({ iso, done = false, className }: { iso: string; done?: boolean; className?: string }) {
  const date = new Date(iso);
  const overdue = !done && isBefore(date, new Date());
  const today = !done && !overdue && isToday(date);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium",
        overdue && "bg-red-500/10 text-red-700 dark:text-red-400",
        today && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        !overdue && !today && "bg-muted text-muted-foreground",
        className
      )}
    >
      {overdue ? `Overdue · ${dayLabel(date)}` : dayLabel(date)}
    </span>
  );
}
