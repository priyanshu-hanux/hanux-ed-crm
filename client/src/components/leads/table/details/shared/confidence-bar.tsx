import { cn } from "@/lib/utils";
import { confidenceLevel } from "../utils";

/** Extraction confidence as a bar plus a percentage ("Low" is spelled out, so color isn't the only signal) */
export function ConfidenceBar({ label, value }: { label: string; value: number | undefined }) {
  const { percent, level } = confidenceLevel(value);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            level === "high" && "bg-emerald-500",
            level === "medium" && "bg-amber-500",
            level === "low" && "bg-red-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn("w-14 text-right tabular-nums", level === "low" && "font-medium text-red-600 dark:text-red-400")}>
        {percent}%{level === "low" ? " Low" : ""}
      </span>
    </div>
  );
}
