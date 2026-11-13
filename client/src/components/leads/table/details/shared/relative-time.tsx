import { format, formatDistanceToNowStrict } from "date-fns";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** "just now" within the last minute, otherwise "3 days ago" */
function relativeLabel(date: Date) {
  const elapsed = Date.now() - date.getTime();
  return elapsed >= 0 && elapsed < 60_000 ? "just now" : formatDistanceToNowStrict(date, { addSuffix: true });
}

/** Relative time ("3 days ago"), with the exact date and time on hover */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} className={className}>
          {relativeLabel(date)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{format(date, "d MMM yyyy, h:mm a")}</TooltipContent>
    </Tooltip>
  );
}
