import type { ReactNode } from "react";
import { CalendarDays, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = CalendarDays,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center px-6 text-center",
        compact ? "gap-1 py-4" : "gap-1.5 py-8"
      )}
    >
      {!compact && (
        <div className="mb-1.5 flex size-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
