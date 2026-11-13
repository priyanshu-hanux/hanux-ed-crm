import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "../types";
import { LEAD_STATUS_CONFIG } from "../utils";

/** Pipeline status as a colored pill with a dot */
export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const config = LEAD_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent font-medium", config.className, className)}>
      <span className={cn("size-1.5 rounded-full", config.dotClassName)} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
